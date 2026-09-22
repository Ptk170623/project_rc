import {
  getDB,
  reqAdd,
  reqAll,
  reqDelete,
  reqGet,
  reqIndexAll,
  reqPut,
  withStore,
} from "./db.js";
import { DEFAULT_TRAIT_OPTIONS } from "./defaultOptions.js";

async function seedDefaultOptions() {
  await withStore("options", "readwrite", async (store) => {
    for (const [kind, labels] of [["trait", DEFAULT_TRAIT_OPTIONS]]) {
      const existing = await reqIndexAll(store, "kind", kind);
      if (existing.length) continue;
      for (let i = 0; i < labels.length; i++) {
        await reqAdd(store, { kind, label: labels[i], position: i + 1 });
      }
    }
  });
}

let seeded = getDB().then(seedDefaultOptions);

function notFound(what) {
  const err = new Error(`${what} not found`);
  err.status = 404;
  return err;
}

function maxPosition(items) {
  return items.reduce((max, item) => Math.max(max, item.position || 0), 0);
}

// Shared by exportBand/exportAlbum: builds one album's {name, lineup, songs}
// export shape from its rows in the songs/traits/album_lineup stores.
async function exportAlbumData(album, { songs, traits, album_lineup }) {
  const songList = await reqIndexAll(songs, "album_id", album.id);
  songList.sort((a, b) => a.position - b.position);
  const songExports = [];
  for (const song of songList) {
    const traitList = await reqIndexAll(traits, "song_id", song.id);
    traitList.sort((a, b) => a.position - b.position);
    songExports.push({
      name: song.name,
      rating: song.rating || null,
      traits: traitList.map((t) => ({
        text: t.text,
        highlight: t.highlight || null,
        performer: t.performer || null,
      })),
    });
  }
  const lineupList = await reqIndexAll(album_lineup, "album_id", album.id);
  lineupList.sort((a, b) => a.position - b.position);
  return {
    name: album.name,
    lineup: lineupList.map((e) => ({ instrument: e.instrument, performer: e.performer })),
    songs: songExports,
  };
}

// Mirrors the backend's plain-text import format: a bare list of song names
// still works with zero markup; optional `Band:`/`Album:` header lines,
// an optional `Lineup:` section (`Instrument: Performer` pairs upserted as
// album defaults), an optional `Songs:` section, and per-song
// `| Instrument: Name[, Instrument: Name]` override syntax.
function parseImportFile(text) {
  let bandName = null;
  let albumName = null;
  const lineup = [];
  const songs = [];
  let section = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const lower = line.toLowerCase();

    if (lower.startsWith("band:")) {
      bandName = line.slice(line.indexOf(":") + 1).trim();
      continue;
    }
    if (lower.startsWith("album:")) {
      albumName = line.slice(line.indexOf(":") + 1).trim();
      continue;
    }
    if (lower === "lineup:") {
      section = "lineup";
      continue;
    }
    if (lower === "songs:") {
      section = "songs";
      continue;
    }

    if (section === "lineup") {
      if (line.includes(":")) {
        const idx = line.indexOf(":");
        const instrument = line.slice(0, idx).trim();
        const performer = line.slice(idx + 1).trim();
        if (instrument && performer) lineup.push([instrument, performer]);
      }
      continue;
    }

    if (line.includes("|")) {
      const idx = line.indexOf("|");
      const title = line.slice(0, idx).trim();
      const rest = line.slice(idx + 1);
      const overrides = [];
      for (const part of rest.split(",")) {
        if (part.includes(":")) {
          const pIdx = part.indexOf(":");
          const instrument = part.slice(0, pIdx).trim();
          const name = part.slice(pIdx + 1).trim();
          if (instrument && name) overrides.push([instrument, name]);
        }
      }
      if (title) songs.push([title, overrides]);
    } else if (line) {
      songs.push([line, []]);
    }
  }

  return { bandName, albumName, lineup, songs };
}

export const api = {
  ready: () => seeded,

  // ---------- Bands ----------
  listBands: () =>
    withStore("bands", "readonly", async (store) => {
      const all = await reqAll(store);
      return all.sort((a, b) => a.name.localeCompare(b.name));
    }),

  createBand: (name) =>
    withStore("bands", "readwrite", async (store) => {
      const record = { name };
      record.id = await reqAdd(store, record);
      return record;
    }),

  getBand: (bandId) =>
    withStore(["bands", "albums"], "readonly", async ({ bands, albums }) => {
      const band = await reqGet(bands, Number(bandId));
      if (!band) throw notFound("Band");
      const albumList = await reqIndexAll(albums, "band_id", Number(bandId));
      albumList.sort((a, b) => a.id - b.id);
      return { ...band, albums: albumList };
    }),

  deleteBand: (bandId) =>
    withStore(
      ["bands", "albums", "songs", "traits", "rotation_slots", "album_lineup"],
      "readwrite",
      async ({ bands, albums, songs, traits, rotation_slots, album_lineup }) => {
        const id = Number(bandId);
        const albumList = await reqIndexAll(albums, "band_id", id);
        for (const album of albumList) {
          const songList = await reqIndexAll(songs, "album_id", album.id);
          for (const song of songList) {
            const traitList = await reqIndexAll(traits, "song_id", song.id);
            for (const trait of traitList) await reqDelete(traits, trait.id);
            await reqDelete(songs, song.id);
          }
          const lineupList = await reqIndexAll(album_lineup, "album_id", album.id);
          for (const entry of lineupList) await reqDelete(album_lineup, entry.id);
          await reqDelete(albums, album.id);
        }
        const allSlots = await reqAll(rotation_slots);
        for (const slot of allSlots) {
          if (slot.band_id === id) await reqDelete(rotation_slots, slot.id);
        }
        await reqDelete(bands, id);
      }
    ),

  exportBand: (bandId) =>
    withStore(
      ["bands", "albums", "songs", "traits", "album_lineup"],
      "readonly",
      async ({ bands, albums, songs, traits, album_lineup }) => {
        const band = await reqGet(bands, Number(bandId));
        if (!band) throw notFound("Band");
        const albumList = await reqIndexAll(albums, "band_id", band.id);
        albumList.sort((a, b) => a.id - b.id);
        const albumExports = [];
        for (const album of albumList) {
          albumExports.push(await exportAlbumData(album, { songs, traits, album_lineup }));
        }
        return {
          type: "band",
          version: 1,
          exported_at: new Date().toISOString(),
          band: { name: band.name, albums: albumExports },
        };
      }
    ),

  // ---------- Albums ----------
  createAlbum: (bandId, name) =>
    withStore("albums", "readwrite", async (store) => {
      const record = { band_id: Number(bandId), name };
      record.id = await reqAdd(store, record);
      return record;
    }),

  getAlbum: (albumId) =>
    withStore(
      ["albums", "bands", "songs", "traits", "album_lineup"],
      "readonly",
      async ({ albums, bands, songs, traits, album_lineup }) => {
        const album = await reqGet(albums, Number(albumId));
        if (!album) throw notFound("Album");
        const band = await reqGet(bands, album.band_id);
        const songList = await reqIndexAll(songs, "album_id", Number(albumId));
        songList.sort((a, b) => a.position - b.position);
        for (const song of songList) {
          const traitList = await reqIndexAll(traits, "song_id", song.id);
          traitList.sort((a, b) => a.position - b.position);
          song.traits = traitList;
        }
        const lineupList = await reqIndexAll(album_lineup, "album_id", Number(albumId));
        lineupList.sort((a, b) => a.position - b.position);
        return {
          ...album,
          band_name: band ? band.name : "",
          songs: songList,
          lineup: lineupList,
        };
      }
    ),

  exportAlbum: (albumId) =>
    withStore(
      ["albums", "bands", "songs", "traits", "album_lineup"],
      "readonly",
      async ({ albums, bands, songs, traits, album_lineup }) => {
        const album = await reqGet(albums, Number(albumId));
        if (!album) throw notFound("Album");
        const band = await reqGet(bands, album.band_id);
        return {
          type: "album",
          version: 1,
          exported_at: new Date().toISOString(),
          band_name: band ? band.name : "",
          album: await exportAlbumData(album, { songs, traits, album_lineup }),
        };
      }
    ),

  deleteAlbum: (albumId) =>
    withStore(
      ["albums", "songs", "traits", "album_lineup"],
      "readwrite",
      async ({ albums, songs, traits, album_lineup }) => {
        const id = Number(albumId);
        const songList = await reqIndexAll(songs, "album_id", id);
        for (const song of songList) {
          const traitList = await reqIndexAll(traits, "song_id", song.id);
          for (const trait of traitList) await reqDelete(traits, trait.id);
          await reqDelete(songs, song.id);
        }
        const lineupList = await reqIndexAll(album_lineup, "album_id", id);
        for (const entry of lineupList) await reqDelete(album_lineup, entry.id);
        await reqDelete(albums, id);
      }
    ),

  // ---------- Songs ----------
  createSong: (albumId, name) =>
    withStore("songs", "readwrite", async (store) => {
      const existing = await reqIndexAll(store, "album_id", Number(albumId));
      const record = {
        album_id: Number(albumId),
        name,
        rating: null,
        position: maxPosition(existing) + 1,
      };
      record.id = await reqAdd(store, record);
      return { ...record, traits: [] };
    }),

  updateSong: (songId, payload) =>
    withStore(["songs", "traits"], "readwrite", async ({ songs, traits }) => {
      const song = await reqGet(songs, Number(songId));
      if (!song) throw notFound("Song");
      if (payload.name != null) song.name = payload.name;
      if (payload.clear_rating) song.rating = null;
      else if (payload.rating != null) song.rating = payload.rating;
      await reqPut(songs, song);
      const traitList = await reqIndexAll(traits, "song_id", song.id);
      traitList.sort((a, b) => a.position - b.position);
      return { ...song, traits: traitList };
    }),

  deleteSong: (songId) =>
    withStore(["songs", "traits"], "readwrite", async ({ songs, traits }) => {
      const id = Number(songId);
      const traitList = await reqIndexAll(traits, "song_id", id);
      for (const trait of traitList) await reqDelete(traits, trait.id);
      await reqDelete(songs, id);
    }),

  // ---------- Traits ----------
  addTrait: (songId, text) =>
    withStore("traits", "readwrite", async (store) => {
      const existing = await reqIndexAll(store, "song_id", Number(songId));
      const record = {
        song_id: Number(songId),
        text,
        highlight: null,
        performer: null,
        position: maxPosition(existing) + 1,
      };
      record.id = await reqAdd(store, record);
      return record;
    }),

  updateTrait: (traitId, payload) =>
    withStore("traits", "readwrite", async (store) => {
      const trait = await reqGet(store, Number(traitId));
      if (!trait) throw notFound("Trait");
      if (payload.text != null) trait.text = payload.text;
      if (payload.clear_highlight) trait.highlight = null;
      else if (payload.highlight != null) trait.highlight = payload.highlight;
      if (payload.clear_performer) trait.performer = null;
      else if (payload.performer != null) trait.performer = payload.performer;
      await reqPut(store, trait);
      return trait;
    }),

  deleteTrait: (traitId) =>
    withStore("traits", "readwrite", (store) => reqDelete(store, Number(traitId))),

  // ---------- Album lineup ----------
  addLineupEntry: (albumId, instrument, performer) =>
    withStore("album_lineup", "readwrite", async (store) => {
      const existing = await reqIndexAll(store, "album_id", Number(albumId));
      const record = {
        album_id: Number(albumId),
        instrument,
        performer,
        position: maxPosition(existing) + 1,
      };
      record.id = await reqAdd(store, record);
      return record;
    }),

  updateLineupEntry: (id, payload) =>
    withStore("album_lineup", "readwrite", async (store) => {
      const entry = await reqGet(store, Number(id));
      if (!entry) throw notFound("Lineup entry");
      if (payload.instrument != null) entry.instrument = payload.instrument;
      if (payload.performer != null) entry.performer = payload.performer;
      await reqPut(store, entry);
      return entry;
    }),

  deleteLineupEntry: (id) =>
    withStore("album_lineup", "readwrite", (store) => reqDelete(store, Number(id))),

  // ---------- Bulk import ----------
  // Client-side counterpart to the backend's /import/songs endpoint: parses
  // the same plain-text format and writes bands/albums/lineup/songs/traits
  // directly into IndexedDB.
  importSongs: (file, albumId) =>
    file.text().then((raw) =>
      withStore(
        ["bands", "albums", "album_lineup", "songs", "traits"],
        "readwrite",
        async ({ bands, albums, album_lineup, songs, traits }) => {
          const { bandName, albumName, lineup, songs: parsedSongs } = parseImportFile(raw);

          let band;
          let album;
          if (bandName && albumName) {
            const allBands = await reqAll(bands);
            band = allBands.find((b) => b.name.toLowerCase() === bandName.toLowerCase());
            if (!band) {
              band = { name: bandName };
              band.id = await reqAdd(bands, band);
            }
            const bandAlbums = await reqIndexAll(albums, "band_id", band.id);
            album = bandAlbums.find((a) => a.name.toLowerCase() === albumName.toLowerCase());
            if (!album) {
              album = { band_id: band.id, name: albumName };
              album.id = await reqAdd(albums, album);
            }
          } else if (albumId != null) {
            album = await reqGet(albums, Number(albumId));
            if (!album) throw notFound("Album");
            band = await reqGet(bands, album.band_id);
          } else {
            const err = new Error(
              "The file needs Band: and Album: lines, or import it from inside an album."
            );
            err.status = 400;
            throw err;
          }

          const existingLineup = await reqIndexAll(album_lineup, "album_id", album.id);
          let lineupPosition = maxPosition(existingLineup);
          for (const [instrument, performer] of lineup) {
            const match = existingLineup.find(
              (e) => e.instrument.toLowerCase() === instrument.toLowerCase()
            );
            if (match) {
              match.performer = performer;
              await reqPut(album_lineup, match);
            } else {
              lineupPosition += 1;
              const entry = {
                album_id: album.id,
                instrument,
                performer,
                position: lineupPosition,
              };
              entry.id = await reqAdd(album_lineup, entry);
              existingLineup.push(entry);
            }
          }

          const existingSongs = await reqIndexAll(songs, "album_id", album.id);
          let position = maxPosition(existingSongs) + 1;
          let createdCount = 0;
          const skipped = [];
          for (const [title, overrides] of parsedSongs) {
            if (title.length > 300) {
              skipped.push(title);
              continue;
            }
            const song = { album_id: album.id, name: title, rating: null, position };
            song.id = await reqAdd(songs, song);
            position += 1;
            let i = 1;
            for (const [instrument, performer] of overrides) {
              await reqAdd(traits, {
                song_id: song.id,
                text: instrument,
                highlight: null,
                performer,
                position: i,
              });
              i += 1;
            }
            createdCount += 1;
          }

          return {
            band_id: band.id,
            band_name: band.name,
            album_id: album.id,
            album_name: album.name,
            created_count: createdCount,
            skipped,
            lineup_count: lineup.length,
          };
        }
      )
    ),

  // ---------- Selective export/import (by band or by album) ----------
  // Client-side counterpart to the backend's /import/data endpoint: merges
  // a band/album JSON export into whatever's already on this device instead
  // of replacing it (matches an existing band/album by name and an existing
  // song by name within its album, and upserts lineup entries by
  // instrument), rather than the full-device wipe-and-replace of
  // exportAll/importAll below.
  importData: (file) =>
    file.text().then((raw) =>
      withStore(
        ["bands", "albums", "album_lineup", "songs", "traits"],
        "readwrite",
        async ({ bands, albums, album_lineup, songs, traits }) => {
          let payload;
          try {
            payload = JSON.parse(raw);
          } catch {
            const err = new Error("Not a valid JSON export file.");
            err.status = 400;
            throw err;
          }

          let bandName;
          let albumList;
          let isSingleAlbum;
          if (payload.type === "band") {
            bandName = payload.band.name;
            albumList = payload.band.albums || [];
            isSingleAlbum = false;
          } else if (payload.type === "album") {
            bandName = payload.band_name;
            albumList = [payload.album];
            isSingleAlbum = true;
          } else {
            const err = new Error(
              "Unrecognized export file (expected a band or album export)."
            );
            err.status = 400;
            throw err;
          }

          const allBands = await reqAll(bands);
          let band = allBands.find((b) => b.name.toLowerCase() === bandName.toLowerCase());
          if (!band) {
            band = { name: bandName };
            band.id = await reqAdd(bands, band);
          }

          let songsCreated = 0;
          let songsSkipped = 0;
          let lineupUpserted = 0;
          let resultAlbumId = null;

          for (const albumData of albumList) {
            const bandAlbums = await reqIndexAll(albums, "band_id", band.id);
            let album = bandAlbums.find(
              (a) => a.name.toLowerCase() === albumData.name.toLowerCase()
            );
            if (!album) {
              album = { band_id: band.id, name: albumData.name };
              album.id = await reqAdd(albums, album);
            }
            if (isSingleAlbum) resultAlbumId = album.id;

            const existingLineup = await reqIndexAll(album_lineup, "album_id", album.id);
            let lineupPosition = maxPosition(existingLineup);
            for (const entry of albumData.lineup || []) {
              const match = existingLineup.find(
                (e) => e.instrument.toLowerCase() === entry.instrument.toLowerCase()
              );
              if (match) {
                match.performer = entry.performer;
                await reqPut(album_lineup, match);
              } else {
                lineupPosition += 1;
                const newEntry = {
                  album_id: album.id,
                  instrument: entry.instrument,
                  performer: entry.performer,
                  position: lineupPosition,
                };
                newEntry.id = await reqAdd(album_lineup, newEntry);
                existingLineup.push(newEntry);
              }
              lineupUpserted += 1;
            }

            const existingSongs = await reqIndexAll(songs, "album_id", album.id);
            const existingNames = new Set(existingSongs.map((s) => s.name.toLowerCase()));
            let position = maxPosition(existingSongs);
            for (const songData of albumData.songs || []) {
              if (existingNames.has(songData.name.toLowerCase())) {
                songsSkipped += 1;
                continue;
              }
              position += 1;
              const song = {
                album_id: album.id,
                name: songData.name,
                rating: songData.rating || null,
                position,
              };
              song.id = await reqAdd(songs, song);
              let i = 1;
              for (const trait of songData.traits || []) {
                await reqAdd(traits, {
                  song_id: song.id,
                  text: trait.text,
                  highlight: trait.highlight || null,
                  performer: trait.performer || null,
                  position: i,
                });
                i += 1;
              }
              songsCreated += 1;
              existingNames.add(songData.name.toLowerCase());
            }
          }

          return {
            band_id: band.id,
            band_name: band.name,
            album_id: resultAlbumId,
            songs_created: songsCreated,
            songs_skipped: songsSkipped,
            lineup_upserted: lineupUpserted,
          };
        }
      )
    ),

  // ---------- Quick options ----------
  listOptions: (kind) =>
    withStore("options", "readonly", async (store) => {
      const all = await reqIndexAll(store, "kind", kind);
      return all.sort((a, b) => a.position - b.position);
    }),

  createOption: (kind, label) =>
    withStore("options", "readwrite", async (store) => {
      const existing = await reqIndexAll(store, "kind", kind);
      const record = { kind, label, position: maxPosition(existing) + 1 };
      record.id = await reqAdd(store, record);
      return record;
    }),

  updateOption: (id, label) =>
    withStore("options", "readwrite", async (store) => {
      const option = await reqGet(store, Number(id));
      if (!option) throw notFound("Option");
      option.label = label;
      await reqPut(store, option);
      return option;
    }),

  deleteOption: (id) =>
    withStore("options", "readwrite", (store) => reqDelete(store, Number(id))),

  // ---------- Weekly rotation ----------
  listRotation: () =>
    withStore(
      ["rotation_slots", "bands"],
      "readonly",
      async ({ rotation_slots, bands }) => {
        const all = await reqAll(rotation_slots);
        all.sort((a, b) => a.position - b.position);
        for (const slot of all) {
          const band = await reqGet(bands, slot.band_id);
          slot.band = band ? { id: band.id, name: band.name } : { id: slot.band_id, name: "Unknown" };
        }
        return all;
      }
    ),

  addRotationSlot: (day, bandId) =>
    withStore("rotation_slots", "readwrite", async (store) => {
      const existing = await reqIndexAll(store, "day", day);
      const record = { day, band_id: Number(bandId), position: maxPosition(existing) + 1 };
      record.id = await reqAdd(store, record);
      return record;
    }),

  deleteRotationSlot: (id) =>
    withStore("rotation_slots", "readwrite", (store) => reqDelete(store, Number(id))),

  // ---------- Backup ----------
  exportAll: () =>
    withStore(
      ["bands", "albums", "songs", "traits", "options", "rotation_slots", "album_lineup"],
      "readonly",
      async ({ bands, albums, songs, traits, options, rotation_slots, album_lineup }) => ({
        version: 1,
        exported_at: new Date().toISOString(),
        bands: await reqAll(bands),
        albums: await reqAll(albums),
        songs: await reqAll(songs),
        traits: await reqAll(traits),
        options: await reqAll(options),
        rotation_slots: await reqAll(rotation_slots),
        album_lineup: await reqAll(album_lineup),
      })
    ),

  importAll: (data) =>
    withStore(
      ["bands", "albums", "songs", "traits", "options", "rotation_slots", "album_lineup"],
      "readwrite",
      async ({ bands, albums, songs, traits, options, rotation_slots, album_lineup }) => {
        for (const store of [bands, albums, songs, traits, options, rotation_slots, album_lineup]) {
          const keys = await new Promise((resolve, reject) => {
            const req = store.getAllKeys();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });
          for (const key of keys) await reqDelete(store, key);
        }
        for (const record of data.bands || []) await reqPut(bands, record);
        for (const record of data.albums || []) await reqPut(albums, record);
        for (const record of data.songs || []) await reqPut(songs, record);
        for (const record of data.traits || []) await reqPut(traits, record);
        for (const record of data.options || []) await reqPut(options, record);
        for (const record of data.rotation_slots || []) await reqPut(rotation_slots, record);
        for (const record of data.album_lineup || []) await reqPut(album_lineup, record);
      }
    ),
};
