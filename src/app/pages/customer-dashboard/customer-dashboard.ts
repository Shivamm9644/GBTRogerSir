import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { API_BASE_URL } from '../../config/api.config';
import { LayoutService } from '../../services/layout.service';

interface CustomerAppSummary {
  id: number;
  companyId?: string;
  customer: string;
  monthYear: string;
  app: 'ELD' | 'GPS' | 'REEFER' | 'DASHCAM';
  activeAtStart: number;
  addedDuringMonth: number;
  deletedDuringMonth: number;
  serverStatus: 'Online' | 'Warning' | 'Offline';
  locked: boolean;
}

interface MonthlyTrend {
  month: string;
  active: number; 
  activated: number; 
  deactivated: number; 
  cumulativeDeactivated: number;
  serverStatus: 'Online' | 'Warning' | 'Offline';
}

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
<div class="p-8 space-y-6">
  <!-- Dynamic Header -->
  <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
        {{ viewMode === 'summary' ? 'Dashboard Summary' : (viewMode === 'customerDashboard' ? 'Customer Dashboard' : 'Detailed Records') }}
      </h2>
      <p class="text-slate-500 text-sm mt-1">
        {{ viewMode === 'summary' 
           ? 'Overview of customer app health and monthly activity.' 
           : (viewMode === 'customerDashboard' && viewOnlyCustomer ? 'View-only dashboard for ' + viewOnlyCustomer.customer : 'Managing ' + selectedAppType + ' records for ' + selectedMonth) }}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      @if (viewMode === 'details') {
        <button (click)="viewMode = 'summary'; selectedTrend = null" class="flex items-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-semibold text-sm border border-primary/10 hover:border-primary/40 transition-all">
          <span class="material-symbols-outlined text-[18px]">arrow_back</span>Back to Summary
        </button>
      }
      @if (viewMode === 'customerDashboard') {
        <button (click)="closeViewOnlyDashboard()" class="flex items-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-semibold text-sm border border-primary/10 hover:border-primary/40 transition-all">
          <span class="material-symbols-outlined text-[18px]">arrow_back</span>Back
        </button>
      }
      @if (viewMode !== 'customerDashboard') {
        <select [(ngModel)]="selectedMonth" class="px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-primary/10 outline-none">
          @for (month of months; track month) { <option [value]="month">{{ month }}</option> }
        </select>
        <button (click)="createCustomer()" class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary/90">
          <span class="material-symbols-outlined text-[18px]">add_business</span>Create Customer
        </button>
        @if (viewMode === 'summary') {
          <button (click)="openTransferModal()" class="flex items-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-semibold text-sm border border-primary/10 hover:border-primary/40">
            <span class="material-symbols-outlined text-[18px]">swap_horiz</span>Transfer Data
          </button>
        }
      }
    </div>
  </div>

  <!-- FULL CUSTOMER DASHBOARD VIEW ONLY -->
  @if (viewMode === 'customerDashboard' && viewOnlyCustomer) {
    <div class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div class="rounded-2xl overflow-hidden border border-primary/10 bg-white dark:bg-slate-900 shadow-sm">
        <div class="bg-[#004a99] px-6 py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between text-white">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">Entire Customer Dashboard · View Only</p>
            <h3 class="text-2xl font-black mt-1">{{ viewOnlyCustomer.customer }}</h3>
            <p class="text-xs text-white/70 mt-1">Opened by double-clicking the company name.</p>
          </div>
          <span class="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full bg-white/15 border border-white/20 w-fit">
            <span class="material-symbols-outlined text-[14px]">visibility</span>Viewable Only · No Edit · No Delete
          </span>
        </div>

        <div class="p-6 space-y-6">
          <div class="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 flex items-start gap-3">
            <span class="material-symbols-outlined text-[20px] mt-0.5">lock</span>
            <p class="text-xs font-bold leading-5">All Customer Dashboard information is read-only here. Edit, delete, and change actions are intentionally not available on this screen.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <div class="rounded-2xl border border-primary/10 bg-slate-50 dark:bg-slate-800/50 p-5"><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company ID</p><p class="text-xl font-black text-slate-900 dark:text-white mt-2">{{ viewOnlyCustomer.companyId || ('CMP-' + viewOnlyCustomer.id) }}</p></div>
            <div class="rounded-2xl border border-primary/10 bg-slate-50 dark:bg-slate-800/50 p-5"><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">App Type</p><p class="text-xl font-black text-slate-900 dark:text-white mt-2">{{ viewOnlyCustomer.app }}</p></div>
            <div class="rounded-2xl border border-primary/10 bg-slate-50 dark:bg-slate-800/50 p-5"><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Month / Year</p><p class="text-xl font-black text-slate-900 dark:text-white mt-2">{{ viewOnlyCustomer.monthYear }}</p></div>
            <div class="rounded-2xl border border-primary/10 bg-slate-50 dark:bg-slate-800/50 p-5"><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Server Status</p><span class="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mt-3" [class]="getServerClass(viewOnlyCustomer.serverStatus)"><span class="w-2 h-2 rounded-full" [class]="getServerDotClass(viewOnlyCustomer.serverStatus)"></span>{{ viewOnlyCustomer.serverStatus }}</span></div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div class="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-primary/10 shadow-sm"><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active At Start</p><p class="text-3xl font-black text-slate-900 dark:text-white mt-2">{{ viewOnlyCustomer.activeAtStart | number }}</p></div>
            <div class="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-primary/10 shadow-sm"><p class="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest">Added During Month</p><p class="text-3xl font-black text-emerald-600 mt-2">+{{ viewOnlyCustomer.addedDuringMonth | number }}</p></div>
            <div class="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-primary/10 shadow-sm"><p class="text-[10px] font-black text-red-500/70 uppercase tracking-widest">Deleted During Month</p><p class="text-3xl font-black text-red-500 mt-2">-{{ viewOnlyCustomer.deletedDuringMonth | number }}</p></div>
          </div>

          <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div class="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-primary/10 p-6">
              <h4 class="font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[18px]">business</span>Company Information</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <label class="space-y-1"><span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Name</span><input [value]="viewOnlyCustomer.customer" readonly class="w-full border-b border-slate-300 py-2 bg-transparent text-sm font-bold outline-none cursor-not-allowed" /></label>
                <label class="space-y-1"><span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Safety Lock</span><input [value]="viewOnlyCustomer.locked ? 'Enabled' : 'Disabled'" readonly class="w-full border-b border-slate-300 py-2 bg-transparent text-sm font-bold outline-none cursor-not-allowed" /></label>
                <label class="space-y-1"><span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">DOT Number</span><input value="Dummy-DOT-{{ viewOnlyCustomer.id }}" readonly class="w-full border-b border-slate-300 py-2 bg-transparent text-sm font-bold outline-none cursor-not-allowed" /></label>
                <label class="space-y-1"><span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance Mode</span><input [value]="viewOnlyCustomer.app === 'ELD' ? 'ELD Compliance' : 'Standard Tracking'" readonly class="w-full border-b border-slate-300 py-2 bg-transparent text-sm font-bold outline-none cursor-not-allowed" /></label>
              </div>
            </div>

            <div class="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-primary/10 p-6">
              <h4 class="font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[18px]">analytics</span>Dashboard Modules</h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="rounded-xl bg-white dark:bg-slate-900 border border-primary/10 p-4"><p class="text-[9px] font-black uppercase text-slate-400">Vehicles</p><p class="text-xl font-black mt-1">{{ viewOnlyCustomer.activeAtStart }}</p></div>
                <div class="rounded-xl bg-white dark:bg-slate-900 border border-primary/10 p-4"><p class="text-[9px] font-black uppercase text-slate-400">Drivers</p><p class="text-xl font-black mt-1">{{ viewOnlyCustomer.activeAtStart + 8 }}</p></div>
                <div class="rounded-xl bg-white dark:bg-slate-900 border border-primary/10 p-4"><p class="text-[9px] font-black uppercase text-slate-400">Logs</p><p class="text-xl font-black mt-1">{{ viewOnlyCustomer.activeAtStart * 14 }}</p></div>
                <div class="rounded-xl bg-white dark:bg-slate-900 border border-primary/10 p-4"><p class="text-[9px] font-black uppercase text-slate-400">Billing</p><p class="text-xl font-black mt-1">View Only</p></div>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-primary/10 overflow-hidden">
            <div class="px-5 py-4 border-b border-primary/10 flex items-center justify-between"><h4 class="font-black text-slate-800 dark:text-white">Customer Dashboard Records</h4><span class="text-[10px] font-black text-slate-400 uppercase">Read-only table</span></div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-slate-50 dark:bg-slate-800/70 text-xs uppercase tracking-wider text-slate-500"><tr><th class="px-5 py-3 text-left font-black">App</th><th class="px-5 py-3 text-right font-black">Active</th><th class="px-5 py-3 text-right font-black">Added</th><th class="px-5 py-3 text-right font-black">Deleted</th><th class="px-5 py-3 text-left font-black">Status</th></tr></thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (item of customerDashboardRows; track item.id) {
                    <tr>
                      <td class="px-5 py-4 font-bold">{{ item.app }}</td>
                      <td class="px-5 py-4 text-right font-bold">{{ item.activeAtStart }}</td>
                      <td class="px-5 py-4 text-right font-bold text-emerald-600">+{{ item.addedDuringMonth }}</td>
                      <td class="px-5 py-4 text-right font-bold text-red-500">-{{ item.deletedDuringMonth }}</td>
                      <td class="px-5 py-4"><span class="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" [class]="getServerClass(item.serverStatus)"><span class="w-2 h-2 rounded-full" [class]="getServerDotClass(item.serverStatus)"></span>{{ item.serverStatus }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  }

  <!-- SUMMARY VIEW (KPIs + Blocks) -->
  @if (viewMode === 'summary') {
    <div class="space-y-6 animate-in fade-in duration-500">
      <!-- Main KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        @for (kpi of summaryCards; track kpi.label) {
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-primary/10 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div class="p-2.5 rounded-xl" [class]="kpi.bg">
                <span class="material-symbols-outlined" [class]="kpi.color">{{ kpi.icon }}</span>
              </div>
              <span class="text-[11px] font-bold px-2 py-1 rounded-full" [class]="kpi.badgeClass">{{ kpi.badge }}</span>
            </div>
            <p class="text-3xl font-black text-slate-900 dark:text-white mt-4">{{ kpi.value }}</p>
            <p class="text-sm font-semibold text-slate-500 mt-1">{{ kpi.label }}</p>
          </div>
        }
      </div>

      <!-- App Type Blocks -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
        @for (type of appBlocks; track type.name) {
          <div (click)="enterDetails(type.name)" 
               class="bg-white dark:bg-slate-900 rounded-2xl border border-primary/10 p-5 cursor-pointer transition-all hover:shadow-xl group hover:-translate-y-1">
            <div class="flex items-center justify-between mb-4">
              <div class="p-2 rounded-xl" [class]="type.bg">
                <span class="material-symbols-outlined text-sm" [class]="type.color">rocket_launch</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full" [class]="type.dotColor"></span>
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">{{ type.status }}</span>
              </div>
            </div>
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">{{ type.name }}</h3>
            <div class="flex items-end justify-between mt-1">
              <p class="text-2xl font-black text-slate-900 dark:text-white">{{ type.count | number }} Units</p>
              <span class="text-[10px] font-bold text-primary group-hover:underline flex items-center gap-1">
                View Records <span class="material-symbols-outlined text-[12px]">arrow_forward</span>
              </span>
            </div>
          </div>
        }
      </div>

      <!-- Top Companies Quick Look -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-primary/10 p-6 animate-in fade-in duration-700 delay-300">
        <div class="flex items-center justify-between mb-6">
           <h4 class="font-bold text-slate-800 dark:text-white">Active Customer Snapshots</h4>
           <button (click)="enterDetails('ALL')" class="text-xs font-bold text-primary hover:underline">See All Customers</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           @for (row of filteredSummaries.slice(0, 6); track row.id) {
             <div (click)="enterDetails('ALL', row)" 
                  (dblclick)="openViewOnlyDashboard(row); $event.stopPropagation()"
                  class="flex items-center justify-between p-3.5 rounded-xl border border-primary/5 hover:bg-slate-50 cursor-pointer transition-colors group">
                <div class="flex items-center gap-3">
                   <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-[11px]">{{ row.customer.charAt(0) }}</div>
                   <div>
                      <p class="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors">{{ row.customer }}</p>
                      <p class="text-[9px] text-slate-400 uppercase font-black">{{ row.app }} · {{ row.serverStatus }}</p>
                   </div>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <span class="text-[10px] font-mono font-bold text-slate-500">{{ row.activeAtStart }} Active</span>
                  <span class="text-[8px] font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase">Dbl-Click for Dash</span>
                </div>
             </div>
           }
        </div>
      </div>
    </div>
  }

  <!-- DETAILS VIEW (Table + Graph) -->
  @if (viewMode === 'details') {
    <div class="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-primary/10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center gap-3">
             <button (click)="viewMode = 'summary'" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
               <span class="material-symbols-outlined text-[18px]">arrow_back</span>
             </button>
             <div>
                <h4 class="font-bold text-slate-800 dark:text-white">Customer App Summary: {{ selectedAppType }}</h4>
                <p class="text-xs text-slate-400 mt-0.5">
                  Click name for Trend. Dbl-Click for Full Dashboard. Right-click badge for Store.
                </p>
             </div>
          </div>
          
          <div class="relative w-full lg:w-64">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input [(ngModel)]="search" placeholder="Search customer..." class="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-transparent outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/70 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th class="px-6 py-3 text-left font-black">Customer</th>
                <th class="px-6 py-3 text-left font-black">Mm/Yr</th>
                <th class="px-6 py-3 text-left font-black">App</th>
                <th class="px-6 py-3 text-right font-black">Active Start</th>
                <th class="px-6 py-3 text-right font-black">Added</th>
                <th class="px-6 py-3 text-right font-black">Deleted</th>
                <th class="px-6 py-3 text-left font-black">Server Status</th>
                <th class="px-6 py-3 text-right font-black">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              @for (row of filteredSummaries; track row.id) {
                <tr (dblclick)="openViewOnlyDashboard(row)" class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-default">
                  <td class="px-6 py-4">
                    <button (click)="showTrend(row); $event.stopPropagation()" 
                            (dblclick)="openViewOnlyDashboard(row); $event.stopPropagation()"
                            class="font-bold text-primary hover:underline cursor-pointer text-left">
                      {{ row.customer }}
                    </button>
                    @if (row.locked) {
                      <span class="ml-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                        <span class="material-symbols-outlined text-[11px]">lock</span>Locked
                      </span>
                    }
                  </td>
                  <td class="px-6 py-4 text-slate-600 dark:text-slate-300">{{ row.monthYear }}</td>
                  <td class="px-6 py-4">
                    <span (click)="showTrend(row); $event.stopPropagation()"
                          (contextmenu)="onAppContextMenu($event, row)"
                          class="text-xs font-black px-2.5 py-1 rounded-full cursor-pointer border border-transparent hover:border-primary/30 transition-all" 
                          [class]="getAppClass(row.app)">
                      {{ row.app }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right font-bold">{{ row.activeAtStart | number }}</td>
                  <td class="px-6 py-4 text-right font-bold text-emerald-600">+{{ row.addedDuringMonth | number }}</td>
                  <td class="px-6 py-4 text-right font-bold text-red-500">-{{ row.deletedDuringMonth | number }}</td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" [class]="getServerClass(row.serverStatus)">
                      <span class="w-2 h-2 rounded-full" [class]="getServerDotClass(row.serverStatus)"></span>{{ row.serverStatus }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button (click)="editCustomer(row); $event.stopPropagation()" class="p-2 rounded-lg hover:bg-blue-50 text-blue-600">
                        <span class="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button (click)="removeCustomer(row); $event.stopPropagation()" class="p-2 rounded-lg hover:bg-red-50 text-red-500">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="8" class="px-6 py-12 text-center text-slate-400 font-semibold">No customer summary found for {{ selectedAppType }} in {{ selectedMonth }}.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Detail Graph (Inside Details View) -->
      @if (selectedTrend) {
        <div class="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-primary/10 shadow-xl overflow-hidden animate-in zoom-in-95 duration-500">
          <div class="px-6 py-5 border-b border-primary/10 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <h4 class="font-black text-slate-800 dark:text-white uppercase tracking-tight">Record Details: {{ selectedTrend.customer }}</h4>
              </div>
              <p class="text-xs text-slate-400 mt-1">{{ selectedTrend.app }} Summary · Server: <span class="font-bold" [class]="selectedTrend.serverStatus === 'Online' ? 'text-emerald-500' : 'text-amber-500'">{{ selectedTrend.serverStatus }}</span> · Last 12 Months Analytics</p>
            </div>
            <button (click)="selectedTrend = null" class="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all border border-transparent hover:border-primary/20">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          
          <div class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div class="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-primary/5 shadow-sm">
                 <div class="flex items-center gap-3 mb-2">
                   <div class="p-2 rounded-lg bg-blue-50 text-blue-600"><span class="material-symbols-outlined text-sm">devices</span></div>
                   <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currently Active</p>
                 </div>
                 <p class="text-3xl font-black text-slate-900 dark:text-white">{{ selectedTrend.activeAtStart }}</p>
              </div>
              <div class="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-primary/5 shadow-sm">
                 <div class="flex items-center gap-3 mb-2">
                   <div class="p-2 rounded-lg bg-emerald-50 text-emerald-600"><span class="material-symbols-outlined text-sm">add_circle</span></div>
                   <p class="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Added This Month</p>
                 </div>
                 <p class="text-3xl font-black text-emerald-600">+{{ selectedTrend.addedDuringMonth }}</p>
              </div>
              <div class="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-primary/5 shadow-sm">
                 <div class="flex items-center gap-3 mb-2">
                   <div class="p-2 rounded-lg bg-red-50 text-red-500"><span class="material-symbols-outlined text-sm">remove_circle</span></div>
                   <p class="text-[10px] font-black text-red-500/60 uppercase tracking-widest">Deactivations</p>
                 </div>
                 <p class="text-3xl font-black text-red-500">-{{ selectedTrend.deletedDuringMonth }}</p>
              </div>
            </div>

            <div class="rounded-3xl border border-primary/10 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-6 shadow-sm">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6">
                <div>
                  <p class="text-[10px] font-black text-primary uppercase tracking-[0.22em]">Performance Analytics</p>
                  <h5 class="text-lg font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-[20px]">query_stats</span>
                    12 Month Performance Trend
                  </h5>
                  <p class="text-xs text-slate-500 mt-1">App Active at start of month, activated running sum, deactivated running sum and server status.</p>
                </div>

                <div class="grid grid-cols-3 gap-2 w-full lg:w-auto">
                  <div class="rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-primary/10 px-4 py-3 shadow-sm">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Start Month Active</p>
                    <p class="text-xl font-black text-slate-900 dark:text-white mt-1">{{ latestTrend?.active || 0 }}</p>
                  </div>
                  <div class="rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-emerald-100 px-4 py-3 shadow-sm">
                    <p class="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest">Activated</p>
                    <p class="text-xl font-black text-emerald-600 mt-1">+{{ latestTrend?.activated || 0 }}</p>
                  </div>
                  <div class="rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-red-100 px-4 py-3 shadow-sm">
                    <p class="text-[9px] font-black text-red-500/70 uppercase tracking-widest">Deactivated</p>
                    <p class="text-xl font-black text-red-500 mt-1">{{ latestTrend?.deactivated || 0 }}</p>
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-5">
                <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-blue-600 shadow-sm"></span> App Active Start Month</span>
                <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></span> Activated Running Sum</span>
                <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-red-400 shadow-sm"></span> Deactivated Running Sum</span>
                <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-amber-400 shadow-sm"></span> Cumulative Deactivated</span>
              </div>

              <div class="relative rounded-3xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-5 overflow-hidden">
                <div class="absolute inset-x-5 top-5 bottom-14 pointer-events-none flex flex-col justify-between">
                  <span class="border-t border-dashed border-slate-200 dark:border-slate-800"></span>
                  <span class="border-t border-dashed border-slate-200 dark:border-slate-800"></span>
                  <span class="border-t border-dashed border-slate-200 dark:border-slate-800"></span>
                  <span class="border-t border-dashed border-slate-200 dark:border-slate-800"></span>
                </div>

                <div class="relative h-72 flex items-end gap-3 overflow-x-auto pb-2">
                  @for (item of trendData; track item.month; let i = $index) {
                    <div class="min-w-[62px] flex-1 h-full flex flex-col justify-end items-center group">
                      <div class="relative w-full h-[220px] flex items-end justify-center gap-1.5 px-1">
                        <div class="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 rounded-xl bg-slate-900 text-white text-[10px] font-bold px-3 py-2 shadow-xl whitespace-nowrap">
                          {{ item.month }} · {{ item.active }} active · +{{ item.activated }} activated · -{{ item.deactivated }} deactivated · {{ item.serverStatus }}
                        </div>

                        <div class="w-3.5 rounded-t-xl bg-gradient-to-t from-blue-600 to-blue-400 shadow-sm transition-all duration-700 group-hover:scale-105" [style.height.%]="getTrendBarHeight(item.active)"></div>
                        <div class="w-3.5 rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-300 shadow-sm transition-all duration-700 group-hover:scale-105" [style.height.%]="getTrendBarHeight(item.activated)"></div>
                        <div class="w-3.5 rounded-t-xl bg-gradient-to-t from-red-500 to-red-300 shadow-sm transition-all duration-700 group-hover:scale-105" [style.height.%]="getTrendBarHeight(item.deactivated)"></div>
                        <div class="w-3.5 rounded-t-xl bg-gradient-to-t from-amber-500 to-amber-300 shadow-sm transition-all duration-700 group-hover:scale-105" [style.height.%]="getTrendBarHeight(item.cumulativeDeactivated)"></div>
                      </div>

                      <div class="w-full mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p class="text-[10px] font-black text-slate-500 group-hover:text-primary transition-colors">{{ item.month }}</p>
                        <p class="text-[9px] font-bold text-slate-400 mt-0.5">{{ item.active }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>


              <div class="mt-6 rounded-2xl bg-white dark:bg-slate-950 border border-primary/10 overflow-hidden">
                <div class="px-5 py-4 border-b border-primary/10 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h6 class="text-sm font-black text-slate-900 dark:text-white">Monthly Performance Register</h6>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Includes Server Status as per requirement</p>
                  </div>
                  <span class="text-[10px] font-black text-primary uppercase">View Only</span>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-xs">
                    <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th class="px-4 py-3 text-left font-black">Customer</th>
                        <th class="px-4 py-3 text-left font-black">Mn/Yr</th>
                        <th class="px-4 py-3 text-left font-black">App</th>
                        <th class="px-4 py-3 text-right font-black">App Active<br><span class="font-bold normal-case">Start of month</span></th>
                        <th class="px-4 py-3 text-right font-black">App Added<br><span class="font-bold normal-case">During month</span></th>
                        <th class="px-4 py-3 text-right font-black">App Deleted<br><span class="font-bold normal-case">In month</span></th>
                        <th class="px-4 py-3 text-left font-black">Server Status</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                      @for (item of trendData; track item.month) {
                        <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-900/70">
                          <td class="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{{ selectedTrend.customer }}</td>
                          <td class="px-4 py-3 font-bold">{{ getTrendMonthYear(item.month) }}</td>
                          <td class="px-4 py-3"><span class="inline-flex px-2 py-1 rounded-lg font-black" [class]="getAppClass(selectedTrend.app)">{{ selectedTrend.app }}</span></td>
                          <td class="px-4 py-3 text-right font-black text-blue-600">{{ item.active }}</td>
                          <td class="px-4 py-3 text-right font-black text-emerald-600">+{{ item.activated }}</td>
                          <td class="px-4 py-3 text-right font-black text-red-500">-{{ item.deactivated }}</td>
                          <td class="px-4 py-3"><span class="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full" [class]="getServerClass(item.serverStatus)"><span class="w-2 h-2 rounded-full" [class]="getServerDotClass(item.serverStatus)"></span>{{ item.serverStatus }}</span></td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="rounded-2xl bg-white dark:bg-slate-950 border border-primary/10 p-4">
                  <div class="flex items-center justify-between mb-3">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Unit Progress</p>
                    <p class="text-xs font-black text-blue-600">{{ trendGrowth >= 0 ? '+' : '' }}{{ trendGrowth }} in 12 months</p>
                  </div>
                  <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div class="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" [style.width.%]="getTrendBarHeight(latestTrend?.active || 0)"></div>
                  </div>
                </div>

                <div class="rounded-2xl bg-white dark:bg-slate-950 border border-primary/10 p-4">
                  <div class="flex items-center justify-between mb-3">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cumulative Deactivation</p>
                    <p class="text-xs font-black text-amber-600">{{ latestTrend?.cumulativeDeactivated || 0 }} total</p>
                  </div>
                  <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div class="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-400" [style.width.%]="getTrendBarHeight(latestTrend?.cumulativeDeactivated || 0)"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  }

  @if (showAddModal) {
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="showAddModal = false"></div>
      <div class="relative w-full max-w-4xl bg-[#f8f9fb] rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 flex flex-col" style="max-height: 92vh;">

        <!-- Header -->
        <div class="bg-[#004a99] px-6 py-3 flex items-center justify-between text-white flex-shrink-0">
          <h3 class="text-sm font-bold tracking-wide">Add Company</h3>
          <button (click)="showAddModal = false" class="hover:bg-white/10 p-1 rounded-lg transition-colors">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="overflow-y-auto flex-1 p-6 space-y-6">

          <!-- Section: General Information -->
          <div class="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h4 class="text-slate-700 font-bold mb-5 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px] text-[#004a99]">business</span>
              General Information
            </h4>

            <!-- Company ID Banner -->
            <div class="mb-5 flex items-center gap-3 bg-[#004a99]/5 border border-[#004a99]/20 rounded-lg px-4 py-3">
              <span class="material-symbols-outlined text-[#004a99] text-[18px]">fingerprint</span>
              <div>
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Auto-Generated Company ID</p>
                <p class="text-sm font-mono font-black text-[#004a99] tracking-wider mt-0.5">{{ generatedCompanyId }}</p>
              </div>
              <span class="ml-auto text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Read-only</span>
            </div>

            <!-- Row 1: Company Name + DOT -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-5">
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Name *</label>
                <input [(ngModel)]="newCustomer.customer" placeholder="Enter Company Name"
                  class="w-full border-b border-slate-300 py-2 outline-none focus:border-[#004a99] transition-colors text-sm" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">DOT Number</label>
                <input [(ngModel)]="newCustomer.dotNumber" placeholder="Enter DOT Number"
                  class="w-full border-b border-slate-300 py-2 outline-none focus:border-[#004a99] transition-colors text-sm" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Time Zone</label>
                <select class="w-full border-b border-slate-300 py-2 outline-none focus:border-[#004a99] transition-colors text-sm bg-transparent">
                  <option>Select time zone</option>
                  <option>Eastern Standard Time (EST)</option>
                  <option>Central Standard Time (CST)</option>
                  <option>Mountain Standard Time (MST)</option>
                  <option>Pacific Standard Time (PST)</option>
                </select>
              </div>
            </div>

            <!-- Address Block -->
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Address</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <input placeholder="Street Address" class="w-full border-b border-slate-300 py-2 outline-none focus:border-[#004a99] text-sm transition-colors" />
                <input placeholder="City" class="w-full border-b border-slate-300 py-2 outline-none focus:border-[#004a99] text-sm transition-colors" />
              </div>
              <div class="grid grid-cols-3 gap-4 mt-4">
                <select class="w-full border-b border-slate-300 py-2 outline-none focus:border-[#004a99] text-sm bg-transparent transition-colors">
                  <option value="">Country</option>
                  <option>United States</option>
                  <option>Canada</option>
                  <option>Mexico</option>
                </select>
                <select class="w-full border-b border-slate-300 py-2 outline-none focus:border-[#004a99] text-sm bg-transparent transition-colors">
                  <option value="">State</option>
                  <option>California</option>
                  <option>Texas</option>
                  <option>New York</option>
                  <option>Florida</option>
                </select>
                <input placeholder="Zip / Postal Code" class="w-full border-b border-slate-300 py-2 outline-none focus:border-[#004a99] text-sm transition-colors" />
              </div>
            </div>
          </div>

          <!-- Section: Terminal -->
          <div class="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <div class="flex items-center justify-between mb-5">
              <h4 class="text-slate-700 font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#004a99]">location_on</span>
                Terminal
              </h4>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" id="sameAbove" class="w-4 h-4 rounded accent-[#004a99]">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Same as above</span>
              </label>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-5">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Zone</label>
                  <select class="w-full border-b border-slate-300 py-2 outline-none text-sm bg-transparent focus:border-[#004a99] transition-colors">
                    <option>Select time zone</option>
                    <option>Eastern Standard Time (EST)</option>
                    <option>Central Standard Time (CST)</option>
                    <option>Mountain Standard Time (MST)</option>
                    <option>Pacific Standard Time (PST)</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">24H Period Starting Time</label>
                  <input type="time" value="00:00"
                    class="w-full border-b border-slate-300 py-2 outline-none text-sm bg-transparent focus:border-[#004a99] transition-colors" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terminal Address</label>
                <div class="grid grid-cols-1 gap-4 mt-2">
                  <input placeholder="Street Address" class="w-full border-b border-slate-300 py-2 outline-none focus:border-[#004a99] text-sm transition-colors" />
                  <input placeholder="City" class="w-full border-b border-slate-300 py-2 outline-none focus:border-[#004a99] text-sm transition-colors" />
                  <div class="grid grid-cols-3 gap-3">
                    <select class="w-full border-b border-slate-300 py-2 outline-none text-sm bg-transparent focus:border-[#004a99] transition-colors">
                      <option value="">Country</option>
                      <option>United States</option>
                      <option>Canada</option>
                    </select>
                    <select class="w-full border-b border-slate-300 py-2 outline-none text-sm bg-transparent focus:border-[#004a99] transition-colors">
                      <option value="">State</option>
                      <option>California</option>
                      <option>Texas</option>
                      <option>New York</option>
                    </select>
                    <input placeholder="Zip / Postal" class="w-full border-b border-slate-300 py-2 outline-none focus:border-[#004a99] text-sm transition-colors" />
                  </div>
                </div>
              </div>
            </div>
            <button type="button" class="mt-6 px-4 py-2 border border-emerald-600 text-emerald-600 text-[10px] font-bold rounded uppercase hover:bg-emerald-50 transition-colors">
              + Add New Terminal
            </button>
          </div>

          <!-- Section: Carrier Settings -->
          <div class="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h4 class="text-slate-700 font-bold mb-5 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px] text-[#004a99]">settings</span>
              Carrier Settings
            </h4>
            <div class="space-y-5">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance Mode *</label>
                  <select [(ngModel)]="newCustomer.complianceMode" class="w-full border-b border-slate-300 py-2 outline-none text-sm bg-transparent focus:border-[#004a99] transition-colors">
                    <option value="">Select Compliance Mode</option>
                    <option value="ELD">ELD — Electronic Logging Device</option>
                    <option value="AOBRD">AOBRD — Automatic On-Board Recording</option>
                    <option value="Non-CDL">Non-CDL — Short-Haul Exempt</option>
                    <option value="Exempt">Exempt — No ELD Required</option>
                    <option value="Drivewyze">Drivewyze Integration</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle Motion Threshold</label>
                  <p class="text-sm font-bold text-slate-800 py-2 border-b border-slate-300">5 mi/h</p>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cycle Rule *</label>
                  <select class="w-full border-b border-slate-300 py-2 outline-none text-sm bg-transparent focus:border-[#004a99] transition-colors">
                    <option>70 hrs/8 days</option>
                    <option>60 hrs/7 days</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo Type *</label>
                  <select class="w-full border-b border-slate-300 py-2 outline-none text-sm bg-transparent focus:border-[#004a99] transition-colors">
                    <option>Property</option>
                    <option>Passenger</option>
                    <option>Hazmat</option>
                  </select>
                </div>
              </div>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" [(ngModel)]="newCustomer.locked" id="safetyLock" class="w-4 h-4 accent-[#004a99]">
                <span class="text-[11px] font-bold text-slate-600 uppercase">Enable Safety Lock (Strict Mode)</span>
              </label>
            </div>
          </div>

          <!-- Plan Features & Integrations -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <h4 class="text-slate-700 font-bold mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#004a99]">checklist</span>
                Plan Features
              </h4>
              <div class="space-y-3">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked class="w-4 h-4 accent-[#004a99]">
                  <span class="text-xs text-slate-600 font-medium">Allow Tracking</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked class="w-4 h-4 accent-[#004a99]">
                  <span class="text-xs text-slate-600 font-medium">Allow GPS Tracking</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" class="w-4 h-4 accent-[#004a99]">
                  <span class="text-xs text-slate-600 font-medium">Allow IFTA</span>
                </label>
              </div>
            </div>
            <div class="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <h4 class="text-slate-700 font-bold mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#004a99]">extension</span>
                Integrations
              </h4>
              <div class="space-y-3">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" class="w-4 h-4 accent-[#004a99]">
                  <span class="text-xs text-slate-600 font-medium">Project 44</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" class="w-4 h-4 accent-[#004a99]">
                  <span class="text-xs text-slate-600 font-medium">MacroPoint</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
          <button (click)="showAddModal = false" class="px-5 py-2 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100 rounded transition-colors">Cancel</button>
          <button (click)="saveCustomer()" class="px-8 py-2 bg-[#004a99] text-white text-[10px] font-black uppercase rounded hover:bg-[#003d7e] shadow-lg transition-all">Save Company</button>
        </div>
      </div>
    </div>
  }

  <!-- DUMMY TRANSFER MODAL -->
  @if (showTransferModal) {
    <div class="fixed inset-0 z-[75] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" (click)="closeTransferModal()"></div>
      <div class="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
        <div class="bg-[#004a99] px-6 py-4 flex items-center justify-between text-white">
          <div><p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">Dummy Transfer Flow</p><h3 class="text-lg font-black mt-1">Transfer Customer Dashboard Data</h3></div>
          <button (click)="closeTransferModal()" class="hover:bg-white/10 p-2 rounded-lg transition-colors"><span class="material-symbols-outlined text-[20px]">close</span></button>
        </div>
        <div class="p-6 space-y-6">
          <div class="rounded-xl border border-blue-200 bg-blue-50 text-blue-800 px-4 py-3 flex items-start gap-3"><span class="material-symbols-outlined text-[20px] mt-0.5">info</span><p class="text-xs font-bold leading-5">This is only a front-end demo. Later this button can call backend API to move all customers, apps, vehicles, drivers, logs, billing, and dashboard records from Company A to Company B.</p></div>
          <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <label class="space-y-2"><span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">From Company A</span><select [(ngModel)]="transferFromCustomer" (ngModelChange)="buildTransferPreview()" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-primary/20"><option value="">Select source company</option>@for (company of uniqueCustomers; track company) {<option [value]="company">{{ company }}</option>}</select></label>
            <div class="hidden md:flex h-10 w-10 rounded-full bg-primary/10 text-primary items-center justify-center mb-0.5"><span class="material-symbols-outlined">arrow_forward</span></div>
            <label class="space-y-2"><span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">To Company B</span><select [(ngModel)]="transferToCustomer" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-primary/20"><option value="">Select target company</option>@for (company of uniqueCustomers; track company) {<option [value]="company" [disabled]="company === transferFromCustomer">{{ company }}</option>}</select></label>
          </div>
          @if (transferPreview) {
            <div class="rounded-2xl border border-primary/10 overflow-hidden"><div class="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-primary/10 flex items-center justify-between"><h4 class="text-sm font-black text-slate-800 dark:text-white">Transfer Preview</h4><span class="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">Backend Pending</span></div><div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-5"><div><p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Apps</p><p class="text-xl font-black text-slate-900 dark:text-white mt-1">{{ transferPreview.apps }}</p></div><div><p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Units</p><p class="text-xl font-black text-slate-900 dark:text-white mt-1">{{ transferPreview.activeUnits }}</p></div><div><p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Added</p><p class="text-xl font-black text-emerald-600 mt-1">+{{ transferPreview.added }}</p></div><div><p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deleted</p><p class="text-xl font-black text-red-500 mt-1">-{{ transferPreview.deleted }}</p></div></div></div>
          }
          <div class="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-4"><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Future Backend API</p><code class="text-xs text-slate-600 dark:text-slate-300">POST /api/customer-transfer</code><p class="text-xs text-slate-500 mt-2">Payload: fromCompanyId, toCompanyId, transferAllDashboardData, approvedBy, reviewRequired</p></div>
        </div>
        <div class="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3"><button (click)="closeTransferModal()" class="px-5 py-2 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">Cancel</button><button (click)="submitDummyTransfer()" [disabled]="!canSubmitTransfer" class="px-6 py-2 bg-[#004a99] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase rounded hover:bg-[#003d7e] shadow-lg transition-all">Prepare Transfer Request</button></div>
      </div>
    </div>
  }
</div>

<!-- Context Menu -->
@if (showContextMenu) {
  <div class="fixed z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1.5 min-w-[220px]"
       [style.left.px]="menuX" [style.top.px]="menuY">
    <div class="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
      <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ contextApp?.company }} - {{ contextApp?.app_name }}</p>
    </div>
    
    <button (click)="triggerStoreUpload(contextApp)" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/5 transition-all">
      <span class="material-symbols-outlined text-[18px]">cloud_upload</span> Upload v{{ contextApp?.app_version }} to Store
    </button>

    <div class="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
    <p class="px-3 py-1 text-[8px] text-slate-400 italic">Initiates Store Upload & OTA update signal.</p>
  </div>
}
`,
  styles: [`.cursor-context-menu { cursor: context-menu; }`]
})
export class CustomerDashboardComponent implements OnInit {
  viewMode: 'summary' | 'details' | 'customerDashboard' = 'summary';
  previousViewMode: 'summary' | 'details' = 'summary';
  selectedMonth = 'Apr/2026';
  selectedAppType: 'ALL' | 'ELD' | 'GPS' | 'REEFER' | 'DASHCAM' = 'ALL';
  search = '';
  selectedTrend: CustomerAppSummary | null = null;
  viewOnlyCustomer: CustomerAppSummary | null = null;
  showAddModal = false;
  generatedCompanyId = '';
  newCustomer: any = {
    customer: '',
    dotNumber: '',
    app: 'ELD',
    complianceMode: '',
    locked: true
  };

  months = ['Apr/2026', 'Mar/2026', 'Feb/2026', 'Jan/2026'];
  appTypes: ('ELD' | 'GPS' | 'REEFER' | 'DASHCAM')[] = ['ELD', 'GPS', 'REEFER', 'DASHCAM'];

  summaries: CustomerAppSummary[] = [
    { id: 1, customer: 'Acme Logistics', monthYear: 'Apr/2026', app: 'ELD', activeAtStart: 118, addedDuringMonth: 9, deletedDuringMonth: 2, serverStatus: 'Online', locked: true },
    { id: 2, customer: 'Acme Logistics', monthYear: 'Apr/2026', app: 'GPS', activeAtStart: 104, addedDuringMonth: 6, deletedDuringMonth: 1, serverStatus: 'Online', locked: true },
    { id: 3, customer: 'Northline Freight', monthYear: 'Apr/2026', app: 'REEFER', activeAtStart: 42, addedDuringMonth: 4, deletedDuringMonth: 3, serverStatus: 'Warning', locked: false },
    { id: 4, customer: 'Prime Carrier Group', monthYear: 'Apr/2026', app: 'DASHCAM', activeAtStart: 76, addedDuringMonth: 8, deletedDuringMonth: 0, serverStatus: 'Online', locked: true },
    { id: 5, customer: 'Sterling Transport', monthYear: 'Apr/2026', app: 'ELD', activeAtStart: 31, addedDuringMonth: 1, deletedDuringMonth: 4, serverStatus: 'Offline', locked: false },
    { id: 6, customer: 'Globe Fleet Inc.', monthYear: 'Mar/2026', app: 'GPS', activeAtStart: 89, addedDuringMonth: 5, deletedDuringMonth: 2, serverStatus: 'Online', locked: true },
  ];

  trendData: MonthlyTrend[] = [
    { month: 'May', active: 78, activated: 5, deactivated: 3, cumulativeDeactivated: 12, serverStatus: 'Online' },
    { month: 'Jun', active: 81, activated: 7, deactivated: 4, cumulativeDeactivated: 16, serverStatus: 'Online' },
    { month: 'Jul', active: 88, activated: 9, deactivated: 2, cumulativeDeactivated: 18, serverStatus: 'Online' },
    { month: 'Aug', active: 91, activated: 8, deactivated: 5, cumulativeDeactivated: 23, serverStatus: 'Warning' },
    { month: 'Sep', active: 96, activated: 9, deactivated: 4, cumulativeDeactivated: 27, serverStatus: 'Online' },
    { month: 'Oct', active: 102, activated: 12, deactivated: 6, cumulativeDeactivated: 33, serverStatus: 'Online' },
    { month: 'Nov', active: 108, activated: 9, deactivated: 3, cumulativeDeactivated: 36, serverStatus: 'Online' },
    { month: 'Dec', active: 111, activated: 5, deactivated: 2, cumulativeDeactivated: 38, serverStatus: 'Online' },
    { month: 'Jan', active: 115, activated: 8, deactivated: 4, cumulativeDeactivated: 42, serverStatus: 'Warning' },
    { month: 'Feb', active: 120, activated: 8, deactivated: 3, cumulativeDeactivated: 45, serverStatus: 'Online' },
    { month: 'Mar', active: 125, activated: 10, deactivated: 5, cumulativeDeactivated: 50, serverStatus: 'Online' },
    { month: 'Apr', active: 127, activated: 4, deactivated: 2, cumulativeDeactivated: 52, serverStatus: 'Online' },
  ];

  artifacts: any[] = [];
  showContextMenu = false;
  menuX = 0;
  menuY = 0;
  contextApp: any = null;

  showTransferModal = false;
  transferFromCustomer = '';
  transferToCustomer = '';
  transferPreview: { apps: number; activeUnits: number; added: number; deleted: number } | null = null;

  layout = inject(LayoutService);

  constructor(private router: Router, private http: HttpClient) { }

  ngOnInit() {
    this.loadArtifacts();
    // Sync with global category selection
    this.selectedAppType = this.layout.selectedApp();
  }

  loadArtifacts() {
    this.http.get<any[]>(`${API_BASE_URL}/api/apps.php`).subscribe(data => {
      this.artifacts = data || [];
    });
  }

  enterDetails(type: any, record: CustomerAppSummary | null = null) {
    this.selectedAppType = type;
    this.viewMode = 'details';
    if (record) {
      this.showTrend(record);
    }
  }

  get customerDashboardRows(): CustomerAppSummary[] {
    if (!this.viewOnlyCustomer) return [];
    return this.summaries.filter(item => item.customer === this.viewOnlyCustomer?.customer && item.monthYear === this.viewOnlyCustomer?.monthYear);
  }

  get filteredSummaries(): CustomerAppSummary[] {
    const q = this.search.toLowerCase().trim();
    return this.summaries.filter(row =>
      row.monthYear === this.selectedMonth &&
      (this.selectedAppType === 'ALL' || row.app === this.selectedAppType) &&
      (!q || row.customer.toLowerCase().includes(q) || row.app.toLowerCase().includes(q) || row.serverStatus.toLowerCase().includes(q))
    );
  }

  get summaryCards() {
    const rows = this.summaries.filter(r => 
      r.monthYear === this.selectedMonth && 
      (this.selectedAppType === 'ALL' || r.app === this.selectedAppType)
    );
    const active = rows.reduce((sum, row) => sum + row.activeAtStart, 0);
    const added = rows.reduce((sum, row) => sum + row.addedDuringMonth, 0);
    const deleted = rows.reduce((sum, row) => sum + row.deletedDuringMonth, 0);
    const issues = rows.filter(row => row.serverStatus !== 'Online').length;
    return [
      { label: 'Active Devices', value: active.toLocaleString(), badge: 'Start Month', icon: 'devices', bg: 'bg-blue-50 dark:bg-blue-900/20', color: 'text-blue-600', badgeClass: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' },
      { label: 'Apps Added', value: added.toLocaleString(), badge: 'Running Sum', icon: 'add_circle', bg: 'bg-emerald-50 dark:bg-emerald-900/20', color: 'text-emerald-600', badgeClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' },
      { label: 'Apps Deleted', value: deleted.toLocaleString(), badge: 'Running Sum', icon: 'remove_circle', bg: 'bg-red-50 dark:bg-red-900/20', color: 'text-red-500', badgeClass: 'bg-red-50 text-red-500 dark:bg-red-900/20' },
      { label: 'Server Issues', value: issues.toLocaleString(), badge: 'Status', icon: 'dns', bg: 'bg-amber-50 dark:bg-amber-900/20', color: 'text-amber-600', badgeClass: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' },
    ];
  }

  get appBlocks() {
    // Strictly show ONLY the selected app type if not 'ALL'
    const typesToDisplay = this.selectedAppType === 'ALL' 
      ? this.appTypes 
      : [this.selectedAppType];

    return typesToDisplay.map(type => {
      const rows = this.summaries.filter(r => r.monthYear === this.selectedMonth && r.app === type);
      const count = rows.reduce((sum, r) => sum + r.activeAtStart, 0);
      const offline = rows.filter(r => r.serverStatus === 'Offline').length;

      const appStyles = {
        ELD: { bg: 'bg-blue-50', color: 'text-blue-600', dotColor: 'bg-blue-500' },
        GPS: { bg: 'bg-emerald-50', color: 'text-emerald-600', dotColor: 'bg-emerald-500' },
        REEFER: { bg: 'bg-cyan-50', color: 'text-cyan-600', dotColor: 'bg-cyan-500' },
        DASHCAM: { bg: 'bg-violet-50', color: 'text-violet-600', dotColor: 'bg-violet-500' },
      };

      return {
        name: type,
        count: count,
        status: offline > 0 ? `${offline} OFFLINE` : 'HEALTHY',
        ...appStyles[type]
      };
    });
  }

  get maxTrendValue(): number {
    return Math.max(...this.trendData.flatMap(item => [item.active, item.activated, item.deactivated, item.cumulativeDeactivated]), 1);
  }

  get latestTrend(): MonthlyTrend | null {
    return this.trendData.length ? this.trendData[this.trendData.length - 1] : null;
  }

  get firstTrend(): MonthlyTrend | null {
    return this.trendData.length ? this.trendData[0] : null;
  }

  get trendGrowth(): number {
    return (this.latestTrend?.active || 0) - (this.firstTrend?.active || 0);
  }

  getTrendMonthYear(month: string): string {
    return `${month}/2026`;
  }

  getTrendWidth(value: number, max: number): number {
    return Math.max(4, Math.round((value / max) * 100));
  }

  getTrendBarHeight(value: number): number {
    return Math.max(3, Math.round((value / this.maxTrendValue) * 100));
  }

  getAppClass(app: CustomerAppSummary['app']): string {
    const map = {
      ELD: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      GPS: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
      REEFER: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
      DASHCAM: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400',
    };
    return map[app];
  }

  getServerClass(status: CustomerAppSummary['serverStatus']): string {
    if (status === 'Online') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400';
    if (status === 'Warning') return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
    return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400';
  }

  getServerDotClass(status: CustomerAppSummary['serverStatus']): string {
    if (status === 'Online') return 'bg-emerald-500 animate-pulse';
    if (status === 'Warning') return 'bg-amber-500';
    return 'bg-red-500';
  }

  generateCompanyId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  createCustomer() {
    this.generatedCompanyId = this.generateCompanyId();
    this.newCustomer = {
      customer: '',
      dotNumber: '',
      app: 'ELD',
      complianceMode: '',
      locked: true
    };
    this.showAddModal = true;
  }

  saveCustomer() {
    if (!this.newCustomer.customer.trim()) {
      alert('Please enter a company name.');
      return;
    }
    const nextId = Math.max(...this.summaries.map(item => item.id), 0) + 1;
    this.summaries = [
      ...this.summaries,
      {
        id: nextId,
        companyId: this.generatedCompanyId,
        customer: this.newCustomer.customer.trim(),
        monthYear: this.selectedMonth,
        app: this.newCustomer.app,
        activeAtStart: 0,
        addedDuringMonth: 0,
        deletedDuringMonth: 0,
        serverStatus: 'Online',
        locked: this.newCustomer.locked
      }
    ];
    this.showAddModal = false;
  }

  editCustomer(row: CustomerAppSummary) {
    if (row.locked && !confirm('Safety lock is enabled. Do you want to continue editing this customer summary?')) return;
    const updatedName = prompt('Update customer name', row.customer);
    if (!updatedName?.trim()) return;
    this.summaries = this.summaries.map(item => item.id === row.id ? { ...item, customer: updatedName.trim() } : item);
  }

  removeCustomer(row: CustomerAppSummary) {
    if (row.locked) {
      alert('This customer is safety locked. Unlock/approve it before removal.');
      return;
    }
    if (!confirm(`Remove ${row.customer} ${row.app} summary?`)) return;
    this.summaries = this.summaries.filter(item => item.id !== row.id);
  }

  showTrend(row: CustomerAppSummary) {
    this.selectedTrend = row;
    setTimeout(() => {
      document.querySelector('.bg-white.dark\\:bg-slate-900.rounded-2xl.border.border-primary\\/10.shadow-sm.overflow-hidden:last-of-type')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  openViewOnlyDashboard(row: CustomerAppSummary) {
    this.previousViewMode = this.viewMode === 'details' ? 'details' : 'summary';
    this.viewOnlyCustomer = row;
    this.viewMode = 'customerDashboard';
    this.selectedTrend = null;
  }

  closeViewOnlyDashboard() {
    this.viewOnlyCustomer = null;
    this.viewMode = this.previousViewMode;
  }

  onAppContextMenu(event: MouseEvent, row: CustomerAppSummary) {
    event.preventDefault();
    const realApp = this.artifacts.find(a =>
      a.company.toLowerCase().includes(row.customer.toLowerCase()) &&
      (row.app === 'ELD' ? a.app_name.includes('ELD') : true)
    );

    if (realApp) {
      this.contextApp = realApp;
      this.menuX = event.clientX;
      this.menuY = event.clientY;
      this.showContextMenu = true;
    } else {
      alert(`No repository artifact found for ${row.customer} - ${row.app}`);
    }
  }

  @HostListener('document:click')
  closeContextMenu() {
    this.showContextMenu = false;
  }

  triggerStoreUpload(app: any) {
    if (!app) return;
    const storeName = app.platform === 'Android' ? 'Google Play Store' : 'Apple Store';
    if (confirm(`Upload ${app.app_name} v${app.app_version} to ${storeName}?\n\nThis will trigger an OTA update signal.`)) {
      this.http.get<any>(`${API_BASE_URL}/api/apps.php?cmd=store_upload&id=${app.id}`).subscribe({
        next: () => alert(`Done: Upload initiated for ${app.company}!`),
        error: () => alert("Upload trigger failed.")
      });
    }
    this.showContextMenu = false;
  }

  get uniqueCustomers(): string[] {
    return Array.from(new Set(this.summaries.map(item => item.customer))).sort();
  }

  get canSubmitTransfer(): boolean {
    return !!this.transferFromCustomer && !!this.transferToCustomer && this.transferFromCustomer !== this.transferToCustomer;
  }

  openTransferModal() {
    this.transferFromCustomer = '';
    this.transferToCustomer = '';
    this.transferPreview = null;
    this.showTransferModal = true;
  }

  closeTransferModal() {
    this.showTransferModal = false;
    this.transferFromCustomer = '';
    this.transferToCustomer = '';
    this.transferPreview = null;
  }

  buildTransferPreview() {
    if (!this.transferFromCustomer) {
      this.transferPreview = null;
      return;
    }

    const rows = this.summaries.filter(item => item.customer === this.transferFromCustomer);
    this.transferPreview = {
      apps: rows.length,
      activeUnits: rows.reduce((sum, item) => sum + item.activeAtStart, 0),
      added: rows.reduce((sum, item) => sum + item.addedDuringMonth, 0),
      deleted: rows.reduce((sum, item) => sum + item.deletedDuringMonth, 0),
    };
  }

  submitDummyTransfer() {
    if (!this.canSubmitTransfer) {
      alert('Please select different source and target companies.');
      return;
    }

    alert(`Transfer request prepared:
${this.transferFromCustomer} -> ${this.transferToCustomer}

Status: Dummy only. Backend API will be connected later.`);
    this.closeTransferModal();
  }

  exportReport() { 
    alert('Exporting customer dashboard summary...'); 
  }
  
  drillDown(kpi: any) { 
    alert(`${kpi.label}: ${kpi.value}`); 
  }
}
