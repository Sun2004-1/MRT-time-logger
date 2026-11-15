import { ITripRepository } from '@/core/types/storage.types';
import { APP_CONFIG } from '@/core/config/constants';
import { TripLog } from '@/core/types/trip.types';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  message: string;
}

export class GoogleSheetsSyncService {
  constructor(private repository: ITripRepository) {}

  public getWebhookUrl(): string {
    return localStorage.getItem(APP_CONFIG.STORAGE_KEYS.WEBHOOK_URL) || '';
  }

  public setWebhookUrl(url: string): void {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.WEBHOOK_URL, url.trim());
  }

  public isAutoSyncEnabled(): boolean {
    return localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTO_SYNC) === 'true';
  }

  public setAutoSyncEnabled(enabled: boolean): void {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUTO_SYNC, enabled ? 'true' : 'false');
  }

  /**
   * Sync all unsynced trips to Google Sheets
   */
  public async syncUnsyncedTrips(): Promise<SyncResult> {
    const webhookUrl = this.getWebhookUrl();
    if (!webhookUrl) {
      return {
        success: false,
        syncedCount: 0,
        message: 'กรุณาระบุ Google Sheets Webhook URL ในหน้าตั้งค่าก่อนเริ่มซิงก์',
      };
    }

    if (!navigator.onLine) {
      return {
        success: false,
        syncedCount: 0,
        message: 'อุปกรณ์กำลังออฟไลน์ ข้อมูลจะถูกเก็บไว้ในเครื่องและซิงก์อัตโนมัติเมื่อต่อเน็ต',
      };
    }

    const unsyncedTrips = await this.repository.getUnsynced();
    if (unsyncedTrips.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        message: 'ข้อมูลทั้งหมดซิงก์เรียบร้อยแล้ว ไม่มีรายการค้าง',
      };
    }

    try {
      const payload = {
        action: 'batch_sync',
        timestamp: new Date().toISOString(),
        trips: unsyncedTrips,
      };

      // Send to Google Apps Script Webhook (using text/plain to prevent CORS preflight issue)
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok && response.type !== 'opaque') {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Mark trips as synced locally
      const syncedIds = unsyncedTrips.map((t: TripLog) => t.id);
      await this.repository.markAsSynced(syncedIds);
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.LAST_SYNC, String(Date.now()));

      return {
        success: true,
        syncedCount: unsyncedTrips.length,
        message: `ซิงก์สำเร็จ ${unsyncedTrips.length} รายการขึ้น Google Sheets`,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      return {
        success: false,
        syncedCount: 0,
        message: `การซิงก์ล้มเหลว: ${msg}`,
      };
    }
  }

  /**
   * Provides the Google Apps Script boilerplate for the user's Google Sheet
   */
  public static getGoogleAppsScriptTemplate(): string {
    return `// ==========================================
// Google Apps Script สำหรับรับข้อมูลจาก MRT Time Logger
// 1. ไปที่ Google Sheet ของคุณ -> Extensions -> Apps Script
// 2. วางโค้ดนี้แทนที่ทั้งหมด แล้วกด Save
// 3. กด Deploy -> New deployment -> Select type "Web app"
// 4. ตั้งค่า Who has access: "Anyone" (ทุกคน)
// 5. คัดลอก Web App URL มาใส่ในแอพ MRT Time Logger
// ==========================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // สร้างหัวตารางอัตโนมัติหากตารางยังว่างอยู่
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "รหัสบันทึก (ID)",
        "วันที่",
        "วันในสัปดาห์",
        "เวลาเทียบชานชาลา",
        "เที่ยว",
        "สถานีต้นทาง",
        "สถานีปลายทาง",
        "ทิศทาง",
        "ความหนาแน่น",
        "หมายเหตุ",
        "เวลาที่ซิงก์ (Server Time)"
      ]);
      sheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#EFEBE9");
      sheet.setFrozenRows(1);
    }
    
    var data = JSON.parse(e.postData.contents);
    var trips = data.trips || [];
    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
    
    // ดึงรายการ ID เดิมที่มีอยู่ใน Sheet เพื่อป้องกันข้อมูลซ้ำ (Upsert)
    var lastRow = sheet.getLastRow();
    var existingIds = {};
    if (lastRow > 1) {
      var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < idValues.length; i++) {
        existingIds[idValues[i][0]] = i + 2; // เก็บเลข row
      }
    }
    
    for (var j = 0; j < trips.length; j++) {
      var t = trips[j];
      var rowData = [
        t.id,
        t.date,
        t.dayOfWeek,
        t.time,
        t.tripType === "morning" ? "เช้า (ขาไป)" : (t.tripType === "evening" ? "เย็น (ขากลับ)" : "ทั่วไป"),
        t.station + " (" + t.stationCode + ")",
        t.destinationStation || "-",
        t.direction,
        t.crowdLevel,
        t.notes || "",
        nowStr
      ];
      
      if (existingIds[t.id]) {
        // อัปเดตข้อมูลแถวเดิม (กรณีแก้ไขความหนาแน่นหรือหมายเหตุย้อนหลัง)
        sheet.getRange(existingIds[t.id], 1, 1, rowData.length).setValues([rowData]);
      } else {
        // เพิ่มแถวใหม่
        sheet.appendRow(rowData);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      count: trips.length
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
  }
}
