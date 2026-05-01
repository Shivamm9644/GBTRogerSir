import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  isDarkMode = false;
  searchQuery = '';

  auth = inject(AuthService);

  get currentUser() {
    const u = this.auth.currentUser();
    return u ?? { name: 'Guest', email: '', role: '' };
  }

  get isLoggedIn() { return this.auth.isLoggedIn; }

  navSetup = [
    { label: 'Users',         icon: 'group',                route: '/users' },
    { label: 'Companies',     icon: 'business',             route: '/companies' },
    { label: 'Alerts',        icon: 'notifications_active', route: '/alerts' },
    { label: 'Development',   icon: 'terminal',             route: '/development' },
    { label: 'Apps',          icon: 'widgets',              route: '/apps' },
    { label: 'Firmware',      icon: 'memory',               route: '/firmware' },
    { label: 'File Explorer', icon: 'folder_open',          route: '/file-explorer' },
    { label: 'Archive',       icon: 'archive',              route: '/archive' },
  ];

  navCustomers = [
    { label: 'Customer Dashboard', icon: 'monitoring',       route: '/customer-dashboard' },
    { label: 'Contacts',           icon: 'contact_page',     route: '/contacts' },
    { label: 'Servers',            icon: 'dns',              route: '/servers' },
    { label: 'Finance',            icon: 'account_balance',  route: '/finance' },
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') this.enableDark();
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      this.enableDark();
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }

  enableDark() {
    this.isDarkMode = true;
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
  }

  onSearchChange(value: string) { this.searchQuery = value; }

  navigateTo(route: string) { this.router.navigate([route]); }

  logout() { this.auth.logout(); }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
}
