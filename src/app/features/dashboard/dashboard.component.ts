import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductivityService } from '../../core/services/productivity.service';
import { DashboardStats, ActivityTimeline, ProductivityReport, Activity } from '../../core/models/dashboard.model';
import { EmployeeProductivityDetail, AppUsage } from '../../core/models/productivity.model';
import { User } from '../../core/models/user.model';

interface GroupedActivities {
  label: string;
  date: string;
  activities: Activity[];
  totalDuration: number;
}

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

  // Employee productivity data
  myProductivity: EmployeeProductivityDetail | null = null;
  groupedActivities: GroupedActivities[] = [];
  loadingActivities = false;

  // Activity view
  selectedPeriod: 'today' | 'yesterday' | 'week' = 'today';

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
    private productivityService: ProductivityService,
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
      this.loadMyProductivity();
      this.loadMyActivities();
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

  loadMyProductivity(): void {
    if (!this.currentUser) return;

    this.productivityService.getEmployeeDetail(this.currentUser.id, 7).subscribe({
      next: (data) => {
        this.myProductivity = data;
      },
      error: (err) => {
        console.error('My productivity error:', err);
      }
    });
  }

  loadMyActivities(): void {
    this.loadingActivities = true;
    const days = this.selectedPeriod === 'today' ? 1 : this.selectedPeriod === 'yesterday' ? 2 : 7;

    this.dashboardService.getMyActivities(1, 100, {}).subscribe({
      next: (data) => {
        this.groupActivitiesByDate(data.results);
        this.loadingActivities = false;
      },
      error: (err) => {
        console.error('Activities error:', err);
        this.loadingActivities = false;
      }
    });
  }

  groupActivitiesByDate(activities: Activity[]): void {
    const groups: { [key: string]: GroupedActivities } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    activities.forEach(activity => {
      const activityDate = new Date(activity.start_time);
      activityDate.setHours(0, 0, 0, 0);

      const dateKey = activityDate.toISOString().split('T')[0];
      let label = activityDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

      if (activityDate.getTime() === today.getTime()) {
        label = 'Today';
      } else if (activityDate.getTime() === yesterday.getTime()) {
        label = 'Yesterday';
      }

      if (!groups[dateKey]) {
        groups[dateKey] = {
          label,
          date: dateKey,
          activities: [],
          totalDuration: 0
        };
      }

      groups[dateKey].activities.push(activity);
      groups[dateKey].totalDuration += activity.duration || 0;
    });

    // Sort by date descending
    this.groupedActivities = Object.values(groups).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  onPeriodChange(): void {
    this.loadMyActivities();
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
      case 'PRODUCTIVE': return 'cat-productive';
      case 'NON_PRODUCTIVE': return 'cat-unproductive';
      default: return 'cat-neutral';
    }
  }

  getScoreColor(score: number): string {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }

  formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    } else if (m > 0) {
      return `${m}m ${s}s`;
    }
    return `${s}s`;
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

  navigateToProductivity(): void {
    this.router.navigate(['/productivity']);
  }
}
