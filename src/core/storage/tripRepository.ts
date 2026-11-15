import { ITripRepository } from '../types/storage.types';
import { TripLog } from '../types/trip.types';
import { IndexedDbAdapter } from './indexedDbAdapter';
import { APP_CONFIG } from '../config/constants';

export class TripRepository implements ITripRepository {
  private adapter = IndexedDbAdapter.getInstance();

  public async create(trip: TripLog): Promise<TripLog> {
    const { store, tx } = await this.adapter.getStore(APP_CONFIG.STORE_NAME, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(trip);
      request.onsuccess = () => resolve(trip);
      request.onerror = () => reject(request.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  public async getById(id: string): Promise<TripLog | null> {
    const { store } = await this.adapter.getStore(APP_CONFIG.STORE_NAME, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve((request.result as TripLog) || null);
      request.onerror = () => reject(request.error);
    });
  }

  public async getAll(limit?: number, offset?: number): Promise<TripLog[]> {
    const { store } = await this.adapter.getStore(APP_CONFIG.STORE_NAME, 'readonly');
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      // Order descending: latest trip first
      const request = index.openCursor(null, 'prev');
      const results: TripLog[] = [];
      let skipped = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (!cursor) {
          return resolve(results);
        }

        if (offset && skipped < offset) {
          skipped++;
          cursor.continue();
          return;
        }

        results.push(cursor.value as TripLog);

        if (limit && results.length >= limit) {
          return resolve(results);
        }

        cursor.continue();
      };

      request.onerror = () => reject(request.error);
    });
  }

  public async getByDateRange(startDate: string, endDate: string): Promise<TripLog[]> {
    const { store } = await this.adapter.getStore(APP_CONFIG.STORE_NAME, 'readonly');
    const index = store.index('date');
    const range = IDBKeyRange.bound(startDate, endDate);

    return new Promise((resolve, reject) => {
      const request = index.getAll(range);
      request.onsuccess = () => {
        const items = (request.result as TripLog[]) || [];
        items.sort((a, b) => b.timestamp - a.timestamp);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async update(id: string, updates: Partial<TripLog>): Promise<TripLog> {
    const { store, tx } = await this.adapter.getStore(APP_CONFIG.STORE_NAME, 'readwrite');
    const current = await this.getById(id);

    if (!current) {
      throw new Error(`Trip record with id ${id} not found.`);
    }

    const updated: TripLog = {
      ...current,
      ...updates,
      // If crowdLevel or notes changed, mark as unsynced so it pushes to Google Sheets
      synced: updates.synced !== undefined ? updates.synced : false,
    };

    return new Promise((resolve, reject) => {
      const request = store.put(updated);
      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  public async delete(id: string): Promise<boolean> {
    const { store, tx } = await this.adapter.getStore(APP_CONFIG.STORE_NAME, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  public async getUnsynced(): Promise<TripLog[]> {
    const all = await this.getAll();
    return all.filter((item) => !item.synced);
  }

  public async markAsSynced(ids: string[]): Promise<void> {
    const { store, tx } = await this.adapter.getStore(APP_CONFIG.STORE_NAME, 'readwrite');
    const now = Date.now();

    for (const id of ids) {
      const item = await this.getById(id);
      if (item) {
        item.synced = true;
        item.syncedAt = now;
        store.put(item);
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  public async count(): Promise<number> {
    const { store } = await this.adapter.getStore(APP_CONFIG.STORE_NAME, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
