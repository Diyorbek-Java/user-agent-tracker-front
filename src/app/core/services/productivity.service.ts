import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ProductivityDashboard,
  EmployeeListResponse,
  EmployeeProductivityDetail,
  AppCategory,
  AppCategoryCreate,
  UncategorizedAppsResponse,
  AppUsage
} from '../models/productivity.model';

@Injectable({
  providedIn: 'root'
})
export class ProductivityService {
  private readonly API_URL = '/api';

  constructor(private http: HttpClient) {}

  // Productivity Dashboard endpoints
  getProductivityDashboard(days: number = 7): Observable<ProductivityDashboard> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<ProductivityDashboard>(`${this.API_URL}/productivity/dashboard/`, { params });
  }

  getEmployeesList(
    days: number = 7,
    department?: number,
    status?: 'productive' | 'needs_improvement' | 'unproductive'
  ): Observable<EmployeeListResponse> {
    let params = new HttpParams().set('days', days.toString());
    if (department) {
      params = params.set('department', department.toString());
    }
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<EmployeeListResponse>(`${this.API_URL}/productivity/employees/`, { params });
  }

  getEmployeeDetail(userId: number, days: number = 7): Observable<EmployeeProductivityDetail> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<EmployeeProductivityDetail>(`${this.API_URL}/productivity/employees/${userId}/`, { params });
  }

  getEmployeeApps(
    userId: number,
    days: number = 7,
    category?: 'PRODUCTIVE' | 'NEUTRAL' | 'NON_PRODUCTIVE'
  ): Observable<{ user: { id: number; name: string }; period: { from: string; to: string }; apps: AppUsage[] }> {
    let params = new HttpParams().set('days', days.toString());
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<any>(`${this.API_URL}/productivity/employees/${userId}/apps/`, { params });
  }

  // App Category Management endpoints
  getAppCategories(category?: 'PRODUCTIVE' | 'NEUTRAL' | 'NON_PRODUCTIVE'): Observable<AppCategory[]> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<AppCategory[]>(`${this.API_URL}/app-categories/`, { params });
  }

  createAppCategory(data: AppCategoryCreate): Observable<AppCategory> {
    return this.http.post<AppCategory>(`${this.API_URL}/app-categories/`, data);
  }

  updateAppCategory(id: number, data: Partial<AppCategoryCreate>): Observable<AppCategory> {
    return this.http.put<AppCategory>(`${this.API_URL}/app-categories/${id}/`, data);
  }

  deleteAppCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/app-categories/${id}/`);
  }

  getUncategorizedApps(limit: number = 20): Observable<UncategorizedAppsResponse> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<UncategorizedAppsResponse>(`${this.API_URL}/app-categories/suggestions/`, { params });
  }
}
