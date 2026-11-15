import { StationInfo } from '../types/trip.types';

export const APP_CONFIG = {
  APP_NAME: 'MRT Time Logger',
  VERSION: '1.1.0',
  DB_NAME: 'mrt_logger_db',
  DB_VERSION: 1,
  STORE_NAME: 'trips',
  SETTINGS_STORE_NAME: 'app_settings',
  CUTOFF_HOUR_NOON: 12, // Before 12:00 = Morning trip, >= 12:00 = Evening trip
  STORAGE_KEYS: {
    WEBHOOK_URL: 'mrt_google_sheets_webhook_url',
    AUTO_SYNC: 'mrt_auto_sync_enabled',
    LAST_SYNC: 'mrt_last_sync_timestamp',
  },
} as const;

export const DEFAULT_COMMUTE = {
  MORNING: {
    origin: 'บางหว้า',
    originCode: 'BL34',
    destination: 'สามย่าน',
    destinationCode: 'BL27',
    directionLabel: 'มุ่งหน้า ท่าพระ / หัวลำโพง',
  },
  EVENING: {
    origin: 'สามย่าน',
    originCode: 'BL27',
    destination: 'บางหว้า',
    destinationCode: 'BL34',
    directionLabel: 'มุ่งหน้า บางซื่อ / ท่าพระ / หลักสอง',
  },
} as const;

export const QUICK_TAGS = [
  '🌧️ ฝนตก',
  '⏳ รถทิ้งช่วงนาน',
  '⚠️ รอสัญญาณ',
  '👥 ชานชาลาคนล้น',
  '❄️ แอร์เย็นมาก',
] as const;

export const CROWD_LABELS: Record<string, { label: string; emoji: string; color: string; badgeClass: string }> = {
  low: {
    label: 'โล่ง (มีที่นั่ง)',
    emoji: '🟢',
    color: '#64836B',
    badgeClass: 'bg-emerald-950/40 text-emerald-300 border-emerald-700/30',
  },
  medium: {
    label: 'ปานกลาง (ยืนสบาย)',
    emoji: '🟡',
    color: '#C9974C',
    badgeClass: 'bg-amber-950/40 text-amber-300 border-amber-700/30',
  },
  high: {
    label: 'แน่นมาก (เบียด)',
    emoji: '🔴',
    color: '#C25745',
    badgeClass: 'bg-rose-950/40 text-rose-300 border-rose-700/30',
  },
  unspecified: {
    label: 'ยังไม่ระบุ',
    emoji: '⚪',
    color: '#A89E93',
    badgeClass: 'bg-stone-800/40 text-stone-400 border-stone-700/30',
  },
};

// All MRT Blue Line Stations in order
export const MRT_BLUE_LINE_STATIONS: StationInfo[] = [
  { code: 'BL01', nameTh: 'ท่าพระ', nameEn: 'Tha Phra' },
  { code: 'BL02', nameTh: 'จรัญฯ 13', nameEn: 'Charan 13' },
  { code: 'BL03', nameTh: 'ไฟฉาย', nameEn: 'Fai Chai' },
  { code: 'BL04', nameTh: 'บางขุนนนท์', nameEn: 'Bang Khun Non' },
  { code: 'BL05', nameTh: 'บางยี่ขัน', nameEn: 'Bang Yi Khan' },
  { code: 'BL06', nameTh: 'สิรินธร', nameEn: 'Sirindhorn' },
  { code: 'BL07', nameTh: 'บางพลัด', nameEn: 'Bang Phlat' },
  { code: 'BL08', nameTh: 'บางอ้อ', nameEn: 'Bang O' },
  { code: 'BL09', nameTh: 'บางโพ', nameEn: 'Bang Pho' },
  { code: 'BL10', nameTh: 'เตาปูน', nameEn: 'Tao Poon' },
  { code: 'BL11', nameTh: 'บางซื่อ', nameEn: 'Bang Sue' },
  { code: 'BL12', nameTh: 'กำแพงเพชร', nameEn: 'Kamphaeng Phet' },
  { code: 'BL13', nameTh: 'สวนจตุจักร', nameEn: 'Chatuchak Park' },
  { code: 'BL14', nameTh: 'พหลโยธิน', nameEn: 'Phahon Yothin' },
  { code: 'BL15', nameTh: 'ลาดพร้าว', nameEn: 'Lat Phrao' },
  { code: 'BL16', nameTh: 'รัชดาภิเษก', nameEn: 'Ratchadaphisek' },
  { code: 'BL17', nameTh: 'สุทธิสาร', nameEn: 'Sutthisan' },
  { code: 'BL18', nameTh: 'ห้วยขวาง', nameEn: 'Huai Khwang' },
  { code: 'BL19', nameTh: 'ศูนย์วัฒนธรรมแห่งประเทศไทย', nameEn: 'Thailand Cultural Centre' },
  { code: 'BL20', nameTh: 'พระราม 9', nameEn: 'Phra Ram 9' },
  { code: 'BL21', nameTh: 'เพชรบุรี', nameEn: 'Phetchaburi' },
  { code: 'BL22', nameTh: 'สุขุมวิท', nameEn: 'Sukhumvit' },
  { code: 'BL23', nameTh: 'ศูนย์การประชุมแห่งชาติสิริกิติ์', nameEn: 'Queen Sirikit National Convention Centre' },
  { code: 'BL24', nameTh: 'คลองเตย', nameEn: 'Khlong Toei' },
  { code: 'BL25', nameTh: 'ลุมพินี', nameEn: 'Lumphini' },
  { code: 'BL26', nameTh: 'สีลม', nameEn: 'Si Lom' },
  { code: 'BL27', nameTh: 'สามย่าน', nameEn: 'Sam Yan' },
  { code: 'BL28', nameTh: 'หัวลำโพง', nameEn: 'Hua Lamphong' },
  { code: 'BL29', nameTh: 'วัดมังกร', nameEn: 'Wat Mangkon' },
  { code: 'BL30', nameTh: 'สามยอด', nameEn: 'Sam Yot' },
  { code: 'BL31', nameTh: 'สนามไชย', nameEn: 'Sanam Chai' },
  { code: 'BL32', nameTh: 'อิสรภาพ', nameEn: 'Itsaraphap' },
  { code: 'BL01-2', nameTh: 'ท่าพระ (ชานชาลาล่าง)', nameEn: 'Tha Phra' },
  { code: 'BL33', nameTh: 'บางไผ่', nameEn: 'Bang Phai' },
  { code: 'BL34', nameTh: 'บางหว้า', nameEn: 'Bang Wa' },
  { code: 'BL35', nameTh: 'เพชรเกษม 48', nameEn: 'Phetkasem 48' },
  { code: 'BL36', nameTh: 'ภาษีเจริญ', nameEn: 'Phasi Charoen' },
  { code: 'BL37', nameTh: 'บางแค', nameEn: 'Bang Khae' },
  { code: 'BL38', nameTh: 'หลักสอง', nameEn: 'Lak Song' },
];
