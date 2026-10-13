// db.ts: a tiny IndexedDB wrapper for Finance. The ledger lives in one object
// store, keyed by id; every edit is a put() or delete(). Nothing here touches
// the DOM, and every call is a promise, so the views can await a load and
// move on after a save. All access is guarded so the docs server can import
// this module and render the page without a database.
import type { Tx } from "./money.ts";

const DB = "nuclo-desktop-finance";
const STORE = "transactions";

export const supported = () => typeof indexedDB !== "undefined";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Could not open the database"));
  });
}

function request(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<any> {
  return open().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = run(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? tx.error);
    tx.oncomplete = () => db.close();
  }));
}

export const loadTxs = (): Promise<Tx[]> => request("readonly", (store) => store.getAll());

export const saveTx = (t: Tx): Promise<void> => request("readwrite", (store) => store.put(t));

export const deleteTx = (id: number): Promise<void> => request("readwrite", (store) => store.delete(id));

/** Wipes the store and writes a fresh set, for the demo Reset. */
export function replaceAll(txs: Tx[]): Promise<void> {
  return open().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.clear();
    for (const t of txs) store.put(t);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  }));
}
