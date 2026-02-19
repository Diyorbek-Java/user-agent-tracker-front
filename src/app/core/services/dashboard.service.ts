import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DashboardStats,
  Session,
  Activity,
  ActivityTimeline,
  ProductivityReport,
  PaginatedResponse
} from '../models/dashboard.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = '/api/frontend';

  constructor(private http: HttpClient) {}

  getDashboardStats(userId?: number): Observable<DashboardStats> {
    let params = new HttpParams();
    if (userId) {
      params = params.set('user_id', userId.toString());
    }
    return this.http.get<DashboardStats>(`${this.API_URL}/dashboard/`, { params });
  }

  getMySessions(page: number = 1, pageSize: number = 10, userId?: number): Observable<PaginatedResponse<Session>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());
    if (userId) {
      params = params.set('user_id', userId.toString());
    }
    return this.http.get<PaginatedResponse<Session>>(`${this.API_URL}/sessions/`, { params });
  }

  getMyActivities(
    page: number = 1,
    pageSize: number = 20,
    filters?: { start_date?: string; end_date?: string; process_name?: string; user_id?: number }
  ): Observable<PaginatedResponse<Activity>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters) {
      if (filters.start_date) params = params.set('start_date', filters.start_date);
      if (filters.end_date) params = params.set('end_date', filters.end_date);
      if (filters.process_name) params = params.set('process_name', filters.process_name);
      if (filters.user_id) params = params.set('user_id', filters.user_id.toString());
    }

    return this.http.get<PaginatedResponse<Activity>>(`${this.API_URL}/activities/`, { params });
  }

  getActivityTimeline(date?: string, userId?: number): Observable<ActivityTimeline[]> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }
    if (userId) {
      params = params.set('user_id', userId.toString());
    }
    return this.http.get<ActivityTimeline[]>(`${this.API_URL}/timeline/`, { params });
  }

  getProductivityReport(days: number = 7, userId?: number): Observable<ProductivityReport[]> {
    let params = new HttpParams().set('days', days.toString());
    if (userId) {
      params = params.set('user_id', userId.toString());
    }
    return this.http.get<ProductivityReport[]>(`${this.API_URL}/productivity/`, { params });
  }

  // Get list of all users for selection (Admin/Manager only)
  getUserList(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/users/list/`);
  }

  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/profile/`);
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/profile/update/`, data);
  }

  getDayAppSummary(date: string, userId?: number): Observable<{ process_name: string; total_seconds: number; session_count: number }[]> {
    let params = new HttpParams().set('date', date);
    if (userId) {
      params = params.set('user_id', userId.toString());
    }
    return this.http.get<{ process_name: string; total_seconds: number; session_count: number }[]>(
      `${this.API_URL}/day-app-summary/`, { params }
    );
  }

  // Admin endpoints
  getAllUsersSummary(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/admin/users/`);
  }

  getUserDetailReport(userId: number, days: number = 7): Observable<any> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<any>(`${this.API_URL}/admin/users/${userId}/`, { params });
  }
}
