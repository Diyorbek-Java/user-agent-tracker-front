import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { HttpClient } from '@angular/common/http';
import { HasRoleDirective } from '../../core/directives/has-role.directive';

interface CreateUserRequest {
  email: string;
  full_name: string;
  department?: number | null;
  position?: number | null;
  role: 'MANAGER' | 'EMPLOYEE' | 'ORG_MANAGER' | 'ORG_ADMIN';
}

interface CreateUserResponse {
  success: boolean;
  message: string;
  user?: any;
  error?: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HasRoleDirective],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  currentUser: User | null = null;

  // Form data
  newUser: CreateUserRequest = {
    email: '',
    full_name: '',
    department: null,
    position: null,
    role: 'EMPLOYEE'
  };

  // UI state
  loading = false;
  error = '';
  successMessage = '';
  createdUserOTP = '';

  // User list
  users: any[] = [];
  usersLoading = false;
  deleteError = '';
  showForm = false;

  // Dropdowns
  departments: any[] = [];
  positions: any[] = [];

  // Available roles based on current user
  availableRoles: { value: string; label: string }[] = [];

  // Per-row UI state: which user is currently being edited / saving
  rowSavingId: number | null = null;

  // Role labels (also used for inline edit dropdown)
  private readonly ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Administrator',
    ORG_MANAGER: 'Organization Manager',
    ORG_ADMIN: 'Organization Admin',
    MANAGER: 'Manager',
    EMPLOYEE: 'Employee',
  };

  // Mirrors backend _ASSIGNABLE_BY_CALLER; keep in sync.
  private readonly ASSIGNABLE_BY_CALLER: Record<string, string[]> = {
    ADMIN:       ['MANAGER', 'EMPLOYEE', 'ORG_MANAGER', 'ORG_ADMIN'],
    ORG_MANAGER: ['ORG_ADMIN', 'MANAGER', 'EMPLOYEE'],
    ORG_ADMIN:   ['MANAGER', 'EMPLOYEE'],
    MANAGER:     ['EMPLOYEE'],
  };

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.setAvailableRoles();
    this.loadUsers();
    this.loadDepartments();
    this.loadPositions();
  }

  loadUsers(): void {
    this.usersLoading = true;
    this.http.get<any[]>('/api/frontend/users/list/').subscribe({
      next: (users) => {
        this.users = users;
        this.usersLoading = false;
      },
      error: () => { this.usersLoading = false; }
    });
  }

  loadDepartments(): void {
    this.http.get<any>('/api/frontend/departments/').subscribe({
      next: (res) => { this.departments = res.departments || []; },
      error: () => {}
    });
  }

  loadPositions(): void {
    this.http.get<any>('/api/frontend/positions/').subscribe({
      next: (res) => { this.positions = res.positions || []; },
      error: () => {}
    });
  }

  deleteUser(user: any): void {
    if (!confirm(`Delete ${user.full_name}? This cannot be undone.`)) return;
    this.deleteError = '';
    this.http.delete<any>(`/api/frontend/admin/users/${user.id}/`).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
      },
      error: (err) => {
        this.deleteError = err.error?.error || 'Failed to delete user';
      }
    });
  }

  // Roles the current caller can assign on `user`'s row.
  // Returns [] when the caller isn't allowed to manage that row.
  rolesAssignableTo(user: any): string[] {
    const callerRole = this.currentUser?.role;
    if (!callerRole || !user) return [];
    if (user.id === this.currentUser?.id) return [];
    const allowed = this.ASSIGNABLE_BY_CALLER[callerRole] || [];
    if (callerRole !== 'ADMIN' && !allowed.includes(user.role)) return [];
    return allowed;
  }

  canEditRole(user: any): boolean {
    return this.rolesAssignableTo(user).length > 0;
  }

  canToggleActive(user: any): boolean {
    if (!this.currentUser || user.id === this.currentUser.id) return false;
    const callerRole = this.currentUser.role;
    const allowed = this.ASSIGNABLE_BY_CALLER[callerRole] || [];
    return callerRole === 'ADMIN' || allowed.includes(user.role);
  }

  roleLabel(role: string): string {
    return this.ROLE_LABELS[role] || role;
  }

  changeRole(user: any, newRole: string): void {
    if (!newRole || newRole === user.role) return;
    if (!confirm(`Change ${user.full_name}'s role to ${this.roleLabel(newRole)}?`)) return;

    this.rowSavingId = user.id;
    this.deleteError = '';
    this.http.patch<any>(`/api/frontend/org-users/${user.id}/role/`, { role: newRole }).subscribe({
      next: (res) => {
        this.rowSavingId = null;
        if (res?.user?.role) user.role = res.user.role;
      },
      error: (err) => {
        this.rowSavingId = null;
        this.deleteError = err.error?.error || 'Failed to update role';
      }
    });
  }

  toggleActive(user: any): void {
    const next = !user.is_active;
    const verb = next ? 'reactivate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${verb} ${user.full_name}?`)) return;

    this.rowSavingId = user.id;
    this.deleteError = '';
    this.http.patch<any>(`/api/frontend/org-users/${user.id}/active/`, { is_active: next }).subscribe({
      next: (res) => {
        this.rowSavingId = null;
        if (res?.user) user.is_active = res.user.is_active;
      },
      error: (err) => {
        this.rowSavingId = null;
        this.deleteError = err.error?.error || `Failed to ${verb} user`;
      }
    });
  }

  setAvailableRoles(): void {
    if (this.currentUser?.role === 'ADMIN') {
      this.availableRoles = [
        { value: 'MANAGER', label: 'Manager' },
        { value: 'EMPLOYEE', label: 'Employee' },
        { value: 'ORG_MANAGER', label: 'Organization Manager' },
        { value: 'ORG_ADMIN', label: 'Organization Admin' }
      ];
    } else if (this.currentUser?.role === 'ORG_MANAGER') {
      this.availableRoles = [
        { value: 'ORG_ADMIN', label: 'Organization Admin' },
        { value: 'EMPLOYEE', label: 'Employee' }
      ];
    } else if (this.currentUser?.role === 'MANAGER') {
      this.availableRoles = [
        { value: 'EMPLOYEE', label: 'Employee' }
      ];
      this.newUser.role = 'EMPLOYEE';
    }
  }

  get isAdminOrManager(): boolean {
    const r = this.currentUser?.role;
    return r === 'ADMIN' || r === 'MANAGER' || r === 'ORG_MANAGER';
  }

  createUser(): void {
    this.error = '';
    this.successMessage = '';
    this.createdUserOTP = '';

    if (!this.newUser.email || !this.newUser.full_name) {
      this.error = 'Email and Full Name are required';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newUser.email)) {
      this.error = 'Please enter a valid email address';
      return;
    }

    this.loading = true;

    this.http.post<CreateUserResponse>('/api/admin/invite-staff/', this.newUser).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.successMessage = response.message;
          if (response.user?.otp) {
            this.createdUserOTP = response.user.otp;
          }
          this.showForm = false;
          this.resetForm();
          this.loadUsers();
        } else {
          this.error = response.error || 'Failed to create user';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Failed to create user';
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  cancelForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.error = '';
    this.newUser = {
      email: '',
      full_name: '',
      department: null,
      position: null,
      role: 'EMPLOYEE'
    };
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN': return 'badge badge-admin';
      case 'MANAGER': return 'badge badge-manager';
      case 'ORG_MANAGER': return 'badge badge-org-manager';
      case 'ORG_ADMIN': return 'badge badge-org-admin';
      default: return 'badge badge-employee';
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
