import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ShiftService } from '../../core/services/shift.service';
import { AuthService } from '../../core/services/auth.service';
import { HasRoleDirective } from '../../core/directives/has-role.directive';
import {
  UserShiftSummary,
  UserShiftsResponse,
  WorkingShift,
  ShiftInput,
  DAY_NAMES
} from '../../core/models/shift.model';
import { User } from '../../core/models/user.model';

interface ShiftFormRow {
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  is_day_off: boolean;
  lunch_break_minutes: number;
}

@Component({
  selector: 'app-shift-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HasRoleDirective],
  templateUrl: './shift-management.component.html',
  styleUrls: ['./shift-management.component.css']
})
export class ShiftManagementComponent implements OnInit {
  currentUser: User | null = null;
  dayNames = DAY_NAMES;

  // User list view
  userSummaries: UserShiftSummary[] = [];
  filteredSummaries: UserShiftSummary[] = [];
  searchQuery = '';
  loadingList = true;

  // Detail/edit view
  selectedUserId: number | null = null;
  selectedUserName = '';
  userShiftsData: UserShiftsResponse | null = null;
  shiftForm: ShiftFormRow[] = [];
  loadingDetail = false;
  saving = false;

  // State
  showEditor = false;
  successMessage = '';
  errorMessage = '';

  get isAdminOrManager(): boolean {
    return this.currentUser?.role === 'ADMIN' || this.currentUser?.role === 'MANAGER';
  }

  constructor(
    private shiftService: ShiftService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;

    if (this.isAdminOrManager) {
      this.loadUserList();
    } else {
      // Employee: show their own shifts
      if (this.currentUser) {
        this.openUserShifts(this.currentUser.id, this.currentUser.full_name);
      }
    }
  }

  loadUserList(): void {
    this.loadingList = true;
    this.shiftService.getAllUsersShifts().subscribe({
      next: (data) => {
        this.userSummaries = data;
        this.applyFilter();
        this.loadingList = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load user list';
        console.error('Shift list error:', err);
        this.loadingList = false;
      }
    });
  }

  applyFilter(): void {
    if (!this.searchQuery) {
      this.filteredSummaries = this.userSummaries;
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredSummaries = this.userSummaries.filter(u =>
        u.full_name.toLowerCase().includes(q) ||
        u.employee_id.toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q)
      );
    }
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  openUserShifts(userId: number, userName: string): void {
    this.selectedUserId = userId;
    this.selectedUserName = userName;
    this.showEditor = true;
    this.loadingDetail = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.shiftService.getUserShifts(userId).subscribe({
      next: (data) => {
        this.userShiftsData = data;
        this.buildShiftForm(data.shifts);
        this.loadingDetail = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load shifts';
        console.error('Shift detail error:', err);
        this.loadingDetail = false;
      }
    });
  }

  buildShiftForm(existingShifts: WorkingShift[]): void {
    const shiftMap: { [day: number]: WorkingShift } = {};
    existingShifts.forEach(s => shiftMap[s.day_of_week] = s);

    this.shiftForm = [];
    for (let day = 0; day < 7; day++) {
      const existing = shiftMap[day];
      this.shiftForm.push({
        day_of_week: day,
        day_name: DAY_NAMES[day],
        start_time: existing?.start_time ? existing.start_time.substring(0, 5) : '09:00',
        end_time: existing?.end_time ? existing.end_time.substring(0, 5) : '18:00',
        is_day_off: existing ? existing.is_day_off : (day >= 5),
        lunch_break_minutes: existing?.lunch_break_minutes ?? 60,
      });
    }
  }

  toggleDayOff(row: ShiftFormRow): void {
    row.is_day_off = !row.is_day_off;
  }

  applyToWeekdays(): void {
    // Copy Monday's shift to Tue-Fri
    const monday = this.shiftForm[0];
    for (let i = 1; i < 5; i++) {
      this.shiftForm[i].start_time = monday.start_time;
      this.shiftForm[i].end_time = monday.end_time;
      this.shiftForm[i].is_day_off = monday.is_day_off;
      this.shiftForm[i].lunch_break_minutes = monday.lunch_break_minutes;
    }
  }

  saveShifts(): void {
    if (!this.selectedUserId) return;

    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const shifts: ShiftInput[] = this.shiftForm.map(row => {
      if (row.is_day_off) {
        return { day_of_week: row.day_of_week, is_day_off: true };
      }
      return {
        day_of_week: row.day_of_week,
        start_time: row.start_time,
        end_time: row.end_time,
        is_day_off: false,
        lunch_break_minutes: row.lunch_break_minutes
      };
    });

    this.shiftService.setUserShifts(this.selectedUserId, shifts).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Shifts saved successfully';
        this.saving = false;
        // Refresh list if admin
        if (this.isAdminOrManager) {
          this.loadUserList();
        }
        // Refresh detail
        if (res.shifts) {
          this.userShiftsData = {
            ...this.userShiftsData!,
            total_weekly_hours: res.total_weekly_hours,
            shifts: res.shifts
          };
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.shifts?.[0] || err.error?.error || 'Failed to save shifts';
        console.error('Save shifts error:', err);
        this.saving = false;
      }
    });
  }

  closeEditor(): void {
    this.showEditor = false;
    this.selectedUserId = null;
    this.selectedUserName = '';
    this.userShiftsData = null;
    this.successMessage = '';
    this.errorMessage = '';
  }

  getShiftDuration(row: ShiftFormRow): string {
    if (row.is_day_off) return 'Day Off';
    const [sh, sm] = row.start_time.split(':').map(Number);
    const [eh, em] = row.end_time.split(':').map(Number);
    let totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // overnight
    // Deduct lunch break
    totalMinutes = Math.max(totalMinutes - (row.lunch_break_minutes || 0), 0);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  }

  getTotalFormHours(): number {
    let totalMinutes = 0;
    for (const row of this.shiftForm) {
      if (row.is_day_off) continue;
      const [sh, sm] = row.start_time.split(':').map(Number);
      const [eh, em] = row.end_time.split(':').map(Number);
      let mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins < 0) mins += 24 * 60;
      // Deduct lunch break
      mins = Math.max(mins - (row.lunch_break_minutes || 0), 0);
      totalMinutes += mins;
    }
    return Math.round(totalMinutes / 60 * 100) / 100;
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
