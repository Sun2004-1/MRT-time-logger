const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

export function getNowComponents(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hours}:${minutes}:${seconds}`;
  const dayOfWeek = THAI_DAYS[date.getDay()];
  const id = `MRT-${year}${month}${day}-${hours}${minutes}${seconds}`;

  return {
    id,
    dateStr,
    timeStr,
    dayOfWeek,
    timestamp: date.getTime(),
    hours: date.getHours(),
  };
}

export function formatThaiDateLong(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const thaiYear = parseInt(year, 10) + 543;
  const monthIndex = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} ${thaiMonths[monthIndex]} ${thaiYear}`;
}
