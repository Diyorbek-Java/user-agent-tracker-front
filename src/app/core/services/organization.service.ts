import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Department,
  DepartmentCreate,
  JobPosition,
  JobPositionCreate,
  DepartmentAppRule,
  DepartmentAppRuleCreate
} from '../models/organization.model';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private readonly API_URL = '/api/frontend';

  constructor(private http: HttpClient) {}

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
}
