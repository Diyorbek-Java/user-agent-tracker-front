import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrganizationService } from '../../core/services/organization.service';
import { AuthService } from '../../core/services/auth.service';
import { Department, DepartmentCreate, JobPosition, JobPositionCreate } from '../../core/models/organization.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './organization.component.html',
  styleUrls: ['./organization.component.css']
})
export class OrganizationComponent implements OnInit {
  currentUser: User | null = null;
  activeTab: 'departments' | 'positions' = 'departments';

  departments: Department[] = [];
  positions: JobPosition[] = [];

  loading = true;
  saving = false;
  error = '';

  // Modal state
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  modalType: 'department' | 'position' = 'department';

  // Department form
  deptForm: DepartmentCreate = { name: '', description: '', head_of_department: null, is_active: true };
  editingDeptId: number | null = null;

  // Position form
  posForm: JobPositionCreate = { title: '', description: '', level: 1, is_active: true };
  editingPosId: number | null = null;

  get isAdminOrManager(): boolean {
    return this.currentUser?.role === 'ADMIN' || this.currentUser?.role === 'MANAGER';
  }

  constructor(
    private orgService: OrganizationService,
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

    this.orgService.getDepartments().subscribe({
      next: (data) => {
        this.departments = data;
        this.loadPositions();
      },
      error: (err) => {
        this.error = 'Failed to load departments';
        console.error('Departments error:', err);
        this.loading = false;
      }
    });
  }

  loadPositions(): void {
    this.orgService.getPositions().subscribe({
      next: (data) => {
        this.positions = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load positions';
        console.error('Positions error:', err);
        this.loading = false;
      }
    });
  }

  setTab(tab: 'departments' | 'positions'): void {
    this.activeTab = tab;
  }

  // Department CRUD
  openCreateDept(): void {
    this.modalType = 'department';
    this.modalMode = 'create';
    this.editingDeptId = null;
    this.deptForm = { name: '', description: '', head_of_department: null, is_active: true };
    this.showModal = true;
  }

  openEditDept(dept: Department): void {
    this.modalType = 'department';
    this.modalMode = 'edit';
    this.editingDeptId = dept.id;
    this.deptForm = {
      name: dept.name,
      description: dept.description || '',
      head_of_department: dept.head_of_department,
      is_active: dept.is_active
    };
    this.showModal = true;
  }

  saveDept(): void {
    if (!this.deptForm.name) return;
    this.saving = true;

    const obs = this.modalMode === 'create'
      ? this.orgService.createDepartment(this.deptForm)
      : this.orgService.updateDepartment(this.editingDeptId!, this.deptForm);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadData();
      },
      error: (err) => {
        console.error('Save dept error:', err);
        this.saving = false;
        alert('Failed to save department: ' + (err.error?.name?.[0] || err.message));
      }
    });
  }

  deleteDept(dept: Department): void {
    if (!confirm(`Delete department "${dept.name}"? This cannot be undone.`)) return;

    this.orgService.deleteDepartment(dept.id).subscribe({
      next: () => this.loadData(),
      error: (err) => {
        console.error('Delete dept error:', err);
        alert('Failed to delete department');
      }
    });
  }

  // Position CRUD
  openCreatePos(): void {
    this.modalType = 'position';
    this.modalMode = 'create';
    this.editingPosId = null;
    this.posForm = { title: '', description: '', level: 1, is_active: true };
    this.showModal = true;
  }

  openEditPos(pos: JobPosition): void {
    this.modalType = 'position';
    this.modalMode = 'edit';
    this.editingPosId = pos.id;
    this.posForm = {
      title: pos.title,
      description: pos.description || '',
      level: pos.level,
      is_active: pos.is_active
    };
    this.showModal = true;
  }

  savePos(): void {
    if (!this.posForm.title) return;
    this.saving = true;

    const obs = this.modalMode === 'create'
      ? this.orgService.createPosition(this.posForm)
      : this.orgService.updatePosition(this.editingPosId!, this.posForm);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadData();
      },
      error: (err) => {
        console.error('Save pos error:', err);
        this.saving = false;
        alert('Failed to save position: ' + (err.error?.title?.[0] || err.message));
      }
    });
  }

  deletePos(pos: JobPosition): void {
    if (!confirm(`Delete position "${pos.title}"? This cannot be undone.`)) return;

    this.orgService.deletePosition(pos.id).subscribe({
      next: () => this.loadData(),
      error: (err) => {
        console.error('Delete pos error:', err);
        alert('Failed to delete position');
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.editingDeptId = null;
    this.editingPosId = null;
  }

  save(): void {
    if (this.modalType === 'department') {
      this.saveDept();
    } else {
      this.savePos();
    }
  }

  navigateBack(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
