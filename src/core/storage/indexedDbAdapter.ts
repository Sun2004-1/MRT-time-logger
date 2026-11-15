import { APP_CONFIG } from '@/core/config/constants';

export class IndexedDbAdapter {
  private static instance: IndexedDbAdapter;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  private constructor() {}

  public static getInstance(): IndexedDbAdapter {
    if (!IndexedDbAdapter.instance) {
      IndexedDbAdapter.instance = new IndexedDbAdapter();
    }
    return IndexedDbAdapter.instance;
  }

  public async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported on this platform.'));
      }

      const request = window.indexedDB.open(APP_CONFIG.DB_NAME, APP_CONFIG.DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Trips object store
        if (!db.objectStoreNames.contains(APP_CONFIG.STORE_NAME)) {
          const store = db.createObjectStore(APP_CONFIG.STORE_NAME, { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('tripType', 'tripType', { unique: false });
        }

        // App settings object store
        if (!db.objectStoreNames.contains(APP_CONFIG.SETTINGS_STORE_NAME)) {
          db.createObjectStore(APP_CONFIG.SETTINGS_STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.initPromise;
  }

  public async getStore(
    storeName: string = APP_CONFIG.STORE_NAME,
    mode: IDBTransactionMode = 'readonly'
  ): Promise<{ store: IDBObjectStore; tx: IDBTransaction }> {
    const db = await this.getDb();
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    return { store, tx };
  }
}
