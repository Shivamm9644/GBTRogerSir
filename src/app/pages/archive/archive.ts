import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { API_BASE_URL } from '../../config/api.config';

@Component({
  selector: 'app-archive',
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
<div class="p-8 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Version Archive & Master Zips</h2>
      <p class="text-slate-500">File Explorer for Historical application snapshots and Developer Master Source code.</p>
    </div>
    <div class="flex gap-3">
      <button (click)="openMasterZipModal()" class="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-lg hover:bg-slate-800 transition-colors">
        <span class="material-symbols-outlined text-[18px]">folder_zip</span> Master ZIP Upload
      </button>
    </div>
  </div>

  <!-- File Explorer Views Toggle -->
  <div class="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
    <button (click)="explorerView = 'history'" [class]="'pb-2 font-bold transition-all border-b-2 px-2 ' + (explorerView === 'history' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800')">
      Historical Artifacts
    </button>
    <button (click)="explorerView = 'master'" [class]="'pb-2 font-bold transition-all border-b-2 px-2 ' + (explorerView === 'master' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800')">
      Developer Master ZIPs
    </button>
  </div>

  <!-- Storage Stats -->
  <div class="grid grid-cols-3 gap-5">
    <div class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm">
      <p class="text-2xl font-bold text-primary">12.4 GB</p>
      <p class="text-xs text-slate-500 mt-1">Of 50 GB available</p>
      <div class="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full">
        <div class="h-full rounded-full bg-primary" style="width: 24.8%"></div>
      </div>
    </div>
    <div class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm">
      <p class="text-2xl font-bold text-green-500">100% Secure</p>
      <p class="text-xs text-slate-500 mt-1">Last scan 4 hours ago</p>
      <div class="flex items-center gap-2 mt-3">
        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        <span class="text-xs font-bold text-green-600">Integrity Verified</span>
      </div>
    </div>
    <div class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm">
      <p class="text-2xl font-bold">148 Files</p>
      <p class="text-xs text-slate-500 mt-1">Across 12 versions</p>
    </div>
  </div>

  <!-- Notice -->
  <div class="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
    <span class="material-symbols-outlined text-blue-500 flex-shrink-0">info</span>
    <p>Archive integrity is validated upon every system boot. To restore a version, please contact the DevOps lead.</p>
  </div>

  <!-- Versions -->
  <div class="bg-white dark:bg-slate-900 rounded-xl border border-primary/10 shadow-sm overflow-hidden">
    <div class="px-6 py-4 border-b border-primary/10 flex items-center justify-between">
      <h4 class="font-bold text-slate-800 dark:text-white">{{ explorerView === 'history' ? 'Version History Explorer' : 'Master App Source Explorer' }}</h4>
      <div class="flex gap-2">
        @if(explorerView === 'history') {
          @for (f of filters; track f) {
            <button (click)="activeFilter = f" [class]="activeFilter === f ? 'px-3 py-1 rounded-full text-xs font-bold bg-primary text-white' : 'px-3 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-500'">{{ f }}</button>
          }
        }
      </div>
    </div>
    <div class="divide-y divide-slate-100 dark:divide-slate-800 max-h-[60vh] overflow-y-auto">
      @for (version of activeExplorerItems; track version.id) {
        <div (click)="selectVersion(version)" [class]="'px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group ' + (selectedVersion?.id === version.id ? 'bg-primary/5' : '')">
          <div class="flex items-start gap-4">
            <div [class]="'p-2 rounded-xl flex-shrink-0 ' + version.iconBg">
              <span [class]="'material-symbols-outlined ' + version.iconColor">{{ version.icon }}</span>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <p class="text-sm font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{{ version.version }}</p>
                <span [class]="'px-2 py-0.5 text-[10px] font-bold rounded-full ' + version.typeClass">{{ version.type }}</span>
              </div>
              <p class="text-xs text-slate-500 mt-1">{{ version.desc }}</p>
              <div class="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">schedule</span>{{ version.date }}</span>
                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">storage</span>{{ version.size }}</span>
                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">person</span>{{ version.author }}</span>
              </div>
            </div>
            <div class="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" (click)="$event.stopPropagation()">
              <button (click)="downloadVersion(version)" class="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg" title="Download"><span class="material-symbols-outlined text-[18px]">download</span></button>
              <button (click)="restoreVersion(version)" class="p-1.5 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-lg" title="Restore"><span class="material-symbols-outlined text-[18px]">restore</span></button>
            </div>
          </div>
        </div>
      }
    </div>
    <div class="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t text-xs text-slate-400 font-mono flex items-center justify-between">
      <span>Showing {{ activeExplorerItems.length }} files in directory</span>
      <span>Read-Only & Encrypted Mode Active 🛡️</span>
    </div>
  </div>

  <!-- Master App ZIP Upload Modal -->
  @if(showMasterModal) {
    <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg p-6">
        <h3 class="text-xl font-bold mb-4 font-mono flex items-center gap-2"><span class="material-symbols-outlined text-blue-500">folder_zip</span> Upload GBT Master Source</h3>
        <p class="text-xs text-slate-500 mb-6">ZIP file should enclose source code, libraries, executable, flowcharts, and notes. This will be locked as read-only.</p>
        
        <div class="space-y-4">
          <div>
             <label class="block text-xs font-bold mb-1">Company</label>
             <input [(ngModel)]="masterCompany" class="w-full border rounded p-2 text-sm bg-slate-50" readonly disabled />
          </div>
          <div>
             <label class="block text-xs font-bold mb-1">GBT Master App Name</label>
             <input [(ngModel)]="masterAppName" placeholder="e.g. Master_ELD_V3" class="w-full border rounded p-2 text-sm" />
          </div>
          <div>
             <label class="block text-xs font-bold mb-1">Developer Notes</label>
             <textarea [(ngModel)]="masterNotes" rows="3" placeholder="Architecture changes, dependencies..." class="w-full border rounded p-2 text-sm"></textarea>
          </div>
          <div>
             <label class="block text-xs font-bold mb-1">Select ZIP File</label>
             <input type="file" accept=".zip,.rar,.tar" (change)="onZipSelected($event)" class="w-full border rounded p-2 text-sm" />
          </div>
          
          <div class="flex gap-3 justify-end mt-6">
            <button (click)="showMasterModal = false" class="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
            <button (click)="submitMasterZip()" class="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px]">cloud_upload</span> Upload Master
            </button>
          </div>
        </div>
      </div>
    </div>
  }
</div>
`
})
export class ArchiveComponent implements OnInit {
  activeFilter = 'All';
  explorerView: 'history' | 'master' = 'history';
  filters = ['All', 'Production Build', 'Pre-release', 'Major Release', 'Security Patch'];
  selectedVersion: any = null;
  versions: any[] = [];

  showMasterModal = false;
  masterCompany = 'GBT';
  masterAppName = '';
  masterNotes = '';
  masterZipFile: File | null = null;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.loadArchives();
  }

  loadArchives() {
    this.http.get<any[]>(`${API_BASE_URL}/api/apps.php?cmd=get_all_archives`).subscribe({
      next: (data) => {
        this.versions = data.map(item => this.mapDataToVersion(item));
      },
      error: (err) => console.error("Failed to load archives:", err)
    });
  }

  mapDataToVersion(data: any): any {
    const isErrorOrCrit = data.dot_cancelled == 1;
    const isWarning = data.artifact_status === 'Beta';

    let iconBg = 'bg-blue-50 dark:bg-blue-900/20';
    let iconColor = 'text-blue-600';
    let typeClass = 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';

    if (data.app_type === 'Master Source') {
      iconBg = 'bg-stone-100 dark:bg-stone-800';
      iconColor = 'text-stone-700 dark:text-stone-300';
      typeClass = 'bg-stone-800 text-white font-mono text-[9px]';
    } else if (isErrorOrCrit) {
      iconBg = 'bg-red-50 dark:bg-red-900/20'; iconColor = 'text-red-600'; typeClass = 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400';
    } else if (isWarning) {
      iconBg = 'bg-amber-50 dark:bg-amber-900/20'; iconColor = 'text-amber-600'; typeClass = 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
    } else if (data.artifact_status === 'Latest') {
      iconBg = 'bg-green-50 dark:bg-green-900/20'; iconColor = 'text-green-600'; typeClass = 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';
    }

    return {
      id: data.id,
      version: data.app_version,
      rawAppType: data.app_type,
      type: data.app_type === 'Master Source' ? 'MASTER ZIP' : (data.artifact_status || 'Archived'),
      desc: data.app_type === 'Master Source' ? `[DEVELOPER SOURCE] ${data.description}` : `[${data.company}] ${data.description} (${data.platform})`,
      date: data.archived_at ? data.archived_at : data.created_at,
      size: data.binary_file_name ? 'Binary/Zip available' : 'No binary',
      author: data.app_type === 'Master Source' ? 'Dev Team / Master' : 'System Auto-Archive',
      icon: data.app_type === 'Master Source' ? 'folder_zip' : this.getIconForPlatform(data.platform),
      iconBg,
      iconColor,
      typeClass,
      binary_file_name: data.binary_file_name
    };
  }

  getIconForPlatform(platform: string) {
    if (platform === 'Android') return 'android';
    if (platform === 'iOS') return 'phone_iphone';
    if (platform === 'Windows') return 'desktop_windows';
    return 'terminal';
  }

  get activeExplorerItems() {
    let items = this.versions;
    if (this.explorerView === 'master') {
      return items.filter(v => v.rawAppType === 'Master Source');
    } else {
      items = items.filter(v => v.rawAppType !== 'Master Source');
      if (this.activeFilter !== 'All') {
        return items.filter(v => v.type === this.activeFilter);
      }
      return items;
    }
  }

  selectVersion(v: any) { this.selectedVersion = v; }

  downloadVersion(v: any) {
    if (v.binary_file_name) {
      const folderPath = v.rawAppType === 'Master Source' ? 'master/' : '';
      window.open(`${API_BASE_URL}/storage/apps/${folderPath}${v.binary_file_name}`, '_blank');
    } else {
      alert('No binary available for this archived version.');
    }
  }

  restoreVersion(v: any) {
    if (v.rawAppType === 'Master Source') {
      alert("Master Source ZIPs cannot be restored natively. Please download and extract the ZIP first.");
      return;
    }
    if (confirm(`Restore ${v.version}? This will replace the current deployment.`)) alert(`Restoring ${v.version} is simulated for now.`);
  }

  openMasterZipModal() {
    this.masterAppName = '';
    this.masterNotes = '';
    this.masterZipFile = null;
    this.showMasterModal = true;
  }

  onZipSelected(event: any) {
    this.masterZipFile = event.target.files[0];
  }

  submitMasterZip() {
    if (!this.masterAppName || !this.masterZipFile) {
      alert("Please provide the Master App Name and attach the Source ZIP file.");
      return;
    }
    const formData = new FormData();
    formData.append('cmd', 'save_master_zip');
    formData.append('company', this.masterCompany);
    formData.append('app_name', this.masterAppName);
    formData.append('notes', this.masterNotes);
    formData.append('master_zip', this.masterZipFile);

    this.http.post<any>(`${API_BASE_URL}/api/apps.php`, formData).subscribe({
      next: (resp) => {
        alert(resp.message);
        this.showMasterModal = false;
        this.loadArchives();
      },
      error: () => alert("Master App Upload failed! Check your connection.")
    });
  }
}
