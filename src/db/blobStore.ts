/**
 * IndexedDB binary storage layer for:
 * 1. Persisting the SQLite database binary (Uint8Array) offline on each device.
 * 2. Storing teacher-uploaded PDF files, Video files (.mp4/.webm), and generated offline PDFs.
 */

const DB_NAME = 'pragatir_pathshala_idb_v1';
const DB_VERSION = 1;
const STORE_SQLITE = 'sqlite_snapshot';
const STORE_BLOBS = 'media_blobs';

export interface StoredBlobRecord {
  key: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  blob: Blob;
  updatedAt: string;
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SQLITE)) {
        db.createObjectStore(STORE_SQLITE);
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadSqliteSnapshot(): Promise<Uint8Array | null> {
  try {
    const db = await openIdb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SQLITE, 'readonly');
      const store = tx.objectStore(STORE_SQLITE);
      const req = store.get('main_db');
      req.onsuccess = () => {
        const res = req.result;
        if (res instanceof Uint8Array) resolve(res);
        else if (res instanceof ArrayBuffer) resolve(new Uint8Array(res));
        else resolve(null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function saveSqliteSnapshot(bytes: Uint8Array): Promise<void> {
  const db = await openIdb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_SQLITE, 'readwrite');
    const store = tx.objectStore(STORE_SQLITE);
    const req = store.put(bytes, 'main_db');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveMediaBlob(record: StoredBlobRecord): Promise<void> {
  const db = await openIdb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_BLOBS, 'readwrite');
    const store = tx.objectStore(STORE_BLOBS);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getMediaBlob(key: string): Promise<StoredBlobRecord | null> {
  try {
    const db = await openIdb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BLOBS, 'readonly');
      const store = tx.objectStore(STORE_BLOBS);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as StoredBlobRecord | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteMediaBlob(key: string): Promise<void> {
  const db = await openIdb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_BLOBS, 'readwrite');
    const store = tx.objectStore(STORE_BLOBS);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function listMediaStats(): Promise<{ count: number; totalBytes: number }> {
  try {
    const db = await openIdb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_BLOBS, 'readonly');
      const store = tx.objectStore(STORE_BLOBS);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as StoredBlobRecord[]) || [];
        const totalBytes = items.reduce((acc, item) => acc + (item.sizeBytes || 0), 0);
        resolve({ count: items.length, totalBytes });
      };
      req.onerror = () => resolve({ count: 0, totalBytes: 0 });
    });
  } catch {
    return { count: 0, totalBytes: 0 };
  }
}
