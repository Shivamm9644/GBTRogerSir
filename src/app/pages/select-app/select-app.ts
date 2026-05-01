import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-select-app',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
      <div class="text-center mb-16">
        <h1 class="text-4xl font-black text-slate-900 dark:text-white mb-4">Welcome back</h1>
        <p class="text-slate-500 font-medium text-lg">Select an application category to start your session</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl">
        @for (app of apps; track app.name) {
          <div (click)="selectApp(app.name)" 
               class="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-primary/10 p-10 cursor-pointer 
                      transition-all hover:shadow-[0_30px_60px_rgba(19,127,236,0.15)] group hover:-translate-y-3 
                      flex flex-col items-center text-center relative overflow-hidden">
            
            <!-- Glow effect on hover -->
            <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div class="w-24 h-24 rounded-3xl mb-8 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm relative z-10" [class]="app.bg">
              <span class="material-symbols-outlined text-5xl" [class]="app.color">rocket_launch</span>
            </div>
            
            <h3 class="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8 relative z-10">{{ app.name }}</h3>
            
            <div class="mt-auto w-full pt-8 border-t border-slate-50 dark:border-slate-800 flex items-center justify-center relative z-10">
              <div class="flex items-center gap-3 text-primary font-bold text-sm">
                <span>Enter Dashboard</span>
                <span class="material-symbols-outlined group-hover:translate-x-2 transition-transform">arrow_forward</span>
              </div>
            </div>
          </div>
        }
      </div>

      <div class="mt-16">
        <button (click)="logout()" class="text-slate-400 hover:text-red-500 font-bold text-sm transition-colors flex items-center gap-2">
          <span class="material-symbols-outlined text-lg">logout</span> Sign Out
        </button>
      </div>
    </div>
  `
})
export class SelectAppComponent {
  apps = [
    { name: 'ELD', bg: 'bg-blue-50', color: 'text-blue-600' },
    { name: 'GPS', bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { name: 'REEFER', bg: 'bg-cyan-50', color: 'text-cyan-600' },
    { name: 'DASHCAM', bg: 'bg-violet-50', color: 'text-violet-600' },
  ];

  router = inject(Router);
  layout = inject(LayoutService);

  constructor() {
    this.layout.hideSidebar();
  }

  selectApp(appName: string) {
    this.layout.showSidebar();
    this.router.navigate(['/dashboard']);
  }

  logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
  }
}
