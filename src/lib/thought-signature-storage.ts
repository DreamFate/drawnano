// src/lib/thought-signature-storage.ts

const DB_NAME = 'DrawnanoThoughtSignatureDB';
const STORE_NAME = 'ThoughtSignatureStore';
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

// 存储思路签名
export async function storeThoughtSignature(id: string, src: string): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ id, src });

    request.onsuccess = () => {
      resolve(id);
    };

    request.onerror = (event) => {
      reject('Failed to store thought signature: ' + (event.target as IDBRequest).error);
    };
  });
}

// 获取思路签名
export async function getThoughtSignature(id: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request: IDBRequestWithResult<{id: string, src: string} | undefined> = store.get(id);

    request.onsuccess = () => {
      resolve(request.result ? request.result.src : null);
    };

    request.onerror = (event) => {
      reject('Failed to retrieve thought signature: ' + (event.target as IDBRequest).error);
    };
  });
}

// 获取所有思路签名
export async function getAllThoughtSignatures(): Promise<{id: string, src: string}[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request: IDBRequestWithResult<{id: string, src: string}[]> = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      reject('Failed to retrieve all thought signatures: ' + (event.target as IDBRequest).error);
    };
  });
}

// 删除思路签名
export async function deleteThoughtSignature(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject('Failed to delete thought signature: ' + (event.target as IDBRequest).error);
    };
  });
}

// 获取所有思路签名ID
export async function getAllThoughtSignatureIds(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAllKeys();

    request.onsuccess = () => {
      resolve(request.result as string[]);
    };

    request.onerror = (event) => {
      reject('Failed to retrieve all thought signature IDs: ' + (event.target as IDBRequest).error);
    };
  });
}

// 批量删除思路签名（用于清理不再使用的签名）
export async function deleteThoughtSignatures(ids: string[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    let completed = 0;
    let hasError = false;

    ids.forEach(id => {
      const request = store.delete(id);

      request.onsuccess = () => {
        completed++;
        if (completed === ids.length && !hasError) {
          resolve();
        }
      };

      request.onerror = (event) => {
        if (!hasError) {
          hasError = true;
          reject('Failed to delete thought signatures: ' + (event.target as IDBRequest).error);
        }
      };
    });

    if (ids.length === 0) {
      resolve();
    }
  });
}
