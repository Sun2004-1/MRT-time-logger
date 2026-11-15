import { triggerHaptic } from '../../core/utils/haptic';

export type TabKey = 'snap' | 'history' | 'export';

export class TabBar {
  private container: HTMLElement;
  private currentTab: TabKey = 'snap';
  private onTabChangeCallback: (tab: TabKey) => void;

  constructor(containerId: string, onTabChange: (tab: TabKey) => void) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`TabBar container #${containerId} not found`);
    this.container = el;
    this.onTabChangeCallback = onTabChange;
    this.render();
  }

  public getActiveTab(): TabKey {
    return this.currentTab;
  }

  public setActiveTab(tab: TabKey): void {
    this.currentTab = tab;
    this.updateTabStyles();
    this.onTabChangeCallback(tab);
  }

  public render(): void {
    this.container.innerHTML = `
      <nav class="fixed bottom-0 left-0 right-0 z-40 bg-[#171412]/90 backdrop-blur-2xl border-t border-white/5 safe-bottom">
        <div class="max-w-md mx-auto px-6 h-16 flex items-center justify-around">
          
          <!-- Snap Tab -->
          <button data-tab="snap" class="tab-item-btn flex flex-col items-center gap-1 text-[#C86D51] transition-all flex-1 py-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" stroke-width="2"></circle>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7v5l3 3"></path>
            </svg>
            <span class="text-[11px] font-semibold tracking-wide">บันทึกเวลา</span>
          </button>

          <!-- History Tab -->
          <button data-tab="history" class="tab-item-btn flex flex-col items-center gap-1 text-[#A89E93] transition-all flex-1 py-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
            </svg>
            <span class="text-[11px] font-medium tracking-wide">ประวัติ</span>
          </button>

          <!-- Export & Sync Tab -->
          <button data-tab="export" class="tab-item-btn flex flex-col items-center gap-1 text-[#A89E93] transition-all flex-1 py-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            <span class="text-[11px] font-medium tracking-wide">ส่งออก & ซิงก์</span>
          </button>

        </div>
      </nav>
    `;

    this.container.querySelectorAll('.tab-item-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        triggerHaptic('light');
        const tab = btn.getAttribute('data-tab') as TabKey;
        if (tab && tab !== this.currentTab) {
          this.setActiveTab(tab);
        }
      });
    });
  }

  private updateTabStyles(): void {
    this.container.querySelectorAll('.tab-item-btn').forEach((btn) => {
      const tab = btn.getAttribute('data-tab') as TabKey;
      const textSpan = btn.querySelector('span');

      if (tab === this.currentTab) {
        btn.classList.remove('text-[#A89E93]');
        btn.classList.add('text-[#C86D51]');
        textSpan?.classList.add('font-semibold');
        textSpan?.classList.remove('font-medium');
      } else {
        btn.classList.remove('text-[#C86D51]');
        btn.classList.add('text-[#A89E93]');
        textSpan?.classList.remove('font-semibold');
        textSpan?.classList.add('font-medium');
      }
    });
  }
}
