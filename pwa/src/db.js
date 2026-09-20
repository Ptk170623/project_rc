const DB_NAME = "music_journal";
const DB_VERSION = 2;

// Every store creation is guarded by objectStoreNames.contains(): this runs
// for a brand new database (all stores get created) and for an upgrade of
// an already-installed one (only stores added since its version are
// missing), and createObjectStore throws if called on a name that already
// exists, so the guard is required either way.
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains("bands")) {
        db.createObjectStore("bands", { keyPath: "id", autoIncrement: true });
      }

      if (!db.objectStoreNames.contains("albums")) {
        const albums = db.createObjectStore("albums", {
          keyPath: "id",
          autoIncrement: true,
        });
        albums.createIndex("band_id", "band_id");
      }

      if (!db.objectStoreNames.contains("songs")) {
        const songs = db.createObjectStore("songs", {
          keyPath: "id",
          autoIncrement: true,
        });
        songs.createIndex("album_id", "album_id");
      }

      if (!db.objectStoreNames.contains("traits")) {
        const traits = db.createObjectStore("traits", {
          keyPath: "id",
          autoIncrement: true,
        });
        traits.createIndex("song_id", "song_id");
      }

      if (!db.objectStoreNames.contains("options")) {
        const options = db.createObjectStore("options", {
          keyPath: "id",
          autoIncrement: true,
        });
        options.createIndex("kind", "kind");
      }

      if (!db.objectStoreNames.contains("rotation_slots")) {
        const rotation = db.createObjectStore("rotation_slots", {
          keyPath: "id",
          autoIncrement: true,
        });
        rotation.createIndex("day", "day");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise;
export function getDB() {
  if (!dbPromise) dbPromise = openDB();
  return dbPromise;
}

function promisify(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function withStore(storeNames, mode, fn) {
  const db = await getDB();
  const transaction = db.transaction(storeNames, mode);
  const stores = Array.isArray(storeNames)
    ? Object.fromEntries(
        storeNames.map((name) => [name, transaction.objectStore(name)])
      )
    : transaction.objectStore(storeNames);

  const result = await fn(stores);
  await new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  return result;
}

export function reqAll(store) {
  return promisify(store.getAll());
}

export function reqGet(store, key) {
  return promisify(store.get(key));
}

export function reqAdd(store, value) {
  return promisify(store.add(value));
}

export function reqPut(store, value) {
  return promisify(store.put(value));
}

export function reqDelete(store, key) {
  return promisify(store.delete(key));
}

export function reqIndexAll(store, indexName, query) {
  return promisify(store.index(indexName).getAll(query));
}
