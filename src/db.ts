import type { ParkingExport, PortableThought, Thought } from './types';

const REAL_DB_NAME = 'thought-parking';
const DB_VERSION = 1;
const STORE = 'thoughts';

let databasePromise: Promise<IDBDatabase> | undefined;
let databaseName = REAL_DB_NAME;

/**
 * The demo deliberately uses a different IndexedDB database. Calling this
 * before reading data guarantees a sample session cannot see or alter a
 * visitor's real parking lot.
 */
export function setDatabaseName(name: string): void {
  if (databaseName === name) return;
  void databasePromise?.then((database) => database.close()).catch(() => undefined);
  databasePromise = undefined;
  databaseName = name;
}

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      const store = database.createObjectStore(STORE, { keyPath: 'id' });
      store.createIndex('createdAt', 'createdAt');
      store.createIndex('status', 'status');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'));
    request.onblocked = () => reject(new Error('Local storage is blocked by another open version.'));
  });
  return databasePromise;
}

function complete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save locally.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Local save was cancelled.'));
  });
}

export async function getThoughts(): Promise<Thought[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    request.onsuccess = () => resolve((request.result as Thought[]).sort((a, b) => b.createdAt - a.createdAt));
    request.onerror = () => reject(request.error ?? new Error('Could not read parked thoughts.'));
  });
}

export async function saveThought(thought: Thought): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE, 'readwrite');
  transaction.objectStore(STORE).put(thought);
  await complete(transaction);
}

export async function saveThoughts(thoughts: Thought[]): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE, 'readwrite');
  const store = transaction.objectStore(STORE);
  thoughts.forEach((thought) => store.put(thought));
  await complete(transaction);
}

export async function clearThoughts(): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE, 'readwrite');
  transaction.objectStore(STORE).clear();
  await complete(transaction);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read an audio clip.'));
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export async function createExport(thoughts: Thought[]): Promise<ParkingExport> {
  const portable: PortableThought[] = await Promise.all(thoughts.map(async ({ audio, ...thought }) => ({
    ...thought,
    ...(audio ? { audio: await blobToDataUrl(audio) } : {}),
  })));
  return { product: 'thought-parking', version: 1, exportedAt: new Date().toISOString(), thoughts: portable };
}

export async function fromPortable(thoughts: PortableThought[]): Promise<Thought[]> {
  return Promise.all(thoughts.map(async ({ audio, ...thought }) => ({
    ...thought,
    ...(audio ? { audio: await dataUrlToBlob(audio) } : {}),
  })));
}
