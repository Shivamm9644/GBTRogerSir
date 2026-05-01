import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { API_BASE_URL } from '../../config/api.config';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export type AppType = 'ELD' | 'GPS' | 'Reefer' | 'DashCam' | 'Admin Dashboard' | 'End User Dashboard' | 'Firmware';
export type Platform = 'Android' | 'iOS' | 'Windows' | 'Binary';
export type ArtifactStatus = 'Latest' | 'Stable' | 'Beta' | 'Legacy';

export interface AppArtifact {
  id: number;
  company: string;
  description: string;
  app_type: string;
  appVersion: string;
  osVersion: string;
  platform: string;
  user_manual?: string;
  user_manual_url?: string;
  effectiveDate: string;
  hardware: string;
  firmwareVersion: string;
  fwEffectiveDate: string;
  is_locked: boolean;
  artifact_status: string;
  dot_cancelled: boolean;
  trigger_login_update: boolean;
  binary_file_name?: string;
  binary_file_path?: string;
  binary_file_ext?: string;
  is_latest: boolean;
  archive_status: string;
  archived_at?: string;
  is_encrypted: boolean;
  store_upload_status: 'none' | 'pending' | 'processing' | 'success' | 'failed';
  store_upload_message?: string;
  uploaded_to_store_at?: string;
  mail_sent_at?: string;
  status: ArtifactStatus;
  type: AppType;
  uploadedAt: string;
  isLocked: boolean;
  isEncrypted: boolean;
  isDotCancelled: boolean;
  triggerLoginUpdate: boolean;
  userManualUrl: string;
  liveStoreVersion?: string; 
  liveStoreDate?: string;
  liveStoreError?: string;   
}

export interface VersionHistory {
  version: string;
  date: string;
  platform: Platform;
  status: ArtifactStatus;
  removedAt?: string;
}

@Component({
  selector: 'app-firmware',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  host: { class: 'block w-full' },
  template: `
  <div class="flex min-h-screen bg-slate-50 dark:bg-slate-950 relative">
    <main class="flex-1 flex flex-col">
      <div class="flex-shrink-0 sticky top-0 z-20 bg-slate-50 dark:bg-slate-950">
        <div class="px-4 md:px-8 pt-6 md:pt-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Firmware Repository</h2>
            <p class="text-slate-500 text-[10px] md:text-sm mt-0.5">Manage firmware binaries and hardware artifacts.</p>
          </div>
          <div class="flex items-center gap-2 md:gap-3 flex-shrink-0 z-30">
            <button (click)="openUploadModal()"
                    class="flex items-center justify-center gap-2 bg-primary text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              <span class="material-symbols-outlined text-[16px] md:text-[18px]">upload_file</span>
              New Artifact
            </button>
          </div>
        </div>

        <div class="flex flex-col border-b border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30">
          <div class="px-8 pt-6">
            <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
              @for (stat of getStats(); track stat.label) {
                <div class="bg-white dark:bg-slate-900 p-3.5 md:p-4 rounded-xl border border-primary/10 shadow-sm flex items-center gap-3">
                  <div [class]="'p-2.5 rounded-xl ' + getStatBg(stat.color)">
                    <span class="material-symbols-outlined text-[20px]" [class]="stat.color">{{ stat.icon }}</span>
                  </div>
                  <div>
                    <p class="text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-0.5">{{ stat.label }}</p>
                    <p class="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-none">{{ stat.value }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
          <div class="px-8 pt-6 pb-6 space-y-4">
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-primary/10 shadow-sm p-4">
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                <input [(ngModel)]="searchTerm" type="text"
                  placeholder="Search firmware, versions, companies..."
                  class="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-transparent rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 dark:text-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 md:p-6 bg-slate-50 dark:bg-slate-950">
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div class="w-full overflow-x-auto pb-4">
            <table class="w-full text-left border-collapse min-w-max">
              <thead>
                <tr class="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Company</th>
                  <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Description</th>
                  <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">App Type</th>
                  <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">FW Version</th>
                  <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Platform</th>
                  <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Release Status</th>
                  <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Manual</th>
                  <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Flags</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                @for (app of filteredArtifacts; track app.id) {
                  <tr (click)="onAppVersionContextMenu($event, app)"
                      class="group hover:bg-primary/5 transition-all cursor-pointer">
                    <td class="px-5 py-4 font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">{{ app.company }}</td>
                    <td class="px-5 py-4 text-xs font-semibold text-slate-600">{{ app.description }}</td>
                    <td class="px-5 py-4 text-xs font-semibold text-slate-400">{{ app.type }}</td>
                    <td class="px-5 py-4">
                      <div (contextmenu)="onAppVersionContextMenu($event, app)"
                           class="inline-flex flex-col gap-1 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 cursor-context-menu hover:bg-primary/5 transition-all w-full">
                        <span class="text-sm font-bold font-mono text-slate-900 dark:text-white">{{ app.appVersion }}</span>
                      </div>
                    </td>
                    <td class="px-5 py-4 text-xs font-semibold text-slate-500">{{ app.platform }}</td>
                    <td class="px-5 py-4">
                      <span [class]="'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ' + getStatusBadge(app.status)">
                        {{ app.status }}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-center">
                      <a [href]="app.userManualUrl" target="_blank" (click)="$event.stopPropagation()"
                         class="p-1.5 hover:bg-red-50 text-red-500 rounded-lg inline-flex">
                        <span class="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                      </a>
                    </td>
                    <td class="px-5 py-4 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {{ app.effectiveDate }}
                    </td>
                    <td class="px-5 py-4">
                      @if (app.triggerLoginUpdate) {
                        <span class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[9px] font-bold uppercase tracking-wider">OTA</span>
                      }
                    </td>
                  </tr>
                }
                @if (filteredArtifacts.length === 0) {
                  <tr><td colspan="8" class="px-5 py-20 text-center text-slate-400 italic">No firmware artifacts found.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>

  <!-- Context Menu -->
  @if (showContextMenu) {
    <div class="fixed z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1.5 min-w-[200px]"
         [style.left.px]="menuX" [style.top.px]="menuY">
      <button (click)="downloadArtifact(selectedApp)" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-100">
        <span class="material-symbols-outlined text-[18px]">download</span> Download Binary
      </button>
      <button (click)="triggerOTA(selectedApp)" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 mt-1">
        <span class="material-symbols-outlined text-[18px]">system_update</span> Trigger OTA Update
      </button>
      <button (click)="moveToArchive(selectedApp!.id)" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 mt-1">
        <span class="material-symbols-outlined text-[18px]">archive</span> Move to Archive
      </button>
      <div class="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
      <button (click)="deleteApp(selectedApp!.id)" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50">
        <span class="material-symbols-outlined text-[18px]">delete</span> Delete Firmware
      </button>
    </div>
  }

  <!-- Upload Modal -->
  @if (showUploadModal) {
    <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" (click)="closeUploadModal()">
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <div class="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">New Firmware Upload</h2>
          <button (click)="closeUploadModal()" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span class="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>
        <form [formGroup]="uploadForm" (ngSubmit)="submitUpload()" class="px-8 py-6 space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">COMPANY *</label>
              <input formControlName="company" placeholder="e.g. ABC" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">DESCRIPTION *</label>
              <input formControlName="description" placeholder="e.g. ELD Firmware" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">HARDWARE PART NO.</label>
              <input formControlName="hardware" placeholder="e.g. 145000A-01" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">APP TYPE *</label>
              <select formControlName="type" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                <option value="Firmware">Firmware / Binary</option>
                <option value="ELD">ELD App</option>
                <option value="GPS">GPS / Tracking</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">FIRMWARE VERSION *</label>
              <input formControlName="appVersion" placeholder="e.g. 1.0.1" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">PLATFORM *</label>
              <select formControlName="platform" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                <option value="Binary">Binary</option>
                <option value="Windows">Windows</option>
                <option value="Android">Android</option>
              </select>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">FIRMWARE FILE</label>
            <div class="bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 group hover:border-primary/50 transition-all">
              <input type="file" #fileInput class="hidden" (change)="onFileSelected($event)" />
              <button type="button" (click)="fileInput.click()" class="w-full flex flex-col items-center gap-2">
                <div class="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <span class="material-symbols-outlined text-slate-400 text-[32px]">cloud_upload</span>
                </div>
                <p class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ uploadedFileName || 'Click to upload .bin or binary' }}</p>
              </button>
            </div>
          </div>

          <button type="submit" [disabled]="uploadForm.invalid" class="w-full bg-primary text-white py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all">
            Save Firmware
          </button>
        </form>
      </div>
    </div>
  }
  `,
  styles: [`:host { display: block; } .cursor-context-menu { cursor: context-menu; }`]
})
export class FirmwareComponent implements OnInit {
  searchTerm = '';
  showContextMenu = false;
  menuX = 0;
  menuY = 0;
  selectedApp: AppArtifact | null = null;
  showUploadModal = false;
  uploadedFileName = '';
  binaryFile: File | null = null;
  uploadForm!: FormGroup;
  artifacts: AppArtifact[] = [];

  constructor(private fb: FormBuilder, private http: HttpClient) { }

  ngOnInit() {
    this.initForm();
    this.loadArtifacts();
  }

  initForm() {
    this.uploadForm = this.fb.group({
      company: ['', Validators.required],
      type: ['Firmware'],
      description: ['', Validators.required],
      platform: ['Binary', Validators.required],
      appVersion: ['', Validators.required],
      osVersion: ['N/A'],
      status: ['Latest'],
      hardware: [''],
      isDotCancelled: [false]
    });
  }

  loadArtifacts() {
    this.http.get<any[]>(`${API_BASE_URL}/api/apps.php`).subscribe({
      next: (data) => {
        this.artifacts = (data || [])
          .filter(item => item.app_type === 'Firmware')
          .map(item => this.mapBackendToArtifact(item));
      }
    });
  }

  mapBackendToArtifact(data: any): AppArtifact {
    return {
      ...data,
      appVersion: data.app_version,
      effectiveDate: data.created_at ? data.created_at.split(' ')[0] : 'N/A',
      status: data.artifact_status as ArtifactStatus || 'Stable',
      type: (data.app_type || 'Firmware') as AppType,
      isDotCancelled: data.dot_cancelled == 1,
      triggerLoginUpdate: data.trigger_login_update == 1,
      userManualUrl: data.user_manual ? `${API_BASE_URL}/storage/apps/${data.user_manual}` : '#'
    } as AppArtifact;
  }

  getStats() {
    return [
      { label: 'Total Firmware', value: this.artifacts.length, icon: 'inventory_2', color: 'text-primary' },
      { label: 'Latest', value: this.artifacts.filter(a => a.status === 'Latest').length, icon: 'verified', color: 'text-green-500' },
      { label: 'Critical', value: this.artifacts.filter(a => a.isDotCancelled).length, icon: 'gpp_bad', color: 'text-red-500' },
      { label: 'OTA Ready', value: this.artifacts.filter(a => a.triggerLoginUpdate).length, icon: 'sync', color: 'text-sky-500' },
      { label: 'Binary', value: this.artifacts.filter(a => a.platform === 'Binary').length, icon: 'terminal', color: 'text-emerald-500' }
    ];
  }

  getStatBg(color: string) {
    if (color.includes('green') || color.includes('emerald')) return 'bg-green-50';
    if (color.includes('red')) return 'bg-red-50';
    if (color.includes('sky')) return 'bg-sky-50';
    return 'bg-primary/5';
  }

  get filteredArtifacts() {
    return this.artifacts.filter(a => {
      const search = this.searchTerm.toLowerCase();
      return !search || a.company.toLowerCase().includes(search) || a.description.toLowerCase().includes(search) || a.appVersion.toLowerCase().includes(search);
    });
  }

  getStatusBadge(s: string) {
    const map: Record<string, string> = {
      Latest: 'bg-green-100 text-green-700',
      Stable: 'bg-blue-100 text-blue-700',
      Beta: 'bg-amber-100 text-amber-700',
      Legacy: 'bg-slate-100 text-slate-700'
    };
    return map[s] || map['Stable'];
  }

  openUploadModal() { this.initForm(); this.uploadedFileName = ''; this.binaryFile = null; this.showUploadModal = true; }
  closeUploadModal() { this.showUploadModal = false; }

  onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) { this.uploadedFileName = file.name; this.binaryFile = file; }
  }

  submitUpload() {
    const v = this.uploadForm.value;
    const formData = new FormData();
    formData.append('cmd', 'save_app');
    formData.append('company', v.company);
    formData.append('description', v.description);
    formData.append('app_type', 'Firmware');
    formData.append('platform', v.platform);
    formData.append('app_version', v.appVersion);
    formData.append('os_version', v.osVersion);
    formData.append('artifact_status', v.status);
    formData.append('hardware', v.hardware);
    if (this.binaryFile) formData.append('binary', this.binaryFile);

    this.http.post<any>(`${API_BASE_URL}/api/apps.php`, formData).subscribe({
      next: (resp) => {
        alert(resp.message);
        this.loadArtifacts();
        this.closeUploadModal();
      },
      error: () => alert("Upload failed")
    });
  }

  downloadArtifact(app: AppArtifact | null) {
    if (app?.binary_file_name) window.open(`${API_BASE_URL}/storage/apps/${app.binary_file_name}`, '_blank');
  }

  triggerOTA(app: any) {
    alert(`OTA Update triggered for ${app.company} v${app.appVersion}`);
  }

  moveToArchive(id: number) {
    const fd = new FormData();
    fd.append('cmd', 'archive');
    fd.append('id', id.toString());
    this.http.post(`${API_BASE_URL}/api/apps.php`, fd).subscribe(() => {
      this.showContextMenu = false;
      this.loadArtifacts();
    });
  }

  deleteApp(id: number) {
    if (confirm("Delete this firmware?")) {
      this.http.get(`${API_BASE_URL}/api/apps.php?cmd=delete&id=${id}`).subscribe(() => {
        this.showContextMenu = false;
        this.loadArtifacts();
      });
    }
  }

  onAppVersionContextMenu(event: MouseEvent, app: AppArtifact) {
    event.preventDefault();
    this.selectedApp = app;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    this.showContextMenu = true;
  }

  @HostListener('document:click')
  closeContextMenu() { this.showContextMenu = false; }
}
