import { MRT_BLUE_LINE_STATIONS } from '../../core/config/constants';
import { StationInfo } from '../../core/types/trip.types';

export class StationPickerModal {
  private modalEl: HTMLElement | null = null;
  private onSelectCallback: ((station: StationInfo) => void) | null = null;

  constructor() {
    this.createModalDom();
  }

  private createModalDom(): void {
    const el = document.createElement('div');
    el.id = 'station-picker-modal';
    el.className = 'fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm hidden';

    el.innerHTML = `
      <div class="w-full sm:max-w-md bg-[#231E1B] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-transform">
        <!-- Header -->
        <div class="px-5 pt-4 pb-3 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-[#FAF5EE]">เลือกสถานี MRT สายสีน้ำเงิน</h3>
            <p class="text-xs text-[#A89E93]">แตะเลือกสถานีที่ต้องการ</p>
          </div>
          <button id="close-station-modal-btn" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm text-[#A89E93] hover:text-white">✕</button>
        </div>

        <!-- Search input -->
        <div class="px-4 py-2 border-b border-white/5">
          <input
            id="station-search-input"
            type="text"
            placeholder="ค้นหาชื่อสถานี (เช่น บางหว้า, BL34)..."
            class="w-full bg-[#2E2723] text-sm text-[#FAF5EE] placeholder-[#A89E93] px-3.5 py-2.5 rounded-xl border border-white/5 outline-none focus:border-[#C86D51]"
          />
        </div>

        <!-- Station List -->
        <div id="station-list-container" class="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-white/[0.03]">
          <!-- Station items rendered dynamically -->
        </div>
      </div>
    `;

    document.body.appendChild(el);
    this.modalEl = el;

    el.querySelector('#close-station-modal-btn')?.addEventListener('click', () => this.hide());
    el.addEventListener('click', (e) => {
      if (e.target === el) this.hide();
    });

    const searchInput = el.querySelector('#station-search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      const q = (e.target as HTMLInputElement).value.trim().toLowerCase();
      this.renderList(q);
    });
  }

  private renderList(filterQuery: string = ''): void {
    if (!this.modalEl) return;
    const container = this.modalEl.querySelector('#station-list-container');
    if (!container) return;

    const filtered = MRT_BLUE_LINE_STATIONS.filter((s) => {
      if (!filterQuery) return true;
      return (
        s.nameTh.toLowerCase().includes(filterQuery) ||
        s.nameEn.toLowerCase().includes(filterQuery) ||
        s.code.toLowerCase().includes(filterQuery)
      );
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div class="py-8 text-center text-xs text-[#A89E93]">ไม่พบสถานีที่ค้นหา</div>`;
      return;
    }

    container.innerHTML = filtered
      .map(
        (s) => `
      <button data-code="${s.code}" class="station-item-btn w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-left transition-colors">
        <div class="flex items-center gap-3">
          <span class="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-[#3B322D] text-[#C86D51]">${s.code}</span>
          <div>
            <div class="text-sm font-medium text-[#FAF5EE]">${s.nameTh}</div>
            <div class="text-xs text-[#A89E93]">${s.nameEn}</div>
          </div>
        </div>
        <span class="text-xs text-[#A89E93]">เลือก ➔</span>
      </button>
    `
      )
      .join('');

    container.querySelectorAll('.station-item-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        const station = MRT_BLUE_LINE_STATIONS.find((s) => s.code === code);
        if (station && this.onSelectCallback) {
          this.onSelectCallback(station);
          this.hide();
        }
      });
    });
  }

  public open(onSelect: (station: StationInfo) => void): void {
    this.onSelectCallback = onSelect;
    if (this.modalEl) {
      this.modalEl.classList.remove('hidden');
      const searchInput = this.modalEl.querySelector('#station-search-input') as HTMLInputElement;
      if (searchInput) searchInput.value = '';
      this.renderList();
    }
  }

  public hide(): void {
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }
  }
}
