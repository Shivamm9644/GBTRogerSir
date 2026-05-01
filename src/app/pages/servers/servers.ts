import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type ServerStatus = 'Active' | 'Warning' | 'Critical' | 'Offline' | 'Deactivated';
type ServerActionMode = 'create' | 'maintenance' | 'transfer' | 'download' | 'deactivate' | 'threshold' | 'alarm' | null;

interface ServerThresholds {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface ServerNotificationSetting {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  webhook: boolean;
  recipients: string;
}

interface CustomerServer {
  id: number;
  customer: string;
  serverName: string;
  ip: string;
  region: string;
  plan: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: string;
  alerts: number;
  status: ServerStatus;
  lastBackup: string;
  os: string;
  database: string;
  storage: string;
  bandwidth: string;
  requests: string;
  responseTime: string;
  thresholds: ServerThresholds;
  notifications: ServerNotificationSetting;
}

@Component({
  selector: 'app-servers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="min-h-screen bg-slate-50 dark:bg-[#0B1220] p-6 lg:p-8 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between gap-4">
    <div>
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3"><span class="material-symbols-outlined text-[16px]">dns</span> SERVER CONTROL CENTER</div>
      <h2 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Customer Server Management</h2>
      <p class="text-slate-500">Monitor each customer server, review health parameters, run maintenance, transfer content, configure thresholds, and manage alarm notifications.</p>
    </div>
    <div class="flex gap-3">
      <button (click)="openCreateServer()" class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary/90 shadow-lg shadow-primary/20">
        <span class="material-symbols-outlined text-[18px]">add</span>Create Server
      </button>
      <button (click)="openDefaultThresholds()" class="px-4 py-2 text-sm font-semibold border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors">
        Default Thresholds
      </button>
    </div>
  </div>

  <!-- KPI Cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
    @for (kpi of kpis; track kpi.label) {
      <div class="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <p class="text-3xl font-bold text-slate-800 dark:text-white">{{ kpi.value }}</p>
        <p class="text-slate-500 text-sm mt-1">{{ kpi.label }}</p>
      </div>
    }
  </div>


  <!-- Server Health Summary -->
  <div class="grid grid-cols-1 gap-5">
    <div class="lg:col-span-2 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h4 class="font-bold text-slate-900 dark:text-white">Live Server Health Overview</h4>
          <p class="text-xs text-slate-400">Dummy performance view now. Backend metrics API can feed this later.</p>
        </div>
        <span class="px-3 py-1 rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 text-xs font-bold">Auto refresh ready</span>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        @for (item of healthSummary; track item.label) {
          <div class="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-100 dark:border-slate-700">
            <p class="text-xs text-slate-400">{{ item.label }}</p>
            <p class="text-xl font-black mt-1 text-slate-900 dark:text-white">{{ item.value }}</p>
            <p [class]="'text-[11px] font-semibold mt-1 ' + item.className">{{ item.note }}</p>
          </div>
        }
      </div>
    </div>
    <!-- <div class="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
      <h4 class="font-bold text-slate-900 dark:text-white mb-3">Quick Actions</h4>
      <div class="grid grid-cols-2 gap-3">
        <button (click)="openCreateServer()" class="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-left hover:border-primary hover:bg-primary/5 transition-colors">
          <span class="material-symbols-outlined text-primary">add_circle</span>
          <p class="text-xs font-bold mt-1">Create</p>
        </button>
        <button (click)="openDefaultThresholds()" class="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-left hover:border-primary hover:bg-primary/5 transition-colors">
          <span class="material-symbols-outlined text-primary">tune</span>
          <p class="text-xs font-bold mt-1">Thresholds</p>
        </button>
      </div>
    </div> -->
  </div>

  <!-- SERVER TABLE -->
  <div class="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
    <div class="px-6 py-4 border-b border-primary/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h4 class="font-bold text-slate-800 dark:text-white">Customer Server Details</h4>
        <p class="text-xs text-slate-400">Every row shows customer, server, health, alarms, and status. Click a row to open full performance details and available server actions.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        @for (f of filters; track f) {
          <button (click)="activeFilter = f" [class]="activeFilter === f ? 'px-3 py-1 rounded-full text-xs font-bold bg-primary text-white' : 'px-3 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-500'">{{ f }}</button>
        }
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            <th class="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Customer</th>
            <th class="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Server</th>
            <th class="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Key Performance Parameters</th>
            <th class="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Region</th>
            <th class="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Uptime</th>
            <th class="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Alarms</th>
            <th class="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
            <th class="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          @for (server of filteredServers; track server.id) {
            <tr (click)="selectCustomerServer(server)" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group transition-colors">
              <td class="px-6 py-4">
                <p class="text-sm font-semibold group-hover:text-primary transition-colors">{{ server.customer }}</p>
                <p class="text-[10px] text-slate-400">Click to view full server performance</p>
              </td>
              <td class="px-6 py-4">
                <p class="text-sm font-semibold text-slate-800 dark:text-white">{{ server.serverName }}</p>
                <p class="text-[10px] text-slate-400">{{ server.ip }} · {{ server.plan }}</p>
              </td>
              <td class="px-6 py-4 min-w-[340px]">
                <div class="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div class="flex justify-between mb-1"><span class="text-slate-500">CPU</span><b>{{ server.cpu }}%</b></div>
                    <div class="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"><div [class]="getMetricBarClass(server.cpu)" [style.width]="server.cpu + '%'"></div></div>
                  </div>
                  <div>
                    <div class="flex justify-between mb-1"><span class="text-slate-500">Memory</span><b>{{ server.memory }}%</b></div>
                    <div class="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"><div [class]="getMetricBarClass(server.memory)" [style.width]="server.memory + '%'"></div></div>
                  </div>
                  <div>
                    <div class="flex justify-between mb-1"><span class="text-slate-500">Disk</span><b>{{ server.disk }}%</b></div>
                    <div class="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"><div [class]="getMetricBarClass(server.disk)" [style.width]="server.disk + '%'"></div></div>
                  </div>
                  <div>
                    <div class="flex justify-between mb-1"><span class="text-slate-500">Network</span><b>{{ server.network }}%</b></div>
                    <div class="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"><div [class]="getMetricBarClass(server.network)" [style.width]="server.network + '%'"></div></div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-500">{{ server.region }}</td>
              <td class="px-6 py-4 text-sm text-slate-500">{{ server.uptime }}</td>
              <td class="px-6 py-4">
                @if (server.alerts > 0) {
                  <span class="px-2 py-1 text-[10px] font-bold bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-full">{{ server.alerts }} alarm{{ server.alerts > 1 ? 's' : '' }}</span>
                } @else {
                  <span class="text-xs text-slate-400">None</span>
                }
              </td>
              <td class="px-6 py-4"><span [class]="'px-2 py-1 text-[10px] font-bold rounded-full ' + getStatusClass(server.status)">{{ server.status }}</span></td>
              <td class="px-6 py-4">
                <div class="flex gap-1" (click)="$event.stopPropagation()">
                  <button (click)="openMaintenance(server)" class="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg" title="Maintenance"><span class="material-symbols-outlined text-[18px]">settings</span></button>
                  <button (click)="openTransfer(server)" class="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Transfer"><span class="material-symbols-outlined text-[18px]">swap_horiz</span></button>
                  <button (click)="openDownload(server)" class="p-1.5 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-lg" title="Download"><span class="material-symbols-outlined text-[18px]">download</span></button>
                  <button (click)="openDeactivate(server)" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Delete / Deactivate"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  </div>

  <!-- CUSTOMER SERVER DETAIL -->
  @if (selectedServer) {
    <div class="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-primary/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h4 class="font-bold text-slate-800 dark:text-white">Comprehensive Server Performance: {{ selectedServer.customer }}</h4>
          <p class="text-xs text-slate-400">{{ selectedServer.serverName }} · {{ selectedServer.ip }} · {{ selectedServer.region }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button (click)="openMaintenance(selectedServer)" class="px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold">Server Maintenance</button>
          <button (click)="openTransfer(selectedServer)" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold">Transfer Server</button>
          <button (click)="openDownload(selectedServer)" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold">Download Content</button>
          <button (click)="openServerThreshold(selectedServer)" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold">Thresholds</button>
          <button (click)="openAlarmNotifications(selectedServer)" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold">Alarm Notifications</button>
          <button (click)="selectedServer = null" class="px-3 py-2 rounded-lg text-slate-500 text-xs font-bold">Close</button>
        </div>
      </div>

      <div class="p-6 grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div class="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
          <p class="text-xs text-slate-400">CPU Utilization</p>
          <p class="text-2xl font-bold">{{ selectedServer.cpu }}%</p>
          <div class="mt-3 h-2 bg-slate-100 rounded-full"><div class="h-2 rounded-full bg-primary" [style.width]="selectedServer.cpu + '%'"></div></div>
        </div>
        <div class="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
          <p class="text-xs text-slate-400">Memory Usage</p>
          <p class="text-2xl font-bold">{{ selectedServer.memory }}%</p>
          <div class="mt-3 h-2 bg-slate-100 rounded-full"><div class="h-2 rounded-full bg-green-500" [style.width]="selectedServer.memory + '%'"></div></div>
        </div>
        <div class="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
          <p class="text-xs text-slate-400">Disk Usage</p>
          <p class="text-2xl font-bold">{{ selectedServer.disk }}%</p>
          <div class="mt-3 h-2 bg-slate-100 rounded-full"><div class="h-2 rounded-full bg-orange-400" [style.width]="selectedServer.disk + '%'"></div></div>
        </div>
        <div class="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
          <p class="text-xs text-slate-400">Network Load</p>
          <p class="text-2xl font-bold">{{ selectedServer.network }}%</p>
          <div class="mt-3 h-2 bg-slate-100 rounded-full"><div class="h-2 rounded-full bg-purple-500" [style.width]="selectedServer.network + '%'"></div></div>
        </div>
      </div>

      <div class="px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="rounded-xl border border-slate-100 dark:border-slate-800 p-5">
          <h5 class="font-bold mb-4">Server Information</h5>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <p class="text-slate-500">Operating System</p><p class="font-semibold">{{ selectedServer.os }}</p>
            <p class="text-slate-500">Database</p><p class="font-semibold">{{ selectedServer.database }}</p>
            <p class="text-slate-500">Storage</p><p class="font-semibold">{{ selectedServer.storage }}</p>
            <p class="text-slate-500">Bandwidth</p><p class="font-semibold">{{ selectedServer.bandwidth }}</p>
            <p class="text-slate-500">Requests</p><p class="font-semibold">{{ selectedServer.requests }}</p>
            <p class="text-slate-500">Response Time</p><p class="font-semibold">{{ selectedServer.responseTime }}</p>
            <p class="text-slate-500">Last Backup</p><p class="font-semibold">{{ selectedServer.lastBackup }}</p>
          </div>
        </div>
        <div class="rounded-xl border border-slate-100 dark:border-slate-800 p-5">
          <h5 class="font-bold mb-4">Current Thresholds</h5>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <p class="text-slate-500">CPU Threshold</p><p class="font-semibold">{{ selectedServer.thresholds.cpu }}%</p>
            <p class="text-slate-500">Memory Threshold</p><p class="font-semibold">{{ selectedServer.thresholds.memory }}%</p>
            <p class="text-slate-500">Disk Threshold</p><p class="font-semibold">{{ selectedServer.thresholds.disk }}%</p>
            <p class="text-slate-500">Network Threshold</p><p class="font-semibold">{{ selectedServer.thresholds.network }}%</p>
          </div>
          <div class="mt-4 rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-500">
            Alarm notifications enabled: Email {{ selectedServer.notifications.email ? 'ON' : 'OFF' }}, SMS {{ selectedServer.notifications.sms ? 'ON' : 'OFF' }}, WhatsApp {{ selectedServer.notifications.whatsapp ? 'ON' : 'OFF' }}, Webhook {{ selectedServer.notifications.webhook ? 'ON' : 'OFF' }}
          </div>
        </div>
      </div>
    </div>
  }

  <!-- ACTION MODAL -->
  @if (actionMode) {
    <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-primary/10">
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ actionTitle }}</h3>
            <p class="text-xs text-slate-400">Dummy UI now. Backend API can be connected later.</p>
          </div>
          <button (click)="closeAction()" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><span class="material-symbols-outlined">close</span></button>
        </div>

        <div class="p-6 space-y-5">
          @if (actionMode === 'create') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="text-sm font-semibold">Customer
                <input [(ngModel)]="createForm.customer" class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" placeholder="Customer name">
              </label>
              <label class="text-sm font-semibold">Server Name
                <input [(ngModel)]="createForm.serverName" class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" placeholder="prod-us-east-02">
              </label>
              <label class="text-sm font-semibold">Region
                <input [(ngModel)]="createForm.region" class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" placeholder="N. Virginia">
              </label>
              <label class="text-sm font-semibold">Plan / Resources
                <select [(ngModel)]="createForm.plan" class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent">
                  <option>2 vCPU / 4 GB RAM</option>
                  <option>4 vCPU / 8 GB RAM</option>
                  <option>8 vCPU / 16 GB RAM</option>
                  <option>16 vCPU / 32 GB RAM</option>
                </select>
              </label>
            </div>
          }

          @if (actionMode === 'maintenance') {
            <div class="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-sm">
              <b>{{ activeServer?.customer }}</b> · {{ activeServer?.serverName }} · Current Plan: {{ activeServer?.plan }}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="text-sm font-semibold">CPU Cores
                <select [(ngModel)]="maintenanceForm.cpu" class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent">
                  <option>2 vCPU</option><option>4 vCPU</option><option>8 vCPU</option><option>16 vCPU</option>
                </select>
              </label>
              <label class="text-sm font-semibold">RAM
                <select [(ngModel)]="maintenanceForm.ram" class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent">
                  <option>4 GB</option><option>8 GB</option><option>16 GB</option><option>32 GB</option>
                </select>
              </label>
              <label class="text-sm font-semibold">Storage
                <select [(ngModel)]="maintenanceForm.storage" class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent">
                  <option>100 GB SSD</option><option>250 GB SSD</option><option>500 GB SSD</option><option>1 TB SSD</option>
                </select>
              </label>
              <label class="text-sm font-semibold">Maintenance Window
                <input [(ngModel)]="maintenanceForm.window" class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" placeholder="Sunday 02:00 AM">
              </label>
            </div>
          }

          @if (actionMode === 'transfer') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="text-sm font-semibold">From Server
                <input [ngModel]="activeServer?.serverName" readonly class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              </label>
              <label class="text-sm font-semibold">Transfer To Server
                <select [(ngModel)]="transferForm.toServerId" class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent">
                  @for (server of servers; track server.id) {
                    @if (server.id !== activeServer?.id) {
                      <option [ngValue]="server.id">{{ server.customer }} · {{ server.serverName }}</option>
                    }
                  }
                </select>
              </label>
            </div>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="transferForm.includeContent"> Include server content</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="transferForm.includeDatabase"> Include database</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="transferForm.includeBackups"> Include backups</label>
          }

          @if (actionMode === 'download') {
            <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <p class="font-semibold">Download server content to local server</p>
              <p class="text-sm text-slate-500 mt-1">This will prepare a downloadable package for files, database dump, logs, and backup metadata.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="downloadForm.files"> Application files</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="downloadForm.database"> Database dump</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="downloadForm.logs"> Server logs</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="downloadForm.backups"> Backups</label>
            </div>
          }

          @if (actionMode === 'deactivate') {
            <div class="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300">
              Delete/deactivate server action for {{ activeServer?.customer }} · {{ activeServer?.serverName }}. For safety, this dummy UI marks the server as Deactivated only.
            </div>
            <label class="text-sm font-semibold">Reason
              <textarea [(ngModel)]="deactivateForm.reason" rows="3" class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" placeholder="Enter reason"></textarea>
            </label>
          }

          @if (actionMode === 'threshold') {
            <div class="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-sm">
              {{ thresholdForm.applyToAll ? 'Apply default thresholds to all servers' : 'Set thresholds for selected server only' }}
            </div>
            <label class="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" [(ngModel)]="thresholdForm.applyToAll"> Apply to all servers as default</label>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <label class="text-sm font-semibold">CPU %
                <input type="number" [(ngModel)]="thresholdForm.cpu" class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent">
              </label>
              <label class="text-sm font-semibold">Memory %
                <input type="number" [(ngModel)]="thresholdForm.memory" class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent">
              </label>
              <label class="text-sm font-semibold">Disk %
                <input type="number" [(ngModel)]="thresholdForm.disk" class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent">
              </label>
              <label class="text-sm font-semibold">Network %
                <input type="number" [(ngModel)]="thresholdForm.network" class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent">
              </label>
            </div>
          }

          @if (actionMode === 'alarm') {
            <div class="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-sm">
              Configure server alarm notification channels for {{ activeServer?.customer }}.
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="notificationForm.email"> Email alerts</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="notificationForm.sms"> SMS alerts</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="notificationForm.whatsapp"> WhatsApp alerts</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="notificationForm.webhook"> Webhook alerts</label>
            </div>
            <label class="text-sm font-semibold">Recipients / Webhook URL
              <textarea [(ngModel)]="notificationForm.recipients" rows="3" class="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" placeholder="admin@example.com, +91xxxxxxxxxx, webhook url"></textarea>
            </label>
          }
        </div>

        <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button (click)="closeAction()" class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold">Cancel</button>
          <button (click)="submitAction()" class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">Save / Continue</button>
        </div>
      </div>
    </div>
  }
</div>
`
})
export class ServersComponent {
  activeFilter: 'All' | ServerStatus = 'All';
  filters: Array<'All' | ServerStatus> = ['All', 'Active', 'Warning', 'Critical', 'Offline', 'Deactivated'];

  selectedServer: CustomerServer | null = null;
  activeServer: CustomerServer | null = null;
  actionMode: ServerActionMode = null;

  defaultThresholds: ServerThresholds = { cpu: 85, memory: 85, disk: 90, network: 80 };

  kpis = [
    { label: 'Total Servers', value: '128' },
    { label: 'Active Alarms', value: '3' },
    { label: 'Avg. CPU Load', value: '42.4%' },
    { label: 'System Uptime', value: '99.98%' },
  ];

  healthSummary = [
    { label: 'Healthy Servers', value: '2', note: 'No active alarms', className: 'text-green-600 dark:text-green-400' },
    { label: 'Warning Servers', value: '1', note: 'Needs review', className: 'text-yellow-600 dark:text-yellow-400' },
    { label: 'Critical Servers', value: '1', note: 'Immediate action', className: 'text-red-600 dark:text-red-400' },
    { label: 'Offline Servers', value: '1', note: 'Backup node offline', className: 'text-slate-500 dark:text-slate-400' },
  ];

  servers: CustomerServer[] = [
    {
      id: 1,
      customer: 'Customer A',
      serverName: 'prod-us-east-01',
      ip: '10.0.1.1',
      region: 'N. Virginia',
      plan: '4 vCPU / 8 GB RAM',
      cpu: 32,
      memory: 54,
      disk: 45,
      network: 36,
      uptime: '99.9%',
      alerts: 0,
      status: 'Active',
      lastBackup: 'Today 02:10 AM',
      os: 'Ubuntu 22.04 LTS',
      database: 'MySQL 8.0',
      storage: '250 GB SSD',
      bandwidth: '1.2 TB / month',
      requests: '1.8M / day',
      responseTime: '82 ms',
      thresholds: { cpu: 85, memory: 85, disk: 90, network: 80 },
      notifications: { email: true, sms: false, whatsapp: true, webhook: false, recipients: 'ops@customera.com' },
    },
    {
      id: 2,
      customer: 'Customer B',
      serverName: 'prod-eu-west-01',
      ip: '10.0.2.1',
      region: 'Ireland',
      plan: '8 vCPU / 16 GB RAM',
      cpu: 78,
      memory: 82,
      disk: 60,
      network: 58,
      uptime: '99.1%',
      alerts: 1,
      status: 'Warning',
      lastBackup: 'Yesterday 01:30 AM',
      os: 'Ubuntu 22.04 LTS',
      database: 'PostgreSQL 15',
      storage: '500 GB SSD',
      bandwidth: '2.7 TB / month',
      requests: '2.3M / day',
      responseTime: '128 ms',
      thresholds: { cpu: 80, memory: 80, disk: 88, network: 75 },
      notifications: { email: true, sms: true, whatsapp: false, webhook: false, recipients: 'admin@customerb.com' },
    },
    {
      id: 3,
      customer: 'Customer C',
      serverName: 'prod-ap-sgp-01',
      ip: '10.0.3.1',
      region: 'Singapore',
      plan: '16 vCPU / 32 GB RAM',
      cpu: 95,
      memory: 91,
      disk: 85,
      network: 72,
      uptime: '97.3%',
      alerts: 2,
      status: 'Critical',
      lastBackup: '2 days ago',
      os: 'Amazon Linux 2023',
      database: 'MySQL 8.0',
      storage: '1 TB SSD',
      bandwidth: '4.1 TB / month',
      requests: '4.9M / day',
      responseTime: '210 ms',
      thresholds: { cpu: 85, memory: 85, disk: 90, network: 80 },
      notifications: { email: true, sms: true, whatsapp: true, webhook: true, recipients: 'noc@customerc.com' },
    },
    {
      id: 4,
      customer: 'Customer D',
      serverName: 'stg-us-east-01',
      ip: '10.0.4.1',
      region: 'N. Virginia',
      plan: '2 vCPU / 4 GB RAM',
      cpu: 15,
      memory: 28,
      disk: 22,
      network: 18,
      uptime: '100%',
      alerts: 0,
      status: 'Active',
      lastBackup: 'Today 04:10 AM',
      os: 'Ubuntu 20.04 LTS',
      database: 'MariaDB 10.6',
      storage: '100 GB SSD',
      bandwidth: '210 GB / month',
      requests: '120K / day',
      responseTime: '55 ms',
      thresholds: { cpu: 85, memory: 85, disk: 90, network: 80 },
      notifications: { email: true, sms: false, whatsapp: false, webhook: false, recipients: 'devops@customerd.com' },
    },
    {
      id: 5,
      customer: 'Customer E',
      serverName: 'backup-us-west-01',
      ip: '10.0.5.1',
      region: 'Oregon',
      plan: '4 vCPU / 8 GB RAM',
      cpu: 0,
      memory: 0,
      disk: 38,
      network: 0,
      uptime: '0%',
      alerts: 0,
      status: 'Offline',
      lastBackup: '5 days ago',
      os: 'Ubuntu 22.04 LTS',
      database: 'Backup Node',
      storage: '500 GB SSD',
      bandwidth: '0 GB / month',
      requests: '0 / day',
      responseTime: 'N/A',
      thresholds: { cpu: 85, memory: 85, disk: 90, network: 80 },
      notifications: { email: true, sms: false, whatsapp: true, webhook: false, recipients: 'backup@customere.com' },
    },
  ];

  createForm = {
    customer: '',
    serverName: '',
    region: 'N. Virginia',
    plan: '4 vCPU / 8 GB RAM',
  };

  maintenanceForm = {
    cpu: '4 vCPU',
    ram: '8 GB',
    storage: '250 GB SSD',
    window: 'Sunday 02:00 AM',
  };

  transferForm = {
    toServerId: 2,
    includeContent: true,
    includeDatabase: true,
    includeBackups: true,
  };

  downloadForm = {
    files: true,
    database: true,
    logs: true,
    backups: true,
  };

  deactivateForm = {
    reason: '',
  };

  thresholdForm = {
    applyToAll: false,
    cpu: 85,
    memory: 85,
    disk: 90,
    network: 80,
  };

  notificationForm: ServerNotificationSetting = {
    email: true,
    sms: false,
    whatsapp: false,
    webhook: false,
    recipients: '',
  };

  get filteredServers(): CustomerServer[] {
    if (this.activeFilter === 'All') return this.servers;
    return this.servers.filter(s => s.status === this.activeFilter);
  }

  get actionTitle(): string {
    const titles: Record<Exclude<ServerActionMode, null>, string> = {
      create: 'Create Server',
      maintenance: 'Server Maintenance / Change Resources',
      transfer: 'Transfer Server to Another Server',
      download: 'Download Server Content to Local Server',
      deactivate: 'Delete / Deactivate Server',
      threshold: 'Set Server Performance Thresholds',
      alarm: 'Server Alarm Notifications',
    };
    return this.actionMode ? titles[this.actionMode] : '';
  }

  selectCustomerServer(server: CustomerServer): void {
    this.selectedServer = server;
  }

  openCreateServer(): void {
    this.actionMode = 'create';
    this.activeServer = null;
    this.createForm = { customer: '', serverName: '', region: 'N. Virginia', plan: '4 vCPU / 8 GB RAM' };
  }

  openMaintenance(server: CustomerServer): void {
    this.activeServer = server;
    this.actionMode = 'maintenance';
    const [cpuPart, ramPart] = server.plan.split('/').map(x => x.trim());
    this.maintenanceForm = {
      cpu: cpuPart || '4 vCPU',
      ram: ramPart || '8 GB RAM',
      storage: server.storage,
      window: 'Sunday 02:00 AM',
    };
  }

  openTransfer(server: CustomerServer): void {
    this.activeServer = server;
    this.actionMode = 'transfer';
    this.transferForm = {
      toServerId: this.servers.find(s => s.id !== server.id)?.id || server.id,
      includeContent: true,
      includeDatabase: true,
      includeBackups: true,
    };
  }

  openDownload(server: CustomerServer): void {
    this.activeServer = server;
    this.actionMode = 'download';
  }

  openDeactivate(server: CustomerServer): void {
    this.activeServer = server;
    this.actionMode = 'deactivate';
    this.deactivateForm.reason = '';
  }

  openServerThreshold(server: CustomerServer): void {
    this.activeServer = server;
    this.actionMode = 'threshold';
    this.thresholdForm = {
      applyToAll: false,
      cpu: server.thresholds.cpu,
      memory: server.thresholds.memory,
      disk: server.thresholds.disk,
      network: server.thresholds.network,
    };
  }

  openDefaultThresholds(): void {
    this.activeServer = null;
    this.actionMode = 'threshold';
    this.thresholdForm = {
      applyToAll: true,
      cpu: this.defaultThresholds.cpu,
      memory: this.defaultThresholds.memory,
      disk: this.defaultThresholds.disk,
      network: this.defaultThresholds.network,
    };
  }

  openAlarmNotifications(server: CustomerServer): void {
    this.activeServer = server;
    this.actionMode = 'alarm';
    this.notificationForm = { ...server.notifications };
  }

  closeAction(): void {
    this.actionMode = null;
    this.activeServer = null;
  }

  submitAction(): void {
    // TODO: Replace each block with backend API integration when APIs are ready.
    // Example endpoints can be:
    // POST /api/servers
    // PUT /api/servers/{id}/resources
    // POST /api/servers/{id}/transfer
    // POST /api/servers/{id}/download
    // PATCH /api/servers/{id}/deactivate
    // PUT /api/servers/{id}/thresholds
    // PUT /api/servers/{id}/notifications

    if (this.actionMode === 'create') {
      const nextId = Math.max(...this.servers.map(s => s.id)) + 1;
      const newServer: CustomerServer = {
        id: nextId,
        customer: this.createForm.customer || 'New Customer',
        serverName: this.createForm.serverName || `new-server-${nextId}`,
        ip: `10.0.${nextId}.1`,
        region: this.createForm.region,
        plan: this.createForm.plan,
        cpu: 5,
        memory: 10,
        disk: 5,
        network: 3,
        uptime: '100%',
        alerts: 0,
        status: 'Active',
        lastBackup: 'Not configured',
        os: 'Ubuntu 22.04 LTS',
        database: 'MySQL 8.0',
        storage: this.createForm.plan.includes('16 GB') ? '500 GB SSD' : '250 GB SSD',
        bandwidth: '0 GB / month',
        requests: '0 / day',
        responseTime: 'N/A',
        thresholds: { ...this.defaultThresholds },
        notifications: { email: true, sms: false, whatsapp: false, webhook: false, recipients: '' },
      };
      this.servers = [newServer, ...this.servers];
      this.selectedServer = newServer;
      alert('Server created locally as dummy data. Backend API will save this later.');
    }

    if (this.actionMode === 'maintenance' && this.activeServer) {
      this.activeServer.plan = `${this.maintenanceForm.cpu} / ${this.maintenanceForm.ram}`;
      this.activeServer.storage = this.maintenanceForm.storage;
      alert('Server resources updated locally as dummy data.');
    }

    if (this.actionMode === 'transfer' && this.activeServer) {
      const target = this.servers.find(s => s.id === Number(this.transferForm.toServerId));
      alert(`Dummy transfer prepared from ${this.activeServer.serverName} to ${target?.serverName}. Backend API will perform actual transfer later.`);
    }

    if (this.actionMode === 'download' && this.activeServer) {
      alert(`Dummy download package prepared for ${this.activeServer.serverName}. Backend API will generate actual package later.`);
    }

    if (this.actionMode === 'deactivate' && this.activeServer) {
      this.activeServer.status = 'Deactivated';
      this.activeServer.alerts = 0;
      alert(`${this.activeServer.serverName} marked as Deactivated locally.`);
    }

    if (this.actionMode === 'threshold') {
      const thresholds: ServerThresholds = {
        cpu: Number(this.thresholdForm.cpu),
        memory: Number(this.thresholdForm.memory),
        disk: Number(this.thresholdForm.disk),
        network: Number(this.thresholdForm.network),
      };

      if (this.thresholdForm.applyToAll) {
        this.defaultThresholds = thresholds;
        this.servers = this.servers.map(server => ({ ...server, thresholds: { ...thresholds } }));
        alert('Default thresholds applied to all servers locally.');
      } else if (this.activeServer) {
        this.activeServer.thresholds = thresholds;
        alert('Thresholds updated for selected server locally.');
      }
    }

    if (this.actionMode === 'alarm' && this.activeServer) {
      this.activeServer.notifications = { ...this.notificationForm };
      alert('Alarm notification settings updated locally.');
    }

    this.closeAction();
  }

  getMetricBarClass(value: number, heightClass: string = 'h-1.5'): string {
    const base = `${heightClass} rounded-full transition-all duration-500`;
    if (value >= 90) return `${base} bg-red-500`;
    if (value >= 75) return `${base} bg-yellow-500`;
    return `${base} bg-green-500`;
  }

  getStatusClass(status: ServerStatus): string {
    switch (status) {
      case 'Active':
        return 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'Warning':
        return 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Critical':
        return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400';
      case 'Offline':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
      case 'Deactivated':
        return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }
}
