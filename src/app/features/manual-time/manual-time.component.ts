import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductivityService } from '../../core/services/productivity.service';
import { AuthService } from '../../core/services/auth.service';
import { ManualTimeEntry, ManualTimeEntryCreate } from '../../core/models/productivity.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-manual-time',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manual-time.component.html',
  styleUrls: ['./manual-time.component.css']
})
export class ManualTimeComponent implements OnInit {
  currentUser: User | null = null;
  entries: ManualTimeEntry[] = [];

  loading = true;
  saving = false;
  error = '';

  // Activity type options
  activityTypes = [
    { value: 'MEETING', label: 'Meeting' },
    { value: 'PHONE_CALL', label: 'Phone Call' },
    { value: 'FIELD_WORK', label: 'Field Work' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'BREAK', label: 'Break' },
    { value: 'OTHER', label: 'Other' }
  ];

  // Modal
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  editingEntryId: number | null = null;
  formData: ManualTimeEntryCreate = {
    activity_type: 'MEETING',
    description: '',
    start_time: '',
    end_time: '',
    is_productive: true
  };

  get isAdminOrManager(): boolean {
    return this.currentUser?.role === 'ADMIN' || this.currentUser?.role === 'MANAGER';
  }

  constructor(
    private productivityService: ProductivityService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.loadEntries();
  }

  loadEntries(): void {
    this.loading = true;
    this.error = '';

    this.productivityService.getManualTimeEntries().subscribe({
      next: (data) => {
        this.entries = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load manual time entries';
        console.error('Manual time error:', err);
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingEntryId = null;

    // Default to current time range (last hour)
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    this.formData = {
      activity_type: 'MEETING',
      description: '',
      start_time: this.toLocalDatetimeString(oneHourAgo),
      end_time: this.toLocalDatetimeString(now),
      is_productive: true
    };
    this.showModal = true;
  }

  openEditModal(entry: ManualTimeEntry): void {
    this.modalMode = 'edit';
    this.editingEntryId = entry.id;
    this.formData = {
      activity_type: entry.activity_type,
      description: entry.description,
      start_time: this.toLocalDatetimeString(new Date(entry.start_time)),
      end_time: this.toLocalDatetimeString(new Date(entry.end_time)),
      is_productive: entry.is_productive
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingEntryId = null;
  }

  saveEntry(): void {
    if (!this.formData.description || !this.formData.start_time || !this.formData.end_time) return;
    this.saving = true;

    // Convert local datetime strings to ISO format
    const payload = {
      ...this.formData,
      start_time: new Date(this.formData.start_time).toISOString(),
      end_time: new Date(this.formData.end_time).toISOString()
    };

    const obs = this.modalMode === 'create'
      ? this.productivityService.createManualTimeEntry(payload)
      : this.productivityService.updateManualTimeEntry(this.editingEntryId!, payload);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadEntries();
      },
      error: (err) => {
        console.error('Save entry error:', err);
        this.saving = false;
        const errMsg = err.error?.non_field_errors?.[0] || err.error?.detail || err.message;
        alert('Failed to save entry: ' + errMsg);
      }
    });
  }

  deleteEntry(entry: ManualTimeEntry): void {
    if (!confirm(`Delete this ${entry.activity_type_display} entry?`)) return;

    this.productivityService.deleteManualTimeEntry(entry.id).subscribe({
      next: () => this.loadEntries(),
      error: (err) => {
        console.error('Delete entry error:', err);
        alert('Failed to delete entry');
      }
    });
  }

  getActivityTypeLabel(type: string): string {
    const found = this.activityTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  private toLocalDatetimeString(date: Date): string {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  }

  navigateBack(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
