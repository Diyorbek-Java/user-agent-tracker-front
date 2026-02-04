import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductivityService } from '../../core/services/productivity.service';
import { AuthService } from '../../core/services/auth.service';
import { AppCategory, AppCategoryCreate, UncategorizedApp } from '../../core/models/productivity.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app-categories.component.html',
  styleUrls: ['./app-categories.component.css']
})
export class AppCategoriesComponent implements OnInit {
  currentUser: User | null = null;
  categories: AppCategory[] = [];
  suggestions: UncategorizedApp[] = [];

  loading = true;
  loadingSuggestions = false;
  saving = false;
  error = '';

  // Filter
  categoryFilter: string = '';

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

  get isAdminOrManager(): boolean {
    return this.currentUser?.role === 'ADMIN' || this.currentUser?.role === 'MANAGER';
  }

  get filteredCategories(): AppCategory[] {
    if (!this.categoryFilter) {
      return this.categories;
    }
    return this.categories.filter(c => c.category === this.categoryFilter);
  }

  constructor(
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

    this.loadCategories();
    this.loadSuggestions();
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

  categorizeFromSuggestion(suggestion: UncategorizedApp, category: 'PRODUCTIVE' | 'NEUTRAL' | 'NON_PRODUCTIVE'): void {
    this.formData = {
      process_name: suggestion.process_name,
      display_name: suggestion.display_name,
      category: category,
      description: ''
    };

    this.saveCategory();
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
      },
      error: (err) => {
        console.error('Delete error:', err);
        alert('Failed to delete category');
      }
    });
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
