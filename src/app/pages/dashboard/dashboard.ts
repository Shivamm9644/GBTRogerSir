import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    template: `
<div class="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h2>
      <p class="text-slate-500">Real-time performance monitoring and statistics.</p>
    </div>
    <button (click)="createReport()" class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all cursor-pointer">
      <span class="material-symbols-outlined text-[18px]">add</span>Create Report
    </button>
  </div>

  <!-- Metric Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    @for (metric of metricsData; track metric.title) {
      <div (click)="onMetricClick(metric)" class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/10 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer">
        <div class="flex items-center justify-between mb-4">
          <div [class]="'p-2 rounded-lg ' + metric.colorBg"><span [class]="'material-symbols-outlined ' + metric.colorText">{{ metric.icon }}</span></div>
          <span [class]="'text-xs font-bold px-2 py-1 rounded-full ' + metric.changeClass">{{ metric.change }}</span>
        </div>
        <p class="text-slate-500 text-sm font-medium">{{ metric.title }}</p>
        <h3 class="text-2xl font-bold mt-1">{{ metric.value }}</h3>
      </div>
    }
  </div>

  <!-- Charts Row -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/10 shadow-sm">
      <div class="flex items-center justify-between mb-8">
        <div><h4 class="font-bold text-slate-800 dark:text-white">Active Devices Trend</h4><p class="text-xs text-slate-400">Last 12 months</p></div>
        <select class="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border-none rounded-lg outline-none cursor-pointer"><option>2025</option><option>2026</option></select>
      </div>
      <div class="h-48 flex items-end justify-between gap-1 px-2">
        @for (h of barHeights; track h; let i = $index) {
          <div class="w-full bg-primary/20 rounded-t hover:bg-primary/60 transition-colors cursor-pointer" [style.height]="h + '%'" [title]="months[i]"></div>
        }
      </div>
      <div class="flex justify-between text-[10px] font-bold text-slate-400 px-1 mt-2">
        @for (m of months; track m) { <span>{{ m }}</span> }
      </div>
    </div>
    <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/10 shadow-sm">
      <div class="flex items-center justify-between mb-8">
        <div><h4 class="font-bold text-slate-800 dark:text-white">Apps Activated vs Deactivated</h4><p class="text-xs text-slate-400">Weekly activity</p></div>
        <div class="flex gap-3">
          <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-primary"></span><span class="text-[10px] text-slate-500 uppercase font-bold">Active</span></div>
          <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-slate-300"></span><span class="text-[10px] text-slate-500 uppercase font-bold">Inactive</span></div>
        </div>
      </div>
      <div class="h-48 grid grid-cols-4 items-end gap-8 px-4">
        @for (week of weeklyData; track week.label) {
          <div class="flex flex-col gap-1 items-center cursor-pointer group" (click)="null">
            <div class="w-full flex items-end gap-1 h-40">
              <div class="flex-1 bg-primary rounded-t group-hover:bg-primary/80 transition-colors" [style.height]="week.active + '%'"></div>
              <div class="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t transition-colors" [style.height]="week.inactive + '%'"></div>
            </div>
            <span class="text-[10px] font-bold text-slate-400">{{ week.label }}</span>
          </div>
        }
      </div>
    </div>
  </div>

  <!-- Bottom Row -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
    <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-primary/10 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-primary/10 flex items-center justify-between">
        <h4 class="font-bold text-slate-800 dark:text-white">Server Health Summary</h4>
        <button (click)="goToServers()" class="text-primary text-xs font-bold hover:underline">View All</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th class="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Node Name</th>
              <th class="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Region</th>
              <th class="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Load</th>
              <th class="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            @for (cluster of clustersData; track cluster.id) {
              <tr (click)="showClusterDetail(cluster)" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group transition-colors">
                <td class="px-6 py-4">
                  <p class="text-sm font-semibold group-hover:text-primary transition-colors">{{ cluster.name }}</p>
                  <p class="text-[10px] text-slate-400">{{ cluster.id }}</p>
                </td>
                <td class="px-6 py-4 text-sm">{{ cluster.region }}</td>
                <td class="px-6 py-4">
                  <div class="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full">
                    <div [class]="'h-full rounded-full ' + cluster.loadColor" [style.width]="cluster.load + '%'"></div>
                  </div>
                  <p class="text-[10px] text-slate-400 mt-1">{{ cluster.load }}%</p>
                </td>
                <td class="px-6 py-4"><span [class]="'px-2 py-1 text-[10px] font-bold rounded-full ' + cluster.statusClass">{{ cluster.status }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    <div class="bg-white dark:bg-slate-900 rounded-xl border border-primary/10 shadow-sm flex flex-col overflow-hidden">
      <div class="px-6 py-4 border-b border-primary/10 flex items-center justify-between">
        <h4 class="font-bold text-slate-800 dark:text-white">Recent Alerts</h4>
        <span class="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{{ unreadCount }} new</span>
      </div>
      <div class="flex-1 overflow-y-auto">
        @for (alert of alertsData; track alert.title) {
          <div (click)="markRead(alert)" [class]="'p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer ' + (alert.read ? 'opacity-60' : '')">
            <div class="flex gap-3">
              <div [class]="'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ' + alert.colorClass">
                <span class="material-symbols-outlined text-[18px]">{{ alert.icon }}</span>
              </div>
              <div>
                <p class="text-sm font-semibold">{{ alert.title }}</p>
                <p class="text-xs text-slate-500 mt-1">{{ alert.desc }}</p>
                <p class="text-[10px] text-slate-400 mt-2 font-bold uppercase">{{ alert.time }}</p>
              </div>
            </div>
          </div>
        }
      </div>
      <div class="p-4 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-primary/10">
        <button (click)="markAllRead()" class="text-xs font-bold text-primary hover:underline">Mark all as read</button>
      </div>
    </div>
  </div>
</div>
`
})
export class DashboardComponent {
    metricsData = [
        { title: 'Total Customers', value: '1,284', change: '+12%', colorBg: 'bg-blue-50 dark:bg-blue-900/20', colorText: 'text-blue-600 dark:text-blue-400', icon: 'person', changeClass: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
        { title: 'Active Devices', value: '45,602', change: '+5.4%', colorBg: 'bg-indigo-50 dark:bg-indigo-900/20', colorText: 'text-indigo-600 dark:text-indigo-400', icon: 'devices', changeClass: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
        { title: 'Total Apps', value: '89', change: '-2.1%', colorBg: 'bg-purple-50 dark:bg-purple-900/20', colorText: 'text-purple-600 dark:text-purple-400', icon: 'apps', changeClass: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
        { title: 'Server Status', value: 'Healthy', change: '100% Uptime', colorBg: 'bg-green-50 dark:bg-green-900/20', colorText: 'text-green-600 dark:text-green-400', icon: 'bolt', changeClass: 'text-slate-500' },
    ];
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    barHeights = [30, 45, 40, 60, 55, 70, 65, 85, 80, 90, 95, 100];
    weeklyData = [
        { label: 'Week 1', active: 60, inactive: 40 },
        { label: 'Week 2', active: 80, inactive: 30 },
        { label: 'Week 3', active: 70, inactive: 50 },
        { label: 'Week 4', active: 95, inactive: 15 },
    ];
    clustersData = [
        { name: 'Cluster-US-West-01', id: '#9901-A', region: 'Oregon, USA', load: 32, loadColor: 'bg-green-500', status: 'ACTIVE', statusClass: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
        { name: 'Cluster-EU-Frank-03', id: '#4422-B', region: 'Frankfurt, DE', load: 78, loadColor: 'bg-yellow-500', status: 'WARNING', statusClass: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' },
        { name: 'Cluster-AS-SGP-01', id: '#1109-C', region: 'Singapore', load: 92, loadColor: 'bg-red-500', status: 'CRITICAL', statusClass: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' },
    ];
    alertsData = [
        { title: 'Database Connection Failed', desc: 'Attempt to reach main cluster failed.', time: 'Just now', icon: 'error', colorClass: 'bg-red-100 dark:bg-red-900/30 text-red-600', read: false },
        { title: 'High Memory Usage', desc: 'Instance EU-Central-02 above 85%.', time: '15m ago', icon: 'warning', colorClass: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600', read: false },
        { title: 'System Update Available', desc: 'New firmware patch v2.4.1 ready.', time: '1h ago', icon: 'info', colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600', read: true },
    ];
    get unreadCount() { return this.alertsData.filter(a => !a.read).length; }

    constructor(private router: Router) { }

    onMetricClick(m: any) { alert(`Metric: ${m.title}\nValue: ${m.value}\nChange: ${m.change}`); }
    createReport() { alert('Create Report dialog... (mock)'); }
    showClusterDetail(c: any) { alert(`Cluster: ${c.name}\nRegion: ${c.region}\nLoad: ${c.load}%\nStatus: ${c.status}`); }
    goToServers() { this.router.navigate(['/servers']); }
    markRead(a: any) { a.read = true; }
    markAllRead() { this.alertsData.forEach(a => a.read = true); }
}
