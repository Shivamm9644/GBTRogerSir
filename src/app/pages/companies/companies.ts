import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../../config/api.config';

// ── Update this to match your PHP server URL ────────────────────────────────
// If you run:  cd backend && php -S localhost:8000
// Leave this as-is. Otherwise update to your XAMPP / server URL.
const API_BASE = API_BASE_URL;

interface Company {
  id?: number;
  company_name: string;
  package_name?: string;
  owner_name: string;
  owner_mobile: string;
  owner_email: string;
  address: string;
  admin_url: string;
  created_at?: string;
}

@Component({
  selector: 'app-companies',
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="p-8 space-y-6 min-h-full">

      <!-- ── Page Header ────────────────────────────────────────────────── -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Companies</h2>
          <p class="text-slate-500 text-sm mt-1">Manage registered companies and their admin portals.</p>
        </div>
        <button id="btn-add-company" (click)="openAddPanel()"
          class="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all cursor-pointer">
          <span class="material-symbols-outlined text-[18px]">add_business</span>
          Add Company
        </button>
      </div>

      <!-- ── Stats Row ──────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <span class="material-symbols-outlined text-blue-600">business</span>
          </div>
          <div>
            <p class="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Companies</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{{ companies.length }}</p>
          </div>
        </div>
        <div class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <span class="material-symbols-outlined text-green-600">link</span>
          </div>
          <div>
            <p class="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Portals</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{{ companies.length }}</p>
          </div>
        </div>
        <div class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <span class="material-symbols-outlined text-purple-600">calendar_today</span>
          </div>
          <div>
            <p class="text-slate-500 text-xs font-bold uppercase tracking-wider">Added This Month</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{{ thisMonthCount }}</p>
          </div>
        </div>
      </div>

      <!-- ── Search Bar ─────────────────────────────────────────────────── -->
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-primary/10 shadow-sm p-4">
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
          <input id="company-search" [(ngModel)]="searchQuery" type="text"
            placeholder="Search by name, owner, email or URL..."
            class="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-transparent rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder-slate-400 text-slate-700 dark:text-slate-200" />
        </div>
      </div>

      <!-- ── Loading State ──────────────────────────────────────────────── -->
      @if (loading) {
        <div class="flex flex-col items-center justify-center py-20 gap-3">
          <div class="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p class="text-slate-400 text-sm font-medium">Loading companies...</p>
        </div>
      }

      <!-- ── Error State ────────────────────────────────────────────────── -->
      @if (error && !loading) {
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5 flex items-start gap-3">
          <span class="material-symbols-outlined text-red-500 mt-0.5">error</span>
          <div class="flex-1">
            <p class="font-semibold text-red-700 dark:text-red-400">Failed to load companies</p>
            <p class="text-sm text-red-600 dark:text-red-500 mt-1">{{ error }}</p>
            <button (click)="loadCompanies()" class="mt-3 text-xs font-bold text-red-600 hover:underline">
              ↺ Retry
            </button>
          </div>
        </div>
      }

      <!-- ── Table ──────────────────────────────────────────────────────── -->
      @if (!loading && !error) {

        <!-- Empty State -->
        @if (filteredCompanies.length === 0) {
          <div class="bg-white dark:bg-slate-900 rounded-xl border border-primary/10 shadow-sm flex flex-col items-center justify-center py-20">
            <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <span class="material-symbols-outlined text-3xl text-slate-400">business</span>
            </div>
            <p class="font-semibold text-slate-700 dark:text-slate-300">
              {{ searchQuery ? 'No results found' : 'No companies yet' }}
            </p>
            <p class="text-slate-400 text-sm mt-1">
              {{ searchQuery ? 'Try a different search term.' : 'Get started by adding your first company.' }}
            </p>
            @if (!searchQuery) {
              <button (click)="openAddPanel()"
                class="mt-5 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                <span class="material-symbols-outlined text-[16px]">add</span> Add First Company
              </button>
            }
          </div>
        }

        <!-- Data Table -->
        @if (filteredCompanies.length > 0) {
          <div class="bg-white dark:bg-slate-900 rounded-xl border border-primary/10 shadow-sm overflow-hidden pb-2">
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead class="bg-slate-50 dark:bg-slate-800/60 border-b border-primary/10">
                  <tr>
                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Company</th>
                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Package ID</th>
                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Owner</th>
                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Admin Portal</th>
                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Added</th>
                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (company of filteredCompanies; track company.id; let i = $index) {
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">

                      <!-- # -->
                      <td class="px-6 py-4 text-xs text-slate-400 font-mono">{{ i + 1 }}</td>

                      <!-- Company Name + Address -->
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            [style.background]="getAvatarColor(company.company_name)">
                            {{ company.company_name.charAt(0).toUpperCase() }}
                          </div>
                          <div>
                            <p class="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-primary transition-colors">
                              {{ company.company_name }}
                            </p>
                            <p class="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{{ company.address || '—' }}</p>
                          </div>
                        </div>
                      </td>

                      <!-- Package Name -->
                      <td class="px-6 py-4">
                        <p class="text-xs font-mono text-slate-500">{{ company.package_name || '—' }}</p>
                      </td>

                      <!-- Owner Name -->
                      <td class="px-6 py-4">
                        <p class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ company.owner_name }}</p>
                      </td>

                      <!-- Contact (email + mobile) -->
                      <td class="px-6 py-4">
                        <p class="text-sm text-slate-600 dark:text-slate-400">{{ company.owner_email }}</p>
                        <p class="text-xs text-slate-400 mt-0.5">{{ company.owner_mobile }}</p>
                      </td>

                      <!-- Admin URL pill -->
                      <td class="px-6 py-4">
                        <button (click)="visitAdmin(company)"
                          class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors max-w-[200px] cursor-pointer">
                          <span class="material-symbols-outlined text-[13px]">open_in_new</span>
                          <span class="truncate">{{ getDomain(company.admin_url) }}</span>
                        </button>
                      </td>

                      <!-- Date -->
                      <td class="px-6 py-4">
                        <p class="text-sm text-slate-500">{{ formatDate(company.created_at) }}</p>
                      </td>

                      <!-- Actions -->
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-1">
                          <button (click)="viewCompany(company)" title="View Company Details"
                            class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors cursor-pointer">
                            <span class="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button (click)="openEditPanel(company)" title="Edit Company"
                            class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors cursor-pointer">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button (click)="visitAdmin(company)" title="Open Admin Portal"
                            class="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer">
                            <span class="material-symbols-outlined text-[18px]">launch</span>
                          </button>
                          <button (click)="confirmDelete(company)" title="Delete Company"
                            class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Table Footer -->
            <div class="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p class="text-xs text-slate-400">
                Showing <span class="font-semibold text-slate-600 dark:text-slate-300">{{ filteredCompanies.length }}</span>
                of <span class="font-semibold text-slate-600 dark:text-slate-300">{{ companies.length }}</span> companies
              </p>
            </div>
          </div>
        }
      }
    </div>

    <!-- ── Add Company Slide-Over Panel ──────────────────────────────────── -->
    @if (panelOpen) {
      <div class="fixed inset-0 z-50 flex justify-end">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="closePanel()"></div>

        <!-- Slide-over -->
        <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col"
          style="animation: slideIn 0.25s cubic-bezier(0.16,1,0.3,1);">

          <!-- Panel Header -->
          <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl" [class]="isEditing ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-primary/10'">
                <span class="material-symbols-outlined" [class]="isEditing ? 'text-indigo-600' : 'text-primary'">{{ isEditing ? 'edit' : 'add_business' }}</span>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 dark:text-white">{{ isEditing ? 'Edit Company' : 'Add New Company' }}</h3>
                <p class="text-xs text-slate-400 mt-0.5">{{ isEditing ? 'Update the company details below' : 'Fill in the details to register a company' }}</p>
              </div>
            </div>
            <button (click)="closePanel()"
              class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Form Body -->
          <div class="flex-1 overflow-y-auto p-6">
            <form [formGroup]="companyForm" (ngSubmit)="submitForm()" class="space-y-5">

              <!-- Company Name -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Company Name <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">business</span>
                  <input id="field-company-name" formControlName="company_name" type="text"
                    placeholder="e.g. Acme Corporation"
                    class="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg outline-none transition-all"
                    [class]="getInputClass('company_name')" />
                </div>
                @if (submitted && f['company_name'].errors?.['required']) {
                  <p class="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[13px]">error</span> Company name is required
                  </p>
                }
              </div>

              <!-- Package Name (Google Play ID) -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Package Name (Google Play ID)
                  <span class="ml-2 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Google Play API</span>
                </label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">id_card</span>
                  <input id="field-package-name" formControlName="package_name" type="text"
                    placeholder="e.g. com.company.app"
                    class="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg outline-none transition-all border bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <p class="text-[10px] text-slate-400 mt-1.5 italic">Must match your Google Play Store ID to fetch live versions.</p>
              </div>

              <!-- Owner Name -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Owner Name <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">person</span>
                  <input id="field-owner-name" formControlName="owner_name" type="text"
                    placeholder="e.g. John Doe"
                    class="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg outline-none transition-all"
                    [class]="getInputClass('owner_name')" />
                </div>
                @if (submitted && f['owner_name'].errors?.['required']) {
                  <p class="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[13px]">error</span> Owner name is required
                  </p>
                }
              </div>

              <!-- Mobile + Email (side-by-side) -->
              <div class="grid grid-cols-2 gap-4">

                <!-- Owner Mobile -->
                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Owner Mobile <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">phone</span>
                    <input id="field-owner-mobile" formControlName="owner_mobile" type="tel"
                      placeholder="+91 98765 43210"
                      class="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg outline-none transition-all"
                      [class]="getInputClass('owner_mobile')" />
                  </div>
                  @if (submitted && f['owner_mobile'].errors?.['required']) {
                    <p class="text-xs text-red-500 mt-1.5">Mobile is required</p>
                  }
                </div>

                <!-- Owner Email -->
                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Owner Email <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">mail</span>
                    <input id="field-owner-email" formControlName="owner_email" type="email"
                      placeholder="john@acme.com"
                      class="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg outline-none transition-all"
                      [class]="getInputClass('owner_email')" />
                  </div>
                  @if (submitted && f['owner_email'].errors?.['required']) {
                    <p class="text-xs text-red-500 mt-1.5">Email is required</p>
                  }
                  @if (submitted && f['owner_email'].errors?.['email']) {
                    <p class="text-xs text-red-500 mt-1.5">Invalid email address</p>
                  }
                </div>
              </div>

              <!-- Address -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Address
                </label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-[20px]">location_on</span>
                  <textarea id="field-address" formControlName="address" rows="3"
                    placeholder="Street, City, State, Country"
                    class="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"></textarea>
                </div>
              </div>

              <!-- Admin URL — Highlighted -->
              <div class="bg-blue-50/60 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4">
                <label class="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Admin URL
                  <span class="text-red-500">*</span>
                  <span class="ml-2 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full align-middle">
                    Used for API Calls
                  </span>
                </label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-[20px]">link</span>
                  <input id="field-admin-url" formControlName="admin_url" type="url"
                    placeholder="https://admin.yourcompany.com"
                    class="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg outline-none transition-all"
                    [class]="getInputClass('admin_url')" />
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-start gap-1.5">
                  <span class="material-symbols-outlined text-[14px] mt-0.5 text-primary flex-shrink-0">info</span>
                  This URL is used as the base endpoint for all API communications with this company's portal.
                </p>
                @if (submitted && f['admin_url'].errors?.['required']) {
                  <p class="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[13px]">error</span> Admin URL is required
                  </p>
                }
              </div>

            </form>
          </div>

          <!-- Panel Footer -->
          <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/80 dark:bg-slate-900/80 flex-shrink-0">
            <button id="btn-save-company" (click)="submitForm()" [disabled]="submitting"
              class="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              @if (submitting) {
                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{{ isEditing ? 'Updating...' : 'Saving...' }}</span>
              } @else {
                <span class="material-symbols-outlined text-[18px]">{{ isEditing ? 'update' : 'save' }}</span>
                <span>{{ isEditing ? 'Update Company' : 'Save Company' }}</span>
              }
            </button>
            <button (click)="closePanel()"
              class="flex-1 py-2.5 rounded-lg font-semibold text-sm border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ── Delete Confirmation Modal ──────────────────────────────────────── -->
    @if (deleteTarget) {
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="deleteTarget = null"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
          style="animation: popIn 0.2s cubic-bezier(0.16,1,0.3,1);">
          <div class="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="material-symbols-outlined text-red-500 text-2xl">delete_forever</span>
          </div>
          <h4 class="font-bold text-lg text-slate-900 dark:text-white">Delete Company?</h4>
          <p class="text-slate-500 text-sm mt-2">
            Are you sure you want to delete <strong class="text-slate-700 dark:text-slate-300">{{ deleteTarget.company_name }}</strong>?
            This action cannot be undone.
          </p>
          <div class="flex gap-3 mt-6">
            <button (click)="executeDelete()" [disabled]="deleting"
              class="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 cursor-pointer">
              @if (deleting) {
                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              } @else {
                Delete
              }
            </button>
            <button (click)="deleteTarget = null"
              class="flex-1 py-2.5 rounded-lg font-semibold text-sm border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ── Toast Notification ─────────────────────────────────────────────── -->
    @if (toast.show) {
      <div class="fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white font-semibold text-sm"
        [class]="toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
        style="animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1);">
        <span class="material-symbols-outlined">{{ toast.type === 'success' ? 'check_circle' : 'error' }}</span>
        {{ toast.message }}
      </div>
    }

    <!-- ── Keyframe Animations ────────────────────────────────────────────── -->
    <style>
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0);    opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(16px); opacity: 0; }
        to   { transform: translateY(0);    opacity: 1; }
      }
      @keyframes popIn {
        from { transform: scale(0.92); opacity: 0; }
        to   { transform: scale(1);    opacity: 1; }
      }
    </style>
  `
})
export class CompaniesComponent implements OnInit, OnDestroy {

  companies: Company[] = [];
  loading = false;
  error = '';
  searchQuery = '';

  // Panel / Form
  panelOpen = false;
  isEditing = false;
  editCompanyId: number | null = null;
  submitted = false;
  submitting = false;
  companyForm!: FormGroup;

  // Delete
  deleteTarget: Company | null = null;
  deleting = false;

  // Toast
  toast = { show: false, message: '', type: 'success' as 'success' | 'error' };
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Computed ──────────────────────────────────────────────────────────────

  get filteredCompanies(): Company[] {
    if (!this.searchQuery.trim()) return this.companies;
    const q = this.searchQuery.toLowerCase();
    return this.companies.filter(c =>
      c.company_name.toLowerCase().includes(q) ||
      c.owner_name.toLowerCase().includes(q) ||
      c.owner_email.toLowerCase().includes(q) ||
      c.admin_url.toLowerCase().includes(q)
    );
  }

  get thisMonthCount(): number {
    const now = new Date();
    return this.companies.filter(c => {
      const d = new Date(c.created_at ?? '');
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }

  get f() { return this.companyForm.controls; }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  constructor(private http: HttpClient, private fb: FormBuilder, private cdr: ChangeDetectorRef, private router: Router) { }

  ngOnInit() {
    this.initForm();
    this.loadCompanies();
  }

  ngOnDestroy() {
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  initForm() {
    this.companyForm = this.fb.group({
      company_name: ['', [Validators.required, Validators.minLength(2)]],
      package_name: [''],
      owner_name: ['', Validators.required],
      owner_mobile: ['', Validators.required],
      owner_email: ['', [Validators.required, Validators.email]],
      address: [''],
      admin_url: ['', Validators.required],
    });
  }

  getInputClass(field: string): string {
    const base = 'border bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 ';
    if (this.submitted && this.f[field]?.errors) {
      return base + 'border-red-400 dark:border-red-600 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900/30';
    }
    return base + 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary';
  }

  // ── API Calls ─────────────────────────────────────────────────────────────

  loadCompanies() {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    this.http.get<any>(`${API_BASE}/api/companies.php`).subscribe({
      next: (res) => {
        this.companies = res.data ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = `Could not reach the backend at ${API_BASE}. Make sure the PHP server is running.`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submitForm() {
    this.submitted = true;
    if (this.companyForm.invalid) return;

    this.submitting = true;
    this.cdr.detectChanges();

    if (this.isEditing && this.editCompanyId) {
      // ── PUT: Update existing company ───────────────────────────────────
      this.http.put<any>(`${API_BASE}/api/companies.php?id=${this.editCompanyId}`, this.companyForm.value).subscribe({
        next: () => {
          this.submitting = false;
          this.closePanel();
          this.cdr.detectChanges();
          this.loadCompanies();
          this.showToast('Company updated successfully!', 'success');
        },
        error: (err) => {
          this.submitting = false;
          const msg = err?.error?.message ?? 'Failed to update company. Please try again.';
          this.cdr.detectChanges();
          this.showToast(msg, 'error');
        }
      });
    } else {
      // ── POST: Create new company ────────────────────────────────────────
      this.http.post<any>(`${API_BASE}/api/companies.php`, this.companyForm.value).subscribe({
        next: () => {
          this.submitting = false;
          this.closePanel();
          this.cdr.detectChanges();
          this.loadCompanies();
          this.showToast('Company added successfully!', 'success');
        },
        error: (err) => {
          this.submitting = false;
          const msg = err?.error?.message ?? 'Failed to add company. Please try again.';
          this.cdr.detectChanges();
          this.showToast(msg, 'error');
        }
      });
    }
  }

  confirmDelete(company: Company) {
    this.deleteTarget = company;
    this.cdr.detectChanges();  // ← required in zoneless mode to show the modal
  }

  executeDelete() {
    if (!this.deleteTarget) return;
    this.deleting = true;
    this.http.delete<any>(`${API_BASE}/api/companies.php?id=${this.deleteTarget.id}`).subscribe({
      next: () => {
        this.companies = this.companies.filter(c => c.id !== this.deleteTarget!.id);
        this.deleting = false;
        this.deleteTarget = null;
        this.cdr.detectChanges();
        this.showToast('Company deleted.', 'success');
      },
      error: () => {
        this.deleting = false;
        this.cdr.detectChanges();
        this.showToast('Failed to delete company.', 'error');
      }
    });
  }

  viewCompany(company: Company) {
    this.router.navigate(['/companies', company.id]);
  }

  visitAdmin(company: Company) {
    window.open(company.admin_url, '_blank');
  }

  // ── Panel ─────────────────────────────────────────────────────────────────

  openAddPanel() {
    this.isEditing = false;
    this.editCompanyId = null;
    this.panelOpen = true;
    this.submitted = false;
    this.companyForm.reset();
    this.cdr.detectChanges();
  }

  openEditPanel(company: Company) {
    this.isEditing = true;
    this.editCompanyId = company.id ?? null;
    this.panelOpen = true;
    this.submitted = false;
    this.companyForm.patchValue({
      company_name: company.company_name,
      package_name: company.package_name,
      owner_name: company.owner_name,
      owner_mobile: company.owner_mobile,
      owner_email: company.owner_email,
      address: company.address,
      admin_url: company.admin_url,
    });
    this.cdr.detectChanges();
  }

  closePanel() {
    this.panelOpen = false;
    this.submitted = false;
    this.isEditing = false;
    this.editCompanyId = null;
    this.cdr.detectChanges();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getAvatarColor(name: string): string {
    const palette = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];
    return palette[name.charCodeAt(0) % palette.length];
  }

  getDomain(url: string): string {
    try { return new URL(url).hostname; } catch { return url; }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  showToast(message: string, type: 'success' | 'error') {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { show: true, message, type };
    this.toastTimer = setTimeout(() => { this.toast.show = false; }, 3500);
  }
}
