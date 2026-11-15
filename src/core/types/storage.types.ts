import { TripLog } from './trip.types';

export interface ITripRepository {
  create(trip: TripLog): Promise<TripLog>;
  getById(id: string): Promise<TripLog | null>;
  getAll(limit?: number, offset?: number): Promise<TripLog[]>;
  getByDateRange(startDate: string, endDate: string): Promise<TripLog[]>;
  update(id: string, updates: Partial<TripLog>): Promise<TripLog>;
  delete(id: string): Promise<boolean>;
  getUnsynced(): Promise<TripLog[]>;
  markAsSynced(ids: string[]): Promise<void>;
  count(): Promise<number>;
}
