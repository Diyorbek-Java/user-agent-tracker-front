import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats, ActivityTimeline, ProductivityReport } from '../../core/models/dashboard.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  dashboardStats: DashboardStats | null = null;
  productivityReport: ProductivityReport[] = [];
  timeline: ActivityTimeline[] = [];
  loading = true;
  error = '';

  // User selection for admin/manager
  availableUsers: User[] = [];
  selectedUserId: number | null = null;
  selectedUserName: string = '';

  // Computed properties for UI
  get productivityColor(): string {
    if (!this.dashboardStats) return 'gray';
    const score = this.dashboardStats.productivity_score;
    if (score >= 75) return '#4CAF50';
    if (score >= 50) return '#FFC107';
    return '#F44336';
  }

  get isAdminOrManager(): boolean {
    return this.currentUser?.role === 'ADMIN' || this.currentUser?.role === 'MANAGER';
  }

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;

    // Load user list if admin/manager
    if (this.isAdminOrManager) {
      this.loadUserList();
    } else {
      this.loadDashboardData();
    }
  }

  loadUserList(): void {
    this.dashboardService.getUserList().subscribe({
      next: (users) => {
        this.availableUsers = users;
        // Auto-select current user by default
        if (this.currentUser) {
          this.selectedUserId = this.currentUser.id;
          this.selectedUserName = this.currentUser.full_name;
        }
        this.loadDashboardData();
      },
      error: (err) => {
        console.error('Error loading user list:', err);
        // Load current user's data anyway
        this.loadDashboardData();
      }
    });
  }

  onUserChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const userId = target.value;

    if (userId === 'me') {
      this.selectedUserId = null;
      this.selectedUserName = this.currentUser?.full_name || '';
    } else {
      this.selectedUserId = parseInt(userId, 10);
      const selectedUser = this.availableUsers.find(u => u.id === this.selectedUserId);
      this.selectedUserName = selectedUser?.full_name || '';
    }

    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = '';

    const userId = this.selectedUserId || undefined;

    // Load dashboard stats
    this.dashboardService.getDashboardStats(userId).subscribe({
      next: (stats) => {
        this.dashboardStats = stats;
      },
      error: (err) => {
        this.error = 'Failed to load dashboard data';
        console.error('Dashboard error:', err);
      }
    });

    // Load productivity report (last 7 days)
    this.dashboardService.getProductivityReport(7, userId).subscribe({
      next: (report) => {
        this.productivityReport = report;
      },
      error: (err) => {
        console.error('Productivity report error:', err);
      }
    });

    // Load today's timeline
    this.dashboardService.getActivityTimeline(undefined, userId).subscribe({
      next: (timeline) => {
        this.timeline = timeline;
        this.loading = false;
      },
      error: (err) => {
        console.error('Timeline error:', err);
        this.loading = false;
      }
    });
  }

  formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  navigateToSessions(): void {
    this.router.navigate(['/sessions']);
  }

  navigateToActivities(): void {
    this.router.navigate(['/activities']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToUserManagement(): void {
    this.router.navigate(['/user-management']);
  }
}
