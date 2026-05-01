import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex bg-slate-50 dark:bg-slate-950">

      <!-- ── Left panel (branding) ─────────────────────────────────────── -->
      <div class="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center
                  bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">

        <!-- Background decorative circles -->
        <div class="absolute w-96 h-96 rounded-full bg-amber-400/10 -top-20 -left-20 blur-3xl"></div>
        <div class="absolute w-80 h-80 rounded-full bg-amber-500/10 bottom-10 right-10 blur-3xl"></div>
        <div class="absolute w-64 h-64 rounded-full bg-blue-500/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>

        <!-- Content -->
        <div class="relative z-10 flex flex-col items-center text-center px-16">

          <!-- GBT Logo (dark version) -->
          <img src="gbt-logo-dark.png" alt="GBT" class="h-24 w-auto object-contain mb-10" />

          <!-- Tagline -->
          <h2 class="text-3xl font-black text-white leading-tight mb-4">
            Manage your fleet<br/>
            <span class="text-amber-400">smarter, faster.</span>
          </h2>
          <p class="text-slate-400 text-sm leading-relaxed max-w-xs">
            The GBT Admin Dashboard gives you complete visibility into
            your ELD network, drivers, vehicles, and more — all in one place.
          </p>

          <!-- Feature list -->
          <div class="mt-10 space-y-3 w-full max-w-xs text-left">
            @for (feat of features; track feat.label) {
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center flex-shrink-0">
                  <span class="material-symbols-outlined text-amber-400 text-[18px]">{{ feat.icon }}</span>
                </div>
                <p class="text-sm text-slate-300">{{ feat.label }}</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- ── Right panel (login form) ──────────────────────────────────── -->
      <div class="flex-1 flex flex-col items-center justify-center px-6 py-12">

        <!-- Mobile logo -->
        <div class="lg:hidden mb-8">
          <img src="gbt-logo-light.png" alt="GBT Admin" class="h-16 w-auto object-contain dark:hidden" />
          <img src="gbt-logo-dark.png" alt="GBT Admin" class="h-16 w-auto object-contain hidden dark:block" />
        </div>

        <!-- Card -->
        <div class="w-full max-w-md">

          <div class="mb-8 text-center lg:text-left">
            <h1 class="text-2xl font-black text-slate-900 dark:text-white">Welcome back</h1>
            <p class="text-slate-500 text-sm mt-1">Sign in to your GBT Admin account</p>
          </div>

          <!-- Error alert -->
          @if (error) {
            <div class="mb-5 flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200
                        dark:border-red-800 rounded-xl p-4"
                 style="animation: shake 0.3s ease;">
              <span class="material-symbols-outlined text-red-500 text-xl flex-shrink-0">error</span>
              <div>
                <p class="font-semibold text-red-700 dark:text-red-400 text-sm">Login failed</p>
                <p class="text-red-600 dark:text-red-500 text-xs mt-0.5">{{ error }}</p>
              </div>
            </div>
          }

          <!-- Form -->
          <form (ngSubmit)="submit()" class="space-y-5">

            <!-- Email -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email address
              </label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">mail</span>
                <input
                  id="login-email"
                  [(ngModel)]="email" name="email"
                  type="email" autocomplete="email"
                  placeholder="admin@gbt.com"
                  [class]="inputClass"
                  (keydown.enter)="submit()" />
              </div>
            </div>

            <!-- Password -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                <button type="button" class="text-xs text-primary hover:underline cursor-pointer">Forgot password?</button>
              </div>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">lock</span>
                <input
                  id="login-password"
                  [(ngModel)]="password" name="password"
                  [type]="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  [class]="inputClass" />
                <button type="button"
                  (click)="showPassword = !showPassword"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <span class="material-symbols-outlined text-[20px]">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>

            <!-- Remember me -->
            <div class="flex items-center gap-2">
              <input id="remember" type="checkbox" [(ngModel)]="remember" name="remember"
                class="w-4 h-4 rounded border-slate-300 text-primary cursor-pointer" />
              <label for="remember" class="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                Remember me
              </label>
            </div>

            <!-- Submit -->
            <button
              id="btn-login"
              type="submit"
              [disabled]="loading"
              class="w-full flex items-center justify-center gap-2 bg-primary text-white
                     py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all
                     shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              @if (loading) {
                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Signing in...</span>
              } @else {
                <span class="material-symbols-outlined text-[18px]">login</span>
                <span>Sign In</span>
              }
            </button>

          </form>

          <!-- Demo credentials hint -->
          <div class="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p class="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-2">
              <span class="material-symbols-outlined text-[14px]">info</span>
              Demo Credentials
            </p>
            <div class="space-y-1 font-mono text-xs text-amber-600 dark:text-amber-500">
              <p>Email: <span class="font-bold">admin&#64;gbt.com</span></p>
              <p>Password: <span class="font-bold">admin123</span></p>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <p class="mt-10 text-xs text-slate-400 text-center">
          &copy; {{ year }} GBT Admin Dashboard. All rights reserved.
        </p>
      </div>

    </div>

    <style>
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%       { transform: translateX(-6px); }
        40%       { transform: translateX(6px); }
        60%       { transform: translateX(-4px); }
        80%       { transform: translateX(4px); }
      }
    </style>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  remember = false;
  loading = false;
  error = '';
  showPassword = false;
  year = new Date().getFullYear();

  inputClass = `w-full pl-11 pr-4 py-3 text-sm border border-slate-200 dark:border-slate-700
    bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200
    placeholder-slate-400 rounded-xl outline-none transition-all
    focus:ring-2 focus:ring-primary/20 focus:border-primary`;

  features = [
    { icon: 'local_shipping', label: 'Fleet & vehicle management' },
    { icon: 'drive_eta', label: 'Driver monitoring & HOS compliance' },
    { icon: 'dns', label: 'Real-time server health monitoring' },
    { icon: 'account_balance', label: 'Finance & billing overview' },
  ];

  constructor(private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) { }

  async submit() {
    this.error = '';
    if (!this.email.trim() || !this.password.trim()) {
      this.error = 'Please enter your email and password.';
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    const result = await this.auth.login(this.email.trim(), this.password);

    if (result.success) {
      this.router.navigate(['/select-app']);
    } else {
      this.error = result.message;
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
