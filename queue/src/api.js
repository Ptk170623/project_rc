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
import { DEFAULT_IMPORTANCE, priorityScore } from "./priority.js";

// A "novo" album graduates to "normal" automatically once it's been
// listened to this many times — it's no longer new, and from then on it's
// up to you to reclassify it (importante/normal/menos) as you like.
const IMPORTANCE_GRADUATION_LISTENS = 3;

function notFound(what) {
  const err = new Error(`${what} not found`);
  err.status = 404;
  return err;
}

function maxField(items, field) {
  return items.reduce((max, item) => Math.max(max, item[field] ?? 0), 0);
}
function minField(items, field, fallback = 0) {
  if (!items.length) return fallback;
  return items.reduce((min, item) => Math.min(min, item[field] ?? 0), items[0][field] ?? 0);
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function dataURLToBlob(dataURL) {
  const res = await fetch(dataURL);
  return res.blob();
}

export const api = {
  ready: () => getDB(),

  // ---------- Albums ----------
  // The list is always live-ranked by priority score (see priority.js):
  // days since last listened, plus a bonus from importance, plus a bonus
  // from `position` — the one field drag-and-drop and "move to top"
  // actually write. So a manual nudge is a strong vote, not an absolute
  // placement: it raises an album's score, but a genuinely overdue album
  // (or one marked "novo"/"importante") can still outrank it. This read
  // is where that ranking happens; nothing is persisted beyond `position`.
  listAlbums: () =>
    withStore("albums", "readonly", async (store) => {
      const all = await reqAll(store);
      const baseOrder = [...all].sort((a, b) => a.position - b.position);
      const total = baseOrder.length;
      return baseOrder
        .map((album, index) => ({ album, score: priorityScore(album, index, total) }))
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.album);
    }),

  listBandNames: () =>
    withStore("albums", "readonly", async (store) => {
      const all = await reqAll(store);
      const names = new Set(all.map((a) => a.band_name).filter(Boolean));
      return [...names].sort((a, b) => a.localeCompare(b));
    }),

  createAlbum: ({ name, band_name, subgenre_id, image }) =>
    withStore("albums", "readwrite", async (store) => {
      const existing = await reqAll(store);
      const record = {
        name,
        band_name: band_name || "",
        subgenre_id: subgenre_id ?? null,
        image: image ?? null,
        importance: DEFAULT_IMPORTANCE,
        position: maxField(existing, "position") + 1,
        last_listened_at: null,
        listen_history: [],
        created_at: new Date().toISOString(),
      };
      record.id = await reqAdd(store, record);
      return record;
    }),

  updateAlbum: (id, patch) =>
    withStore("albums", "readwrite", async (store) => {
      const album = await reqGet(store, Number(id));
      if (!album) throw notFound("Album");
      if (patch.name != null) album.name = patch.name;
      if (patch.band_name != null) album.band_name = patch.band_name;
      if ("subgenre_id" in patch) album.subgenre_id = patch.subgenre_id;
      if ("image" in patch) album.image = patch.image;
      if (patch.importance != null) album.importance = patch.importance;
      await reqPut(store, album);
      return album;
    }),

  deleteAlbum: (id) => withStore("albums", "readwrite", (store) => reqDelete(store, Number(id))),

  // Importance feeds straight into the priority score (see priority.js);
  // listAlbums() re-ranks live, so there's nothing else to recompute here.
  setImportance: (id, importance) =>
    withStore("albums", "readwrite", async (store) => {
      const album = await reqGet(store, Number(id));
      if (!album) throw notFound("Album");
      album.importance = importance;
      await reqPut(store, album);
    }),

  // Marks the album listened now (logged in its history) and sends its
  // manual-position baseline to the back, so its priority score drops back
  // to "just recency" (plus whatever importance it still carries) instead
  // of keeping whatever position-bonus it had before.
  markListened: (id) =>
    withStore("albums", "readwrite", async (store) => {
      const album = await reqGet(store, Number(id));
      if (!album) throw notFound("Album");
      const now = new Date().toISOString();
      album.last_listened_at = now;
      album.listen_history = [...(album.listen_history || []), now];
      if (
        (album.importance ?? DEFAULT_IMPORTANCE) === "novo" &&
        album.listen_history.length >= IMPORTANCE_GRADUATION_LISTENS
      ) {
        album.importance = "normal";
      }
      const all = await reqAll(store);
      album.position = maxField(all, "position") + 1;
      await reqPut(store, album);
      return album;
    }),

  moveToTop: (id) =>
    withStore("albums", "readwrite", async (store) => {
      const album = await reqGet(store, Number(id));
      if (!album) throw notFound("Album");
      const all = await reqAll(store);
      album.position = minField(all, "position") - 1;
      await reqPut(store, album);
      return album;
    }),

  // `orderedIds` is the full album list in its new drag-and-drop order.
  reorderAlbums: (orderedIds) =>
    withStore("albums", "readwrite", async (store) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const album = await reqGet(store, Number(orderedIds[i]));
        if (album && album.position !== i) {
          album.position = i;
          await reqPut(store, album);
        }
      }
    }),

  // ---------- Subgenre labels ----------
  listLabels: (kind) =>
    withStore("subgenre_labels", "readonly", async (store) => {
      const all = await reqIndexAll(store, "kind", kind);
      return all.sort((a, b) => a.position - b.position);
    }),

  // Same as listLabels, but each label also carries `count`: how many
  // albums currently carry that tag — shown next to it in the subgenre bar.
  listLabelsWithCounts: (kind) =>
    withStore(["subgenre_labels", "albums"], "readonly", async ({ subgenre_labels, albums }) => {
      const labels = (await reqIndexAll(subgenre_labels, "kind", kind)).sort(
        (a, b) => a.position - b.position
      );
      const allAlbums = await reqAll(albums);
      const counts = new Map();
      for (const a of allAlbums) {
        if (a.subgenre_id != null) counts.set(a.subgenre_id, (counts.get(a.subgenre_id) || 0) + 1);
      }
      return labels.map((l) => ({ ...l, count: counts.get(l.id) || 0 }));
    }),

  createLabel: (kind, label) =>
    withStore("subgenre_labels", "readwrite", async (store) => {
      const existing = await reqIndexAll(store, "kind", kind);
      const record = { kind, label, position: maxField(existing, "position") + 1 };
      record.id = await reqAdd(store, record);
      return record;
    }),

  updateLabel: (id, label) =>
    withStore("subgenre_labels", "readwrite", async (store) => {
      const row = await reqGet(store, Number(id));
      if (!row) throw notFound("Label");
      row.label = label;
      await reqPut(store, row);
      return row;
    }),

  deleteLabel: (id) =>
    withStore(
      ["subgenre_labels", "albums"],
      "readwrite",
      async ({ subgenre_labels, albums }) => {
        const labelId = Number(id);
        await reqDelete(subgenre_labels, labelId);
        const all = await reqAll(albums);
        for (const album of all) {
          if (album.subgenre_id === labelId) {
            album.subgenre_id = null;
            await reqPut(albums, album);
          }
        }
      }
    ),

  // ---------- Export / Import ----------
  exportAll: () =>
    withStore(
      ["albums", "subgenre_labels"],
      "readonly",
      async ({ albums, subgenre_labels }) => {
        const labelRows = await reqAll(subgenre_labels);
        const labelById = new Map(labelRows.map((l) => [l.id, l]));
        const albumRows = (await reqAll(albums)).sort((a, b) => a.position - b.position);

        const albumExports = [];
        for (const a of albumRows) {
          albumExports.push({
            name: a.name,
            band_name: a.band_name,
            subgenre: labelById.get(a.subgenre_id)
              ? { kind: "specific", label: labelById.get(a.subgenre_id).label }
              : null,
            image: a.image ? await blobToDataURL(a.image) : null,
            importance: a.importance || "normal",
            last_listened_at: a.last_listened_at,
            listen_history: a.listen_history || [],
          });
        }

        return {
          type: "listening-queue-backup",
          version: 1,
          exported_at: new Date().toISOString(),
          labels: labelRows.map((l) => ({ kind: l.kind, label: l.label })),
          albums: albumExports,
        };
      }
    ),

  importAll: (data) =>
    withStore(
      ["albums", "subgenre_labels"],
      "readwrite",
      async ({ albums, subgenre_labels }) => {
        const existingLabels = await reqAll(subgenre_labels);
        const findLabel = (kind, label) =>
          existingLabels.find(
            (l) => l.kind === kind && l.label.toLowerCase() === label.toLowerCase()
          );

        for (const entry of data.labels || []) {
          if (!findLabel(entry.kind, entry.label)) {
            const sameKind = existingLabels.filter((l) => l.kind === entry.kind);
            const record = {
              kind: entry.kind,
              label: entry.label,
              position: maxField(sameKind, "position") + 1,
            };
            record.id = await reqAdd(subgenre_labels, record);
            existingLabels.push(record);
          }
        }

        const existingAlbums = await reqAll(albums);
        const existingKey = (band, name) => `${(band || "").toLowerCase()}::${name.toLowerCase()}`;
        const existingNames = new Set(
          existingAlbums.map((a) => existingKey(a.band_name, a.name))
        );
        let position = maxField(existingAlbums, "position");
        let created = 0;
        let skipped = 0;

        for (const a of data.albums || []) {
          const key = existingKey(a.band_name, a.name);
          if (existingNames.has(key)) {
            skipped += 1;
            continue;
          }
          position += 1;
          // Old backups may still carry a.subgenre_generic — that whole
          // concept has been retired, so it's ignored on import.
          const subgenreLabel = a.subgenre ? findLabel("specific", a.subgenre.label) : null;
          const record = {
            name: a.name,
            band_name: a.band_name || "",
            subgenre_id: subgenreLabel ? subgenreLabel.id : null,
            image: a.image ? await dataURLToBlob(a.image) : null,
            importance: a.importance || "normal",
            position,
            last_listened_at: a.last_listened_at || null,
            listen_history: a.listen_history || [],
            created_at: new Date().toISOString(),
          };
          await reqAdd(albums, record);
          existingNames.add(key);
          created += 1;
        }

        return { labels_count: data.labels?.length || 0, created, skipped };
      }
    ),
};
