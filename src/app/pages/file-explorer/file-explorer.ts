import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

const API_BASE_URL = 'http://localhost:8000';

@Component({
  selector: 'app-file-explorer',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30 selection:text-blue-200">
      
      <!-- Sticky Header -->
      <header class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div (click)="viewingZip = null" class="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/10 cursor-pointer transition-all active:scale-90">
            <span class="material-symbols-outlined text-white text-[32px]">folder_open</span>
          </div>
          <div>
            <h1 class="text-xl font-black tracking-tighter flex items-center gap-2">
              FILE <span class="text-amber-500">EXPLORER</span>
            </h1>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">System File Management</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="relative group">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input type="text" [(ngModel)]="searchQuery" (input)="filterFiles()" placeholder="Search files..." 
                   class="pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500 transition-all w-64">
          </div>
          <button (click)="onAddFilesClick(fileInput)" class="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">
            <span class="material-symbols-outlined text-[18px]">upload_file</span>
            Add Files
          </button>
          <button (click)="onAddFilesClick(fileInput)" class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95">
            <span class="material-symbols-outlined text-[18px]">create_new_folder</span>
            Add Folder
          </button>
          <input #fileInput type="file" (change)="onZipSelected($event)" class="hidden" accept=".zip,.ipa,.apk">
        </div>
      </header>

      <main class="p-8">
        
        <!-- STEP 1: Main Archive List (Full Screen) -->
        @if (!viewingZip) {
          @if (allFiles.length === 0) {
            <!-- Skeleton Loader -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
              @for (i of [1,2,3,4,5,6,7,8]; track i) {
                <div class="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 h-64">
                  <div class="w-14 h-14 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-6"></div>
                  <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-4"></div>
                  <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-8"></div>
                  <div class="space-y-3">
                    <div class="h-2 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                    <div class="h-2 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              @for (file of filteredFiles; track file.id) {
                <div (mousedown)="viewZip(file)" 
                     [class.ring-2]="viewingZip?.id === file.id"
                     [class.ring-amber-500]="viewingZip?.id === file.id"
                     [class.bg-amber-500/5]="viewingZip?.id === file.id"
                     class="group bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all hover:shadow-2xl hover:shadow-amber-500/5 cursor-pointer relative overflow-hidden active:scale-95">
                  <div class="flex items-center justify-between mb-6">
                    <div class="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                      <span class="material-symbols-outlined text-[32px]">{{ getIcon(file.binary_file_ext) }}</span>
                    </div>
                    <button (click)="$event.stopPropagation(); download(file)" class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                      <span class="material-symbols-outlined text-[20px]">download</span>
                    </button>
                  </div>
                  
                  <h3 class="font-black text-slate-900 dark:text-white text-base truncate mb-1" [title]="file.binary_file_name">
                    {{ file.binary_file_name }}
                  </h3>
                  <div class="flex items-center gap-2 mb-6">
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ file.app_type }}</span>
                    <span class="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    <span class="text-[10px] font-black uppercase tracking-widest text-amber-500">{{ file.platform }}</span>
                  </div>

                  <div class="space-y-3 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                    <div class="flex items-center gap-3 text-slate-500">
                      <span class="material-symbols-outlined text-[18px] opacity-40">label</span>
                      <span class="text-xs font-bold">V{{ file.app_version }}</span>
                    </div>
                    <div class="flex items-center gap-3 text-slate-500">
                      <span class="material-symbols-outlined text-[18px] opacity-40">event</span>
                      <span class="text-xs font-bold">{{ file.created_at | date:'MMM dd, yyyy' }}</span>
                    </div>
                  </div>

                  <div class="mt-6 flex items-center justify-between">
                    <span class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-black uppercase tracking-tighter">{{ file.binary_file_ext }}</span>
                    <button (click)="$event.stopPropagation(); restore(file.id)" class="text-amber-500 text-[10px] font-black uppercase tracking-widest hover:underline">Restore to Latest</button>
                  </div>
                </div>
              }
            </div>
          }
        }

        <!-- STEP 2: Deep ZIP Inspection (Full Screen) -->
        @if (viewingZip) {
          <div class="animate-in fade-in slide-in-from-right-4 duration-500">
            <!-- Inspection Header -->
            <div class="flex flex-col md:flex-row items-center justify-between mb-8 p-8 bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 gap-6">
              <div class="flex items-center gap-6">
                <button (click)="viewingZip = null" class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-lg active:scale-90">
                  <span class="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                  <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{{ viewingZip.binary_file_name }}</h2>
                  <div class="flex items-center gap-3 mt-1">
                    <span class="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest rounded">Archive Explorer</span>
                    <span class="text-slate-400 text-xs font-bold tracking-tighter">{{ viewingZip.app_version }} • {{ viewingZip.platform }}</span>
                  </div>
                </div>
              </div>
              <div class="flex gap-3">
                <button (click)="download(viewingZip)" class="px-8 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.1em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20">Download Full ZIP</button>
              </div>
            </div>

            <!-- Windows Explorer Content Container -->
            <div class="bg-[#0f1115] rounded-[48px] p-10 min-h-[600px] shadow-2xl border border-white/5 overflow-hidden flex flex-col">
              
              <!-- Navigation Breadcrumbs -->
              <div class="flex items-center gap-2 mb-10 px-6 py-3 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <button (click)="navigateTo('')" class="text-[11px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em] flex items-center gap-2">
                  <span class="material-symbols-outlined text-[18px]">home</span>
                  ROOT
                </button>
                @for (part of currentPath.split('/'); track $index) {
                  @if (part) {
                    <span class="text-slate-700">/</span>
                    <button (click)="navigateTo(currentPath.split(part)[0] + part + '/')" class="text-[11px] font-black text-slate-300 hover:text-white transition-colors uppercase tracking-[0.2em]">
                      {{ part }}
                    </button>
                  }
                }
              </div>

              <div class="flex-1">
                @if (zipLoading) {
                  <div class="flex flex-col items-center justify-center py-40 gap-8">
                    <div class="relative">
                      <div class="w-20 h-20 border-4 border-amber-500/20 rounded-full"></div>
                      <div class="absolute inset-0 w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span class="material-symbols-outlined absolute inset-0 flex items-center justify-center text-amber-500 animate-pulse">folder_zip</span>
                    </div>
                    <div class="text-center">
                      <p class="text-xs font-black text-slate-200 uppercase tracking-[0.5em] mb-2">Restoring Session...</p>
                      <p class="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Mapping Archive Architecture</p>
                    </div>
                  </div>
                } @else {
                  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-10">
                    @for (item of getVisibleZipItems(); track item.name) {
                      <div (mousedown)="onZipItemClick(item)" class="group flex flex-col items-center text-center gap-4 p-5 rounded-[32px] hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/10 active:scale-95 select-none">
                        <div class="relative w-24 h-24 flex items-center justify-center">
                          @if (item.name.endsWith('/')) {
                            <div class="relative scale-110">
                              <span class="material-symbols-outlined text-[100px] text-amber-400 drop-shadow-[0_15px_30px_rgba(251,191,36,0.2)] group-hover:scale-105 transition-transform duration-500">folder</span>
                              <div class="absolute inset-0 flex items-center justify-center pt-3 opacity-30">
                                <span class="material-symbols-outlined text-[24px] text-white">folder_open</span>
                              </div>
                            </div>
                          } @else {
                            <div class="relative">
                              <span class="material-symbols-outlined text-[88px] text-slate-100 group-hover:text-blue-400 transition-colors duration-300">description</span>
                              <div class="absolute bottom-2 right-2 bg-blue-600 text-[10px] font-black text-white px-2 py-0.5 rounded shadow-lg uppercase tracking-tight">
                                {{ item.name.split('.').pop() }}
                              </div>
                            </div>
                          }
                        </div>
                        <div class="w-full">
                          <p class="text-[13px] font-bold text-slate-200 truncate group-hover:whitespace-normal group-hover:break-all line-clamp-2 px-2 leading-tight">
                            {{ item.shortName }}
                          </p>
                          @if (!item.name.endsWith('/')) {
                            <p class="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-tighter opacity-60">{{ formatSize(item.size) }}</p>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  @if (getVisibleZipItems().length === 0) {
                    <div class="flex flex-col items-center justify-center py-40 text-slate-800">
                      <span class="material-symbols-outlined text-[120px] opacity-10">folder_open</span>
                      <p class="font-black text-xs uppercase tracking-[0.5em] mt-8 opacity-20">This folder is empty</p>
                    </div>
                  }
                }
              </div>
            </div>
          </div>
        }
      </main>
    </div>

    <style>
      .scrollbar-hide::-webkit-scrollbar { display: none; }
    </style>
  `,
  styles: []
})
export class FileExplorerComponent implements OnInit {
  allFiles: any[] = [];
  filteredFiles: any[] = [];
  searchQuery: string = '';
  viewingZip: any = null;
  zipFiles: any[] = [];
  zipLoading = false;
  currentPath = '';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.load();
  }

  load() {
    this.http.get<any[]>(`${API_BASE_URL}/api/apps.php?cmd=get_all_archives`).subscribe({
      next: (res) => {
        this.allFiles = res;
        this.filterFiles();
        
        // Restore session if exists
        const savedId = localStorage.getItem('last_viewing_zip');
        if (savedId) {
          const file = this.allFiles.find(f => f.id.toString() === savedId);
          if (file) {
            const savedPath = localStorage.getItem('last_zip_path') || '';
            this.viewZip(file, savedPath);
          }
        }
      },
      error: (err) => console.error("Load failed:", err)
    });
  }

  filterFiles() {
    const q = this.searchQuery.toLowerCase();
    this.filteredFiles = this.allFiles.filter(f => 
      f.binary_file_name.toLowerCase().includes(q) || 
      f.app_type.toLowerCase().includes(q)
    );
  }

  getIcon(ext: string): string {
    const e = ext?.toLowerCase();
    if (e === 'zip') return 'folder_zip';
    if (e === 'ipa') return 'apple';
    if (e === 'apk') return 'android';
    return 'description';
  }

  viewZip(file: any, path: string = '') {
    this.viewingZip = file;
    this.zipLoading = true;
    this.zipFiles = [];
    this.currentPath = path;
    
    // Save to local storage for refresh persistence
    localStorage.setItem('last_viewing_zip', file.id.toString());
    localStorage.setItem('last_zip_path', path);

    this.http.get<any[]>(`${API_BASE_URL}/api/apps.php?cmd=get_zip_contents&id=${file.id}`).subscribe({
      next: (res) => {
        if (!Array.isArray(res)) {
          this.zipFiles = [];
          this.zipLoading = false;
          return;
        }

        this.zipFiles = res.map(item => {
          const parts = item.name.split('/');
          const isDir = item.name.endsWith('/');
          const shortName = isDir ? parts[parts.length - 2] : parts[parts.length - 1];
          return { ...item, shortName };
        });

        this.zipLoading = false;
      },
      error: (err) => {
        console.error("Failed to read ZIP:", err);
        this.zipLoading = false;
      }
    });
  }

  getVisibleZipItems() {
    return this.zipFiles.filter(item => {
      const name = item.name;
      if (!name.startsWith(this.currentPath)) return false;
      const relative = name.substring(this.currentPath.length);
      if (!relative) return false;
      const parts = relative.split('/');
      if (name.endsWith('/') && parts.length === 2) return true;
      if (!name.endsWith('/') && parts.length === 1) return true;
      return false;
    }).sort((a: any, b: any) => {
      const aIsDir = a.name.endsWith('/');
      const bIsDir = b.name.endsWith('/');
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  onZipItemClick(item: any) {
    if (item.name.endsWith('/')) {
      this.currentPath = item.name;
      localStorage.setItem('last_zip_path', this.currentPath);
    }
  }

  navigateTo(path: string) {
    if (path === '') {
      this.viewingZip = null;
      localStorage.removeItem('last_viewing_zip');
      localStorage.removeItem('last_zip_path');
    }
    this.currentPath = path;
    localStorage.setItem('last_zip_path', this.currentPath);
  }

  download(file: any) {
    window.open(`${API_BASE_URL}/storage/apps/${file.binary_file_name}`, '_blank');
  }

  restore(id: number) {
    if (confirm("Restore this file to the main repository?")) {
      const fd = new FormData();
      fd.append('cmd', 'restore');
      fd.append('id', id.toString());
      this.http.post(`${API_BASE_URL}/api/apps.php`, fd).subscribe(() => {
        alert("Restored!");
        this.load();
      });
    }
  }

  onAddFilesClick(input: HTMLInputElement) {
    input.click();
  }

  onZipSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.uploadZip(file);
  }

  uploadZip(file: File) {
    const fd = new FormData();
    fd.append('cmd', 'save_app');
    fd.append('company', 'Manual Archive');
    fd.append('app_type', 'Source Master');
    fd.append('platform', 'Binary');
    fd.append('app_version', '1.0.0');
    fd.append('binary', file);

    this.http.post(`${API_BASE_URL}/api/apps.php`, fd).subscribe(() => {
      alert("Uploaded!");
      this.load();
    });
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
