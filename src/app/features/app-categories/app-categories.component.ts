import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasRoleDirective } from '../../core/directives/has-role.directive';
import { Router } from '@angular/router';
import { ProductivityService } from '../../core/services/productivity.service';
import { OrganizationService } from '../../core/services/organization.service';
import { AuthService } from '../../core/services/auth.service';
import { AppCategory, AppCategoryCreate, UncategorizedApp } from '../../core/models/productivity.model';
import {
  JobPosition,
  PositionAppWeight,
  PositionAppWeightCreate,
  ProductivitySettingsModel
} from '../../core/models/organization.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, HasRoleDirective],
  templateUrl: './app-categories.component.html',
  styleUrls: ['./app-categories.component.css']
})
export class AppCategoriesComponent implements OnInit {
  currentUser: User | null = null;
  categories: AppCategory[] = [];
  suggestions: UncategorizedApp[] = [];
  positions: JobPosition[] = [];
  positionWeights: PositionAppWeight[] = [];
  settings: ProductivitySettingsModel | null = null;

  loading = true;
  loadingSuggestions = false;
  saving = false;
  savingSettings = false;
  error = '';

  // Position filter (required to categorize)
  selectedPosition: number | undefined = undefined;

  // Modal state
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  editingCategory: AppCategory | null = null;

  // Form data
  formData: AppCategoryCreate = {
    process_name: '',
    display_name: '',
    category: 'NEUTRAL',
    description: ''
  };

  // Settings form
  settingsForm = {
    default_weight: 0.5,
    productive_threshold: 70,
    needs_improvement_threshold: 50
  };

  // Track which weights are being saved (by app category id)
  savingWeightIds: Set<number> = new Set();

  get isAdminOrManager(): boolean {
    return this.currentUser?.role === 'ADMIN' || this.currentUser?.role === 'MANAGER';
  }

  getPositionTitle(): string {
    const pos = this.positions.find(p => p.id === this.selectedPosition);
    return pos ? pos.title : '';
  }

  constructor(
    private productivityService: ProductivityService,
    private orgService: OrganizationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;

    this.loadPositions();
    this.loadCategories();
    this.loadSuggestions();
    this.loadSettings();
  }

  loadPositions(): void {
    this.orgService.getPositions().subscribe({
      next: (data) => this.positions = data,
      error: (err) => console.error('Positions error:', err)
    });
  }

  loadCategories(): void {
    this.loading = true;
    this.error = '';

    this.productivityService.getAppCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load app categories';
        console.error('Categories error:', err);
        this.loading = false;
      }
    });
  }

  loadSuggestions(): void {
    this.loadingSuggestions = true;

    this.productivityService.getUncategorizedApps(20).subscribe({
      next: (data) => {
        this.suggestions = data.uncategorized_apps;
        this.loadingSuggestions = false;
      },
      error: (err) => {
        console.error('Suggestions error:', err);
        this.loadingSuggestions = false;
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
      error: (err) => console.error('Settings error:', err)
    });
  }

  loadPositionWeights(): void {
    if (!this.selectedPosition) {
      this.positionWeights = [];
      return;
    }
    this.orgService.getPositionWeights(this.selectedPosition).subscribe({
      next: (data) => this.positionWeights = data,
      error: (err) => console.error('Weights error:', err)
    });
  }

  onPositionChange(): void {
    this.loadPositionWeights();
  }

  // Get the weight for a specific app category in the selected position
  getWeightForApp(appCategoryId: number): number {
    const pw = this.positionWeights.find(w => w.app_category === appCategoryId);
    if (pw) return pw.weight;
    return this.settings?.default_weight ?? 0.5;
  }

  // Check if a position-specific weight exists (vs fallback)
  hasPositionWeight(appCategoryId: number): boolean {
    return this.positionWeights.some(w => w.app_category === appCategoryId);
  }

  // Get the PositionAppWeight record if exists
  getPositionWeight(appCategoryId: number): PositionAppWeight | undefined {
    return this.positionWeights.find(w => w.app_category === appCategoryId);
  }

  // Save or update a weight for the selected position + app
  setWeightForApp(appCategoryId: number, weight: number): void {
    if (!this.selectedPosition) return;
    this.savingWeightIds.add(appCategoryId);

    const existing = this.getPositionWeight(appCategoryId);
    const data: PositionAppWeightCreate = {
      position: this.selectedPosition,
      app_category: appCategoryId,
      weight: weight
    };

    const obs = existing
      ? this.orgService.updatePositionWeight(existing.id, { weight })
      : this.orgService.createPositionWeight(data);

    obs.subscribe({
      next: () => {
        this.savingWeightIds.delete(appCategoryId);
        this.loadPositionWeights();
      },
      error: (err) => {
        console.error('Save weight error:', err);
        this.savingWeightIds.delete(appCategoryId);
        alert('Failed to save weight: ' + (err.error?.non_field_errors?.[0] || err.error?.detail || err.message));
      }
    });
  }

  removeWeightForApp(appCategoryId: number): void {
    const existing = this.getPositionWeight(appCategoryId);
    if (!existing) return;
    if (!confirm('Remove weight for this position? App will use the default weight instead.')) return;

    this.orgService.deletePositionWeight(existing.id).subscribe({
      next: () => this.loadPositionWeights(),
      error: (err) => {
        console.error('Delete weight error:', err);
        alert('Failed to remove weight');
      }
    });
  }

  // Categorize uncategorized app: register it + set weight for the selected position
  categorizeWithWeight(suggestion: UncategorizedApp, weight: number): void {
    if (!this.selectedPosition) return;
    this.saving = true;

    // Register the app in AppCategory (category field is just informational now)
    const catData: AppCategoryCreate = {
      process_name: suggestion.process_name,
      display_name: suggestion.display_name,
      category: 'NEUTRAL',
      description: ''
    };

    this.productivityService.createAppCategory(catData).subscribe({
      next: (createdCat) => {
        // Create the position-specific weight
        const weightData: PositionAppWeightCreate = {
          position: this.selectedPosition!,
          app_category: createdCat.id,
          weight: weight
        };
        this.orgService.createPositionWeight(weightData).subscribe({
          next: () => {
            this.saving = false;
            this.loadCategories();
            this.loadSuggestions();
            this.loadPositionWeights();
          },
          error: (err) => {
            console.error('Weight creation error:', err);
            this.saving = false;
            // App was registered but weight failed - still reload
            this.loadCategories();
            this.loadSuggestions();
          }
        });
      },
      error: (err) => {
        console.error('Save error:', err);
        this.saving = false;
        alert('Failed to register app: ' + (err.error?.process_name?.[0] || err.message));
      }
    });
  }

  saveSettings(): void {
    this.savingSettings = true;
    this.orgService.updateProductivitySettings(this.settingsForm).subscribe({
      next: (data) => {
        this.settings = data;
        this.savingSettings = false;
      },
      error: (err) => {
        console.error('Save settings error:', err);
        this.savingSettings = false;
        alert('Failed to save settings');
      }
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingCategory = null;
    this.formData = {
      process_name: '',
      display_name: '',
      category: 'NEUTRAL',
      description: ''
    };
    this.showModal = true;
  }

  openEditModal(category: AppCategory): void {
    this.modalMode = 'edit';
    this.editingCategory = category;
    this.formData = {
      process_name: category.process_name,
      display_name: category.display_name,
      category: category.category,
      description: category.description || ''
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingCategory = null;
  }

  saveCategory(): void {
    if (!this.formData.process_name || !this.formData.display_name) {
      return;
    }

    this.saving = true;

    if (this.modalMode === 'create' || !this.showModal) {
      this.productivityService.createAppCategory(this.formData).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadCategories();
          this.loadSuggestions();
        },
        error: (err) => {
          console.error('Save error:', err);
          this.saving = false;
          alert('Failed to create category: ' + (err.error?.process_name?.[0] || err.message));
        }
      });
    } else if (this.editingCategory) {
      this.productivityService.updateAppCategory(this.editingCategory.id, this.formData).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadCategories();
        },
        error: (err) => {
          console.error('Update error:', err);
          this.saving = false;
          alert('Failed to update category');
        }
      });
    }
  }

  deleteCategory(category: AppCategory): void {
    if (!confirm(`Are you sure you want to delete "${category.display_name}"?`)) {
      return;
    }

    this.productivityService.deleteAppCategory(category.id).subscribe({
      next: () => {
        this.loadCategories();
        this.loadSuggestions();
        if (this.selectedPosition) this.loadPositionWeights();
      },
      error: (err) => {
        console.error('Delete error:', err);
        alert('Failed to delete category');
      }
    });
  }

  getWeightColor(weight: number): string {
    if (weight >= 0.7) return '#10b981';
    if (weight >= 0.4) return '#f59e0b';
    return '#ef4444';
  }

  formatWeight(weight: number): string {
    return (weight * 100).toFixed(0) + '%';
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
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  }

  navigateBack(): void {
    this.router.navigate(['/productivity']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
