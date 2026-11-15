import './styles/main.css';
import { TripRepository } from '@/core/storage/tripRepository';
import { QuickSnapService } from '@/features/quick-snap/services/quickSnapService';
import { HistoryService } from '@/features/history/services/historyService';
import { ExportService } from '@/features/export/services/exportService';
import { GoogleSheetsSyncService } from '@/features/sync/services/googleSheetsSyncService';
import { QuickSnapView } from '@/features/quick-snap/ui/quickSnapView';
import { HistoryView } from '@/features/history/ui/historyView';
import { ExportView } from '@/features/export/ui/exportView';
import { TabBar, TabKey } from '@/ui/components/tabBar';
import { MetadataModal } from '@/features/history/ui/metadataModal';
import { Toast } from '@/ui/components/toast';
import { TripLog, CrowdLevel } from '@/core/types/trip.types';

class App {
  private repository: TripRepository;
  private quickSnapService: QuickSnapService;
  private historyService: HistoryService;
  private exportService: ExportService;
  private syncService: GoogleSheetsSyncService;

  public quickSnapView!: QuickSnapView;
  public historyView!: HistoryView;
  public exportView!: ExportView;
  public tabBar!: TabBar;
  private metadataModal!: MetadataModal;

  constructor() {
    this.repository = new TripRepository();
    this.quickSnapService = new QuickSnapService(this.repository);
    this.historyService = new HistoryService(this.repository);
    this.exportService = new ExportService(this.repository);
    this.syncService = new GoogleSheetsSyncService(this.repository);
  }

  public async init(): Promise<void> {
    this.metadataModal = new MetadataModal();

    // Initialize Views
    this.quickSnapView = new QuickSnapView('tab-view-snap', this.quickSnapService, {
      onRecordLogged: (trip: TripLog) => {
        this.handleNewRecord(trip);
      },
      onEditTrip: (trip: TripLog) => {
        this.openMetadataEditor(trip);
      },
      onCrowdUpdated: async (trip: TripLog, crowd: CrowdLevel) => {
        const updated = await this.historyService.updateDeferredMetadata(trip.id, crowd, trip.notes || '');
        this.quickSnapView.setLastLoggedTrip(updated);
        await this.historyView.loadAndRender();
      },
    });

    this.historyView = new HistoryView('tab-view-history', this.historyService, (trip: TripLog) => {
      this.openMetadataEditor(trip);
    });

    this.exportView = new ExportView(
      'tab-view-export',
      this.exportService,
      this.syncService,
      async () => {
        // When data restored from JSON backup
        await this.historyView.loadAndRender();
        const recent = await this.historyService.getRecentTrips(1);
        this.quickSnapView.setLastLoggedTrip(recent[0] || null);
      }
    );

    // Initialize TabBar
    this.tabBar = new TabBar('app-tab-bar-container', (tab: TabKey) => {
      this.switchTab(tab);
    });

    // Load initial latest trip for quick-snap banner
    const recent = await this.historyService.getRecentTrips(1);
    if (recent.length > 0) {
      this.quickSnapView.setLastLoggedTrip(recent[0]);
    }

    // Register Service Worker for PWA
    this.registerServiceWorker();

    // Listen to network status
    window.addEventListener('online', () => {
      Toast.show('เชื่อมต่อสัญญาณอินเทอร์เน็ตแล้ว', 'info');
      const badge = document.getElementById('network-status-badge');
      if (badge) {
        badge.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400';
        badge.textContent = '● Online';
      }
    });

    window.addEventListener('offline', () => {
      Toast.show('อยู่ในโหมดออฟไลน์ (ข้อมูลจะถูกบันทึกในเครื่อง)', 'info');
      const badge = document.getElementById('network-status-badge');
      if (badge) {
        badge.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-400';
        badge.textContent = '○ Offline';
      }
    });
  }

  private switchTab(tab: TabKey): void {
    const snapEl = document.getElementById('tab-view-snap');
    const histEl = document.getElementById('tab-view-history');
    const expEl = document.getElementById('tab-view-export');

    snapEl?.classList.toggle('hidden', tab !== 'snap');
    histEl?.classList.toggle('hidden', tab !== 'history');
    expEl?.classList.toggle('hidden', tab !== 'export');

    if (tab === 'history') {
      this.historyView.loadAndRender();
    }
  }

  private openMetadataEditor(trip: TripLog): void {
    this.metadataModal.open(trip, async (id: string, crowdLevel: CrowdLevel, notes: string) => {
      try {
        const updated = await this.historyService.updateDeferredMetadata(id, crowdLevel, notes);

        // Refresh both views silently without intrusive popups
        await this.historyView.loadAndRender();
        this.quickSnapView.setLastLoggedTrip(updated);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก';
        Toast.show(msg, 'error');
      }
    });
  }

  private async handleNewRecord(trip: TripLog): Promise<void> {
    // If auto sync enabled and online, try background sync
    if (this.syncService.isAutoSyncEnabled() && navigator.onLine) {
      this.syncService.syncUnsyncedTrips().then((res) => {
        if (res.success && res.syncedCount > 0) {
          Toast.show(`ซิงก์ ${trip.station} ขึ้น Google Sheets แล้ว`, 'info');
        }
      });
    }
  }

  private registerServiceWorker(): void {
    if ('serviceWorker' in navigator && (import.meta as any).env?.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('PWA ServiceWorker registered:', reg.scope))
          .catch((err) => console.error('PWA ServiceWorker registration failed:', err));
      });
    }
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init().catch(console.error);
});
