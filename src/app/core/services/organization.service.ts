import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Organization,
  OrganizationCreate,
  Department,
  DepartmentCreate,
  JobPosition,
  JobPositionCreate,
  DepartmentAppRule,
  DepartmentAppRuleCreate,
  PositionAppWeight,
  PositionAppWeightCreate,
  ProductivitySettingsModel,
  OrgUser,
  ShiftDay
} from '../models/organization.model';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private readonly API_URL = '/api/frontend';

  constructor(private http: HttpClient) {}

  // Organization endpoints
  getOrganizations(): Observable<Organization[]> {
    return this.http.get<any>(`${this.API_URL}/organizations/`).pipe(map(res => res.organizations));
  }
  createOrganization(data: OrganizationCreate): Observable<Organization> {
    return this.http.post<any>(`${this.API_URL}/organizations/`, data).pipe(map(res => res.organization));
  }
  updateOrganization(id: number, data: Partial<OrganizationCreate>): Observable<Organization> {
    return this.http.put<any>(`${this.API_URL}/organizations/${id}/`, data).pipe(map(res => res.organization));
  }
  deleteOrganization(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/organizations/${id}/`);
  }

  // Org users
  getOrgUsers(): Observable<OrgUser[]> {
    return this.http.get<any>(`${this.API_URL}/org-users/`).pipe(map(res => res.users));
  }
  assignUser(userId: number, data: { department?: number | null; position?: number | null }): Observable<OrgUser> {
    return this.http.patch<any>(`${this.API_URL}/org-users/${userId}/assign/`, data).pipe(map(res => res.user));
  }
  assignOrgAdmin(orgId: number, userId: number | null): Observable<Organization> {
    return this.http.post<any>(`${this.API_URL}/organizations/${orgId}/assign-admin/`, { user_id: userId }).pipe(map(res => res.organization));
  }

  // Shifts
  getUserShifts(userId: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/shifts/${userId}/`);
  }
  setUserShifts(userId: number, shifts: ShiftDay[]): Observable<any> {
    const payload = shifts.map(s => ({
      day_of_week: s.day,
      is_day_off: s.is_day_off,
      start_time: s.is_day_off ? undefined : s.start_time || undefined,
      end_time: s.is_day_off ? undefined : s.end_time || undefined,
      lunch_break_minutes: s.lunch_break_minutes
    }));
    return this.http.post<any>(`${this.API_URL}/shifts/${userId}/set/`, { shifts: payload });
  }

  // Department endpoints
  getDepartments(): Observable<Department[]> {
    return this.http.get<any>(`${this.API_URL}/departments/`).pipe(
      map(res => res.departments)
    );
  }

  getDepartment(id: number): Observable<Department> {
    return this.http.get<any>(`${this.API_URL}/departments/${id}/`).pipe(
      map(res => res.department)
    );
  }

  createDepartment(data: DepartmentCreate): Observable<Department> {
    return this.http.post<any>(`${this.API_URL}/departments/`, data).pipe(
      map(res => res.department)
    );
  }

  updateDepartment(id: number, data: Partial<DepartmentCreate>): Observable<Department> {
    return this.http.put<any>(`${this.API_URL}/departments/${id}/`, data).pipe(
      map(res => res.department)
    );
  }

  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/departments/${id}/`);
  }

  // Position endpoints
  getPositions(): Observable<JobPosition[]> {
    return this.http.get<any>(`${this.API_URL}/positions/`).pipe(
      map(res => res.positions)
    );
  }

  getPosition(id: number): Observable<JobPosition> {
    return this.http.get<any>(`${this.API_URL}/positions/${id}/`).pipe(
      map(res => res.position)
    );
  }

  createPosition(data: JobPositionCreate): Observable<JobPosition> {
    return this.http.post<any>(`${this.API_URL}/positions/`, data).pipe(
      map(res => res.position)
    );
  }

  updatePosition(id: number, data: Partial<JobPositionCreate>): Observable<JobPosition> {
    return this.http.put<any>(`${this.API_URL}/positions/${id}/`, data).pipe(
      map(res => res.position)
    );
  }

  deletePosition(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/positions/${id}/`);
  }

  // Department App Rules endpoints
  getDepartmentRules(departmentId?: number): Observable<DepartmentAppRule[]> {
    let url = `${this.API_URL}/department-rules/`;
    if (departmentId) {
      url += `?department=${departmentId}`;
    }
    return this.http.get<DepartmentAppRule[]>(url);
  }

  createDepartmentRule(data: DepartmentAppRuleCreate): Observable<DepartmentAppRule> {
    return this.http.post<DepartmentAppRule>(`${this.API_URL}/department-rules/`, data);
  }

  updateDepartmentRule(id: number, data: Partial<DepartmentAppRuleCreate>): Observable<DepartmentAppRule> {
    return this.http.put<DepartmentAppRule>(`${this.API_URL}/department-rules/${id}/`, data);
  }

  deleteDepartmentRule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/department-rules/${id}/`);
  }

  // Position App Weights endpoints
  getPositionWeights(positionId?: number): Observable<PositionAppWeight[]> {
    let url = `${this.API_URL}/position-weights/`;
    if (positionId) {
      url += `?position=${positionId}`;
    }
    return this.http.get<PositionAppWeight[]>(url);
  }

  createPositionWeight(data: PositionAppWeightCreate): Observable<PositionAppWeight> {
    return this.http.post<PositionAppWeight>(`${this.API_URL}/position-weights/`, data);
  }

  updatePositionWeight(id: number, data: Partial<PositionAppWeightCreate>): Observable<PositionAppWeight> {
    return this.http.put<PositionAppWeight>(`${this.API_URL}/position-weights/${id}/`, data);
  }

  deletePositionWeight(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/position-weights/${id}/`);
  }

  // Productivity Settings endpoints
  getProductivitySettings(): Observable<ProductivitySettingsModel> {
    return this.http.get<ProductivitySettingsModel>(`${this.API_URL}/productivity-settings/`);
  }

  updateProductivitySettings(data: Partial<ProductivitySettingsModel>): Observable<ProductivitySettingsModel> {
    return this.http.put<ProductivitySettingsModel>(`${this.API_URL}/productivity-settings/`, data);
  }
}
