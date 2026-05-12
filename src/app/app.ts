import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { LayoutService } from './services/layout.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  searchQuery = '';

  auth = inject(AuthService);
  layout = inject(LayoutService);

  get isSidebarVisible() { return this.layout.sidebarVisible(); }
  get isDarkMode() { return document.documentElement.classList.contains('dark'); }

  get currentUser() {
    const u = this.auth.currentUser();
    return u ?? { name: 'Guest', email: '', role: '' };
  }

  get isLoggedIn() { return this.auth.isLoggedIn; }

  navSetup = [
    { label: 'Users',         icon: 'group',                route: '/users' },
    { label: 'System Alerts', icon: 'notifications',        route: '/alerts' },
    { label: 'Development',   icon: 'developer_mode',       route: '/development' },
    { label: 'Apps',          icon: 'apps',                 route: '/apps' },
    { label: 'Firmware',      icon: 'dynamic_feed',         route: '/firmware' },
    { label: 'File Explorer', icon: 'folder_open',          route: '/file-explorer' },
    { label: 'Archive',       icon: 'inventory_2',          route: '/archive' },
    { label: 'Companies',     icon: 'business',             route: '/companies' },
  ];

  navCustomers = [
    { label: 'Customer Dashboard', icon: 'dashboard_customize', route: '/customer-dashboard' },
    { label: 'Contacts',           icon: 'contact_phone',        route: '/contacts' },
    { label: 'Servers',            icon: 'dns',                  route: '/servers' },
    { label: 'Finance',            icon: 'payments',             route: '/finance' },
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') this.enableDark();

    // Ensure sidebar is visible on navigation without resetting app selection
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.layout.showSidebar();
    });
  }

  onSearchChange(value: string) {
    this.searchQuery = value;
    // Logic for search can be added here
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  toggleDarkMode() {
    if (document.documentElement.classList.contains('dark')) {
      this.disableDark();
    } else {
      this.enableDark();
    }
  }

  private enableDark() {
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
  }

  private disableDark() {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', 'false');
  }

  getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
