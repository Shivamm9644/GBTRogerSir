import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { API_BASE_URL } from '../../config/api.config';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export type AppType = 'ELD' | 'GPS' | 'Reefer' | 'DashCam' | 'Admin Dashboard' | 'End User Dashboard' | 'Firmware';
export type Platform = 'Android' | 'iOS' | 'Windows' | 'Binary';
export type ArtifactStatus = 'Latest' | 'Stable' | 'Beta' | 'Legacy';
export type DashboardView = 'admin' | 'enduser';

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

  // Real backend fields
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

  // UI UI Logic / Template Compatibility Aliases
  status: ArtifactStatus;
  type: AppType;
  uploadedAt: string;
  isLocked: boolean;
  isEncrypted: boolean;
  isDotCancelled: boolean;
  triggerLoginUpdate: boolean;
  userManualUrl: string;
  liveStoreVersion?: string; 
  liveStoreDate?: string;    // Add this
  liveStoreError?: string;   
}

export interface VersionHistory {
  version: string;
  date: string;
  platform: Platform;
  status: ArtifactStatus;
  removedAt?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-apps',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  host: { class: 'block w-full' },
  template: `
  <div class="flex min-h-screen bg-slate-50 dark:bg-slate-950 relative">
    <main class="flex-1 flex flex-col">
      <div class="flex-shrink-0 sticky top-0 z-20 bg-slate-50 dark:bg-slate-950">
        <div class="px-4 md:px-8 pt-6 md:pt-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Apps Repository</h2>
            <p class="text-slate-500 text-[10px] md:text-sm mt-0.5">Manage application artifacts and versions.</p>
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
                  placeholder="Search artifacts, versions, hardware part numbers..."
                  class="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-transparent rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 dark:text-slate-200" />
              </div>
            </div>

            <div class="flex items-center gap-3 overflow-x-auto no-scrollbar">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Platform Filter:</p>
              <div class="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                @for (p of platforms; track p.id) {
                  <button (click)="activePlatform = p.id"
                          [class]="'flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all whitespace-nowrap '
                                  + (activePlatform === p.id ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:bg-white/50')">
                    <span class="material-symbols-outlined text-[14px] md:text-[16px]">{{ p.icon }}</span>
                    {{ p.name }}
                  </button>
                }
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
                  <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">App Version</th>
                  <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Platform / OS</th>
                  <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">User Manual</th>
                  <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Effective Date</th>
                  <th class="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Flags</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                @for (app of filteredArtifacts; track app.id) {
                  <tr (click)="onAppVersionContextMenu($event, app)" 
                      [class]="'group hover:bg-primary/5 transition-all cursor-pointer ' + (app.isDotCancelled ? 'bg-red-50/10' : '')">
                    <td class="px-5 py-4 font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">{{ app.company }}</td>
                    <td class="px-5 py-4">
                      <div class="flex flex-col">
                        <span class="text-xs font-semibold">{{ app.description }}</span>
                        <span class="text-[10px] text-slate-400 mt-0.5">{{ app.type }}</span>
                      </div>
                    </td>
                    <td class="px-5 py-4">
                      <div (contextmenu)="onAppVersionContextMenu($event, app)"
                           class="inline-flex flex-col gap-1 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 cursor-context-menu hover:bg-primary/5 transition-all w-full">
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-bold font-mono text-slate-900 dark:text-white">{{ app.appVersion }}</span>
                          @if (app.isLocked) { <span class="material-symbols-outlined text-[14px] text-slate-400">lock</span> }
                          @if (app.isEncrypted) { <span class="material-symbols-outlined text-[14px] text-emerald-500 font-bold">shield</span> }
                        </div>
                        
                        <!-- Inline Live Store Info -->
                        @if (app.platform === 'Android' || app.platform === 'iOS') {
                          @if (app.liveStoreVersion) {
                            <div class="flex flex-col border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                              <span class="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                <span class="material-symbols-outlined text-[12px]">cloud_done</span>
                                Live: {{ app.liveStoreVersion }}
                              </span>
                              @if (app.liveStoreDate) {
                                <span class="text-[8px] text-slate-400 italic">Updated: {{ app.liveStoreDate }}</span>
                              }
                            </div>
                          } @else if (app.liveStoreError) {
                            <div class="text-[8px] text-red-500 border-t border-slate-100 dark:border-slate-700 mt-1 pt-1 truncate max-w-[120px]" [title]="app.liveStoreError">
                              Google API: {{ app.liveStoreError }}
                            </div>
                          }
                        }
                      </div>
                    </td>
                    <td class="px-5 py-4">
                      <div class="flex flex-col gap-1.5">
                        <div class="flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-[14px] text-slate-400">{{ getPlatformIcon(app.platform) }}</span>
                          <span class="text-xs font-semibold">{{ app.osVersion }}</span>
                        </div>
                      </div>
                    </td>
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
                      <div class="flex items-center gap-2">
                        @if (app.triggerLoginUpdate) {
                          <span class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[9px] font-bold uppercase tracking-wider">OTA</span>
                        }
                        @if (app.isDotCancelled) {
                          <span class="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[9px] font-bold uppercase tracking-wider">DOT</span>
                        }
                      </div>
                    </td>
                  </tr>
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
      <div class="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ selectedApp?.appVersion }}</p>
      </div>
      <button (click)="downloadArtifact(selectedApp)" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-100">
        <span class="material-symbols-outlined text-[18px]">download</span> Download Binary
      </button>
      <button (click)="openVersionHistoryFor(selectedApp)" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-100">
        <span class="material-symbols-outlined text-[18px]">history</span> Version History
      </button>
      
      @if (selectedApp?.platform === 'Android') {
        <button (click)="triggerStoreUpload(selectedApp)" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 mt-1">
          <span class="material-symbols-outlined text-[18px]">play_store</span> Upload to Google Play Store
        </button>
      }
      @if (selectedApp?.platform === 'iOS') {
        <button (click)="triggerStoreUpload(selectedApp)" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 mt-1">
          <span class="material-symbols-outlined text-[18px]">apple</span> Upload to Apple Store
        </button>
      }
      @if (selectedApp?.type === 'Firmware') {
        <button (click)="triggerStoreUpload(selectedApp)" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 mt-1">
          <span class="material-symbols-outlined text-[18px]">system_update</span> Trigger OTA Update
        </button>
      }

      <button (click)="moveToArchive(selectedApp!.id)" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 mt-1">
        <span class="material-symbols-outlined text-[18px]">archive</span> Move to Archive
      </button>

      <div class="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
      <button [disabled]="selectedApp?.status === 'Latest'"
              (click)="selectedApp?.status !== 'Latest' && deleteApp(selectedApp!.id)" 
              [class]="'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ' + (selectedApp?.status === 'Latest' ? 'text-slate-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50')">
        <span class="material-symbols-outlined text-[18px]">lock</span>
        {{ selectedApp?.status === 'Latest' ? 'Version Locked (Immutability)' : 'Delete Artifact' }}
      </button>
    </div>
  }

  <!-- Upload Modal -->
  @if (showUploadModal) {
    <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" (click)="closeUploadModal()">
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <div class="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">New Artifact Upload</h2>
            <p class="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">All files are encrypted and locked after upload.</p>
          </div>
          <button (click)="closeUploadModal()" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span class="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>
        <form [formGroup]="uploadForm" (ngSubmit)="submitUpload()" class="px-8 py-6 space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">COMPANY *</label>
              <input formControlName="company" placeholder="e.g. ABC"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">APP TYPE *</label>
              <select formControlName="type" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                <option value="" disabled selected>Select type...</option>
                <option value="ELD">ELD App</option>
                <option value="GPS">GPS / Tracking</option>
                <option value="Reefer">Reefer App</option>
                <option value="DashCam">DashCam App</option>
                <option value="Admin Dashboard">Admin Dashboard (White Label)</option>
                <option value="End User Dashboard">End User Dashboard (White Label)</option>
                <option value="Firmware">Firmware / Binary</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">DESCRIPTION *</label>
              <input formControlName="description" placeholder="e.g. ELD Application"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">PLATFORM *</label>
              <select formControlName="platform" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                <option value="" disabled selected>Select platform...</option>
                <option value="Android">Android</option>
                <option value="iOS">iOS</option>
                <option value="Windows">Windows</option>
                <option value="Binary">Binary</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">APP VERSION *</label>
              <input formControlName="appVersion" placeholder="e.g. ABC-235000-1.01"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">OS VERSION *</label>
              <input formControlName="osVersion" placeholder="e.g. Android 12.1"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </div>


          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">USER MANUAL (PDF/DOC)</label>
              <div class="relative">
                <input type="file" (change)="onManualSelected($event)" class="hidden" #manualInput />
                <button type="button" (click)="manualInput.click()"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-left text-sm text-slate-500 flex items-center gap-2">
                  <span class="material-symbols-outlined text-[18px]">upload_file</span>
                  {{ manualFile ? manualFile.name : 'Upload document...' }}
                </button>
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">RELEASE STATUS</label>
              <select formControlName="status" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                <option value="Latest">Latest</option>
                <option value="Stable">Stable</option>
                <option value="Beta">Beta</option>
                <option value="Legacy">Legacy</option>
              </select>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">EXECUTABLE FILE</label>
            <div class="bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 group hover:border-primary/50 transition-all">
              <input type="file" #fileInput class="hidden" (change)="onFileSelected($event)" />
              <button type="button" (click)="fileInput.click()" class="w-full flex flex-col items-center gap-2">
                <div class="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <span class="material-symbols-outlined text-slate-400 text-[32px]">cloud_upload</span>
                </div>
                <div class="text-center">
                  <p class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ uploadedFileName || 'Click to upload .apk, .ipa, .exe, or binary' }}</p>
                  <p class="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold italic">Android · iOS · Windows · Binary</p>
                </div>
              </button>
            </div>
          </div>

          <div class="flex items-center gap-4 pt-4">
             <button type="submit" [disabled]="uploadForm.invalid"
              class="flex-1 bg-primary text-white py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100">
              Save Artifact
            </button>
          </div>
        </form>
      </div>
    </div>
  }

  <!-- Version History Modal -->
  @if (showVersionHistoryModal) {
    <div class="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" (click)="showVersionHistoryModal = false">
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" (click)="$event.stopPropagation()">
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 class="text-lg font-bold">Version History</h2>
          <button (click)="showVersionHistoryModal = false" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span class="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            @for (h of versionHistory; track h.version) {
              <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <p class="text-sm font-bold">{{ h.version }}</p>
                  <p class="text-[10px] text-slate-500">{{ h.date }}</p>
                </div>
                <span [class]="'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ' + getStatusBadge(h.status)">{{ h.status }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  }
  `,
  styles: [`:host { display: block; } .cursor-context-menu { cursor: context-menu; }`]
})
export class AppsComponent implements OnInit {
  searchTerm = '';
  activeCategory = 'All';
  activePlatform = 'All';
  showContextMenu = false;
  menuX = 0;
  menuY = 0;
  selectedApp: AppArtifact | null = null;
  showUploadModal = false;
  showVersionHistoryModal = false;
  uploadedFileName = '';
  binaryFile: File | null = null;
  manualFile: File | null = null;
  editingAppId: number | null = null;
  uploadForm!: FormGroup;

  artifacts: AppArtifact[] = [];
  versionHistory: VersionHistory[] = [];

  categories = [
    { id: 'All', name: 'All Files', icon: 'grid_view' },
    { id: 'ELD', name: 'ELD Apps', icon: 'local_shipping' },
    { id: 'GPS', name: 'GPS & Tracking', icon: 'location_on' },
    { id: 'Admin Dashboard', name: 'Admin Dashboards', icon: 'dashboard' },
    { id: 'End User Dashboard', name: 'User Dashboards', icon: 'person' },
    { id: 'Firmware', name: 'Firmware Binaries', icon: 'memory' },
  ];

  platforms = [
    { id: 'All', name: 'All Platforms', icon: 'devices' },
    { id: 'Android', name: 'Android', icon: 'android' },
    { id: 'iOS', name: 'iOS', icon: 'phone_iphone' },
    { id: 'Windows', name: 'Windows', icon: 'desktop_windows' },
    { id: 'Binary', name: 'Binary / Other', icon: 'terminal' },
  ];

  constructor(private fb: FormBuilder, private http: HttpClient) { }

  ngOnInit() {
    this.initForm();
    this.loadArtifacts();
  }

  initForm() {
    this.uploadForm = this.fb.group({
      company: ['', Validators.required],
      type: ['', Validators.required],
      description: ['', Validators.required],
      platform: ['', Validators.required],
      appVersion: ['', Validators.required],
      osVersion: ['', Validators.required],
      status: ['Latest', Validators.required],
      isDotCancelled: [false]
    });
  }

  loadArtifacts() {
    this.http.get<any[]>(`${API_BASE_URL}/api/apps.php`).subscribe({
      next: (data) => {
        this.artifacts = (data || []).map(item => this.mapBackendToArtifact(item));
        localStorage.setItem('appsData', JSON.stringify(this.artifacts));

        // Fetch Live Store Versions for Mobile platforms
        this.artifacts.forEach(app => {
          if (app.platform === 'Android' || app.platform === 'iOS') {
            this.loadLiveStoreVersion(app);
          }
        });
      },
      error: (err) => {
        const local = localStorage.getItem('appsData');
        if (local) this.artifacts = JSON.parse(local);
      }
    });
  }

  loadLiveStoreVersion(app: AppArtifact) {
    this.http.get<any>(`${API_BASE_URL}/api/apps.php?cmd=check_live_version&company=${encodeURIComponent(app.company)}`)
      .subscribe({
        next: (res) => {
          if (res.status === 'success' && res.live_version) {
            app.liveStoreVersion = res.live_version;
            app.liveStoreDate = res.release_date;
            app.liveStoreError = undefined;
          } else {
            app.liveStoreError = res.message || 'Unknown error';
          }
        },
        error: (err) => {
          app.liveStoreError = 'Connection failed';
        }
      });
  }

  mapBackendToArtifact(data: any): AppArtifact {
    return {
      ...data,
      appVersion: data.app_version,
      osVersion: data.os_version,
      firmwareVersion: data.firmware_version,
      effectiveDate: data.created_at ? data.created_at.split(' ')[0] : 'N/A',
      fwEffectiveDate: data.created_at ? data.created_at.split(' ')[0] : 'N/A',
      status: data.artifact_status as ArtifactStatus || 'Stable',
      type: (data.app_type || 'ELD') as AppType,
      uploadedAt: data.created_at,
      isLocked: data.is_locked == 1,
      isEncrypted: data.is_encrypted == 1,
      isDotCancelled: data.dot_cancelled == 1,
      triggerLoginUpdate: data.trigger_login_update == 1,
      userManualUrl: data.user_manual ? `${API_BASE_URL}/storage/apps/${data.user_manual}` : '#'
    };
  }

  get filteredArtifacts() {
    return this.artifacts.filter(a => {
      const search = this.searchTerm.toLowerCase();
      const matchesSearch = !search ||
        a.company.toLowerCase().includes(search) ||
        a.description.toLowerCase().includes(search) ||
        a.appVersion.toLowerCase().includes(search) ||
        a.hardware.toLowerCase().includes(search);
      const matchesPlatform = this.activePlatform === 'All' || a.platform === this.activePlatform;
      const matchesCategory = this.activeCategory === 'All' || a.type === this.activeCategory;
      return matchesSearch && matchesPlatform && matchesCategory;
    });
  }

  getStats() {
    return [
      { label: 'Total Apps', value: this.artifacts.length, icon: 'inventory_2', color: 'text-primary' },
      { label: 'Latest', value: this.artifacts.filter(a => a.status === 'Latest').length, icon: 'verified', color: 'text-green-500' },
      { label: 'Critical', value: this.artifacts.filter(a => a.isDotCancelled).length, icon: 'gpp_bad', color: 'text-red-500' },
      { label: 'OTA Ready', value: this.artifacts.filter(a => a.triggerLoginUpdate).length, icon: 'sync', color: 'text-sky-500' },
      { label: 'Android', value: this.artifacts.filter(a => a.platform === 'Android').length, icon: 'android', color: 'text-emerald-500' }
    ];
  }

  getStatBg(color: string) {
    if (color.includes('green') || color.includes('emerald')) return 'bg-green-50';
    if (color.includes('red')) return 'bg-red-50';
    if (color.includes('sky')) return 'bg-sky-50';
    return 'bg-primary/5';
  }

  getPlatformIcon(p: string) {
    return this.platforms.find(pl => pl.id === p)?.icon || 'devices';
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

  openUploadModal() { this.initForm(); this.uploadedFileName = ''; this.binaryFile = null; this.manualFile = null; this.editingAppId = null; this.showUploadModal = true; }
  closeUploadModal() { this.showUploadModal = false; }

  onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) { this.uploadedFileName = file.name; this.binaryFile = file; }
  }

  onManualSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) { this.manualFile = file; }
  }

  submitUpload() {
    if (this.uploadForm.invalid) return;
    const v = this.uploadForm.value;
    const formData = new FormData();
    formData.append('cmd', 'save_app');
    formData.append('company', v.company);
    formData.append('description', v.description);
    formData.append('app_type', v.type);
    formData.append('platform', v.platform);
    formData.append('app_version', v.appVersion);
    formData.append('os_version', v.osVersion);
    formData.append('hardware', v.hardware);
    formData.append('firmware_version', v.firmwareVersion);
    formData.append('artifact_status', v.status);
    formData.append('dot_cancelled', v.isDotCancelled ? '1' : '0');
    if (this.binaryFile) formData.append('binary', this.binaryFile);
    if (this.manualFile) formData.append('user_manual', this.manualFile);
    if (this.editingAppId) formData.append('id', this.editingAppId.toString());

    this.http.post<any>(`${API_BASE_URL}/api/apps.php`, formData).subscribe({
      next: (resp) => {
        alert(resp.message);
        this.loadArtifacts();
        this.closeUploadModal();

        // Automatically trigger store upload for Mobile platforms
        if (resp.id && (v.platform === 'Android' || v.platform === 'iOS')) {
          this.handleStoreUploadTrigger(resp.id, v.platform, v.appVersion);
        }
      },
      error: (err) => alert("Upload failed: " + err.message)
    });
  }

  editApp(app: AppArtifact) {
    this.editingAppId = app.id;
    this.uploadForm.patchValue({
      company: app.company, type: app.type, description: app.description,
      platform: app.platform, appVersion: app.appVersion, osVersion: app.osVersion,
      status: app.status, isDotCancelled: app.isDotCancelled
    });
    this.uploadedFileName = app.binary_file_name || '';
    this.showUploadModal = true;
  }

  moveToArchive(id: number) {
    if (confirm('Move this record to Archive? it will disappear from main Repository.')) {
      const formData = new FormData();
      formData.append('cmd', 'archive');
      formData.append('id', id.toString());
      this.http.post<any>(`${API_BASE_URL}/api/apps.php`, formData).subscribe({
        next: (resp) => {
          this.showContextMenu = false;
          this.loadArtifacts();
        },
        error: () => alert("Archive failed")
      });
    }
  }

  deleteApp(id: number) {
    if (confirm("Delete this artifact permanently?")) {
      this.http.get<any>(`${API_BASE_URL}/api/apps.php?cmd=delete&id=${id}`).subscribe({
        next: (resp) => { alert(resp.message); this.loadArtifacts(); },
        error: (err) => alert("Delete failed")
      });
    }
    this.showContextMenu = false;
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

  downloadArtifact(app: AppArtifact | null) {
    if (!app) return;
    if (app.binary_file_name) window.open(`${API_BASE_URL}/storage/apps/${app.binary_file_name}`, '_blank');
    else alert("No binary available.");
    this.showContextMenu = false;
  }

  openVersionHistoryFor(app: AppArtifact | null) {
    if (!app) return;
    const formData = new FormData();
    formData.append('cmd', 'history');
    formData.append('company', app.company);
    formData.append('app_type', app.app_type);
    formData.append('platform', app.platform);
    this.http.post<any[]>(`${API_BASE_URL}/api/apps.php`, formData).subscribe({
      next: (data) => {
        this.versionHistory = data.map(i => ({
          version: i.app_version, date: i.created_at.split(' ')[0],
          platform: i.platform as Platform, status: i.artifact_status as ArtifactStatus
        }));
        this.showVersionHistoryModal = true;
      },
      error: () => alert("History load failed")
    });
    this.showContextMenu = false;
  }

  toggleDotCancelled(app: AppArtifact | null) {
    if (!app) return;
    app.isDotCancelled = !app.isDotCancelled;
    this.showContextMenu = false;
  }

  triggerStoreUpload(app: AppArtifact | null) {
    if (!app) return;
    const isAndroid = app.platform === 'Android';
    const isIOS = app.platform === 'iOS';
    const storeName = isAndroid ? 'Google Play Store' : 'Apple Store';
    
    let actionDesc = '';
    if (isAndroid || isIOS) {
      actionDesc = `upload version ${app.appVersion} to the ${storeName} and initiate the background process to update end users upon their next login?`;
    } else {
      actionDesc = `trigger an OTA update stream for firmware ${app.firmwareVersion}?`;
    }

    if (confirm(`Do you want to ${actionDesc}`)) {
      this.handleStoreUploadTrigger(app.id, app.platform, app.appVersion);
    }
    this.showContextMenu = false;
  }

  handleStoreUploadTrigger(id: number, platform: string, version: string) {
    const isStore = platform === 'Android' || platform === 'iOS';
    this.http.get<any>(`${API_BASE_URL}/api/apps.php?cmd=store_upload&id=${id}`).subscribe({
      next: (resp) => {
        if (isStore) {
          alert(`🚀 Fastlane Automation Started!\n\nPlatform: ${platform}\nVersion: ${version}\n\nApp will be processed for the ${platform === 'Android' ? 'Play Store' : 'App Store'} in the background. Check 'Store Status' column for updates.`);
          console.log(`Fastlane automation initiated for ${platform} v${version}`);
        } else {
          alert(resp.message);
        }
        this.loadArtifacts();
      },
      error: (err) => alert("Store upload trigger failed.")
    });
  }

  openFirmwareUpdateModal(app: AppArtifact | null) { }
}

