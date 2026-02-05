import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrganizationService } from '../../core/services/organization.service';
import { ProductivityService } from '../../core/services/productivity.service';
import { AuthService } from '../../core/services/auth.service';
import {
  JobPosition,
  PositionAppWeight,
  PositionAppWeightCreate,
  ProductivitySettingsModel
} from '../../core/models/organization.model';
import { AppCategory } from '../../core/models/productivity.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-position-weights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './position-weights.component.html',
  styleUrls: ['./position-weights.component.css']
})
export class PositionWeightsComponent implements OnInit {
  currentUser: User | null = null;
  weights: PositionAppWeight[] = [];
  positions: JobPosition[] = [];
  appCategories: AppCategory[] = [];
  settings: ProductivitySettingsModel | null = null;

  loading = true;
  saving = false;
  savingSettings = false;
  error = '';

  // Filter
  filterPosition: number | undefined = undefined;

  // Weight modal
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  editingWeightId: number | null = null;
  formData: PositionAppWeightCreate = {
    position: 0,
    app_category: 0,
    weight: 0.5,
    reason: ''
  };

  // Settings form
  settingsForm = {
    default_weight: 0.5,
    productive_threshold: 70,
    needs_improvement_threshold: 50
  };

  get isAdminOrManager(): boolean {
    return this.currentUser?.role === 'ADMIN' || this.currentUser?.role === 'MANAGER';
  }

  get filteredWeights(): PositionAppWeight[] {
    if (!this.filterPosition) return this.weights;
    return this.weights.filter(w => w.position === this.filterPosition);
  }

  constructor(
    private orgService: OrganizationService,
    private productivityService: ProductivityService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;

    if (!this.isAdminOrManager) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    this.orgService.getPositions().subscribe({
      next: (positions) => {
        this.positions = positions;
        this.productivityService.getAppCategories().subscribe({
          next: (cats) => {
            this.appCategories = cats;
            this.loadWeights();
            this.loadSettings();
          },
          error: (err) => {
            this.error = 'Failed to load app categories';
            console.error(err);
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.error = 'Failed to load positions';
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadWeights(): void {
    this.orgService.getPositionWeights().subscribe({
      next: (data) => {
        this.weights = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load position weights';
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadSettings(): void {
    this.orgService.getProductivitySettings().subscribe({
      next: (data) => {
        this.settings = data;
        this.settingsForm = {
          default_weight: data.default_weight,
          productive_threshold: data.productive_threshold,
          needs_improvement_threshold: data.needs_improvement_threshold
        };
      },
      error: (err) => console.error('Failed to load settings:', err)
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingWeightId = null;
    this.formData = {
      position: this.positions.length > 0 ? this.positions[0].id : 0,
      app_category: this.appCategories.length > 0 ? this.appCategories[0].id : 0,
      weight: 0.5,
      reason: ''
    };
    this.showModal = true;
  }

  openEditModal(weight: PositionAppWeight): void {
    this.modalMode = 'edit';
    this.editingWeightId = weight.id;
    this.formData = {
      position: weight.position,
      app_category: weight.app_category,
      weight: weight.weight,
      reason: weight.reason || ''
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingWeightId = null;
  }

  saveWeight(): void {
    if (!this.formData.position || !this.formData.app_category) return;
    this.saving = true;

    const obs = this.modalMode === 'create'
      ? this.orgService.createPositionWeight(this.formData)
      : this.orgService.updatePositionWeight(this.editingWeightId!, this.formData);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadWeights();
      },
      error: (err) => {
        console.error('Save weight error:', err);
        this.saving = false;
        alert('Failed to save weight: ' + (err.error?.non_field_errors?.[0] || err.error?.detail || err.message));
      }
    });
  }

  deleteWeight(weight: PositionAppWeight): void {
    if (!confirm(`Delete weight for "${weight.app_display_name}" in ${weight.position_title}?`)) return;

    this.orgService.deletePositionWeight(weight.id).subscribe({
      next: () => this.loadWeights(),
      error: (err) => {
        console.error('Delete weight error:', err);
        alert('Failed to delete weight');
      }
    });
  }

  saveSettings(): void {
    this.savingSettings = true;

    this.orgService.updateProductivitySettings(this.settingsForm).subscribe({
      next: (data) => {
        this.settings = data;
        this.savingSettings = false;
        alert('Settings saved successfully');
      },
      error: (err) => {
        console.error('Save settings error:', err);
        this.savingSettings = false;
        alert('Failed to save settings');
      }
    });
  }

  getWeightColor(weight: number): string {
    if (weight >= 0.7) return '#10b981';
    if (weight >= 0.4) return '#f59e0b';
    return '#ef4444';
  }

  getWeightLabel(weight: number): string {
    if (weight >= 0.9) return 'Highly Productive';
    if (weight >= 0.7) return 'Productive';
    if (weight >= 0.4) return 'Mixed';
    if (weight >= 0.2) return 'Mostly Unproductive';
    return 'Unproductive';
  }

  formatWeight(weight: number): string {
    return (weight * 100).toFixed(0) + '%';
  }

  navigateBack(): void {
    this.router.navigate(['/productivity']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
