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

// Recomputes the album list's stored order: pins the top N albums (N =
// that segmenter's quantity) of each active subgenre segmenter to the
// front, specific-kind segmenters before generic-kind ones, each group
// ordered by order_rank (the order quantities were assigned in). Everything
// else keeps its existing relative (manually-arranged) order after that.
// Writes the result back as every album's new `position`, so it's a real
// reorder, not just a filtered view — a plain drag afterwards still works
// from this new baseline.
async function recomputeOrder() {
  await withStore(["albums", "subgenre_labels", "segmenters"], "readwrite", async (stores) => {
    const { albums, subgenre_labels, segmenters } = stores;
    const baseOrder = (await reqAll(albums)).sort((a, b) => a.position - b.position);
    const labels = await reqAll(subgenre_labels);
    const segRows = await reqAll(segmenters);
    const segByLabelId = new Map(segRows.map((s) => [s.label_id, s]));

    const indexById = new Map(baseOrder.map((a, i) => [a.id, i]));
    const total = baseOrder.length;

    const active = labels
      .map((label) => ({ label, seg: segByLabelId.get(label.id) }))
      .filter(({ seg }) => seg && seg.quantity > 0)
      .map(({ label, seg }) => ({
        label_id: label.id,
        kind: label.kind,
        quantity: seg.quantity,
        order_rank: seg.order_rank ?? 0,
      }));

    const activeSpecific = active
      .filter((s) => s.kind === "specific")
      .sort((a, b) => a.order_rank - b.order_rank);
    const activeGeneric = active
      .filter((s) => s.kind === "generic")
      .sort((a, b) => a.order_rank - b.order_rank);
    const orderedSegmenters = [...activeSpecific, ...activeGeneric];

    const claimed = new Set();
    const pinnedFront = [];
    for (const seg of orderedSegmenters) {
      const field = seg.kind === "specific" ? "subgenre_id" : "subgenre_generic_id";
      const candidates = baseOrder.filter(
        (a) => !claimed.has(a.id) && a[field] === seg.label_id
      );
      const scored = candidates
        .map((a) => ({ album: a, score: priorityScore(a, indexById.get(a.id), total) }))
        .sort((a, b) => b.score - a.score);
      for (const { album } of scored.slice(0, seg.quantity)) {
        claimed.add(album.id);
        pinnedFront.push(album);
      }
    }

    const remaining = baseOrder.filter((a) => !claimed.has(a.id));
    const newOrder = [...pinnedFront, ...remaining];
    newOrder.forEach((album, i) => {
      if (album.position !== i) {
        album.position = i;
        reqPut(albums, album);
      }
    });
  });
}

export const api = {
  ready: () => getDB(),

  // ---------- Albums ----------
  listAlbums: () =>
    withStore("albums", "readonly", async (store) => {
      const all = await reqAll(store);
      return all.sort((a, b) => a.position - b.position);
    }),

  listBandNames: () =>
    withStore("albums", "readonly", async (store) => {
      const all = await reqAll(store);
      const names = new Set(all.map((a) => a.band_name).filter(Boolean));
      return [...names].sort((a, b) => a.localeCompare(b));
    }),

  createAlbum: ({ name, band_name, subgenre_id, subgenre_generic_id, image }) =>
    withStore("albums", "readwrite", async (store) => {
      const existing = await reqAll(store);
      const record = {
        name,
        band_name: band_name || "",
        subgenre_id: subgenre_id ?? null,
        subgenre_generic_id: subgenre_generic_id ?? null,
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
      if ("subgenre_generic_id" in patch) album.subgenre_generic_id = patch.subgenre_generic_id;
      if ("image" in patch) album.image = patch.image;
      if (patch.importance != null) album.importance = patch.importance;
      await reqPut(store, album);
      return album;
    }),

  deleteAlbum: (id) => withStore("albums", "readwrite", (store) => reqDelete(store, Number(id))),

  // Importance feeds straight into the priority score (see priority.js),
  // so changing it re-pins the list the same way a segmenter quantity
  // change does.
  setImportance: async (id, importance) => {
    await withStore("albums", "readwrite", async (store) => {
      const album = await reqGet(store, Number(id));
      if (!album) throw notFound("Album");
      album.importance = importance;
      await reqPut(store, album);
    });
    await recomputeOrder();
  },

  // Marks the album listened now (logged in its history), sends it to the
  // back of the list, and drains one unit from any active segmenter whose
  // tag it matches — then re-pins the front of the list to reflect that.
  markListened: async (id) => {
    const matchedLabelIds = await withStore(
      ["albums", "subgenre_labels", "segmenters"],
      "readwrite",
      async ({ albums, subgenre_labels, segmenters }) => {
        const album = await reqGet(albums, Number(id));
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
        const all = await reqAll(albums);
        album.position = maxField(all, "position") + 1;
        await reqPut(albums, album);

        const matched = [];
        for (const field of ["subgenre_id", "subgenre_generic_id"]) {
          const labelId = album[field];
          if (labelId == null) continue;
          const seg = await reqGet(segmenters, labelId);
          if (seg && seg.quantity > 0) {
            seg.quantity -= 1;
            await reqPut(segmenters, seg);
            matched.push(labelId);
          }
        }
        return matched;
      }
    );
    await recomputeOrder();
    return matchedLabelIds;
  },

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
      ["subgenre_labels", "segmenters", "albums"],
      "readwrite",
      async ({ subgenre_labels, segmenters, albums }) => {
        const labelId = Number(id);
        await reqDelete(subgenre_labels, labelId);
        await reqDelete(segmenters, labelId);
        const all = await reqAll(albums);
        for (const album of all) {
          let changed = false;
          if (album.subgenre_id === labelId) {
            album.subgenre_id = null;
            changed = true;
          }
          if (album.subgenre_generic_id === labelId) {
            album.subgenre_generic_id = null;
            changed = true;
          }
          if (changed) await reqPut(albums, album);
        }
      }
    ),

  // ---------- Segmenters ----------
  // One row per subgenre label (both kinds), merging in its segmenter
  // state (quantity 0 / no order yet if it's never been activated).
  listSegmenters: (kind) =>
    withStore(["subgenre_labels", "segmenters"], "readonly", async ({ subgenre_labels, segmenters }) => {
      const labels = await reqIndexAll(subgenre_labels, "kind", kind);
      const segRows = await reqAll(segmenters);
      const byLabelId = new Map(segRows.map((s) => [s.label_id, s]));
      const merged = labels.map((label) => {
        const seg = byLabelId.get(label.id);
        return {
          label_id: label.id,
          kind: label.kind,
          label: label.label,
          quantity: seg?.quantity ?? 0,
          order_rank: seg?.order_rank ?? label.position,
        };
      });
      merged.sort((a, b) => {
        const aActive = a.quantity > 0;
        const bActive = b.quantity > 0;
        if (aActive !== bActive) return aActive ? -1 : 1;
        return a.order_rank - b.order_rank;
      });
      return merged;
    }),

  setSegmenterQuantity: async (labelId, kind, quantity, { recompute = true } = {}) => {
    const clamped = Math.max(0, quantity);
    await withStore("segmenters", "readwrite", async (store) => {
      let row = await reqGet(store, Number(labelId));
      const wasActive = row && row.quantity > 0;
      const willBeActive = clamped > 0;
      if (!row) row = { label_id: Number(labelId), kind, quantity: 0, order_rank: 0 };
      if (!wasActive && willBeActive) {
        const all = await reqAll(store);
        const sameKindMax = maxField(
          all.filter((s) => s.kind === kind && s.label_id !== Number(labelId)),
          "order_rank"
        );
        row.order_rank = sameKindMax + 1;
      }
      row.kind = kind;
      row.quantity = clamped;
      await reqPut(store, row);
    });
    if (recompute) await recomputeOrder();
  },

  // `orderedLabelIds` is one kind's full segmenter row in its new
  // drag-and-drop order; order_rank for the other kind is untouched, since
  // specific and generic segmenters queue independently (specific-kind
  // pins always take precedence — see recomputeOrder).
  reorderSegmenters: (kind, orderedLabelIds) =>
    withStore("segmenters", "readwrite", async (store) => {
      for (let i = 0; i < orderedLabelIds.length; i++) {
        const labelId = Number(orderedLabelIds[i]);
        let row = await reqGet(store, labelId);
        if (!row) row = { label_id: labelId, kind, quantity: 0, order_rank: i };
        else row.order_rank = i;
        await reqPut(store, row);
      }
    }),

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
            subgenre_generic: labelById.get(a.subgenre_generic_id)
              ? { kind: "generic", label: labelById.get(a.subgenre_generic_id).label }
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
          const subgenreLabel = a.subgenre ? findLabel("specific", a.subgenre.label) : null;
          const genericLabel = a.subgenre_generic
            ? findLabel("generic", a.subgenre_generic.label)
            : null;
          const record = {
            name: a.name,
            band_name: a.band_name || "",
            subgenre_id: subgenreLabel ? subgenreLabel.id : null,
            subgenre_generic_id: genericLabel ? genericLabel.id : null,
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
