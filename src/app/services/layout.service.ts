import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  sidebarVisible = signal(true);
  selectedApp = signal<'ALL' | 'ELD' | 'GPS' | 'REEFER' | 'DASHCAM'>('ELD');

  showSidebar() {
    this.sidebarVisible.set(true);
  }

  hideSidebar() {
    this.sidebarVisible.set(false);
  }

  setSelectedApp(app: any) {
    this.selectedApp.set(app);
  }

  reset() {
    this.sidebarVisible.set(true);
    this.selectedApp.set('ELD');
  }
}
