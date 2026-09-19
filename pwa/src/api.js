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
import { DEFAULT_TRAIT_OPTIONS, DEFAULT_SUBTRAIT_OPTIONS } from "./defaultOptions.js";

async function seedDefaultOptions() {
  await withStore("options", "readwrite", async (store) => {
    for (const [kind, labels] of [
      ["trait", DEFAULT_TRAIT_OPTIONS],
      ["subtrait", DEFAULT_SUBTRAIT_OPTIONS],
    ]) {
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
      ["bands", "albums", "songs", "traits"],
      "readwrite",
      async ({ bands, albums, songs, traits }) => {
        const id = Number(bandId);
        const albumList = await reqIndexAll(albums, "band_id", id);
        for (const album of albumList) {
          const songList = await reqIndexAll(songs, "album_id", album.id);
          for (const song of songList) {
            const traitList = await reqIndexAll(traits, "song_id", song.id);
            for (const trait of traitList) await reqDelete(traits, trait.id);
            await reqDelete(songs, song.id);
          }
          await reqDelete(albums, album.id);
        }
        await reqDelete(bands, id);
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
      ["albums", "bands", "songs", "traits"],
      "readonly",
      async ({ albums, bands, songs, traits }) => {
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
        return { ...album, band_name: band ? band.name : "", songs: songList };
      }
    ),

  deleteAlbum: (albumId) =>
    withStore(
      ["albums", "songs", "traits"],
      "readwrite",
      async ({ albums, songs, traits }) => {
        const id = Number(albumId);
        const songList = await reqIndexAll(songs, "album_id", id);
        for (const song of songList) {
          const traitList = await reqIndexAll(traits, "song_id", song.id);
          for (const trait of traitList) await reqDelete(traits, trait.id);
          await reqDelete(songs, song.id);
        }
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

  bulkCreateSongs: async (albumId, file) => {
    const text = await file.text();
    const names = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return withStore("songs", "readwrite", async (store) => {
      const existing = await reqIndexAll(store, "album_id", Number(albumId));
      let position = maxPosition(existing) + 1;
      const created = [];
      const skipped = [];
      for (const name of names) {
        if (name.length > 300) {
          skipped.push(name);
          continue;
        }
        const record = {
          album_id: Number(albumId),
          name,
          rating: null,
          position,
        };
        record.id = await reqAdd(store, record);
        position += 1;
        created.push({ ...record, traits: [] });
      }
      return { created, skipped };
    });
  },

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
  addTrait: (songId, text, subText) =>
    withStore("traits", "readwrite", async (store) => {
      const existing = await reqIndexAll(store, "song_id", Number(songId));
      const record = {
        song_id: Number(songId),
        text,
        sub_text: subText || null,
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
      if (payload.clear_sub_text) trait.sub_text = null;
      else if (payload.sub_text != null) trait.sub_text = payload.sub_text;
      await reqPut(store, trait);
      return trait;
    }),

  deleteTrait: (traitId) =>
    withStore("traits", "readwrite", (store) => reqDelete(store, Number(traitId))),

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

  // ---------- Backup ----------
  exportAll: () =>
    withStore(
      ["bands", "albums", "songs", "traits", "options"],
      "readonly",
      async ({ bands, albums, songs, traits, options }) => ({
        version: 1,
        exported_at: new Date().toISOString(),
        bands: await reqAll(bands),
        albums: await reqAll(albums),
        songs: await reqAll(songs),
        traits: await reqAll(traits),
        options: await reqAll(options),
      })
    ),

  importAll: (data) =>
    withStore(
      ["bands", "albums", "songs", "traits", "options"],
      "readwrite",
      async ({ bands, albums, songs, traits, options }) => {
        for (const store of [bands, albums, songs, traits, options]) {
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
      }
    ),
};
