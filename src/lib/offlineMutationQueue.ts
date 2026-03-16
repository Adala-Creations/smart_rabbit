'use client';

export type QueuedMutation = {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  createdAt: number;
  attempts: number;
  lastError?: string;
  description?: string;
};

export type QueueFlushResult = {
  processed: number;
  succeeded: number;
  failed: number;
  remaining: number;
};

const DB_NAME = 'smart-rabbit-offline';
const DB_VERSION = 1;
const STORE_NAME = 'mutations';

const hasIndexedDb = () => typeof window !== 'undefined' && typeof indexedDB !== 'undefined';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open offline queue database'));
  });
}

async function withStore<T>(mode: IDBTransactionMode, handler: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const req = handler(store);
    let result: T;

    req.onsuccess = () => {
      result = req.result as T;
    };
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));

    tx.oncomplete = () => {
      db.close();
      resolve(result as T);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('IndexedDB transaction failed'));
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error ?? new Error('IndexedDB transaction aborted'));
    };
  });
}

export async function enqueueMutation(entry: Omit<QueuedMutation, 'id' | 'createdAt' | 'attempts'>): Promise<QueuedMutation | null> {
  if (!hasIndexedDb()) return null;

  const queued: QueuedMutation = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    attempts: 0,
    ...entry,
  };

  await withStore<void>('readwrite', (store) => store.put(queued));
  return queued;
}

export async function getQueuedMutations(): Promise<QueuedMutation[]> {
  if (!hasIndexedDb()) return [];

  const items = await withStore<QueuedMutation[]>('readonly', (store) => store.getAll());
  return (items || []).sort((a, b) => a.createdAt - b.createdAt);
}

export async function getQueuedMutationCount(): Promise<number> {
  if (!hasIndexedDb()) return 0;
  return withStore<number>('readonly', (store) => store.count());
}

export async function deleteQueuedMutation(id: string): Promise<void> {
  if (!hasIndexedDb()) return;
  await withStore<void>('readwrite', (store) => store.delete(id));
}

export async function updateQueuedMutation(item: QueuedMutation): Promise<void> {
  if (!hasIndexedDb()) return;
  await withStore<void>('readwrite', (store) => store.put(item));
}

export async function flushQueuedMutations(): Promise<QueueFlushResult> {
  const queue = await getQueuedMutations();

  if (queue.length === 0) {
    return {
      processed: 0,
      succeeded: 0,
      failed: 0,
      remaining: 0,
    };
  }

  let succeeded = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });

      if (res.ok) {
        await deleteQueuedMutation(item.id);
        succeeded += 1;
        continue;
      }

      if (res.status >= 400 && res.status < 500) {
        await deleteQueuedMutation(item.id);
        failed += 1;
        continue;
      }

      await updateQueuedMutation({
        ...item,
        attempts: item.attempts + 1,
        lastError: `Server error (${res.status})`,
      });
      break;
    } catch {
      await updateQueuedMutation({
        ...item,
        attempts: item.attempts + 1,
        lastError: 'Network unavailable',
      });
      break;
    }
  }

  const remaining = await getQueuedMutationCount();

  return {
    processed: queue.length,
    succeeded,
    failed,
    remaining,
  };
}
