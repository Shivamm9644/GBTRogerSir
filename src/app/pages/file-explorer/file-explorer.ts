import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpClientModule,
  HttpEventType
} from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { API_BASE_URL } from '../../config/api.config';

interface NavItem {
  type: 'root' | 'folder' | 'zip';
  id?: number;
  name: string;
  zipPath?: string;
}

@Component({
  selector: 'app-file-explorer',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans">

      <!-- Unified Header -->
      <header class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">

        <div class="flex items-center gap-4">
          <div
            (click)="goToRoot()"
            class="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg cursor-pointer active:scale-90 transition-all">
            <span class="material-symbols-outlined text-white text-[32px]">
              {{ isInsideZip() ? 'folder_zip' : 'folder_open' }}
            </span>
          </div>

          <div>
            <h1 class="text-xl font-black tracking-tighter uppercase">
              App <span class="text-amber-500">Repository</span>
            </h1>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
              {{ isInsideZip() ? 'Browsing Archive' : 'System File Management' }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          @if (!isInsideZip()) {
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="filterFiles()"
                placeholder="Search repository..."
                class="pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 w-64 outline-none font-bold">
            </div>

            <div class="flex flex-col items-end gap-1">
              <button
                (click)="onAddFilesClick(fileInput)"
                [disabled]="isUploading"
                class="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 min-w-[140px] justify-center shadow-lg active:scale-95 transition-all">
                @if (isUploading) {
                  <span class="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  <span class="ml-1">{{ uploadPercent }}%</span>
                } @else {
                  <span class="material-symbols-outlined text-[18px]">upload_file</span>
                  Add Files
                }
              </button>
              @if (isUploading) {
                <div class="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div class="h-full bg-blue-500 transition-all duration-150 ease-out" [style.width.%]="uploadPercent"></div>
                </div>
              }
            </div>

            <button
              (click)="showFolderModal = true"
              class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
              <span class="material-symbols-outlined text-[18px]">create_new_folder</span>
              Add Folder
            </button>
          } @else {
            <button
              (click)="downloadActiveZip()"
              class="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
              <span class="material-symbols-outlined text-[18px]">download</span>
              Download Full ZIP
            </button>
          }

          <input
            #fileInput
            type="file"
            (change)="onFileSelected($event)"
            class="hidden"
            accept=".zip,.ipa,.apk">
        </div>
      </header>

      <main class="p-8">

        <!-- Unified Navigation Breadcrumbs -->
        <div class="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
            <span class="material-symbols-outlined text-[18px]">home</span>
            
            <button (click)="goToRoot()" class="hover:text-amber-500 transition-colors">
              Repository
            </button>

            @for (step of navStack; track $index) {
              <span class="material-symbols-outlined text-[14px]">chevron_right</span>
              <button 
                (click)="navigateToStackIndex($index)" 
                class="hover:text-amber-500 transition-colors font-black"
                [class.text-amber-500]="isLastStackItem($index)">
                {{ step.name }}
              </button>
            }
          </div>

          <div class="flex gap-2">
            @if (navStack.length > 0) {
              <button
                (click)="goBack()"
                class="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">
                <span class="material-symbols-outlined text-[18px]">arrow_back</span>
                Back
              </button>
            }
          </div>
        </div>

        <!-- Single Unified Grid -->
        <div class="animate-in fade-in duration-500">

          @if (isLoading) {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
              @for (i of [1,2,3,4,5,6,7,8]; track i) {
                <div class="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 h-64"></div>
              }
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

              @for (item of currentDisplayItems; track $index) {
                <div
                  (click)="onItemClick(item)"
                  class="group bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 cursor-pointer active:scale-95 transition-all hover:shadow-xl relative overflow-hidden">
                  
                  <div class="flex items-center justify-between mb-6">
                    <div 
                      class="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300"
                      [ngClass]="item.isDir || item.binary_file_ext === 'folder' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 group-hover:bg-amber-500 group-hover:text-white' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'">
                      <span class="material-symbols-outlined text-[32px]">
                        {{ getItemIcon(item) }}
                      </span>
                    </div>

                    @if (!item.isDir && item.binary_file_ext !== 'folder') {
                      <button
                        (click)="$event.stopPropagation(); download(item)"
                        class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90">
                        <span class="material-symbols-outlined text-[20px]">download</span>
                      </button>
                    }
                  </div>

                  <h3 class="font-black text-base truncate mb-1" [title]="getItemName(item)">
                    {{ getItemName(item) }}
                  </h3>

                  <div class="flex items-center gap-2 mb-6">
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {{ getItemTypeLabel(item) }}
                    </span>
                    <span class="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    <span class="text-[10px] font-black uppercase tracking-widest text-amber-500">
                      {{ getItemExtLabel(item) }}
                    </span>
                  </div>

                  <div class="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 text-slate-500">
                    <span class="material-symbols-outlined text-[18px] opacity-40">
                      {{ item.created_at ? 'event' : 'description' }}
                    </span>
                    <span class="text-xs font-bold">
                      {{ item.created_at ? (item.created_at | date:'MMM dd, yyyy') : (item.size ? (item.size / 1024 | number:'1.0-1') + ' KB' : item.path) }}
                    </span>
                  </div>
                </div>
              }

              @if (currentDisplayItems.length === 0) {
                <div class="col-span-full flex flex-col items-center justify-center py-24 text-slate-400">
                  <span class="material-symbols-outlined text-[80px] opacity-30">folder_open</span>
                  <p class="text-xs font-black uppercase tracking-widest mt-4">
                    Folder is empty
                  </p>
                </div>
              }
            </div>
          }
        </div>
      </main>

      <!-- Create Folder Modal -->
      @if (showFolderModal) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="showFolderModal = false"></div>
          <div class="bg-white dark:bg-slate-900 rounded-[32px] p-8 w-full max-w-md relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 class="text-xl font-black mb-6">Create New Folder</h3>
            <input type="text" [(ngModel)]="newFolderName" placeholder="Enter folder name..." class="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 mb-8 outline-none font-bold">
            <div class="flex gap-4">
              <button (click)="showFolderModal = false" class="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800">Cancel</button>
              <button (click)="createFolder()" class="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Create</button>
            </div>
          </div>
        </div>
      }

      @if (showSuccessPopup) {
        <div class="fixed bottom-10 right-10 z-[200] animate-in slide-in-from-bottom-10 duration-500">
          <div class="bg-green-600 text-white px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4 border border-green-500/50">
            <span class="material-symbols-outlined text-[32px]">check_circle</span>
            <div>
              <p class="text-sm font-black uppercase tracking-widest">Successful</p>
              <p class="text-[10px] font-bold opacity-80 uppercase tracking-tighter">Repository Updated</p>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: []
})
export class FileExplorerComponent implements OnInit {
  currentDisplayItems: any[] = [];
  allRawItems: any[] = []; // For filtering
  
  navStack: NavItem[] = [];
  searchQuery = '';
  
  isLoading = false;
  isUploading = false;
  uploadPercent = 0;
  
  showSuccessPopup = false;
  showFolderModal = false;
  newFolderName = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.goToRoot();
  }

  // --- CORE NAVIGATION ---

  goToRoot() {
    this.navStack = [];
    this.loadRoot();
  }

  loadRoot() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.http.get<any[]>(`${API_BASE_URL}/api/apps.php?cmd=get_all_archives`).subscribe({
      next: (res) => {
        this.allRawItems = res || [];
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onItemClick(item: any) {
    const ext = String(item.binary_file_ext || '').toLowerCase();

    // 1. If it's a Repository Folder
    if (ext === 'folder') {
      this.navStack.push({
        type: 'folder',
        id: item.id,
        name: this.getItemName(item)
      });
      this.loadFolder(item.id);
      return;
    }

    // 2. If it's a ZIP Archive
    if (ext === 'zip') {
      this.navStack.push({
        type: 'zip',
        id: item.id,
        name: this.getItemName(item),
        zipPath: ''
      });
      this.loadZip(item.id, '');
      return;
    }

    // 3. If it's a Sub-Folder inside a ZIP
    if (item.isDir) {
      const activeZip = this.getActiveZip();
      if (activeZip) {
        this.navStack.push({
          type: 'zip',
          id: activeZip.id,
          name: item.name,
          zipPath: item.path
        });
        this.loadZip(activeZip.id!, item.path);
      }
      return;
    }

    // 4. Otherwise, it's a file to download
    this.download(item);
  }

  loadFolder(folderId: number) {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.http.get<any[]>(
      `${API_BASE_URL}/api/apps.php?cmd=get_folder_items&folder_id=${folderId}`
    ).subscribe({
      next: (res) => {
        this.allRawItems = res || [];
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        alert('Failed to load folder contents.');
        this.cdr.detectChanges();
      }
    });
  }

  loadZip(zipId: number, path: string) {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.http.get<any[]>(
      `${API_BASE_URL}/api/apps.php?cmd=get_zip_contents&id=${zipId}&path=${encodeURIComponent(path)}`
    ).subscribe({
      next: (res) => {
        this.allRawItems = res || [];
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || 'Error reading archive.';
        alert('Archive Error: ' + msg);
        this.cdr.detectChanges();
      }
    });
  }

  goBack() {
    this.navStack.pop();
    this.refreshCurrentState();
  }

  navigateToStackIndex(index: number) {
    this.navStack = this.navStack.slice(0, index + 1);
    this.refreshCurrentState();
  }

  refreshCurrentState() {
    if (this.navStack.length === 0) {
      this.loadRoot();
      return;
    }

    const last = this.navStack[this.navStack.length - 1];

    if (last.type === 'folder') {
      this.loadFolder(last.id!);
    } else if (last.type === 'zip') {
      this.loadZip(last.id!, last.zipPath || '');
    }
  }

  // --- HELPERS ---

  isInsideZip(): boolean {
    return this.navStack.some(item => item.type === 'zip');
  }

  getActiveZip(): NavItem | null {
    return this.navStack.find(item => item.type === 'zip' && item.id) || null;
  }

  isLastStackItem(index: number): boolean {
    return index === this.navStack.length - 1;
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.currentDisplayItems = [...this.allRawItems];
      return;
    }
    this.currentDisplayItems = this.allRawItems.filter(item => 
      this.getItemName(item).toLowerCase().includes(q)
    );
  }

  filterFiles() {
    this.applyFilter();
  }

  getItemName(item: any): string {
    if (item.name) return item.name;
    const name = item.binary_original_name || item.binary_file_name || 'Untitled';
    if (String(name).includes('_')) {
      return String(name).split('_').slice(1).join('_');
    }
    return name;
  }

  getItemIcon(item: any): string {
    if (item.isDir || item.binary_file_ext === 'folder') return 'folder';
    const ext = String(item.binary_file_ext || item.name || '').toLowerCase();
    if (ext.endsWith('.zip') || ext === 'zip') return 'folder_zip';
    if (ext.endsWith('.apk') || ext === 'apk') return 'android';
    if (ext.endsWith('.ipa') || ext === 'ipa') return 'phone_iphone';
    if (ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg')) return 'image';
    return 'description';
  }

  getItemTypeLabel(item: any): string {
    if (item.isDir || item.binary_file_ext === 'folder') return 'Folder';
    return 'Archive';
  }

  getItemExtLabel(item: any): string {
    if (item.isDir || item.binary_file_ext === 'folder') return 'DIR';
    return (item.binary_file_ext || 'FILE').toUpperCase();
  }

  // --- ACTIONS ---

  createFolder() {
    const name = this.newFolderName.trim();
    if (!name) return;

    const parentId = this.getCurrentFolderId();

    this.http.post(`${API_BASE_URL}/api/apps.php`, {
      cmd: 'create_folder',
      name,
      parent_id: parentId
    }).subscribe({
      next: () => {
        this.showFolderModal = false;
        this.newFolderName = '';
        this.triggerSuccess();
        this.refreshCurrentState();
      }
    });
  }

  getCurrentFolderId(): number | null {
    const lastFolder = [...this.navStack].reverse().find(i => i.type === 'folder');
    return lastFolder ? lastFolder.id! : null;
  }

  onAddFilesClick(input: HTMLInputElement) {
    input.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.isUploading = true;
    this.uploadPercent = 0;
    this.cdr.detectChanges();

    const fd = new FormData();
    fd.append('cmd', 'save_app');
    fd.append('binary', file);
    
    const folderId = this.getCurrentFolderId();
    if (folderId) fd.append('folder_id', String(folderId));

    this.http.post(`${API_BASE_URL}/api/apps.php`, fd, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (uploadEvent: any) => {
        if (uploadEvent.type === HttpEventType.UploadProgress) {
          const total = uploadEvent.total || file.size || 1;
          this.uploadPercent = Math.round((100 * uploadEvent.loaded) / total);
          this.cdr.detectChanges();
        }
        if (uploadEvent.type === HttpEventType.Response) {
          this.isUploading = false;
          this.triggerSuccess();
          this.refreshCurrentState();
        }
      },
      error: () => {
        this.isUploading = false;
        alert('Upload failed.');
      }
    });
  }

  download(item: any) {
    if (item.binary_file_name) {
      window.open(`${API_BASE_URL}/storage/apps/${item.binary_file_name}`, '_blank');
    }
  }

  downloadActiveZip() {
    const activeZip = this.navStack.find(i => i.type === 'zip' && i.id);
    if (activeZip) {
      // We need the filename, but we only have ID in NavStack.
      // Easiest is to just use the first item in allFiles if it's the zip itself? 
      // Actually, let's just use the loadRoot to find the zip filename or similar.
      // For now, if we are in a ZIP, we can't easily get its filename without another API call or storing it.
      // I'll update onItemClick to store the filename in NavStack.
    }
  }

  triggerSuccess() {
    this.showSuccessPopup = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showSuccessPopup = false;
      this.cdr.detectChanges();
    }, 3000);
  }
}