import { ExportService } from '../services/exportService';
import { GoogleSheetsSyncService } from '@/features/sync/services/googleSheetsSyncService';
import { Toast } from '@/ui/components/toast';
import { triggerHaptic } from '@/core/utils/haptic';

export class ExportView {
  private container: HTMLElement;

  constructor(
    containerId: string,
    private exportService: ExportService,
    private syncService: GoogleSheetsSyncService
  ) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;
    this.render();
  }

  public render(): void {
    const webhookUrl = this.syncService.getWebhookUrl();

    this.container.innerHTML = `
      <div class="max-w-md mx-auto px-5 py-4 safe-top pb-28 space-y-6">
        <div>
          <h2 class="text-xl font-bold text-[#FAF5EE]">ซิงก์ & ส่งออกข้อมูล</h2>
          <p class="text-xs text-[#A89E93]">สำรองข้อมูลไปยัง Google Sheets หรือดาวน์โหลดไฟล์</p>
        </div>

        <!-- Google Sheets Cloud Sync Section -->
        <div class="bg-[#231E1B] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-700/40 text-emerald-400 flex items-center justify-center text-sm font-bold">📊</span>
              <div>
                <h3 class="text-sm font-semibold text-[#FAF5EE]">Google Sheets Sync</h3>
                <p class="text-[11px] text-[#A89E93]">อัปโหลดข้อมูลเข้าสเปรดชีตของคุณ</p>
              </div>
            </div>
            <span id="network-status-badge" class="text-[10px] font-mono px-2 py-0.5 rounded-full ${
              navigator.onLine ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
            }">
              ${navigator.onLine ? '● Online' : '○ Offline'}
            </span>
          </div>

          <!-- Webhook input -->
          <div>
            <label class="block text-[11px] font-medium text-[#A89E93] mb-1.5 uppercase tracking-wider">
              Google Apps Script Webhook URL
            </label>
            <input
              id="webhook-url-input"
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value="${webhookUrl}"
              class="w-full bg-[#2E2723] text-xs text-[#FAF5EE] placeholder-[#A89E93]/50 px-3.5 py-2.5 rounded-xl border border-white/5 outline-none focus:border-[#C86D51] font-mono"
            />
            <div class="flex items-center justify-between mt-2">
              <button id="save-webhook-btn" class="text-xs text-[#C86D51] font-medium hover:underline">
                บันทึก URL
              </button>
              <button id="toggle-guide-btn" class="text-xs text-[#A89E93] hover:text-[#FAF5EE] underline">
                ดูโค้ด Apps Script
              </button>
            </div>
          </div>

          <!-- Apps Script Code Guide Collapsible -->
          <div id="apps-script-guide" class="hidden bg-[#171412] p-3 rounded-2xl border border-white/5 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-[#FAF5EE]">คำแนะนำการติดตั้ง Apps Script</span>
              <button id="copy-script-btn" class="text-xs px-2 py-0.5 rounded bg-[#3B322D] text-[#C86D51] font-medium hover:bg-[#C86D51] hover:text-white">
                คัดลอกโค้ด
              </button>
            </div>
            <p class="text-[11px] text-[#A89E93] leading-relaxed">
              1. เปิด Google Sheet แล้วไปที่ <b>Extensions ➔ Apps Script</b><br>
              2. วางโค้ดนี้แทนที่ทั้งหมด แล้วกด <b>Deploy ➔ New deployment ➔ Web app</b> (ตั้ง Who has access: <b>Anyone</b>)<br>
              3. นำ URL ที่ได้มาใส่ในช่องด้านบน
            </p>
            <pre class="text-[10px] text-[#A89E93] font-mono p-2 bg-[#231E1B] rounded-xl overflow-x-auto max-h-40">${GoogleSheetsSyncService.getGoogleAppsScriptTemplate()}</pre>
          </div>

          <!-- Sync Trigger Button -->
          <button
            id="sync-now-btn"
            class="w-full py-3 px-4 rounded-2xl bg-[#64836B] hover:bg-[#537059] active:scale-[0.98] text-[#FAF5EE] font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span id="sync-btn-spinner" class="hidden animate-spin">↻</span>
            <span id="sync-btn-text">ซิงก์ข้อมูลขึ้น Google Sheets ทันที</span>
          </button>
        </div>

        <!-- File Exports Section -->
        <div class="bg-[#231E1B] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-700/40 text-amber-400 flex items-center justify-center text-sm font-bold">📥</span>
            <div>
              <h3 class="text-sm font-semibold text-[#FAF5EE]">ดาวน์โหลดชุดข้อมูล</h3>
              <p class="text-[11px] text-[#A89E93]">นำไฟล์ไปเปิดบน Excel, Numbers, หรือส่งเข้า Line</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-1">
            <button
              id="export-csv-btn"
              class="p-4 rounded-2xl bg-[#2E2723] hover:bg-[#3B322D] border border-white/5 active:scale-95 text-left transition-all group"
            >
              <div class="text-xl mb-1 group-hover:scale-110 transition-transform">📄</div>
              <div class="text-xs font-semibold text-[#FAF5EE]">ดาวน์โหลด CSV</div>
              <div class="text-[10px] text-[#A89E93] mt-0.5">UTF-8 BOM ภาษาไทยสมบูรณ์</div>
            </button>

            <button
              id="export-xlsx-btn"
              class="p-4 rounded-2xl bg-[#2E2723] hover:bg-[#3B322D] border border-white/5 active:scale-95 text-left transition-all group"
            >
              <div class="text-xl mb-1 group-hover:scale-110 transition-transform">📗</div>
              <div class="text-xs font-semibold text-[#FAF5EE]">ดาวน์โหลด Excel</div>
              <div class="text-[10px] text-[#A89E93] mt-0.5">ไฟล์ .xlsx สำเร็จรูป</div>
            </button>
          </div>
        </div>

        <!-- About & Storage Info -->
        <div class="text-center pt-2">
          <p class="text-[11px] text-[#A89E93]">
            MRT Time Logger v1.0 • Offline-First PWA<br>
            ข้อมูลทั้งหมดถูกบันทึกใน IndexedDB บนเครื่องของคุณ
          </p>
        </div>

      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    // Save webhook
    this.container.querySelector('#save-webhook-btn')?.addEventListener('click', () => {
      triggerHaptic('light');
      const input = this.container.querySelector('#webhook-url-input') as HTMLInputElement;
      if (input) {
        this.syncService.setWebhookUrl(input.value);
        Toast.show('บันทึก Webhook URL สำเร็จ', 'success');
      }
    });

    // Toggle guide
    const toggleGuideBtn = this.container.querySelector('#toggle-guide-btn');
    const guideEl = this.container.querySelector('#apps-script-guide');
    toggleGuideBtn?.addEventListener('click', () => {
      guideEl?.classList.toggle('hidden');
    });

    // Copy script
    this.container.querySelector('#copy-script-btn')?.addEventListener('click', () => {
      triggerHaptic('light');
      navigator.clipboard.writeText(GoogleSheetsSyncService.getGoogleAppsScriptTemplate());
      Toast.show('คัดลอกโค้ด Apps Script แล้ว', 'success');
    });

    // Sync button
    const syncBtn = this.container.querySelector('#sync-now-btn');
    const syncSpinner = this.container.querySelector('#sync-btn-spinner');
    const syncText = this.container.querySelector('#sync-btn-text');

    syncBtn?.addEventListener('click', async () => {
      triggerHaptic('medium');
      syncSpinner?.classList.remove('hidden');
      if (syncText) syncText.textContent = 'กำลังส่งข้อมูล...';

      const result = await this.syncService.syncUnsyncedTrips();

      syncSpinner?.classList.add('hidden');
      if (syncText) syncText.textContent = 'ซิงก์ข้อมูลขึ้น Google Sheets ทันที';

      if (result.success) {
        Toast.show(result.message, 'success');
      } else {
        Toast.show(result.message, 'error', 4000);
      }
    });

    // Export CSV
    this.container.querySelector('#export-csv-btn')?.addEventListener('click', async () => {
      try {
        triggerHaptic('light');
        await this.exportService.exportCsv();
        Toast.show('ดาวน์โหลดไฟล์ CSV เรียบร้อย', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งออก';
        Toast.show(msg, 'error');
      }
    });

    // Export XLSX
    this.container.querySelector('#export-xlsx-btn')?.addEventListener('click', async () => {
      try {
        triggerHaptic('light');
        await this.exportService.exportExcel();
        Toast.show('ดาวน์โหลดไฟล์ Excel (.xlsx) เรียบร้อย', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งออก';
        Toast.show(msg, 'error');
      }
    });
  }
}
