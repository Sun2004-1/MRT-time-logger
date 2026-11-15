import { CrowdLevel, TripLog } from '@/core/types/trip.types';
import { CROWD_LABELS, QUICK_TAGS } from '@/core/config/constants';
import { triggerHaptic } from '@/core/utils/haptic';

export class MetadataModal {
  private modalEl: HTMLElement | null = null;
  private currentTrip: TripLog | null = null;
  private selectedCrowd: CrowdLevel = 'unspecified';
  private onSaveCallback: ((id: string, crowdLevel: CrowdLevel, notes: string) => Promise<void>) | null = null;

  constructor() {
    this.createDom();
  }

  private createDom(): void {
    const el = document.createElement('div');
    el.id = 'metadata-modal';
    el.className = 'fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm hidden';

    el.innerHTML = `
      <div class="w-full sm:max-w-md bg-[#231E1B] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden pb-6 safe-bottom">
        <!-- iOS Sheet Pull Handle -->
        <div class="w-12 h-1 bg-white/20 rounded-full mx-auto my-3 sm:hidden"></div>

        <div class="px-5 pt-1 pb-3 flex items-center justify-between border-b border-white/5">
          <div>
            <h3 class="text-base font-semibold text-[#FAF5EE]">บันทึกข้อมูลบนรถ (Deferred Log)</h3>
            <p id="modal-trip-summary" class="text-xs text-[#A89E93]">กำลังแก้ไขเที่ยวการเดินทาง...</p>
          </div>
          <button id="close-metadata-modal-btn" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm text-[#A89E93] hover:text-white">✕</button>
        </div>

        <div class="p-5 space-y-4">
          <!-- 1. Crowd Selection (Large 52px Touch Targets) -->
          <div>
            <label class="block text-xs font-medium text-[#A89E93] mb-2 uppercase tracking-wider">
              ระดับความหนาแน่นของผู้โดยสาร
            </label>
            <div class="grid grid-cols-3 gap-2" id="crowd-options-grid">
              <!-- Rendered dynamically -->
            </div>
          </div>

          <!-- 2. Quick-Tag Chips (Zero-typing interaction) -->
          <div>
            <label class="block text-xs font-medium text-[#A89E93] mb-2 uppercase tracking-wider">
              แตะแท็กด่วน (ไม่ต้องพิมพ์)
            </label>
            <div class="flex flex-wrap gap-1.5" id="quick-tags-container">
              ${QUICK_TAGS.map(
                (tag) => `
                <button type="button" data-tag="${tag}" class="quick-tag-btn px-2.5 py-1.5 rounded-xl bg-[#2E2723] hover:bg-[#3B322D] border border-white/5 text-xs text-[#FAF5EE] active:scale-95 transition-all">
                  ${tag}
                </button>
              `
              ).join('')}
            </div>
          </div>

          <!-- 3. Notes Textarea -->
          <div>
            <label class="block text-xs font-medium text-[#A89E93] mb-1.5 uppercase tracking-wider">
              หมายเหตุเพิ่มเติม (Optional)
            </label>
            <textarea
              id="metadata-notes-input"
              rows="2"
              placeholder="เช่น ฝนตกคนแน่น, รถดีเลย์ 2 นาที..."
              class="w-full bg-[#2E2723] text-sm text-[#FAF5EE] placeholder-[#A89E93]/50 p-3 rounded-2xl border border-white/5 outline-none focus:border-[#C86D51] resize-none"
            ></textarea>
          </div>

          <!-- 4. Submit Button -->
          <div class="pt-1">
            <button
              id="save-metadata-btn"
              class="w-full py-3.5 px-4 rounded-2xl bg-[#C86D51] hover:bg-[#B85E42] text-[#FAF5EE] font-semibold text-sm shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>บันทึกข้อมูล</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(el);
    this.modalEl = el;

    el.querySelector('#close-metadata-modal-btn')?.addEventListener('click', () => this.hide());
    el.addEventListener('click', (e) => {
      if (e.target === el) this.hide();
    });

    // Quick tag insertion
    el.querySelectorAll('.quick-tag-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        triggerHaptic('light');
        const tag = btn.getAttribute('data-tag');
        const textarea = el.querySelector('#metadata-notes-input') as HTMLTextAreaElement;
        if (tag && textarea) {
          const current = textarea.value.trim();
          textarea.value = current ? `${current}, ${tag}` : tag;
        }
      });
    });

    // Save button
    el.querySelector('#save-metadata-btn')?.addEventListener('click', async () => {
      if (!this.currentTrip || !this.onSaveCallback) return;
      const notesInput = el.querySelector('#metadata-notes-input') as HTMLTextAreaElement;
      const notes = notesInput ? notesInput.value : '';
      triggerHaptic('medium');
      await this.onSaveCallback(this.currentTrip.id, this.selectedCrowd, notes);
      this.hide();
    });
  }

  private renderCrowdButtons(): void {
    if (!this.modalEl) return;
    const grid = this.modalEl.querySelector('#crowd-options-grid');
    if (!grid) return;

    const options: CrowdLevel[] = ['low', 'medium', 'high'];

    grid.innerHTML = options
      .map((key) => {
        const item = CROWD_LABELS[key];
        const isSelected = this.selectedCrowd === key;
        return `
        <button
          type="button"
          data-crowd="${key}"
          class="crowd-select-btn p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
            isSelected
              ? 'bg-[#3B322D] border-[#C86D51] ring-1 ring-[#C86D51] text-[#FAF5EE]'
              : 'bg-[#2E2723] border-white/5 text-[#A89E93] hover:border-white/20'
          }"
        >
          <span class="text-xl">${item.emoji}</span>
          <span class="text-xs font-medium leading-tight text-center">${key === 'low' ? 'โล่ง' : key === 'medium' ? 'ปานกลาง' : 'แน่นมาก'}</span>
        </button>
      `;
      })
      .join('');

    grid.querySelectorAll('.crowd-select-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        triggerHaptic('light');
        const crowd = btn.getAttribute('data-crowd') as CrowdLevel;
        this.selectedCrowd = crowd;
        this.renderCrowdButtons();
      });
    });
  }

  public open(trip: TripLog, onSave: (id: string, crowdLevel: CrowdLevel, notes: string) => Promise<void>): void {
    this.currentTrip = trip;
    this.selectedCrowd = trip.crowdLevel === 'unspecified' ? 'low' : trip.crowdLevel;
    this.onSaveCallback = onSave;

    if (this.modalEl) {
      this.modalEl.classList.remove('hidden');

      const summaryEl = this.modalEl.querySelector('#modal-trip-summary');
      if (summaryEl) {
        summaryEl.textContent = `${trip.station} • ${trip.time} น. (${trip.dayOfWeek})`;
      }

      const notesInput = this.modalEl.querySelector('#metadata-notes-input') as HTMLTextAreaElement;
      if (notesInput) {
        notesInput.value = trip.notes || '';
      }

      this.renderCrowdButtons();
    }
  }

  public hide(): void {
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }
  }
}
