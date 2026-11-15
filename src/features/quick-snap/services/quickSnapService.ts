import { APP_CONFIG, DEFAULT_COMMUTE } from '@/core/config/constants';
import { ITripRepository } from '@/core/types/storage.types';
import { TripLog, TripType } from '@/core/types/trip.types';
import { getNowComponents } from '@/core/utils/date';
import { triggerHaptic } from '@/core/utils/haptic';

export interface RouteState {
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  directionLabel: string;
  tripType: TripType;
  isCustom: boolean;
}

export class QuickSnapService {
  private routeState: RouteState;

  constructor(private repository: ITripRepository) {
    this.routeState = this.calculateSmartDefaultRoute();
  }

  /**
   * Smart route selector:
   * Before 12:00 -> Bang Wa -> Sam Yan (Morning commute)
   * After 12:00 -> Sam Yan -> Bang Wa (Evening commute)
   */
  public calculateSmartDefaultRoute(now: Date = new Date()): RouteState {
    const hours = now.getHours();
    if (hours < APP_CONFIG.CUTOFF_HOUR_NOON) {
      return {
        origin: DEFAULT_COMMUTE.MORNING.origin,
        originCode: DEFAULT_COMMUTE.MORNING.originCode,
        destination: DEFAULT_COMMUTE.MORNING.destination,
        destinationCode: DEFAULT_COMMUTE.MORNING.destinationCode,
        directionLabel: DEFAULT_COMMUTE.MORNING.directionLabel,
        tripType: 'morning',
        isCustom: false,
      };
    } else {
      return {
        origin: DEFAULT_COMMUTE.EVENING.origin,
        originCode: DEFAULT_COMMUTE.EVENING.originCode,
        destination: DEFAULT_COMMUTE.EVENING.destination,
        destinationCode: DEFAULT_COMMUTE.EVENING.destinationCode,
        directionLabel: DEFAULT_COMMUTE.EVENING.directionLabel,
        tripType: 'evening',
        isCustom: false,
      };
    }
  }

  public getRouteState(): RouteState {
    return this.routeState;
  }

  public swapRoute(): RouteState {
    triggerHaptic('light');
    const prev = this.routeState;
    const isNowMorning = prev.tripType === 'evening';

    this.routeState = {
      origin: prev.destination,
      originCode: prev.destinationCode,
      destination: prev.origin,
      destinationCode: prev.originCode,
      directionLabel: isNowMorning
        ? DEFAULT_COMMUTE.MORNING.directionLabel
        : DEFAULT_COMMUTE.EVENING.directionLabel,
      tripType: isNowMorning ? 'morning' : 'evening',
      isCustom: true,
    };
    return this.routeState;
  }

  public setCustomStation(origin: string, originCode: string, destination: string, destinationCode: string, directionLabel: string): RouteState {
    this.routeState = {
      origin,
      originCode,
      destination,
      destinationCode,
      directionLabel,
      tripType: 'custom',
      isCustom: true,
    };
    return this.routeState;
  }

  /**
   * Primary Action: One-Tap Quick Snap Logging
   */
  public async logArrival(crowdLevel: TripLog['crowdLevel'] = 'unspecified', notes: string = ''): Promise<TripLog> {
    const now = getNowComponents();
    triggerHaptic('success');

    const newTrip: TripLog = {
      id: now.id,
      date: now.dateStr,
      dayOfWeek: now.dayOfWeek,
      time: now.timeStr,
      timestamp: now.timestamp,
      tripType: this.routeState.tripType,
      station: this.routeState.origin,
      stationCode: this.routeState.originCode,
      destinationStation: this.routeState.destination,
      direction: this.routeState.directionLabel,
      crowdLevel,
      notes,
      synced: false,
    };

    return await this.repository.create(newTrip);
  }
}
