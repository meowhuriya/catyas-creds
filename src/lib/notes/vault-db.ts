/** Tiny promise wrapper over IndexedDB. Holds notes + photos locally so they open instantly and offline. */
const DB_NAME = "valerias-vault";
const DB_VERSION = 2;
export type VaultStore = "notes" | "media" | "files";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("notes")) db.createObjectStore("notes", { keyPath: "id" });
      if (!db.objectStoreNames.contains("media")) db.createObjectStore("media", { keyPath: "id" });
      if (!db.objectStoreNames.contains("files")) db.createObjectStore("files", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

function run<T>(store: VaultStore, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(store, mode).objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export const idbGetAll = <T,>(store: VaultStore) => run<T[]>(store, "readonly", (s) => s.getAll() as IDBRequest<T[]>);
export const idbGet = <T,>(store: VaultStore, id: string) =>
  run<T | undefined>(store, "readonly", (s) => s.get(id) as IDBRequest<T | undefined>);
export const idbPut = (store: VaultStore, value: unknown) => run(store, "readwrite", (s) => s.put(value));
export const idbDelete = (store: VaultStore, id: string) => run(store, "readwrite", (s) => s.delete(id));
