import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrganizationService } from '../../core/services/organization.service';
import { ProductivityService } from '../../core/services/productivity.service';
import { AuthService } from '../../core/services/auth.service';
import { Department, DepartmentAppRule, DepartmentAppRuleCreate } from '../../core/models/organization.model';
import { AppCategory } from '../../core/models/productivity.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-department-rules',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './department-rules.component.html',
  styleUrls: ['./department-rules.component.css']
})
export class DepartmentRulesComponent implements OnInit {
  currentUser: User | null = null;
  rules: DepartmentAppRule[] = [];
  departments: Department[] = [];
  appCategories: AppCategory[] = [];

  loading = true;
  saving = false;
  error = '';

  // Filter
  filterDepartment: number | undefined = undefined;

  // Modal
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  editingRuleId: number | null = null;
  formData: DepartmentAppRuleCreate = {
    department: 0,
    app_category: 0,
    category_override: 'NEUTRAL',
    reason: ''
  };

  get isAdminOrManager(): boolean {
    return this.currentUser?.role === 'ADMIN' || this.currentUser?.role === 'MANAGER';
  }

  get filteredRules(): DepartmentAppRule[] {
    if (!this.filterDepartment) return this.rules;
    return this.rules.filter(r => r.department === this.filterDepartment);
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

    // Load departments, app categories, and rules in sequence
    this.orgService.getDepartments().subscribe({
      next: (depts) => {
        this.departments = depts;
        this.productivityService.getAppCategories().subscribe({
          next: (cats) => {
            this.appCategories = cats;
            this.loadRules();
          },
          error: (err) => {
            this.error = 'Failed to load app categories';
            console.error(err);
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.error = 'Failed to load departments';
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadRules(): void {
    this.orgService.getDepartmentRules().subscribe({
      next: (data) => {
        this.rules = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load department rules';
        console.error(err);
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingRuleId = null;
    this.formData = {
      department: this.departments.length > 0 ? this.departments[0].id : 0,
      app_category: this.appCategories.length > 0 ? this.appCategories[0].id : 0,
      category_override: 'NEUTRAL',
      reason: ''
    };
    this.showModal = true;
  }

  openEditModal(rule: DepartmentAppRule): void {
    this.modalMode = 'edit';
    this.editingRuleId = rule.id;
    this.formData = {
      department: rule.department,
      app_category: rule.app_category,
      category_override: rule.category_override,
      reason: rule.reason || ''
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingRuleId = null;
  }

  saveRule(): void {
    if (!this.formData.department || !this.formData.app_category) return;
    this.saving = true;

    const obs = this.modalMode === 'create'
      ? this.orgService.createDepartmentRule(this.formData)
      : this.orgService.updateDepartmentRule(this.editingRuleId!, this.formData);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadRules();
      },
      error: (err) => {
        console.error('Save rule error:', err);
        this.saving = false;
        alert('Failed to save rule: ' + (err.error?.non_field_errors?.[0] || err.error?.detail || err.message));
      }
    });
  }

  deleteRule(rule: DepartmentAppRule): void {
    if (!confirm(`Delete override for "${rule.app_display_name}" in ${rule.department_name}?`)) return;

    this.orgService.deleteDepartmentRule(rule.id).subscribe({
      next: () => this.loadRules(),
      error: (err) => {
        console.error('Delete rule error:', err);
        alert('Failed to delete rule');
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

  navigateBack(): void {
    this.router.navigate(['/productivity']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
