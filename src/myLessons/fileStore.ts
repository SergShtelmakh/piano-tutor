// The files the learner added to My lessons, kept on the device in IndexedDB. Every call
// resolves to a result; none throws, because IndexedDB can be blocked (private windows, site data).

const DB_NAME = 'piano-tutor';
const DB_VERSION = 1;
const STORE = 'files';

export interface StoredFile {
  /** The file name as chosen, with its extension. */
  name: string;
  bytes: ArrayBuffer;
}

export type StoreFailure = 'unavailable' | 'quota' | 'missing';
export type StoreResult<T> = { ok: true; value: T } | { ok: false; reason: StoreFailure };

function failure(error: unknown): StoreFailure {
  const name = (error as { name?: string } | null)?.name;
  return name === 'QuotaExceededError' ? 'quota' : 'unavailable';
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB failed to open'));
    request.onblocked = () => reject(new Error('IndexedDB is blocked'));
  });
}

/** Runs one request in a transaction and resolves when the transaction has completed. */
async function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<StoreResult<T>> {
  let db: IDBDatabase | null = null;
  try {
    db = await open();
    const connection = db;
    return await new Promise<StoreResult<T>>((resolve) => {
      const transaction = connection.transaction(STORE, mode);
      const request = action(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve({ ok: true, value: request.result });
      transaction.onabort = () => resolve({ ok: false, reason: failure(transaction.error) });
      transaction.onerror = () => resolve({ ok: false, reason: failure(transaction.error) });
    });
  } catch (error) {
    return { ok: false, reason: failure(error) };
  } finally {
    db?.close();
  }
}

export async function putFile(id: string, file: StoredFile): Promise<StoreResult<null>> {
  const result = await run('readwrite', (store) => store.put(file, id));
  return result.ok ? { ok: true, value: null } : result;
}

export async function getFile(id: string): Promise<StoreResult<StoredFile>> {
  const result = await run(
    'readonly',
    (store) => store.get(id) as IDBRequest<StoredFile | undefined>,
  );
  if (!result.ok) return result;
  const file = result.value;
  if (!file || typeof file.name !== 'string' || !(file.bytes instanceof ArrayBuffer)) {
    return { ok: false, reason: 'missing' };
  }
  return { ok: true, value: file };
}

export async function deleteFile(id: string): Promise<StoreResult<null>> {
  const result = await run('readwrite', (store) => store.delete(id));
  return result.ok ? { ok: true, value: null } : result;
}
