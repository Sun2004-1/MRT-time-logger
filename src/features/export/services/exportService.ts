import * as XLSX from 'xlsx';
import { ITripRepository } from '@/core/types/storage.types';
import { CROWD_LABELS } from '@/core/config/constants';
import { TripLog } from '@/core/types/trip.types';

export class ExportService {
  constructor(private repository: ITripRepository) {}

  private mapTripToExportRow(trip: TripLog) {
    const crowdInfo = CROWD_LABELS[trip.crowdLevel] || CROWD_LABELS.unspecified;
    return {
      'รหัสบันทึก (ID)': trip.id,
      'วันที่': trip.date,
      'วันในสัปดาห์': trip.dayOfWeek,
      'เวลาเทียบชานชาลา': trip.time,
      'เที่ยวการเดินทาง': trip.tripType === 'morning' ? 'เช้า (ขาไป)' : trip.tripType === 'evening' ? 'เย็น (ขากลับ)' : 'ทั่วไป',
      'สถานีต้นทาง': `${trip.station} (${trip.stationCode})`,
      'สถานีปลายทาง': trip.destinationStation || '-',
      'ทิศทางขบวนรถ': trip.direction,
      'ความหนาแน่น': `${crowdInfo.emoji} ${crowdInfo.label}`,
      'หมายเหตุ': trip.notes || '',
      'สถานะการซิงก์': trip.synced ? 'ซิงก์แล้ว' : 'ยังไม่ซิงก์',
    };
  }

  /**
   * Export as CSV with UTF-8 BOM for Microsoft Excel Thai compatibility
   */
  public async exportCsv(): Promise<void> {
    const trips = await this.repository.getAll();
    if (trips.length === 0) {
      throw new Error('ยังไม่มีข้อมูลการบันทึกสำหรับการส่งออก');
    }

    const rows = trips.map((t: TripLog) => this.mapTripToExportRow(t));
    const headers = Object.keys(rows[0]);

    const csvLines = [
      headers.join(','),
      ...rows.map((row: Record<string, string>) =>
        headers
          .map((h) => {
            const val = String(row[h] ?? '').replace(/"/g, '""');
            return `"${val}"`;
          })
          .join(',')
      ),
    ];

    // Prepend UTF-8 BOM (\uFEFF)
    const csvContent = '\uFEFF' + csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, `mrt_time_logs_${this.getExportDateStr()}.csv`);
  }

  /**
   * Export as native Microsoft Excel .xlsx
   */
  public async exportExcel(): Promise<void> {
    const trips = await this.repository.getAll();
    if (trips.length === 0) {
      throw new Error('ยังไม่มีข้อมูลการบันทึกสำหรับการส่งออก');
    }

    const rows = trips.map((t: TripLog) => this.mapTripToExportRow(t));
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-fit column widths
    const colWidths = Object.keys(rows[0]).map((key) => ({
      wch: Math.max(key.length * 2, 16),
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MRT Logs');

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    this.downloadFile(blob, `mrt_time_logs_${this.getExportDateStr()}.xlsx`);
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private getExportDateStr(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }
}
