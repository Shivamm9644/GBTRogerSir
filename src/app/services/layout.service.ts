import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  sidebarVisible = signal(true);

  showSidebar() {
    this.sidebarVisible.set(true);
  }

  hideSidebar() {
    this.sidebarVisible.set(false);
  }

  reset() {
    this.sidebarVisible.set(true);
  }
}
