// src/lib/image-storage.ts

const DB_NAME = 'DrawnanoImageDB';
const STORE_NAME = 'ImageStore';
const DB_VERSION = 1;

interface IDBRequestWithResult<T> extends IDBRequest {
  result: T;
}

// 打开或创建数据库
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject('IndexedDB error: ' + (event.target as IDBOpenDBRequest).error);
    };
  });
}

// 存储图片
export async function storeImage(id: string, src: string): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ id, src });

    request.onsuccess = () => {
      resolve(id);
    };

    request.onerror = (event) => {
      reject('Failed to store image: ' + (event.target as IDBRequest).error);
    };
  });
}

// 获取图片
export async function getImage(id: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request: IDBRequestWithResult<{id: string, src: string} | undefined> = store.get(id);

    request.onsuccess = () => {
      resolve(request.result ? request.result.src : null);
    };

    request.onerror = (event) => {
      reject('Failed to retrieve image: ' + (event.target as IDBRequest).error);
    };
  });
}

// 获取所有图片
export async function getAllImages(): Promise<{id: string, src: string}[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request: IDBRequestWithResult<{id: string, src: string}[]> = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      reject('Failed to retrieve all images: ' + (event.target as IDBRequest).error);
    };
  });
}

// 删除图片
export async function deleteImage(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject('Failed to delete image: ' + (event.target as IDBRequest).error);
    };
  });
}
