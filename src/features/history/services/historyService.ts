import { ITripRepository } from '@/core/types/storage.types';
import { TripLog, CrowdLevel } from '@/core/types/trip.types';

export class HistoryService {
  constructor(private repository: ITripRepository) {}

  public async getRecentTrips(limit: number = 50): Promise<TripLog[]> {
    return await this.repository.getAll(limit);
  }

  public async updateDeferredMetadata(
    id: string,
    crowdLevel: CrowdLevel,
    notes: string
  ): Promise<TripLog> {
    return await this.repository.update(id, {
      crowdLevel,
      notes: notes.trim(),
    });
  }

  public async deleteTrip(id: string): Promise<boolean> {
    return await this.repository.delete(id);
  }

  public async getTodayTrips(): Promise<TripLog[]> {
    const today = new Date().toISOString().split('T')[0];
    const trips = await this.repository.getAll(20);
    return trips.filter((t: TripLog) => t.date === today);
  }
}
