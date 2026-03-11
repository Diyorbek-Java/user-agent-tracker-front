import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { HttpClient } from '@angular/common/http';

interface CreateUserRequest {
  email: string;
  full_name: string;
  employee_id: string;
  department?: string;
  position?: string;
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
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  currentUser: User | null = null;

  // Form data
  newUser: CreateUserRequest = {
    email: '',
    full_name: '',
    employee_id: '',
    department: '',
    position: '',
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

  // Available roles based on current user
  availableRoles: { value: string; label: string }[] = [];

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.setAvailableRoles();
    this.loadUsers();
  }

  loadUsers(): void {
    this.usersLoading = true;
    this.http.get<any[]>('/api/front/users/list/').subscribe({
      next: (users) => {
        this.users = users;
        this.usersLoading = false;
      },
      error: () => { this.usersLoading = false; }
    });
  }

  deleteUser(user: any): void {
    if (!confirm(`Delete ${user.full_name}? This cannot be undone.`)) return;
    this.deleteError = '';
    this.http.delete<any>(`/api/front/admin/users/${user.id}/`).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
      },
      error: (err) => {
        this.deleteError = err.error?.error || 'Failed to delete user';
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
    // Reset messages
    this.error = '';
    this.successMessage = '';
    this.createdUserOTP = '';

    // Validation
    if (!this.newUser.email || !this.newUser.full_name || !this.newUser.employee_id) {
      this.error = 'Email, Full Name, and Employee ID are required';
      return;
    }

    // Email validation
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
        console.error('Create user error:', err);
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
      employee_id: '',
      department: '',
      position: '',
      role: 'EMPLOYEE'
    };
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
