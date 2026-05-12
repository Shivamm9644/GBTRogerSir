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
  [key: string]: any;
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
  [key: string]: any;
}

interface MaintenanceForm {
  cpu: string;
  ram: string;
  storage: string;
  window: string;
  [key: string]: any;
}

interface ThresholdForm {
  applyToAll: boolean;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  [key: string]: any;
}

@Component({
  selector: 'app-servers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="min-h-screen bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-slate-200 font-sans selection:bg-primary/30 transition-colors duration-500">
  <!-- Background Ambient Glows (Subtle) -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none opacity-50 dark:opacity-100">
    <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
    <div class="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px]"></div>
  </div>

  <div class="relative z-10 p-6 lg:p-10 max-w-[1600px] mx-auto space-y-10">
    <!-- Header: Aligned with Dashboard -->
    <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-200 dark:border-white/5 pb-10">
      <div class="space-y-4">
        <div class="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/5 dark:bg-primary/10 border border-primary/20 backdrop-blur-xl">
          <span class="flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span class="text-[11px] font-black tracking-[0.2em] uppercase text-primary">Infrastructure v4.2.0</span>
        </div>
        <h1 class="text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
          Server <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Orchestrator</span>
        </h1>
        <p class="text-slate-500 dark:text-slate-400 max-w-xl text-lg font-medium leading-relaxed">
          Centralized command center for global infrastructure monitoring and automated node deployments.
        </p>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="hidden md:flex flex-col items-end mr-4">
          <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Network Latency</span>
          <span class="text-xl font-black text-green-500 dark:text-green-400 tabular-nums">24ms <span class="text-xs font-medium text-slate-400">Avg</span></span>
        </div>
        <button (click)="openCreateServer()" class="relative group overflow-hidden bg-primary px-8 py-4 rounded-2xl font-black text-sm text-white transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/25">
          <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          <span class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px]">add_circle</span>
            Deploy Instance
          </span>
        </button>
      </div>
    </div>

    <!-- KPI Dashboard: Dashboard Style -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      @for (kpi of kpis; track kpi.label) {
        <div class="group relative overflow-hidden bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 hover:border-primary/40 transition-all duration-500 shadow-sm hover:shadow-xl">
          <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
            <span class="material-symbols-outlined text-4xl text-primary">monitoring</span>
          </div>
          <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">{{ kpi.label }}</p>
          <div class="flex items-baseline gap-2">
            <h3 class="text-4xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{{ kpi.value.replace('%', '') }}</h3>
            @if (kpi.value.includes('%')) {
              <span class="text-xl font-bold text-primary/60">%</span>
            }
          </div>
          <div class="mt-6 flex items-center gap-3">
            <div class="h-1.5 flex-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full w-2/3 group-hover:w-[90%] transition-all duration-1000"></div>
            </div>
            <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-tighter">+12.4%</span>
          </div>
        </div>
      }
    </div>

    <!-- Health Grid: Aligned Colors -->
    <div class="bg-white dark:bg-[#0F172A]/40 backdrop-blur-3xl rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-xl p-10 relative overflow-hidden">
      <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
      
      <div class="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
        <div>
          <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span class="material-symbols-outlined text-primary">grid_view</span>
            Fleet Diagnostics
          </h2>
          <p class="text-sm font-medium text-slate-500 mt-1">Real-time status across {{ servers.length }} active nodes.</p>
        </div>
        <div class="flex items-center gap-1 p-1.5 bg-slate-100 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/5">
          @for (f of filters; track f) {
            <button (click)="activeFilter = f" 
              [class]="activeFilter === f 
                ? 'px-6 py-2.5 rounded-xl text-[10px] font-black bg-primary text-white shadow-xl shadow-primary/20 scale-105' 
                : 'px-4 py-2.5 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all uppercase tracking-widest'">
              {{ f }}
            </button>
          }
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (item of healthSummary; track item.label) {
          <div class="relative group p-6 rounded-3xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 hover:border-primary/20 transition-all hover:bg-white dark:hover:bg-black/40 shadow-sm">
            <div class="flex items-start justify-between mb-4">
              <div [class]="'p-3 rounded-2xl ' + item.className.replace('text', 'bg').replace('400', '400/10').replace('500', '500/10')">
                <span class="material-symbols-outlined" [class]="item.className">{{ item.label.includes('Healthy') ? 'check_circle' : item.label.includes('Warning') ? 'report' : item.label.includes('Critical') ? 'dangerous' : 'offline_bolt' }}</span>
              </div>
              <span class="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{{ item.value }}</span>
            </div>
            <h4 class="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">{{ item.label }}</h4>
            <p [class]="'text-[10px] font-black mt-1 uppercase tracking-widest ' + item.className">{{ item.note }}</p>
          </div>
        }
      </div>
    </div>

    <!-- SERVER LISTING -->
    <div class="bg-white dark:bg-black/40 backdrop-blur-3xl rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden transition-all">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
              <th class="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Compute Node</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Workload Stats</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Infrastructure</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Reliability</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Operations</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/[0.03]">
            @for (server of filteredServers; track server.id) {
              <tr (click)="selectCustomerServer(server)" class="group hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-all duration-300">
                <td class="px-8 py-8">
                  <div class="flex items-center gap-4">
                    <div class="relative">
                      <div [class]="'w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10 group-hover:border-primary/40 transition-colors bg-slate-50 dark:bg-white/5 shadow-inner'">
                        <span class="material-symbols-outlined text-2xl" [class]="server.status === 'Active' ? 'text-green-500' : server.status === 'Critical' ? 'text-red-500' : 'text-slate-400'">dns</span>
                      </div>
                      <span *ngIf="server.status === 'Active'" class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#0F172A] animate-pulse"></span>
                    </div>
                    <div>
                      <div class="text-base font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{{ server.serverName }}</div>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-[10px] font-black text-slate-400 dark:text-slate-500 font-mono tracking-tighter">{{ server.ip }}</span>
                        <span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-widest">{{ server.os.split(' ')[0] }}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-8 min-w-[320px]">
                  <div class="grid grid-cols-2 gap-x-8 gap-y-4">
                    @for (metric of ['cpu', 'memory']; track metric) {
                      <div class="space-y-2">
                        <div class="flex justify-between items-center">
                          <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{{ metric }}</span>
                          <span class="text-[10px] font-black text-slate-900 dark:text-white tabular-nums">{{ server[metric] }}%</span>
                        </div>
                        <div class="h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <div [class]="'h-full transition-all duration-1000 ' + (server[metric] > 80 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : server[metric] > 60 ? 'bg-yellow-500' : 'bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]')" 
                               [style.width]="server[metric] + '%'"></div>
                        </div>
                      </div>
                    }
                  </div>
                </td>
                <td class="px-8 py-8">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span class="material-symbols-outlined text-[14px] text-slate-400">public</span>
                      {{ server.region }}
                    </div>
                    <div class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{{ server.plan.split('/')[0] }} Dedicated</div>
                  </div>
                </td>
                <td class="px-8 py-8">
                  <div class="flex flex-col items-start gap-2">
                    <span class="text-xs font-black text-slate-900 dark:text-white tracking-tight">{{ server.uptime }} <span class="text-[9px] text-slate-400 font-bold ml-1 uppercase">Uptime</span></span>
                    <span [class]="'px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border ' + getStatusClass(server.status)">
                      {{ server.status }}
                    </span>
                  </div>
                </td>
                <td class="px-8 py-8 text-right" (click)="$event.stopPropagation()">
                  <div class="flex items-center justify-end gap-2">
                    <button (click)="openMaintenance(server)" class="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-400 hover:text-primary dark:hover:text-white hover:bg-primary/10 transition-all">
                      <span class="material-symbols-outlined text-[20px]">terminal</span>
                    </button>
                    <button (click)="openServerThreshold(server)" class="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-400 hover:text-blue-500 transition-all">
                      <span class="material-symbols-outlined text-[20px]">analytics</span>
                    </button>
                    <button (click)="openDeactivate(server)" class="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-400 hover:text-red-500 transition-all">
                      <span class="material-symbols-outlined text-[20px]">power_settings_new</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- NODE INSPECTOR -->
    @if (selectedServer) {
      <div class="fixed inset-0 z-[60] flex items-center justify-end pointer-events-none p-4 lg:p-10">
        <div class="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm pointer-events-auto" (click)="selectedServer = null"></div>
        
        <div class="relative w-full max-w-4xl h-full bg-white dark:bg-[#0F172A] border-l border-slate-200 dark:border-white/10 shadow-[-50px_0_100px_rgba(0,0,0,0.1)] dark:shadow-[-50px_0_100px_rgba(0,0,0,0.5)] pointer-events-auto overflow-y-auto animate-in slide-in-from-right duration-500 rounded-[2.5rem] lg:rounded-none lg:rounded-l-[3rem]">
          <div class="p-8 lg:p-12 space-y-12">
            <!-- Inspector Header -->
            <div class="flex items-start justify-between border-b border-slate-100 dark:border-white/5 pb-10">
              <div class="space-y-4">
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span class="material-symbols-outlined text-3xl text-primary">storage</span>
                  </div>
                  <div>
                    <h2 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{{ selectedServer.serverName }}</h2>
                    <p class="text-slate-500 font-mono text-sm tracking-tighter">{{ selectedServer.ip }} · {{ selectedServer.region }}</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <span class="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest">Operational</span>
                  <span class="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">{{ selectedServer.plan.split('/')[0] }}</span>
                </div>
              </div>
              <button (click)="selectedServer = null" class="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <!-- Resource Gauges -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
              @for (metric of [{n:'CPU', v:selectedServer.cpu, c:'text-primary'}, {n:'RAM', v:selectedServer.memory, c:'text-green-500'}, {n:'Disk', v:selectedServer.disk, c:'text-orange-500'}, {n:'Net', v:selectedServer.network, c:'text-purple-500'}]; track metric.n) {
                <div class="p-6 rounded-3xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 space-y-4">
                  <div class="flex justify-between items-end">
                    <span class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{{ metric.n }}</span>
                    <span class="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{{ metric.v }}%</span>
                  </div>
                  <div class="relative h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <div [class]="'absolute inset-y-0 left-0 bg-current rounded-full transition-all duration-1000 ' + metric.c" [style.width]="metric.v + '%'"></div>
                  </div>
                </div>
              }
            </div>

            <!-- Environment Stack -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div class="space-y-6">
                <h3 class="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm">info</span> Environment Stack
                </h3>
                <div class="grid grid-cols-1 gap-3">
                  @for (info of [{l:'OS Distro', v:selectedServer.os}, {l:'Database', v:selectedServer.database}, {l:'Storage', v:selectedServer.storage}, {l:'Traffic', v:selectedServer.bandwidth}, {l:'Requests', v:selectedServer.requests}, {l:'Latency', v:selectedServer.responseTime}]; track info.l) {
                    <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                      <span class="text-xs font-bold text-slate-500 uppercase">{{ info.l }}</span>
                      <span class="text-xs font-black text-slate-900 dark:text-white">{{ info.v }}</span>
                    </div>
                  }
                </div>
              </div>

              <div class="space-y-6">
                <h3 class="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm">security</span> Guardrails
                </h3>
                <div class="p-8 rounded-[2rem] bg-slate-50 dark:bg-gradient-to-br dark:from-primary/10 dark:to-transparent border border-slate-200 dark:border-primary/20">
                  <div class="space-y-4">
                    <div class="flex justify-between text-xs font-black uppercase text-slate-500">
                      <span>Threshold</span>
                      <span class="text-primary">{{ selectedServer.thresholds.cpu }}% Global</span>
                    </div>
                    <div class="flex gap-2">
                      @for (mode of ['email', 'sms', 'whatsapp']; track mode) {
                        <div [class]="'flex-1 p-3 rounded-xl border text-center transition-all ' + (selectedServer.notifications[mode] ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400')">
                          <span class="text-[9px] font-black uppercase tracking-tighter">{{ mode }}</span>
                        </div>
                      }
                    </div>
                  </div>
                </div>
                
                <div class="space-y-4">
                  <button (click)="openMaintenance(selectedServer)" class="w-full p-4 rounded-2xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-all flex items-center justify-center gap-3">
                    <span class="material-symbols-outlined text-sm">build</span>
                    System Maintenance
                  </button>
                  <div class="grid grid-cols-2 gap-4">
                    <button (click)="openTransfer(selectedServer)" class="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-600 dark:text-slate-400 hover:text-primary transition-all uppercase tracking-widest">Transfer</button>
                    <button (click)="openDownload(selectedServer)" class="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-600 dark:text-slate-400 hover:text-primary transition-all uppercase tracking-widest">Backup</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Console Output -->
            <div class="space-y-6">
              <h3 class="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">terminal</span> System Console
              </h3>
              <div class="p-6 rounded-3xl bg-slate-900 border border-slate-800 font-mono text-[11px] leading-relaxed overflow-hidden relative text-slate-300">
                <div class="absolute top-0 right-0 p-4">
                   <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                </div>
                <div class="text-primary mb-1">[SYSTEM] Node handshaking sequence initialized...</div>
                <div class="text-slate-500 mb-1">08:42:20 All services reported HEALTHY state.</div>
                <div class="text-white flex items-center gap-1 mt-2">
                  <span class="text-primary">$</span> tail -f /var/log/syslog <span class="w-1.5 h-4 bg-white/40 animate-pulse ml-1"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- MODALS -->
    @if (actionMode) {
      <div class="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
        <div class="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/10 rounded-[3rem] shadow-4xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transition-all">
          <div class="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
            <div>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{{ actionTitle }}</h3>
              <p class="text-xs font-medium text-slate-500 mt-1 uppercase tracking-widest">Configuration Protocol Alpha</p>
            </div>
            <button (click)="closeAction()" class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="p-8 overflow-y-auto flex-1 space-y-8 no-scrollbar">
            @if (actionMode === 'create') {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instance Identifier</label>
                  <input [(ngModel)]="createForm.serverName" class="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:border-primary outline-none transition-all placeholder:text-slate-300 font-mono" placeholder="prod-cluster-01">
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Customer Namespace</label>
                  <input [(ngModel)]="createForm.customer" class="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:border-primary outline-none transition-all placeholder:text-slate-300" placeholder="Acme Corp Enterprise">
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Deployment Region</label>
                  <select [(ngModel)]="createForm.region" class="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:border-primary outline-none transition-all appearance-none">
                    <option>N. Virginia (us-east-1)</option>
                    <option>Oregon (us-west-2)</option>
                    <option>Ireland (eu-west-1)</option>
                    <option>Singapore (ap-southeast-1)</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Resource Blueprint</label>
                  <select [(ngModel)]="createForm.plan" class="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:border-primary outline-none transition-all appearance-none">
                    <option>2 vCPU / 4 GB RAM (General Purpose)</option>
                    <option>4 vCPU / 8 GB RAM (Production Std)</option>
                    <option>8 vCPU / 16 GB RAM (Performance Tier)</option>
                    <option>16 vCPU / 32 GB RAM (High Compute)</option>
                  </select>
                </div>
              </div>
            }

            @if (actionMode === 'maintenance') {
              <div class="p-6 rounded-3xl bg-primary/5 dark:bg-primary/10 border border-primary/20 flex items-center gap-4">
                <span class="material-symbols-outlined text-primary text-3xl">offline_bolt</span>
                <div>
                  <p class="text-xs font-bold text-primary uppercase tracking-widest">Scaling Protocol</p>
                  <p class="text-sm font-medium text-slate-500 mt-1">Scaling resources for <span class="text-slate-900 dark:text-white font-bold">{{ activeServer?.serverName }}</span>.</p>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                @for (field of [{l:'Compute Cores', k:'cpu', o:['2 vCPU', '4 vCPU', '8 vCPU', '16 vCPU']}, {l:'Memory Allocation', k:'ram', o:['4 GB', '8 GB', '16 GB', '32 GB']}, {l:'Storage Capacity', k:'storage', o:['100 GB SSD', '250 GB SSD', '500 GB SSD', '1 TB SSD']}]; track field.l) {
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{{ field.l }}</label>
                    <select [(ngModel)]="maintenanceForm[field.k]" class="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:border-primary outline-none transition-all appearance-none">
                      @for (opt of field.o; track opt) {
                        <option [value]="opt">{{ opt }}</option>
                      }
                    </select>
                  </div>
                }
              </div>
            }

            @if (actionMode === 'deactivate') {
              <div class="p-8 rounded-[2.5rem] bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-center space-y-6">
                <div class="w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                  <span class="material-symbols-outlined text-4xl text-red-600 dark:text-red-500">warning</span>
                </div>
                <div>
                  <h4 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Decommission Node?</h4>
                  <p class="text-slate-500 text-sm mt-2 max-w-md mx-auto leading-relaxed">Deactivating <span class="text-red-600 dark:text-red-400 font-bold">{{ activeServer?.serverName }}</span> will terminate all active processes.</p>
                </div>
                <textarea [(ngModel)]="deactivateForm.reason" rows="3" class="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:border-red-500 outline-none transition-all placeholder:text-slate-300 text-center" placeholder="Rationale..."></textarea>
              </div>
            }

            @if (actionMode === 'threshold') {
              <div class="space-y-8">
                <div class="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <span class="material-symbols-outlined text-primary">rule</span>
                    </div>
                    <div>
                      <p class="text-sm font-black text-slate-900 dark:text-white">Global Policy Override</p>
                      <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Apply to all nodes</p>
                    </div>
                  </div>
                  <input type="checkbox" [(ngModel)]="thresholdForm.applyToAll" class="w-6 h-6 rounded-lg border-slate-300 dark:border-white/10 text-primary focus:ring-primary">
                </div>
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  @for (t of [{l:'CPU', k:'cpu', i:'memory'}, {l:'RAM', k:'memory', i:'memory'}, {l:'DISK', k:'disk', i:'database'}, {l:'NET', k:'network', i:'lan'}]; track t.l) {
                    <div class="space-y-3 p-6 rounded-3xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 text-center shadow-sm">
                      <span class="material-symbols-outlined text-slate-400 text-sm">{{ t.i }}</span>
                      <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{{ t.l }} CRITICAL %</label>
                      <input type="number" [(ngModel)]="thresholdForm[t.k]" class="w-full bg-transparent text-3xl font-black text-slate-900 dark:text-white text-center outline-none focus:text-primary transition-colors">
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <div class="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex justify-end gap-4">
            <button (click)="closeAction()" class="px-8 py-4 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all">Abort</button>
            <button (click)="submitAction()" class="px-10 py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Commit Changes</button>
          </div>
        </div>
      </div>
    }
  </div>
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

  maintenanceForm: MaintenanceForm = {
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

  thresholdForm: ThresholdForm = {
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

  getMetricBarClass(value: number): string {
    if (value >= 90) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
    if (value >= 75) return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
    return 'bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]';
  }

  getStatusClass(status: ServerStatus): string {
    switch (status) {
      case 'Active':
        return 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]';
      case 'Warning':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]';
      case 'Critical':
        return 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
      case 'Offline':
        return 'bg-slate-500/10 text-slate-400 border-white/5';
      case 'Deactivated':
        return 'bg-red-900/20 text-red-300 border-red-900/30';
      default:
        return 'bg-white/5 text-slate-400 border-white/10';
    }
  }
}
