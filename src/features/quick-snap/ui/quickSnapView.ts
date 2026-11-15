import { QuickSnapService } from '../services/quickSnapService';
import { StationPickerModal } from '@/ui/components/stationPickerModal';
import { Toast } from '@/ui/components/toast';
import { TripLog, CrowdLevel, StationInfo } from '@/core/types/trip.types';
import { CROWD_LABELS } from '@/core/config/constants';
import { triggerHaptic } from '@/core/utils/haptic';

export class QuickSnapView {
  private container: HTMLElement;
  private stationModal: StationPickerModal;
  private clockInterval: number | null = null;
  private onRecordLoggedCallback: ((trip: TripLog) => void) | null = null;
  private onEditTripCallback: ((trip: TripLog) => void) | null = null;
  private onCrowdUpdatedCallback: ((trip: TripLog, crowd: CrowdLevel) => Promise<void>) | null = null;
  private lastLoggedTrip: TripLog | null = null;
  private snapFeedbackTimeout: number | null = null;

  constructor(
    containerId: string,
    private quickSnapService: QuickSnapService,
    callbacks: {
      onRecordLogged?: (trip: TripLog) => void;
      onEditTrip?: (trip: TripLog) => void;
      onCrowdUpdated?: (trip: TripLog, crowd: CrowdLevel) => Promise<void>;
    } = {}
  ) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;
    this.stationModal = new StationPickerModal();
    this.onRecordLoggedCallback = callbacks.onRecordLogged || null;
    this.onEditTripCallback = callbacks.onEditTrip || null;
    this.onCrowdUpdatedCallback = callbacks.onCrowdUpdated || null;
    this.render();
  }

  public setLastLoggedTrip(trip: TripLog | null): void {
    this.lastLoggedTrip = trip;
    this.updateDeferredCard();
  }

  public render(): void {
    const route = this.quickSnapService.getRouteState();

    this.container.innerHTML = `
      <div class="flex flex-col h-[calc(100vh-64px)] justify-between max-w-md mx-auto px-5 py-4 safe-top pb-6">
        
        <!-- Top Section: Clean Header (No Emojis / No Clutter) & Clock -->
        <div class="space-y-4 pt-1">
          <!-- Minimal Top Bar without clutter -->
          <div class="flex items-center gap-2 text-xs text-[#A89E93]">
            <span class="w-2 h-2 rounded-full bg-[#64836B]"></span>
            <span class="font-medium tracking-wide">MRT Blue Line</span>
          </div>

          <!-- Clean Hero Digital Clock -->
          <div class="text-center py-2">
            <div id="live-clock-time" class="text-6xl font-extrabold font-mono tracking-tight text-[#FAF5EE] tnum drop-shadow-sm">
              --:--:--
            </div>
            <div id="live-clock-date" class="text-xs text-[#A89E93] mt-1.5 font-medium tracking-wide">
              กำลังโหลดเวลา...
            </div>
          </div>

          <!-- Inset Route Pill -->
          <div class="bg-[#231E1B]/90 backdrop-blur-xl border border-white/5 rounded-2xl p-3 shadow-lg">
            <div class="flex items-center justify-between gap-2">
              <!-- Origin Station -->
              <button id="origin-station-btn" class="flex-1 text-left py-1 px-2 rounded-xl hover:bg-white/5 transition-all">
                <div class="text-[10px] text-[#A89E93] uppercase font-semibold">ต้นทาง</div>
                <div class="text-base font-semibold text-[#FAF5EE] flex items-center gap-1.5 mt-0.5 truncate">
                  <span id="origin-name">${route.origin}</span>
                  <span id="origin-code" class="text-[10px] font-mono text-[#C86D51] bg-[#3B322D] px-1 py-0.5 rounded">${route.originCode}</span>
                </div>
              </button>

              <!-- Quick Swap Button -->
              <button
                id="swap-route-btn"
                title="สลับสถานี"
                class="w-10 h-10 rounded-xl bg-[#2E2723] hover:bg-[#3B322D] active:rotate-180 border border-white/5 flex items-center justify-center text-sm font-bold text-[#C86D51] shadow transition-transform duration-300"
              >
                ⇄
              </button>

              <!-- Destination Station -->
              <button id="dest-station-btn" class="flex-1 text-right py-1 px-2 rounded-xl hover:bg-white/5 transition-all">
                <div class="text-[10px] text-[#A89E93] uppercase font-semibold">ปลายทาง</div>
                <div class="text-base font-semibold text-[#FAF5EE] flex items-center justify-end gap-1.5 mt-0.5 truncate">
                  <span id="dest-name">${route.destination}</span>
                  <span id="dest-code" class="text-[10px] font-mono text-[#A89E93] bg-[#2E2723] px-1 py-0.5 rounded">${route.destinationCode}</span>
                </div>
              </button>
            </div>

            <!-- Direction caption -->
            <div class="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-[#A89E93] px-2">
              <span id="direction-label" class="truncate">${route.directionLabel}</span>
              <span class="text-[10px] text-[#A89E93]/60">แตะเพื่อเปลี่ยน</span>
            </div>
          </div>
        </div>

        <!-- Center: Hero Shutter Button (Clean Breathing Room) -->
        <div class="flex flex-col items-center justify-center my-auto py-4">
          <div class="relative flex items-center justify-center">
            <!-- Ambient Glow -->
            <div class="absolute w-52 h-52 rounded-full bg-[#C86D51]/10 blur-2xl pointer-events-none"></div>

            <!-- Physical Shutter Button -->
            <button
              id="quick-snap-shutter-btn"
              class="shutter-btn relative w-44 h-44 rounded-full bg-[#231E1B] border-[5px] border-[#3B322D] shadow-2xl flex flex-col items-center justify-center transition-all cursor-pointer focus:outline-none"
            >
              <!-- Core Button Disc -->
              <div id="shutter-inner-disc" class="w-36 h-36 rounded-full bg-gradient-to-br from-[#C86D51] to-[#B85E42] flex flex-col items-center justify-center shadow-inner transition-colors duration-300">
                <svg id="shutter-icon" class="w-11 h-11 text-white mb-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" stroke-width="2"></circle>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 7v5l3 3"></path>
                </svg>
                <span id="shutter-main-text" class="text-sm font-bold tracking-wider text-white uppercase">TAP SNAP</span>
                <span id="shutter-sub-text" class="text-[10px] font-medium text-white/80">แตะเมื่อรถจอดเทียบ</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Bottom: Deferred Floating Quick-Card -->
        <div id="deferred-container" class="min-h-[72px] flex flex-col justify-end">
          <div id="deferred-floating-card" class="hidden bg-[#231E1B] border border-white/10 rounded-2xl p-3.5 shadow-2xl transition-all duration-300">
            <!-- Populated dynamically -->
          </div>
        </div>

      </div>
    `;

    this.bindEvents();
    this.startClock();
    this.updateDeferredCard();
  }

  private startClock(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);

    const updateClock = () => {
      const timeEl = this.container.querySelector('#live-clock-time');
      const dateEl = this.container.querySelector('#live-clock-date');
      if (!timeEl || !dateEl) return;

      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      timeEl.textContent = `${h}:${m}:${s}`;

      const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
      const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      dateEl.textContent = `วัน${days[now.getDay()]}ที่ ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear() + 543}`;
    };

    updateClock();
    this.clockInterval = window.setInterval(updateClock, 1000);
  }

  private bindEvents(): void {
    // Shutter Tap Event
    const shutterBtn = this.container.querySelector('#quick-snap-shutter-btn');
    shutterBtn?.addEventListener('click', async () => {
      await this.handleQuickSnap();
    });

    // Swap Route Button
    const swapBtn = this.container.querySelector('#swap-route-btn');
    swapBtn?.addEventListener('click', () => {
      const newRoute = this.quickSnapService.swapRoute();
      this.updateRouteDisplay(newRoute);
      Toast.show(`สลับสถานีเป็น ${newRoute.origin} ➔ ${newRoute.destination}`, 'info');
    });

    // Origin picker
    const originBtn = this.container.querySelector('#origin-station-btn');
    originBtn?.addEventListener('click', () => {
      triggerHaptic('light');
      this.stationModal.open((station: StationInfo) => {
        const cur = this.quickSnapService.getRouteState();
        const updated = this.quickSnapService.setCustomStation(
          station.nameTh,
          station.code,
          cur.destination,
          cur.destinationCode,
          `มุ่งหน้า ${cur.destination}`
        );
        this.updateRouteDisplay(updated);
        Toast.show(`เปลี่ยนสถานีต้นทางเป็น ${station.nameTh}`, 'info');
      });
    });

    // Destination picker
    const destBtn = this.container.querySelector('#dest-station-btn');
    destBtn?.addEventListener('click', () => {
      triggerHaptic('light');
      this.stationModal.open((station: StationInfo) => {
        const cur = this.quickSnapService.getRouteState();
        const updated = this.quickSnapService.setCustomStation(
          cur.origin,
          cur.originCode,
          station.nameTh,
          station.code,
          `มุ่งหน้า ${station.nameTh}`
        );
        this.updateRouteDisplay(updated);
        Toast.show(`เปลี่ยนสถานีปลายทางเป็น ${station.nameTh}`, 'info');
      });
    });
  }

  private updateRouteDisplay(route: ReturnType<QuickSnapService['getRouteState']>): void {
    const originName = this.container.querySelector('#origin-name');
    const originCode = this.container.querySelector('#origin-code');
    const destName = this.container.querySelector('#dest-name');
    const destCode = this.container.querySelector('#dest-code');
    const dirLabel = this.container.querySelector('#direction-label');

    if (originName) originName.textContent = route.origin;
    if (originCode) originCode.textContent = route.originCode;
    if (destName) destName.textContent = route.destination;
    if (destCode) destCode.textContent = route.destinationCode;
    if (dirLabel) dirLabel.textContent = route.directionLabel;
  }

  private async handleQuickSnap(): Promise<void> {
    try {
      const record = await this.quickSnapService.logArrival('unspecified');
      this.lastLoggedTrip = record;

      // Visual Morph on Shutter button (Apple HIG confirmation)
      this.showSnapSuccessFeedback(record);

      Toast.show(`บันทึกเวลา ${record.time} น. (${record.station}) เรียบร้อย`, 'success');

      if (this.onRecordLoggedCallback) {
        this.onRecordLoggedCallback(record);
      }

      this.updateDeferredCard();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก';
      Toast.show(msg, 'error');
    }
  }

  private showSnapSuccessFeedback(record: TripLog): void {
    const disc = this.container.querySelector('#shutter-inner-disc');
    const mainText = this.container.querySelector('#shutter-main-text');
    const subText = this.container.querySelector('#shutter-sub-text');
    const icon = this.container.querySelector('#shutter-icon');

    if (!disc || !mainText || !subText) return;

    if (this.snapFeedbackTimeout) clearTimeout(this.snapFeedbackTimeout);

    // Turn into Emerald Green Success state
    disc.className = 'w-36 h-36 rounded-full bg-gradient-to-br from-[#64836B] to-[#4A6450] flex flex-col items-center justify-center shadow-inner transition-colors duration-300';
    mainText.textContent = record.time;
    subText.textContent = 'บันทึกสำเร็จ ✓';
    if (icon) icon.classList.add('scale-110');

    // Revert back after 3 seconds
    this.snapFeedbackTimeout = window.setTimeout(() => {
      disc.className = 'w-36 h-36 rounded-full bg-gradient-to-br from-[#C86D51] to-[#B85E42] flex flex-col items-center justify-center shadow-inner transition-colors duration-300';
      mainText.textContent = 'TAP SNAP';
      subText.textContent = 'แตะเมื่อรถจอดเทียบ';
      if (icon) icon.classList.remove('scale-110');
    }, 3000);
  }

  private updateDeferredCard(): void {
    const card = this.container.querySelector('#deferred-floating-card');
    if (!card) return;

    if (!this.lastLoggedTrip) {
      card.classList.add('hidden');
      return;
    }

    const t = this.lastLoggedTrip;

    card.classList.remove('hidden');
    card.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-[#64836B]"></span>
          <span class="text-xs font-semibold text-[#FAF5EE]">บันทึกล่าสุด: ${t.station}</span>
          <span class="text-xs font-mono text-[#A89E93]">${t.time} น.</span>
        </div>
        <button id="deferred-edit-btn" class="text-xs font-medium text-[#C86D51] hover:underline flex items-center gap-1">
          <span>+ โน้ต/แก้ไข</span>
        </button>
      </div>

      <!-- Quick 1-Tap Crowd Auto-Save Chips -->
      <div class="grid grid-cols-3 gap-2 pt-1">
        <button data-crowd="low" class="deferred-crowd-chip py-2 px-1 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 transition-all ${
          t.crowdLevel === 'low'
            ? 'bg-[#3B322D] border-[#64836B] text-emerald-300 ring-1 ring-[#64836B]'
            : 'bg-[#2E2723] border-white/5 text-[#A89E93] hover:text-[#FAF5EE]'
        }">
          <span>🟢</span> <span>โล่ง</span>
        </button>

        <button data-crowd="medium" class="deferred-crowd-chip py-2 px-1 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 transition-all ${
          t.crowdLevel === 'medium'
            ? 'bg-[#3B322D] border-[#C9974C] text-amber-300 ring-1 ring-[#C9974C]'
            : 'bg-[#2E2723] border-white/5 text-[#A89E93] hover:text-[#FAF5EE]'
        }">
          <span>🟡</span> <span>ปานกลาง</span>
        </button>

        <button data-crowd="high" class="deferred-crowd-chip py-2 px-1 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 transition-all ${
          t.crowdLevel === 'high'
            ? 'bg-[#3B322D] border-[#C25745] text-rose-300 ring-1 ring-[#C25745]'
            : 'bg-[#2E2723] border-white/5 text-[#A89E93] hover:text-[#FAF5EE]'
        }">
          <span>🔴</span> <span>แน่นมาก</span>
        </button>
      </div>
    `;

    // Bind Edit button
    card.querySelector('#deferred-edit-btn')?.addEventListener('click', () => {
      if (this.onEditTripCallback && this.lastLoggedTrip) {
        this.onEditTripCallback(this.lastLoggedTrip);
      }
    });

    // Bind 1-Tap Crowd Chips (Silent instant update with haptic feedback, no popups)
    card.querySelectorAll('.deferred-crowd-chip').forEach((chip) => {
      chip.addEventListener('click', async () => {
        triggerHaptic('light');
        const crowd = chip.getAttribute('data-crowd') as CrowdLevel;
        if (this.lastLoggedTrip && this.onCrowdUpdatedCallback) {
          try {
            await this.onCrowdUpdatedCallback(this.lastLoggedTrip, crowd);
            this.lastLoggedTrip.crowdLevel = crowd;
            this.updateDeferredCard();
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก';
            Toast.show(msg, 'error');
          }
        }
      });
    });
  }
}
