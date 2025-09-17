// IndexedDB utilities for offline data storage

interface DataStore {
  id?: number;
  key: string;
  data: any;
  timestamp: number;
}

class IndexedDBManager {
  private dbName = 'prima-fpa-data';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('data')) {
          const store = db.createObjectStore('data', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('key', 'key', { unique: false });
        }
      };
    });
  }

  async store(key: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readwrite');
      const store = transaction.objectStore('data');
      
      const item: DataStore = {
        key,
        data,
        timestamp: Date.now()
      };
      
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async retrieve(key: string): Promise<any | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readonly');
      const store = transaction.objectStore('data');
      const index = store.index('key');
      
      const request = index.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readwrite');
      const store = transaction.objectStore('data');
      
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const storage = new IndexedDBManager();

// Convenience functions for common data types
export const storeUploadedData = (data: any[]) => 
  storage.store('uploaded-data', data);

export const getUploadedData = (): Promise<any[] | null> => 
  storage.retrieve('uploaded-data');

export const storeChatHistory = (messages: any[]) =>
  storage.store('chat-history', messages);

export const getChatHistory = (): Promise<any[] | null> =>
  storage.retrieve('chat-history');

export const storeNetSuiteConfig = (config: any) =>
  storage.store('netsuite-config', config);

export const getNetSuiteConfig = (): Promise<any | null> =>
  storage.retrieve('netsuite-config');