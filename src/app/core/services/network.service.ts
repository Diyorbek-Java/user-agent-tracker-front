import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../models/dashboard.model';
import {
  NetworkActivity,
  DomainSummaryResponse,
  TopSitesResponse
} from '../models/network.model';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private readonly API_URL = '/api/frontend';

  constructor(private http: HttpClient) {}

  getNetworkActivities(
    page: number = 1,
    pageSize: number = 20,
    filters?: { start_date?: string; end_date?: string; domain?: string; browser?: string; user_id?: number }
  ): Observable<PaginatedResponse<NetworkActivity>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters) {
      if (filters.start_date) params = params.set('start_date', filters.start_date);
      if (filters.end_date) params = params.set('end_date', filters.end_date);
      if (filters.domain) params = params.set('domain', filters.domain);
      if (filters.browser) params = params.set('browser', filters.browser);
      if (filters.user_id) params = params.set('user_id', filters.user_id.toString());
    }

    return this.http.get<PaginatedResponse<NetworkActivity>>(`${this.API_URL}/network-activities/`, { params });
  }

  getDomainSummary(days: number = 7, userId?: number): Observable<DomainSummaryResponse> {
    let params = new HttpParams().set('days', days.toString());
    if (userId) {
      params = params.set('user_id', userId.toString());
    }
    return this.http.get<DomainSummaryResponse>(`${this.API_URL}/network/domains/`, { params });
  }

  getTopSites(days: number = 7, limit: number = 10, userId?: number): Observable<TopSitesResponse> {
    let params = new HttpParams()
      .set('days', days.toString())
      .set('limit', limit.toString());
    if (userId) {
      params = params.set('user_id', userId.toString());
    }
    return this.http.get<TopSitesResponse>(`${this.API_URL}/network/top-sites/`, { params });
  }
}
