import { Component, inject, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CompanyService } from '../../services/company.service';

interface AnalyticsResult {
  totalUsers: number;
  totalDrivers: number;
  totalCompanies: number;
  totalVehicles: number;
  totalDeviceConnected: number;
  totalDeviceDisconnected: number;
}

interface Driver {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  mobileNo: number;
  cdlNo: string;
  companyName: string | null;
  timeZone: string;
  cdlStateName: string;
}

interface Client {
  companyId: string;
  clientId: number;
  clientName: string;
  dotNo: string;
  timezone: string;
  street: string;
  city: string;
  countryName?: string[];
  stateName?: string[];
  zipcode: number;
  complianceMode: string;
  vehicleMotionThresold: string;
  status: string;
  personalUse: string;
  yardMoves: string;
  allowTracking: string;
  allowGpsTracking: string;
  allowIfta: string;
  exemptDriver: string;
  shortHaulException: string;
  cycleUsaName?: string[];
  cargoTypeName?: string[];
  restartName?: string[];
  restBreakName?: string[];
  subscriptionEndTime: number;
  graceTime: number;
}

interface Vehicle {
  vehicleId: number;
  vehicleNo: string;
  make: string;
  model: string;
  manufacturingYear: number;
  licensePlate: string;
  vin: string;
  deviceName: string;
  deviceStatus: string;
  macAddress: string;
  serialNo: string;
  version: string;
  modelNo: string;
  status: string;
  clientId: number;
}

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 space-y-8">

      <!-- ── Page Header ─────────────────────────────────────────────────── -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white">Customer Dashboard</h3>
          <p class="text-slate-500 text-sm mt-1">
            Live analytics from
            <span class="font-semibold text-primary">{{ company?.company_name }}</span>'s portal.
          </p>
        </div>
        <button (click)="reload()"
          class="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300
                 bg-white dark:bg-slate-900 border border-primary/10 hover:border-primary/40
                 px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer">
          <span class="material-symbols-outlined text-[18px]" [class.animate-spin]="loading">refresh</span>
          Refresh
        </button>
      </div>

      <!-- ── Loading ─────────────────────────────────────────────────────── -->
      @if (loading) {
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-5">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-primary/10 p-6 animate-pulse">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800"></div>
                <div class="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
              </div>
              <div class="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg mt-1"></div>
              <div class="h-2 w-20 bg-slate-100 dark:bg-slate-800 rounded-full mt-3"></div>
            </div>
          }
        </div>
      }

      <!-- ── Error ───────────────────────────────────────────────────────── -->
      @if (error && !loading) {
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                    rounded-2xl p-6 flex items-start gap-4">
          <span class="material-symbols-outlined text-red-500 text-2xl mt-0.5">error_outline</span>
          <div>
            <p class="font-bold text-red-700 dark:text-red-400">Failed to load analytics</p>
            <p class="text-sm text-red-600 dark:text-red-500 mt-1">{{ error }}</p>
            <button (click)="reload()" class="mt-3 text-xs font-bold text-red-600 hover:underline cursor-pointer">↺ Retry</button>
          </div>
        </div>
      }

      <!-- ── Analytics Cards ─────────────────────────────────────────────── -->
      @if (analytics && !loading) {

        <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (card of statCards; track card.key) {
            <div
              class="group bg-white dark:bg-slate-900 rounded-2xl border border-primary/10
                     shadow-sm hover:shadow-md hover:border-primary/30 transition-all p-6
                     relative overflow-hidden"
              [class.cursor-pointer]="card.clickable"
              [class.cursor-default]="!card.clickable"
              (click)="onCardClick(card)">

              <div class="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10" [class]="card.bubbleColor"></div>
              @if (card.clickable) {
                <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span class="material-symbols-outlined text-[16px]" [class]="card.iconColor">open_in_new</span>
                </div>
              }

              <div class="flex items-center justify-between mb-4">
                <div class="p-2.5 rounded-xl" [class]="card.iconBg">
                  <span class="material-symbols-outlined text-[22px]" [class]="card.iconColor">{{ card.icon }}</span>
                </div>
                <span class="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                      [class]="card.badgeBg + ' ' + card.badgeText">
                  {{ card.badge }}
                </span>
              </div>

              <p class="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {{ getAnalyticValue(card.key) | number }}
              </p>
              <p class="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                {{ card.label }}
                @if (card.clickable) {
                  <span class="text-[10px] font-bold" [class]="card.iconColor">· View all</span>
                }
              </p>
            </div>
          }
        </div>

        <!-- ── Device Connectivity ─────────────────────────────────────────── -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-primary/10 flex items-center gap-3">
            <div class="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <span class="material-symbols-outlined text-indigo-600">device_hub</span>
            </div>
            <div>
              <h4 class="font-bold text-slate-800 dark:text-white">Device Connectivity</h4>
              <p class="text-xs text-slate-400 mt-0.5">Real-time ELD device connection status</p>
            </div>
          </div>

          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="flex items-center gap-5 bg-emerald-50 dark:bg-emerald-900/10
                        border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-5">
              <div class="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                <span class="material-symbols-outlined text-2xl text-emerald-600">wifi</span>
              </div>
              <div>
                <p class="text-3xl font-black text-emerald-600">{{ analytics.totalDeviceConnected | number }}</p>
                <p class="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">Devices Connected</p>
                <div class="flex items-center gap-1.5 mt-1.5">
                  <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p class="text-xs text-emerald-600 dark:text-emerald-500 font-medium">Online &amp; Active</p>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-5 bg-red-50 dark:bg-red-900/10
                        border border-red-100 dark:border-red-900/30 rounded-xl p-5">
              <div class="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <span class="material-symbols-outlined text-2xl text-red-500">wifi_off</span>
              </div>
              <div>
                <p class="text-3xl font-black text-red-500">{{ analytics.totalDeviceDisconnected | number }}</p>
                <p class="text-sm font-semibold text-red-700 dark:text-red-400 mt-0.5">Devices Disconnected</p>
                <div class="flex items-center gap-1.5 mt-1.5">
                  <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p class="text-xs text-red-600 dark:text-red-500 font-medium">Offline / Inactive</p>
                </div>
              </div>
            </div>
          </div>

          <div class="px-6 pb-6">
            @if (totalDevices > 0) {
              <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span class="font-semibold">Connection Rate</span>
                <span class="font-bold text-primary">{{ connectionRate }}%</span>
              </div>
              <div class="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
                     [style.width]="connectionRate + '%'"></div>
              </div>
              <div class="flex justify-between text-xs text-slate-400 mt-1.5">
                <span>{{ analytics.totalDeviceConnected }} connected</span>
                <span>{{ analytics.totalDeviceDisconnected }} disconnected</span>
              </div>
            } @else {
              <div class="flex items-center gap-2 text-xs text-slate-400">
                <span class="material-symbols-outlined text-[14px]">info</span>No devices registered yet.
              </div>
            }
          </div>
        </div>

        <!-- API footer -->
        <div class="flex items-center gap-2 text-xs text-slate-400">
          <span class="material-symbols-outlined text-[14px]">api</span>
          Data fetched from:
          <code class="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">
            {{ company?.admin_url }}/eld_log/master/view_project_detail_analytics
          </code>
        </div>
      }
    </div>

    <!-- ══ Drivers Slide-Over Panel ══════════════════════════════════════════ -->
    @if (driversOpen) {
      <div class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="closeDrivers()"></div>
        <div class="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col"
             style="animation: slideIn 0.25s cubic-bezier(0.16,1,0.3,1);">

          <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/20">
                <span class="material-symbols-outlined text-violet-600">drive_eta</span>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 dark:text-white">All Drivers</h3>
                <p class="text-xs text-slate-400 mt-0.5">
                  {{ company?.company_name }} ·
                  <span class="font-semibold text-violet-600">{{ filteredDrivers.length }}</span> drivers
                </p>
              </div>
            </div>
            <button (click)="closeDrivers()"
              class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input [(ngModel)]="driverSearch" type="text" placeholder="Search by name, email, CDL, state..."
                class="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-transparent
                       rounded-lg focus:ring-2 focus:ring-violet-200 outline-none transition-all
                       placeholder-slate-400 text-slate-700 dark:text-slate-200" />
            </div>
          </div>

          <div class="flex-1 overflow-y-auto">
            @if (driversLoading) {
              <div class="flex flex-col items-center justify-center py-24 gap-3">
                <div class="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
                <p class="text-slate-400 text-sm font-medium">Loading drivers...</p>
              </div>
            }
            @if (driversError && !driversLoading) {
              <div class="m-6 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-5">
                <p class="font-bold text-red-700 dark:text-red-400">Failed to load drivers</p>
                <p class="text-sm text-red-600 mt-1">{{ driversError }}</p>
                <button (click)="loadDrivers()" class="mt-3 text-xs font-bold text-red-600 hover:underline cursor-pointer">↺ Retry</button>
              </div>
            }
            @if (!driversLoading && !driversError && filteredDrivers.length === 0) {
              <div class="flex flex-col items-center justify-center py-24">
                <div class="w-16 h-16 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center mb-4">
                  <span class="material-symbols-outlined text-3xl text-violet-400">drive_eta</span>
                </div>
                <p class="font-semibold text-slate-700 dark:text-slate-300">
                  {{ driverSearch ? 'No drivers match your search' : 'No drivers found' }}
                </p>
              </div>
            }
            @if (!driversLoading && !driversError && filteredDrivers.length > 0) {
              <div class="divide-y divide-slate-100 dark:divide-slate-800">
                @for (driver of filteredDrivers; track driver.employeeId) {
                  <div class="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div class="flex items-start gap-4">
                      <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                           [style.background]="getAvatarColor(driver.firstName)">
                        {{ driver.firstName.charAt(0).toUpperCase() }}{{ driver.lastName.charAt(0).toUpperCase() }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <p class="font-bold text-slate-800 dark:text-white text-sm">{{ driver.firstName }} {{ driver.lastName }}</p>
                          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                [class]="driver.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'">
                            {{ driver.status }}
                          </span>
                        </div>
                        <p class="text-xs text-slate-500 mt-0.5 truncate">{{ driver.email }}</p>
                        <div class="flex flex-wrap gap-2 mt-2">
                          <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                            <span class="material-symbols-outlined text-[12px]">phone</span>{{ driver.mobileNo }}
                          </span>
                          <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                            <span class="material-symbols-outlined text-[12px]">badge</span>CDL: {{ driver.cdlNo || '—' }}
                          </span>
                          <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                            <span class="material-symbols-outlined text-[12px]">location_on</span>{{ driver.cdlStateName || '—' }}
                          </span>
                          <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                            <span class="material-symbols-outlined text-[12px]">schedule</span>{{ driver.timeZone }}
                          </span>
                        </div>
                      </div>
                      <p class="text-xs font-mono text-slate-400 flex-shrink-0">#{{ driver.employeeId }}</p>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between flex-shrink-0">
            <p class="text-xs text-slate-400">
              Showing <span class="font-semibold text-slate-600 dark:text-slate-300">{{ filteredDrivers.length }}</span>
              of <span class="font-semibold text-slate-600 dark:text-slate-300">{{ drivers.length }}</span> drivers
            </p>
            <button (click)="closeDrivers()"
              class="px-4 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-700
                     text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
              Close
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══ Clients / Companies Slide-Over Panel ═════════════════════════════ -->
    @if (clientsOpen) {
      <div class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="closeClients()"></div>
        <div class="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col"
             style="animation: slideIn 0.25s cubic-bezier(0.16,1,0.3,1);">

          <!-- Header -->
          <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <span class="material-symbols-outlined text-amber-600">business</span>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 dark:text-white">All Companies</h3>
                <p class="text-xs text-slate-400 mt-0.5">
                  {{ company?.company_name }} ·
                  <span class="font-semibold text-amber-600">{{ filteredClients.length }}</span> companies
                </p>
              </div>
            </div>
            <button (click)="closeClients()"
              class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Search -->
          <div class="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input [(ngModel)]="clientSearch" type="text"
                placeholder="Search by name, DOT#, city, state, timezone..."
                class="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-transparent
                       rounded-lg focus:ring-2 focus:ring-amber-200 outline-none transition-all
                       placeholder-slate-400 text-slate-700 dark:text-slate-200" />
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto">

            @if (clientsLoading) {
              <div class="flex flex-col items-center justify-center py-24 gap-3">
                <div class="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
                <p class="text-slate-400 text-sm font-medium">Loading companies...</p>
              </div>
            }

            @if (clientsError && !clientsLoading) {
              <div class="m-6 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-5">
                <p class="font-bold text-red-700 dark:text-red-400">Failed to load companies</p>
                <p class="text-sm text-red-600 mt-1">{{ clientsError }}</p>
                <button (click)="loadClients()" class="mt-3 text-xs font-bold text-red-600 hover:underline cursor-pointer">↺ Retry</button>
              </div>
            }

            @if (!clientsLoading && !clientsError && filteredClients.length === 0) {
              <div class="flex flex-col items-center justify-center py-24">
                <div class="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mb-4">
                  <span class="material-symbols-outlined text-3xl text-amber-400">business</span>
                </div>
                <p class="font-semibold text-slate-700 dark:text-slate-300">
                  {{ clientSearch ? 'No companies match your search' : 'No companies found' }}
                </p>
              </div>
            }

            @if (!clientsLoading && !clientsError && filteredClients.length > 0) {
              <div class="divide-y divide-slate-100 dark:divide-slate-800">
                @for (cl of filteredClients; track cl.clientId) {
                  <div class="px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div class="flex items-start gap-4">

                      <!-- Avatar -->
                      <div class="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                           [style.background]="getAvatarColor(cl.clientName)">
                        {{ cl.clientName.charAt(0).toUpperCase() }}
                      </div>

                      <div class="flex-1 min-w-0">

                        <!-- Name + badges -->
                        <div class="flex items-center gap-2 flex-wrap">
                          <p class="font-bold text-slate-800 dark:text-white text-sm">{{ cl.clientName }}</p>

                          <!-- Active status -->
                          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                [class]="cl.status === 'true'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'">
                            {{ cl.status === 'true' ? 'Active' : 'Inactive' }}
                          </span>

                          <!-- Compliance mode -->
                          @if (cl.complianceMode) {
                            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                                         bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              {{ cl.complianceMode }}
                            </span>
                          }
                        </div>

                        <!-- Location + timezone -->
                        <p class="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <span class="material-symbols-outlined text-[13px]">location_on</span>
                          {{ cl.street }}{{ cl.city ? ', ' + cl.city : '' }}
                          {{ cl.stateName?.[0] ? ', ' + cl.stateName?.[0] : '' }}
                          {{ cl.countryName?.[0] ? ', ' + cl.countryName?.[0] : '' }}
                          · {{ cl.zipcode }}
                        </p>

                        <!-- Key info pills -->
                        <div class="flex flex-wrap gap-2 mt-2">
                          <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                            <span class="material-symbols-outlined text-[12px]">tag</span>
                            DOT#: {{ cl.dotNo || '—' }}
                          </span>
                          <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                            <span class="material-symbols-outlined text-[12px]">schedule</span>
                            {{ cl.timezone }}
                          </span>
                          @if (cl.cycleUsaName?.[0]) {
                            <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                              <span class="material-symbols-outlined text-[12px]">replay</span>
                              {{ cl.cycleUsaName?.[0] }}
                            </span>
                          }
                          @if (cl.cargoTypeName?.[0]) {
                            <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                              <span class="material-symbols-outlined text-[12px]">inventory_2</span>
                              {{ cl.cargoTypeName?.[0] }}
                            </span>
                          }
                          @if (cl.vehicleMotionThresold) {
                            <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                              <span class="material-symbols-outlined text-[12px]">speed</span>
                              {{ cl.vehicleMotionThresold }}
                            </span>
                          }
                        </div>

                        <!-- Feature flags -->
                        <div class="flex flex-wrap gap-1.5 mt-2">
                          @if (cl.allowTracking === 'true') {
                            <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400">Tracking</span>
                          }
                          @if (cl.allowGpsTracking === 'true') {
                            <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400">GPS</span>
                          }
                          @if (cl.allowIfta === 'true') {
                            <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">IFTA</span>
                          }
                          @if (cl.personalUse === 'true') {
                            <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400">Personal Use</span>
                          }
                          @if (cl.yardMoves === 'true') {
                            <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400">Yard Moves</span>
                          }
                          @if (cl.exemptDriver === 'true') {
                            <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">Exempt Driver</span>
                          }
                        </div>

                        <!-- Subscription -->
                        <p class="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                          <span class="material-symbols-outlined text-[12px]">event</span>
                          Subscribed: {{ formatTimestamp(cl.subscriptionEndTime) }} ·
                          Grace: {{ formatTimestamp(cl.graceTime) }}
                        </p>

                      </div>

                      <!-- Client ID -->
                      <p class="text-xs font-mono text-slate-400 flex-shrink-0">#{{ cl.clientId }}</p>
                    </div>
                  </div>
                }
              </div>
            }

          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between flex-shrink-0">
            <p class="text-xs text-slate-400">
              Showing <span class="font-semibold text-slate-600 dark:text-slate-300">{{ filteredClients.length }}</span>
              of <span class="font-semibold text-slate-600 dark:text-slate-300">{{ clients.length }}</span> companies
            </p>
            <button (click)="closeClients()"
              class="px-4 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-700
                     text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
              Close
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══ Vehicles Slide-Over Panel ════════════════════════════════════════ -->

    @if (vehiclesOpen) {
      <div class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="closeVehicles()"></div>
        <div class="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col"
             style="animation: slideIn 0.25s cubic-bezier(0.16,1,0.3,1);">

          <!-- Header -->
          <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <span class="material-symbols-outlined text-emerald-600">local_shipping</span>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 dark:text-white">All Vehicles</h3>
                <p class="text-xs text-slate-400 mt-0.5">
                  {{ company?.company_name }} ·
                  <span class="font-semibold text-emerald-600">{{ filteredVehicles.length }}</span> vehicles
                </p>
              </div>
            </div>
            <button (click)="closeVehicles()"
              class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Search -->
          <div class="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input [(ngModel)]="vehicleSearch" type="text"
                placeholder="Search by vehicle no, make, model, plate, VIN..."
                class="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-transparent
                       rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none transition-all
                       placeholder-slate-400 text-slate-700 dark:text-slate-200" />
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto">

            <!-- Loading -->
            @if (vehiclesLoading) {
              <div class="flex flex-col items-center justify-center py-24 gap-3">
                <div class="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <p class="text-slate-400 text-sm font-medium">Loading vehicles...</p>
              </div>
            }

            <!-- Error -->
            @if (vehiclesError && !vehiclesLoading) {
              <div class="m-6 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-5">
                <p class="font-bold text-red-700 dark:text-red-400">Failed to load vehicles</p>
                <p class="text-sm text-red-600 mt-1">{{ vehiclesError }}</p>
                <button (click)="loadVehicles()" class="mt-3 text-xs font-bold text-red-600 hover:underline cursor-pointer">↺ Retry</button>
              </div>
            }

            <!-- Empty -->
            @if (!vehiclesLoading && !vehiclesError && filteredVehicles.length === 0) {
              <div class="flex flex-col items-center justify-center py-24">
                <div class="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-4">
                  <span class="material-symbols-outlined text-3xl text-emerald-400">local_shipping</span>
                </div>
                <p class="font-semibold text-slate-700 dark:text-slate-300">
                  {{ vehicleSearch ? 'No vehicles match your search' : 'No vehicles found' }}
                </p>
              </div>
            }

            <!-- Vehicle List -->
            @if (!vehiclesLoading && !vehiclesError && filteredVehicles.length > 0) {
              <div class="divide-y divide-slate-100 dark:divide-slate-800">
                @for (v of filteredVehicles; track v.vehicleId) {
                  <div class="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div class="flex items-start gap-4">

                      <!-- Vehicle icon / avatar -->
                      <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                           [class]="v.deviceStatus === 'Connected'
                             ? 'bg-emerald-100 dark:bg-emerald-900/30'
                             : 'bg-slate-100 dark:bg-slate-800'">
                        <span class="material-symbols-outlined text-[20px]"
                              [class]="v.deviceStatus === 'Connected' ? 'text-emerald-600' : 'text-slate-400'">
                          local_shipping
                        </span>
                      </div>

                      <div class="flex-1 min-w-0">

                        <!-- Vehicle name + badges -->
                        <div class="flex items-center gap-2 flex-wrap">
                          <p class="font-bold text-slate-800 dark:text-white text-sm">
                            {{ v.make }} {{ v.model }}
                            <span class="text-slate-400 font-normal">({{ v.manufacturingYear }})</span>
                          </p>
                          <!-- Status -->
                          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                [class]="v.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'">
                            {{ v.status }}
                          </span>
                          <!-- Device status -->
                          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                [class]="v.deviceStatus === 'Connected'
                                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'">
                            <span class="inline-flex items-center gap-1">
                              <span class="material-symbols-outlined text-[10px]">
                                {{ v.deviceStatus === 'Connected' ? 'wifi' : 'wifi_off' }}
                              </span>
                              {{ v.deviceStatus }}
                            </span>
                          </span>
                        </div>

                        <!-- Sub-info -->
                        <p class="text-xs text-slate-500 mt-0.5">
                          Vehicle #{{ v.vehicleNo }} · Plate: <span class="font-semibold">{{ v.licensePlate || '—' }}</span>
                        </p>

                        <!-- Detail pills -->
                        <div class="flex flex-wrap gap-2 mt-2">
                          <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                            <span class="material-symbols-outlined text-[12px]">tag</span>
                            VIN: {{ v.vin || '—' }}
                          </span>
                          @if (v.serialNo) {
                            <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                              <span class="material-symbols-outlined text-[12px]">qr_code</span>
                              S/N: {{ v.serialNo }}
                            </span>
                          }
                          @if (v.modelNo) {
                            <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                              <span class="material-symbols-outlined text-[12px]">devices</span>
                              {{ v.modelNo }}
                            </span>
                          }
                          @if (v.macAddress) {
                            <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full font-mono">
                              <span class="material-symbols-outlined text-[12px]">bluetooth</span>
                              {{ v.macAddress }}
                            </span>
                          }
                          @if (v.version) {
                            <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                              <span class="material-symbols-outlined text-[12px]">update</span>
                              {{ v.version }}
                            </span>
                          }
                        </div>
                      </div>

                      <!-- Vehicle ID -->
                      <p class="text-xs font-mono text-slate-400 flex-shrink-0">#{{ v.vehicleId }}</p>
                    </div>
                  </div>
                }
              </div>
            }

          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between flex-shrink-0">
            <p class="text-xs text-slate-400">
              Showing <span class="font-semibold text-slate-600 dark:text-slate-300">{{ filteredVehicles.length }}</span>
              of <span class="font-semibold text-slate-600 dark:text-slate-300">{{ vehicles.length }}</span> vehicles
            </p>
            <button (click)="closeVehicles()"
              class="px-4 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-700
                     text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
              Close
            </button>
          </div>
        </div>
      </div>
    }

    <style>
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0);    opacity: 1; }
      }
    </style>
  `
})
export class CompanyDashboardComponent {
  private companyService = inject(CompanyService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  get company() { return this.companyService.currentCompany(); }

  analytics: AnalyticsResult | null = null;
  loading = false;
  error = '';

  // ── Drivers panel ─────────────────────────────────────────────────────────
  driversOpen = false;
  driversLoading = false;
  driversError = '';
  drivers: Driver[] = [];
  driverSearch = '';

  get filteredDrivers(): Driver[] {
    const q = this.driverSearch.toLowerCase().trim();
    if (!q) return this.drivers;
    return this.drivers.filter(d =>
      `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q) ||
      String(d.mobileNo).includes(q) ||
      (d.cdlNo ?? '').toLowerCase().includes(q) ||
      (d.cdlStateName ?? '').toLowerCase().includes(q)
    );
  }

  // ── Vehicles panel ────────────────────────────────────────────────────────
  vehiclesOpen = false;
  vehiclesLoading = false;
  vehiclesError = '';
  vehicles: Vehicle[] = [];
  vehicleSearch = '';

  get filteredVehicles(): Vehicle[] {
    const q = this.vehicleSearch.toLowerCase().trim();
    if (!q) return this.vehicles;
    return this.vehicles.filter(v =>
      (v.vehicleNo ?? '').toLowerCase().includes(q) ||
      (v.make ?? '').toLowerCase().includes(q) ||
      (v.model ?? '').toLowerCase().includes(q) ||
      (v.licensePlate ?? '').toLowerCase().includes(q) ||
      (v.vin ?? '').toLowerCase().includes(q) ||
      (v.serialNo ?? '').toLowerCase().includes(q) ||
      (v.modelNo ?? '').toLowerCase().includes(q)
    );
  }

  // ── Clients panel ──────────────────────────────────────────────────────────
  clientsOpen = false;
  clientsLoading = false;
  clientsError = '';
  clients: Client[] = [];
  clientSearch = '';

  get filteredClients(): Client[] {
    const q = this.clientSearch.toLowerCase().trim();
    if (!q) return this.clients;
    return this.clients.filter(c =>
      (c.clientName ?? '').toLowerCase().includes(q) ||
      (c.dotNo ?? '').toLowerCase().includes(q) ||
      (c.city ?? '').toLowerCase().includes(q) ||
      (c.timezone ?? '').toLowerCase().includes(q) ||
      (c.stateName?.[0] ?? '').toLowerCase().includes(q) ||
      (c.countryName?.[0] ?? '').toLowerCase().includes(q)
    );
  }

  // ── Stat cards ────────────────────────────────────────────────────────────
  statCards = [
    {
      key: 'totalUsers', label: 'Total Users', badge: 'Users', clickable: false,
      icon: 'group',
      iconBg: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600',
      bubbleColor: 'bg-blue-400',
      badgeBg: 'bg-blue-50 dark:bg-blue-900/20', badgeText: 'text-blue-600 dark:text-blue-400',
    },
    {
      key: 'totalDrivers', label: 'Total Drivers', badge: 'Drivers', clickable: true,
      icon: 'drive_eta',
      iconBg: 'bg-violet-50 dark:bg-violet-900/20', iconColor: 'text-violet-600',
      bubbleColor: 'bg-violet-400',
      badgeBg: 'bg-violet-50 dark:bg-violet-900/20', badgeText: 'text-violet-600 dark:text-violet-400',
    },
    {
      key: 'totalCompanies', label: 'Total Companies', badge: 'Companies', clickable: true,
      icon: 'business',
      iconBg: 'bg-amber-50 dark:bg-amber-900/20', iconColor: 'text-amber-600',
      bubbleColor: 'bg-amber-400',
      badgeBg: 'bg-amber-50 dark:bg-amber-900/20', badgeText: 'text-amber-600 dark:text-amber-400',
    },
    {
      key: 'totalVehicles', label: 'Total Vehicles', badge: 'Fleet', clickable: true,
      icon: 'local_shipping',
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600',
      bubbleColor: 'bg-emerald-400',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-900/20', badgeText: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      key: 'totalDeviceConnected', label: 'Devices Connected', badge: 'Online', clickable: false,
      icon: 'wifi',
      iconBg: 'bg-teal-50 dark:bg-teal-900/20', iconColor: 'text-teal-600',
      bubbleColor: 'bg-teal-400',
      badgeBg: 'bg-teal-50 dark:bg-teal-900/20', badgeText: 'text-teal-600 dark:text-teal-400',
    },
    {
      key: 'totalDeviceDisconnected', label: 'Devices Disconnected', badge: 'Offline', clickable: false,
      icon: 'wifi_off',
      iconBg: 'bg-red-50 dark:bg-red-900/20', iconColor: 'text-red-500',
      bubbleColor: 'bg-red-400',
      badgeBg: 'bg-red-50 dark:bg-red-900/20', badgeText: 'text-red-500 dark:text-red-400',
    },
  ];

  constructor() {
    effect(() => {
      const c = this.companyService.currentCompany();
      if (c?.admin_url) this.fetchAnalytics(c.admin_url);
    });
  }

  // ── Analytics ─────────────────────────────────────────────────────────────
  fetchAnalytics(adminUrl: string) {
    this.loading = true;
    this.error = '';
    this.analytics = null;
    this.cdr.detectChanges();

    this.http.post<any>(`${adminUrl}/eld_log/master/view_project_detail_analytics`, {}).subscribe({
      next: (res) => {
        this.analytics = res?.status === 'SUCCESS' ? res.result as AnalyticsResult : null;
        if (!this.analytics) this.error = res?.message ?? 'Unexpected response.';
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Could not reach the server.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  reload() {
    const c = this.companyService.currentCompany();
    if (c?.admin_url) this.fetchAnalytics(c.admin_url);
  }

  getAnalyticValue(key: string): number { return (this.analytics as any)?.[key] ?? 0; }

  get totalDevices(): number {
    return (this.analytics?.totalDeviceConnected ?? 0) + (this.analytics?.totalDeviceDisconnected ?? 0);
  }

  get connectionRate(): number {
    return this.totalDevices === 0 ? 0
      : Math.round((this.analytics!.totalDeviceConnected / this.totalDevices) * 100);
  }

  // ── Card click dispatcher ─────────────────────────────────────────────────
  onCardClick(card: any) {
    if (!card.clickable) return;
    if (card.key === 'totalDrivers') this.openDrivers();
    if (card.key === 'totalVehicles') this.openVehicles();
    if (card.key === 'totalCompanies') this.openClients();
  }

  // ── Drivers Panel ─────────────────────────────────────────────────────────
  openDrivers() {
    this.driversOpen = true;
    this.driverSearch = '';
    this.cdr.detectChanges();
    this.loadDrivers();
  }

  closeDrivers() { this.driversOpen = false; this.cdr.detectChanges(); }

  loadDrivers() {
    const c = this.companyService.currentCompany();
    if (!c?.admin_url) return;
    this.driversLoading = true;
    this.driversError = '';
    this.drivers = [];
    this.cdr.detectChanges();

    this.http.post<any>(`${c.admin_url}/eld_log/master/view_driver_information`, { employeeId: '0' }).subscribe({
      next: (res) => {
        this.drivers = res?.status === 'SUCCESS' && Array.isArray(res?.result) ? res.result : [];
        if (!this.drivers.length && res?.status !== 'SUCCESS') this.driversError = res?.message ?? 'No drivers found.';
        this.driversLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.driversError = `Could not load drivers.`;
        this.driversLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Clients Panel ─────────────────────────────────────────────────────────
  openClients() {
    this.clientsOpen = true;
    this.clientSearch = '';
    this.cdr.detectChanges();
    this.loadClients();
  }

  closeClients() { this.clientsOpen = false; this.cdr.detectChanges(); }

  loadClients() {
    const c = this.companyService.currentCompany();
    if (!c?.admin_url) return;
    this.clientsLoading = true;
    this.clientsError = '';
    this.clients = [];
    this.cdr.detectChanges();

    this.http.post<any>(`${c.admin_url}/eld_log/master/view_client`, { clientId: 0 }).subscribe({
      next: (res) => {
        this.clients = res?.status === 'SUCCESS' && Array.isArray(res?.result) ? res.result : [];
        if (!this.clients.length && res?.status !== 'SUCCESS') this.clientsError = res?.message ?? 'No clients found.';
        this.clientsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.clientsError = 'Could not load client/company data.';
        this.clientsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatTimestamp(ts: number): string {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ── Vehicles Panel ────────────────────────────────────────────────────────
  openVehicles() {
    this.vehiclesOpen = true;
    this.vehicleSearch = '';
    this.cdr.detectChanges();
    this.loadVehicles();
  }

  closeVehicles() { this.vehiclesOpen = false; this.cdr.detectChanges(); }

  loadVehicles() {
    const c = this.companyService.currentCompany();
    if (!c?.admin_url) return;
    this.vehiclesLoading = true;
    this.vehiclesError = '';
    this.vehicles = [];
    this.cdr.detectChanges();

    this.http.post<any>(
      `${c.admin_url}/eld_log/master/view_active_vehicle`,
      { vehicleId: 0, clientId: 0 }
    ).subscribe({
      next: (res) => {
        this.vehicles = res?.status === 'SUCCESS' && Array.isArray(res?.result) ? res.result : [];
        if (!this.vehicles.length && res?.status !== 'SUCCESS') this.vehiclesError = res?.message ?? 'No vehicles found.';
        this.vehiclesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.vehiclesError = `Could not load vehicles.`;
        this.vehiclesLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getAvatarColor(name: string): string {
    const palette = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];
    return palette[(name?.charCodeAt(0) ?? 0) % palette.length];
  }
}
