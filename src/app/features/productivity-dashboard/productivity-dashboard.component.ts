import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductivityService } from '../../core/services/productivity.service';
import { OrganizationService } from '../../core/services/organization.service';
import { AuthService } from '../../core/services/auth.service';
import {
  ProductivityDashboard,
  EmployeeProductivity,
  EmployeeProductivityDetail,
  AppUsage
} from '../../core/models/productivity.model';
import { Department } from '../../core/models/organization.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-productivity-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productivity-dashboard.component.html',
  styleUrls: ['./productivity-dashboard.component.css']
})
export class ProductivityDashboardComponent implements OnInit {
  currentUser: User | null = null;
  dashboard: ProductivityDashboard | null = null;
  employees: EmployeeProductivity[] = [];
  selectedEmployee: EmployeeProductivityDetail | null = null;

  loading = true;
  loadingEmployees = false;
  loadingDetail = false;
  error = '';

  // Filters
  selectedDays = 7;
  selectedStatus: string = '';
  selectedDepartment: number | undefined = undefined;
  departments: Department[] = [];
  daysOptions = [
    { value: 1, label: 'Today' },
    { value: 7, label: 'Last 7 Days' },
    { value: 14, label: 'Last 14 Days' },
    { value: 30, label: 'Last 30 Days' }
  ];

  // View mode
  viewMode: 'overview' | 'employees' | 'detail' = 'overview';

  get isAdminOrManager(): boolean {
    return this.currentUser?.role === 'ADMIN' || this.currentUser?.role === 'MANAGER';
  }

  constructor(
    private productivityService: ProductivityService,
    private orgService: OrganizationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;

    if (!this.isAdminOrManager) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadDepartments();
    this.loadDashboard();
  }

  loadDepartments(): void {
    this.orgService.getDepartments().subscribe({
      next: (data) => this.departments = data,
      error: (err) => console.error('Departments error:', err)
    });
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = '';

    this.productivityService.getProductivityDashboard(this.selectedDays).subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
        this.loadEmployees();
      },
      error: (err) => {
        this.error = 'Failed to load productivity dashboard';
        console.error('Dashboard error:', err);
        this.loading = false;
      }
    });
  }

  loadEmployees(): void {
    this.loadingEmployees = true;
    const status = this.selectedStatus as 'productive' | 'needs_improvement' | 'unproductive' | undefined;

    this.productivityService.getEmployeesList(this.selectedDays, this.selectedDepartment, status || undefined).subscribe({
      next: (data) => {
        this.employees = data.employees;
        this.loadingEmployees = false;
      },
      error: (err) => {
        console.error('Employees list error:', err);
        this.loadingEmployees = false;
      }
    });
  }

  loadEmployeeDetail(employeeId: number): void {
    this.loadingDetail = true;
    this.viewMode = 'detail';

    this.productivityService.getEmployeeDetail(employeeId, this.selectedDays).subscribe({
      next: (data) => {
        this.selectedEmployee = data;
        this.loadingDetail = false;
      },
      error: (err) => {
        console.error('Employee detail error:', err);
        this.loadingDetail = false;
      }
    });
  }

  onDaysChange(): void {
    this.loadDashboard();
  }

  onStatusChange(): void {
    this.loadEmployees();
  }

  onDepartmentChange(): void {
    this.loadEmployees();
  }

  setViewMode(mode: 'overview' | 'employees' | 'detail'): void {
    this.viewMode = mode;
    if (mode === 'overview') {
      this.selectedEmployee = null;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'productive': return 'status-productive';
      case 'needs_improvement': return 'status-warning';
      case 'unproductive': return 'status-danger';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'productive': return 'Productive';
      case 'needs_improvement': return 'Needs Improvement';
      case 'unproductive': return 'Unproductive';
      default: return status;
    }
  }

  getCategoryClass(category: string): string {
    switch (category) {
      case 'PRODUCTIVE': return 'category-productive';
      case 'NON_PRODUCTIVE': return 'category-unproductive';
      default: return 'category-neutral';
    }
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'PRODUCTIVE': return 'Productive';
      case 'NON_PRODUCTIVE': return 'Non-Productive';
      default: return 'Neutral';
    }
  }

  formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    const s = Math.round(((hours - h) * 60 - m) * 60);
    if (h > 0) {
      return `${h}h ${m}m`;
    } else if (m > 0) {
      return `${m}m ${s}s`;
    }
    return `${s}s`;
  }

  formatDuration(hours: number): string {
    const totalSeconds = Math.round(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m ${s}s`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getScoreColor(score: number): string {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }

  navigateToAppCategories(): void {
    this.router.navigate(['/app-categories']);
  }

  navigateToDepartmentRules(): void {
    this.router.navigate(['/department-rules']);
  }

  navigateBack(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
