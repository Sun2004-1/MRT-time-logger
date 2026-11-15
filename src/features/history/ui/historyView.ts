import { HistoryService } from '../services/historyService';
import { TripLog } from '@/core/types/trip.types';
import { CROWD_LABELS } from '@/core/config/constants';
import { Toast } from '@/ui/components/toast';
import { triggerHaptic } from '@/core/utils/haptic';

export class HistoryView {
  private container: HTMLElement;
  private onEditCallback: ((trip: TripLog) => void) | null = null;
  private trips: TripLog[] = [];

  constructor(
    containerId: string,
    private historyService: HistoryService,
    onEdit?: (trip: TripLog) => void
  ) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;
    this.onEditCallback = onEdit || null;
  }

  public async loadAndRender(): Promise<void> {
    this.trips = await this.historyService.getRecentTrips(100);
    this.render();
  }

  public render(): void {
    this.container.innerHTML = `
      <div class="max-w-md mx-auto px-5 py-4 safe-top pb-28">
        <!-- Top Bar -->
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-bold text-[#FAF5EE]">ประวัติการบันทึก</h2>
            <p class="text-xs text-[#A89E93]">ทั้งหมด ${this.trips.length} รายการ (แตะการ์ดเพื่อเพิ่มรายละเอียด)</p>
          </div>
          <button id="refresh-history-btn" class="w-9 h-9 rounded-2xl bg-[#231E1B] border border-white/5 flex items-center justify-center text-[#A89E93] hover:text-[#FAF5EE]">
            ↺
          </button>
        </div>

        <!-- Trips List -->
        <div id="history-trips-list" class="space-y-3">
          ${
            this.trips.length === 0
              ? `
            <div class="py-16 text-center">
              <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-[#231E1B] border border-white/5 flex items-center justify-center text-2xl text-[#A89E93]">
                ⏱️
              </div>
              <h4 class="text-sm font-semibold text-[#FAF5EE]">ยังไม่มีบันทึกเวลา</h4>
              <p class="text-xs text-[#A89E93] mt-1 max-w-xs mx-auto">
                ไปที่แท็บบันทึกเวลา (Quick Snap) แล้วแตะปุ่มขนาดใหญ่เมื่อรถไฟฟ้าเข้าเทียบชานชาลา
              </p>
            </div>
          `
              : this.trips.map((t) => this.renderTripCardHtml(t)).join('')
          }
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private renderTripCardHtml(trip: TripLog): string {
    const crowd = CROWD_LABELS[trip.crowdLevel] || CROWD_LABELS.unspecified;
    const isMorning = trip.tripType === 'morning';

    return `
      <div data-id="${trip.id}" class="trip-card interactive-card bg-[#231E1B] border border-white/5 rounded-2xl p-4 shadow-sm hover:border-[#C86D51]/30 transition-all cursor-pointer">
        <!-- Top row: Date, trip tag, sync status -->
        <div class="flex items-center justify-between text-xs text-[#A89E93] mb-2">
          <div class="flex items-center gap-2">
            <span class="font-medium text-[#FAF5EE]">${trip.date} (${trip.dayOfWeek})</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full ${
              isMorning ? 'bg-[#64836B]/20 text-[#64836B]' : 'bg-[#C9974C]/20 text-[#C9974C]'
            }">
              ${isMorning ? 'เช้า' : 'เย็น'}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            ${
              trip.synced
                ? '<span class="text-[11px] text-[#64836B] flex items-center gap-1 font-mono">● Sync แล้ว</span>'
                : '<span class="text-[11px] text-[#A89E93]/70 font-mono">○ ในเครื่อง</span>'
            }
          </div>
        </div>

        <!-- Middle row: Station & Exact Time -->
        <div class="flex items-baseline justify-between mb-2">
          <div>
            <div class="text-base font-semibold text-[#FAF5EE] flex items-center gap-2">
              <span>${trip.station}</span>
              <span class="text-xs font-mono font-bold text-[#C86D51] bg-[#3B322D] px-1.5 py-0.5 rounded">${trip.stationCode}</span>
            </div>
            <div class="text-xs text-[#A89E93] truncate max-w-[220px]">
              ${trip.direction}
            </div>
          </div>
          <div class="text-right">
            <div class="text-xl font-bold font-mono text-[#FAF5EE] tnum">${trip.time}</div>
            <div class="text-[10px] text-[#A89E93]">น. (เวลาเข้า)</div>
          </div>
        </div>

        <!-- Bottom row: Crowd level badge & Note preview -->
        <div class="pt-2 border-t border-white/5 flex items-center justify-between">
          <span class="text-xs px-2.5 py-1 rounded-xl border flex items-center gap-1.5 font-medium ${crowd.badgeClass}">
            <span>${crowd.emoji}</span>
            <span>${crowd.label}</span>
          </span>

          <div class="flex items-center gap-2">
            ${
              trip.notes
                ? `<span class="text-xs text-[#FAF5EE] italic truncate max-w-[120px]">"${trip.notes}"</span>`
                : `<span class="text-[11px] text-[#C86D51] font-medium">+ เพิ่มโน้ต</span>`
            }
            <button data-delete-id="${trip.id}" class="delete-trip-btn w-7 h-7 rounded-xl hover:bg-white/10 flex items-center justify-center text-xs text-[#A89E93] hover:text-[#C25745] transition-colors ml-1" title="ลบรายการ">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    // Refresh button
    this.container.querySelector('#refresh-history-btn')?.addEventListener('click', async () => {
      triggerHaptic('light');
      await this.loadAndRender();
      Toast.show('รีเฟรชรายการเรียบร้อย', 'info');
    });

    // Card tap to edit
    this.container.querySelectorAll('.trip-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        // Prevent edit modal if delete was clicked
        if ((e.target as HTMLElement).closest('.delete-trip-btn')) return;

        const id = card.getAttribute('data-id');
        const trip = this.trips.find((t) => t.id === id);
        if (trip && this.onEditCallback) {
          triggerHaptic('light');
          this.onEditCallback(trip);
        }
      });
    });

    // Delete buttons
    this.container.querySelectorAll('.delete-trip-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-id');
        if (!id) return;

        if (confirm('คุณต้องการลบรายการบันทึกนี้หรือไม่?')) {
          triggerHaptic('medium');
          await this.historyService.deleteTrip(id);
          Toast.show('ลบรายการบันทึกเรียบร้อย', 'info');
          await this.loadAndRender();
        }
      });
    });
  }
}
