export type CrowdLevel = 'low' | 'medium' | 'high' | 'unspecified';

export type TripType = 'morning' | 'evening' | 'custom';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface TripLog {
  id: string;                      // MRT-YYYYMMDD-HHmmss
  date: string;                    // YYYY-MM-DD
  dayOfWeek: string;               // จันทร์, อังคาร, ...
  time: string;                    // HH:mm:ss
  timestamp: number;               // Epoch millisecond for sorting & accurate arithmetic
  tripType: TripType;              // morning (ขาไป), evening (ขากลับ), custom
  station: string;                 // e.g. บางหว้า
  stationCode: string;             // e.g. BL34
  direction: string;               // e.g. มุ่งหน้า ท่าพระ / หัวลำโพง
  destinationStation: string;      // e.g. สามย่าน
  crowdLevel: CrowdLevel;          // low, medium, high, unspecified
  notes: string;                   // หมายเหตุเพิ่มเติม
  synced: boolean;                 // true if synced to Google Sheets
  syncedAt?: number;               // Epoch millisecond when synced
}

export interface StationInfo {
  code: string;
  nameTh: string;
  nameEn: string;
}

export interface SyncPayload {
  action: 'insert' | 'update' | 'batch_sync';
  trips: TripLog[];
}
