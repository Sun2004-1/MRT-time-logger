export class Toast {
  private static container: HTMLElement | null = null;

  private static ensureContainer(): HTMLElement {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className =
        'fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none w-11/12 max-w-sm px-2';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  public static show(message: string, type: 'success' | 'info' | 'error' = 'info', duration: number = 2800): void {
    const container = this.ensureContainer();

    const toastEl = document.createElement('div');
    const bgColors = {
      success: 'bg-[#231E1B]/95 border-[#64836B]/60 text-[#FAF5EE]',
      info: 'bg-[#231E1B]/95 border-[#C86D51]/50 text-[#FAF5EE]',
      error: 'bg-[#231E1B]/95 border-[#C25745]/60 text-[#FAF5EE]',
    };

    const icons = {
      success: '✓',
      info: 'ℹ',
      error: '✕',
    };

    toastEl.className = `flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 opacity-0 -translate-y-2 pointer-events-auto ${bgColors[type]}`;
    toastEl.innerHTML = `
      <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
        type === 'success' ? 'bg-[#64836B] text-white' : type === 'error' ? 'bg-[#C25745] text-white' : 'bg-[#C86D51] text-white'
      }">${icons[type]}</span>
      <span class="text-sm font-medium leading-tight">${message}</span>
    `;

    container.appendChild(toastEl);

    // Animate in
    requestAnimationFrame(() => {
      toastEl.classList.remove('opacity-0', '-translate-y-2');
      toastEl.classList.add('opacity-100', 'translate-y-0');
    });

    // Auto dismiss
    setTimeout(() => {
      toastEl.classList.remove('opacity-100', 'translate-y-0');
      toastEl.classList.add('opacity-0', '-translate-y-2');
      setTimeout(() => {
        toastEl.remove();
      }, 300);
    }, duration);
  }
}
