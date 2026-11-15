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
  private selectedCrowd: CrowdLevel = 'unspecified';
  private onRecordLoggedCallback: ((trip: TripLog) => void) | null = null;
  private onEditTripCallback: ((trip: TripLog) => void) | null = null;
  private lastLoggedTrip: TripLog | null = null;

  constructor(
    containerId: string,
    private quickSnapService: QuickSnapService,
    callbacks: {
      onRecordLogged?: (trip: TripLog) => void;
      onEditTrip?: (trip: TripLog) => void;
    } = {}
  ) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;
    this.stationModal = new StationPickerModal();
    this.onRecordLoggedCallback = callbacks.onRecordLogged || null;
    this.onEditTripCallback = callbacks.onEditTrip || null;
    this.render();
  }

  public setLastLoggedTrip(trip: TripLog | null): void {
    this.lastLoggedTrip = trip;
    this.updateLastLoggedBanner();
  }

  public render(): void {
    const route = this.quickSnapService.getRouteState();
    const isMorning = route.tripType === 'morning';

    this.container.innerHTML = `
      <div class="flex flex-col h-full justify-between max-w-md mx-auto px-5 py-4 safe-top pb-28">
        
        <!-- Header Info & Clock -->
        <div class="space-y-4">
          <!-- Top Tag -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="inline-block w-2.5 h-2.5 rounded-full bg-[#64836B] animate-pulse"></span>
              <span class="text-xs font-semibold tracking-wider uppercase text-[#A89E93]">MRT Blue Line Precision</span>
            </div>
            <span id="live-trip-tag" class="text-xs px-2.5 py-1 rounded-full font-medium ${
              isMorning
                ? 'bg-[#64836B]/20 text-[#64836B] border border-[#64836B]/30'
                : 'bg-[#C9974C]/20 text-[#C9974C] border border-[#C9974C]/30'
            }">
              ${isMorning ? '🌅 เที่ยวเช้า (ไปทำงาน)' : '🌇 เที่ยวเย็น (กลับบ้าน)'}
            </span>
          </div>

          <!-- Live Digital Clock -->
          <div class="text-center py-2">
            <div id="live-clock-time" class="text-5xl sm:text-6xl font-bold font-mono tracking-tight text-[#FAF5EE] tnum">
              --:--:--
            </div>
            <div id="live-clock-date" class="text-xs font-medium text-[#A89E93] mt-1 tracking-wide">
              กำลังเชื่อมต่อเวลาจริง...
            </div>
          </div>

          <!-- Station Selector Card -->
          <div class="bg-[#231E1B] border border-white/5 rounded-3xl p-4 shadow-xl">
            <div class="flex items-center justify-between gap-3">
              <!-- Origin Station -->
              <button id="origin-station-btn" class="flex-1 text-left group">
                <div class="text-[11px] font-medium text-[#A89E93] uppercase tracking-wider mb-0.5">สถานีต้นทาง (ที่ขึ้น)</div>
                <div class="flex items-baseline gap-1.5">
                  <span id="origin-name" class="text-lg font-semibold text-[#FAF5EE] group-hover:text-[#C86D51] transition-colors">${route.origin}</span>
                  <span id="origin-code" class="text-xs font-mono font-bold text-[#C86D51] bg-[#3B322D] px-1.5 py-0.5 rounded">${route.originCode}</span>
                </div>
              </button>

              <!-- Swap Button [ ⇄ ] -->
              <button
                id="swap-route-btn"
                title="สลับสถานีต้นทาง-ปลายทาง"
                class="w-11 h-11 rounded-2xl bg-[#2E2723] hover:bg-[#3B322D] active:scale-90 border border-white/5 flex items-center justify-center text-lg text-[#C86D51] shadow transition-all"
              >
                ⇄
              </button>

              <!-- Destination Station -->
              <button id="dest-station-btn" class="flex-1 text-right group">
                <div class="text-[11px] font-medium text-[#A89E93] uppercase tracking-wider mb-0.5">สถานีปลายทาง</div>
                <div class="flex items-baseline justify-end gap-1.5">
                  <span id="dest-name" class="text-lg font-semibold text-[#FAF5EE] group-hover:text-[#C86D51] transition-colors">${route.destination}</span>
                  <span id="dest-code" class="text-xs font-mono font-bold text-[#A89E93] bg-[#2E2723] px-1.5 py-0.5 rounded">${route.destinationCode}</span>
                </div>
              </button>
            </div>

            <div class="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-[#A89E93]">
              <span id="direction-label" class="truncate">${route.directionLabel}</span>
              <span class="text-[10px] text-[#A89E93]/70">แตะเพื่อเปลี่ยน</span>
            </div>
          </div>
        </div>

        <!-- Center Shutter Action Button -->
        <div class="flex flex-col items-center justify-center py-6">
          <div class="relative flex items-center justify-center">
            <!-- Outer Pulsing Glow Ring -->
            <div class="absolute w-48 h-48 rounded-full bg-[#C86D51]/10 blur-xl animate-pulse pointer-events-none"></div>

            <!-- Concentric Shutter Button -->
            <button
              id="quick-snap-shutter-btn"
              class="shutter-btn relative w-40 h-40 rounded-full bg-[#231E1B] border-4 border-[#3B322D] shadow-2xl flex flex-col items-center justify-center transition-all cursor-pointer focus:outline-none"
            >
              <!-- Inner Ring -->
              <div class="w-32 h-32 rounded-full bg-gradient-to-br from-[#C86D51] to-[#B85E42] flex flex-col items-center justify-center shadow-inner">
                <svg class="w-10 h-10 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" stroke-width="2"></circle>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 7v5l3 3"></path>
                </svg>
                <span class="text-xs font-bold tracking-wider text-white uppercase">TAP SNAP</span>
                <span class="text-[10px] font-medium text-white/80">รถจอดเทียบ</span>
              </div>
            </button>
          </div>
          <p class="text-xs text-[#A89E93] mt-3 tracking-wide">แตะ 1 ครั้งเมื่อหัวขบวนเทียบชานชาลา</p>
        </div>

        <!-- Bottom: Optional Quick Crowd Selector & Recent Snap Banner -->
        <div class="space-y-3">
          <!-- Quick Crowd Selection -->
          <div>
            <div class="flex items-center justify-between text-xs text-[#A89E93] mb-1.5 px-1">
              <span>ความหนาแน่น (เลือกได้ทันที หรือไปใส่บนรถ)</span>
            </div>
            <div class="grid grid-cols-3 gap-2" id="quick-crowd-grid">
              <button type="button" data-crowd="low" class="quick-crowd-chip p-2.5 rounded-2xl bg-[#231E1B] border border-white/5 hover:border-white/20 text-xs font-medium text-[#FAF5EE] flex items-center justify-center gap-1.5 transition-all">
                <span>🟢</span> <span>โล่ง</span>
              </button>
              <button type="button" data-crowd="medium" class="quick-crowd-chip p-2.5 rounded-2xl bg-[#231E1B] border border-white/5 hover:border-white/20 text-xs font-medium text-[#FAF5EE] flex items-center justify-center gap-1.5 transition-all">
                <span>🟡</span> <span>ปานกลาง</span>
              </button>
              <button type="button" data-crowd="high" class="quick-crowd-chip p-2.5 rounded-2xl bg-[#231E1B] border border-white/5 hover:border-white/20 text-xs font-medium text-[#FAF5EE] flex items-center justify-center gap-1.5 transition-all">
                <span>🔴</span> <span>แน่นมาก</span>
              </button>
            </div>
          </div>

          <!-- Last Logged Trip Banner -->
          <div id="last-logged-banner" class="hidden bg-[#231E1B]/80 border border-[#64836B]/30 rounded-2xl p-3 flex items-center justify-between text-xs transition-all">
            <!-- Content filled dynamically -->
          </div>
        </div>

      </div>
    `;

    this.bindEvents();
    this.startClock();
    this.updateLastLoggedBanner();
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
      Toast.show(`สลับเส้นทางเป็น ${newRoute.origin} ➔ ${newRoute.destination}`, 'info');
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

    // Quick crowd selector chips
    this.container.querySelectorAll('.quick-crowd-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        triggerHaptic('light');
        const crowd = chip.getAttribute('data-crowd') as CrowdLevel;
        if (this.selectedCrowd === crowd) {
          this.selectedCrowd = 'unspecified';
        } else {
          this.selectedCrowd = crowd;
        }
        this.updateCrowdChips();
      });
    });
  }

  private updateCrowdChips(): void {
    this.container.querySelectorAll('.quick-crowd-chip').forEach((chip) => {
      const crowd = chip.getAttribute('data-crowd') as CrowdLevel;
      if (this.selectedCrowd === crowd) {
        chip.classList.add('bg-[#3B322D]', 'border-[#C86D51]', 'ring-1', 'ring-[#C86D51]');
        chip.classList.remove('bg-[#231E1B]');
      } else {
        chip.classList.remove('bg-[#3B322D]', 'border-[#C86D51]', 'ring-1', 'ring-[#C86D51]');
        chip.classList.add('bg-[#231E1B]');
      }
    });
  }

  private updateRouteDisplay(route: ReturnType<QuickSnapService['getRouteState']>): void {
    const originName = this.container.querySelector('#origin-name');
    const originCode = this.container.querySelector('#origin-code');
    const destName = this.container.querySelector('#dest-name');
    const destCode = this.container.querySelector('#dest-code');
    const dirLabel = this.container.querySelector('#direction-label');
    const tripTag = this.container.querySelector('#live-trip-tag');

    if (originName) originName.textContent = route.origin;
    if (originCode) originCode.textContent = route.originCode;
    if (destName) destName.textContent = route.destination;
    if (destCode) destCode.textContent = route.destinationCode;
    if (dirLabel) dirLabel.textContent = route.directionLabel;

    if (tripTag) {
      const isMorning = route.tripType === 'morning';
      tripTag.textContent = isMorning ? '🌅 เที่ยวเช้า (ไปทำงาน)' : '🌇 เที่ยวเย็น (กลับบ้าน)';
    }
  }

  private async handleQuickSnap(): Promise<void> {
    try {
      const record = await this.quickSnapService.logArrival(this.selectedCrowd);
      this.lastLoggedTrip = record;
      this.selectedCrowd = 'unspecified';
      this.updateCrowdChips();
      this.updateLastLoggedBanner();

      Toast.show(`บันทึกเวลา ${record.time} น. ที่สถานี ${record.station} สำเร็จ!`, 'success');

      if (this.onRecordLoggedCallback) {
        this.onRecordLoggedCallback(record);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก';
      Toast.show(msg, 'error');
    }
  }

  private updateLastLoggedBanner(): void {
    const banner = this.container.querySelector('#last-logged-banner');
    if (!banner) return;

    if (!this.lastLoggedTrip) {
      banner.classList.add('hidden');
      return;
    }

    const t = this.lastLoggedTrip;
    const crowdInfo = CROWD_LABELS[t.crowdLevel] || CROWD_LABELS.unspecified;

    banner.classList.remove('hidden');
    banner.innerHTML = `
      <div class="flex items-center gap-2.5">
        <span class="w-2 h-2 rounded-full bg-[#64836B]"></span>
        <div>
          <span class="text-[#FAF5EE] font-medium">บันทึกล่าสุด: ${t.station}</span>
          <span class="text-[#A89E93] ml-1.5 font-mono">${t.time} น.</span>
          <span class="ml-1 text-[11px]">${crowdInfo.emoji}</span>
        </div>
      </div>
      <button id="banner-edit-btn" class="px-3 py-1 rounded-xl bg-[#3B322D] text-[#C86D51] font-semibold text-xs hover:bg-[#C86D51] hover:text-white transition-all">
        แก้ไขข้อมูล
      </button>
    `;

    banner.querySelector('#banner-edit-btn')?.addEventListener('click', () => {
      if (this.onEditTripCallback && this.lastLoggedTrip) {
        this.onEditTripCallback(this.lastLoggedTrip);
      }
    });
  }
}
