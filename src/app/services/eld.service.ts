import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface EldCompanyDashboard {
  company: string;
  company_key: string;
  total_drivers: number;
  active_vehicles: number;
  total_clients: number;
  server_status: string;
  last_sync: string;
}

export interface EldAllCompaniesResponse {
  status: string;
  data: EldCompanyDashboard[];
}

export interface EldSyncResponse {
  status: string;
  message: string;
  apis_successful?: number;
  summary?: any;
}

@Injectable({
  providedIn: 'root'
})
export class EldService {
  private http = inject(HttpClient);

  getAllCompaniesDashboard(): Observable<EldAllCompaniesResponse> {
    return this.http.get<EldAllCompaniesResponse>(`${API_BASE_URL}api/eld/all-companies-dashboard.php`);
  }

  getCompanyDashboard(companyKey: string): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}api/eld/company-dashboard.php?company=${companyKey}`);
  }

  getCompanyDetail(companyKey: string): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}api/eld/company-detail.php?company=${companyKey}`);
  }

  syncCompany(companyKey: string): Observable<EldSyncResponse> {
    return this.http.post<EldSyncResponse>(`${API_BASE_URL}api/eld/sync-company.php?company=${companyKey}`, {});
  }

  syncAllCompanies(): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}api/eld/sync-all.php`, {});
  }
}
