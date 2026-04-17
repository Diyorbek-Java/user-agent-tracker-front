import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasRoleDirective } from '../../core/directives/has-role.directive';
import { Router } from '@angular/router';
import { OrganizationService } from '../../core/services/organization.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Organization, OrganizationCreate,
  Department, DepartmentCreate,
  JobPosition, JobPositionCreate,
  OrgUser, ShiftDay
} from '../../core/models/organization.model';
import { User } from '../../core/models/user.model';

type Tab = 'organizations' | 'departments' | 'positions' | 'users' | 'shifts';
type ModalType = 'organization' | 'department' | 'position' | 'assign';

const DEFAULT_SHIFT_DAYS: ShiftDay[] = [
  { day: 0, name: 'Monday',    is_day_off: false, start_time: '09:00', end_time: '18:00', lunch_break_minutes: 60 },
  { day: 1, name: 'Tuesday',   is_day_off: false, start_time: '09:00', end_time: '18:00', lunch_break_minutes: 60 },
  { day: 2, name: 'Wednesday', is_day_off: false, start_time: '09:00', end_time: '18:00', lunch_break_minutes: 60 },
  { day: 3, name: 'Thursday',  is_day_off: false, start_time: '09:00', end_time: '18:00', lunch_break_minutes: 60 },
  { day: 4, name: 'Friday',    is_day_off: false, start_time: '09:00', end_time: '18:00', lunch_break_minutes: 60 },
  { day: 5, name: 'Saturday',  is_day_off: true,  start_time: '',      end_time: '',      lunch_break_minutes: 0  },
  { day: 6, name: 'Sunday',    is_day_off: true,  start_time: '',      end_time: '',      lunch_break_minutes: 0  },
];

@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [CommonModule, FormsModule, HasRoleDirective],
  templateUrl: './organization.component.html',
  styleUrls: ['./organization.component.css']
})
export class OrganizationComponent implements OnInit {
  currentUser: User | null = null;
  activeTab: Tab = 'organizations';

  organizations: Organization[] = [];
  departments: Department[] = [];
  positions: JobPosition[] = [];
  orgUsers: OrgUser[] = [];

  loading = false;
  saving = false;
  error = '';

  // Modal
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  modalType: ModalType = 'organization';

  // Forms
  orgForm: OrganizationCreate = { name: '', description: '', head_of_organization: null, is_active: true };
  orgFormAdminUserId: number | null = null;
  editingOrgId: number | null = null;

  deptForm: DepartmentCreate = { name: '', description: '', organization: null, head_of_department: null, is_active: true };
  editingDeptId: number | null = null;

  posForm: JobPositionCreate = { title: '', description: '', level: '', is_active: true };
  editingPosId: number | null = null;

  assignForm: { department: number | null; position: number | null } = { department: null, position: null };
  assigningUser: OrgUser | null = null;

  // Shifts tab
  shiftUserId: number | null = null;
  shiftUserName = '';
  shiftDays: ShiftDay[] = DEFAULT_SHIFT_DAYS.map(d => ({ ...d }));
  loadingShifts = false;
  savingShifts = false;

  get isAdminOrManager(): boolean {
    const r = this.currentUser?.role;
    return r === 'ADMIN' || r === 'MANAGER' || r === 'ORG_MANAGER' || r === 'ORG_ADMIN';
  }

  get isOrgManager(): boolean {
    return this.currentUser?.role === 'ORG_MANAGER';
  }

  get isOrgAdmin(): boolean {
    return this.currentUser?.role === 'ORG_ADMIN';
  }

  get administrationUsers(): OrgUser[] {
    return this.orgUsers.filter(u => u.role === 'ORG_ADMIN');
  }

  constructor(
    private orgService: OrganizationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.loadAll();
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
  }

  loadAll(): void {
    this.loading = true;
    this.error = '';
    let done = 0;
    const finish = () => { if (++done === 4) this.loading = false; };

    this.orgService.getOrganizations().subscribe({ next: d => { this.organizations = d; finish(); }, error: () => finish() });
    this.orgService.getDepartments().subscribe({ next: d => { this.departments = d; finish(); }, error: () => finish() });
    this.orgService.getPositions().subscribe({ next: d => { this.positions = d; finish(); }, error: () => finish() });
    this.orgService.getOrgUsers().subscribe({ next: d => { this.orgUsers = d; finish(); }, error: () => finish() });
  }

  // ---- Organizations ----
  openCreateOrg(): void {
    this.modalType = 'organization'; this.modalMode = 'create'; this.editingOrgId = null;
    this.orgForm = { name: '', description: '', head_of_organization: null, is_active: true };
    this.orgFormAdminUserId = null;
    this.showModal = true;
  }
  openEditOrg(org: Organization): void {
    this.modalType = 'organization'; this.modalMode = 'edit'; this.editingOrgId = org.id;
    this.orgForm = { name: org.name, description: org.description || '', head_of_organization: org.head_of_organization, is_active: org.is_active };
    this.orgFormAdminUserId = org.admin_user_id;
    this.showModal = true;
  }
  saveOrg(): void {
    if (!this.orgForm.name) return;
    this.saving = true;
    const obs = this.modalMode === 'create'
      ? this.orgService.createOrganization(this.orgForm)
      : this.orgService.updateOrganization(this.editingOrgId!, this.orgForm);
    obs.subscribe({
      next: saved => {
        // After saving org, assign the org admin if ORG_MANAGER
        if (this.isOrgManager) {
          this.orgService.assignOrgAdmin(saved.id, this.orgFormAdminUserId).subscribe({
            next: () => { this.saving = false; this.closeModal(); this.loadAll(); },
            error: err => { this.saving = false; alert('Org saved but admin assign failed: ' + (err.error?.error || err.message)); }
          });
        } else {
          this.saving = false; this.closeModal(); this.loadAll();
        }
      },
      error: err => { this.saving = false; alert('Failed: ' + (err.error?.name?.[0] || err.message)); }
    });
  }
  deleteOrg(org: Organization): void {
    if (!confirm(`Delete organization "${org.name}"?`)) return;
    this.orgService.deleteOrganization(org.id).subscribe({ next: () => this.loadAll(), error: () => alert('Failed to delete') });
  }

  // ---- Departments ----
  openCreateDept(): void {
    this.modalType = 'department'; this.modalMode = 'create'; this.editingDeptId = null;
    this.deptForm = { name: '', description: '', organization: null, head_of_department: null, is_active: true };
    this.showModal = true;
  }
  openEditDept(dept: Department): void {
    this.modalType = 'department'; this.modalMode = 'edit'; this.editingDeptId = dept.id;
    this.deptForm = { name: dept.name, description: dept.description || '', organization: dept.organization, head_of_department: dept.head_of_department, is_active: dept.is_active };
    this.showModal = true;
  }
  saveDept(): void {
    if (!this.deptForm.name) return;
    this.saving = true;
    const obs = this.modalMode === 'create'
      ? this.orgService.createDepartment(this.deptForm)
      : this.orgService.updateDepartment(this.editingDeptId!, this.deptForm);
    obs.subscribe({ next: () => { this.saving = false; this.closeModal(); this.loadAll(); }, error: err => { this.saving = false; alert('Failed: ' + (err.error?.name?.[0] || err.message)); } });
  }
  deleteDept(dept: Department): void {
    if (!confirm(`Delete department "${dept.name}"?`)) return;
    this.orgService.deleteDepartment(dept.id).subscribe({ next: () => this.loadAll(), error: () => alert('Failed to delete') });
  }

  // ---- Positions ----
  openCreatePos(): void {
    this.modalType = 'position'; this.modalMode = 'create'; this.editingPosId = null;
    this.posForm = { title: '', description: '', level: '', is_active: true };
    this.showModal = true;
  }
  openEditPos(pos: JobPosition): void {
    this.modalType = 'position'; this.modalMode = 'edit'; this.editingPosId = pos.id;
    this.posForm = { title: pos.title, description: pos.description || '', level: pos.level, is_active: pos.is_active };
    this.showModal = true;
  }
  savePos(): void {
    if (!this.posForm.title) return;
    this.saving = true;
    const obs = this.modalMode === 'create'
      ? this.orgService.createPosition(this.posForm)
      : this.orgService.updatePosition(this.editingPosId!, this.posForm);
    obs.subscribe({ next: () => { this.saving = false; this.closeModal(); this.loadAll(); }, error: err => { this.saving = false; alert('Failed: ' + (err.error?.title?.[0] || err.message)); } });
  }
  deletePos(pos: JobPosition): void {
    if (!confirm(`Delete position "${pos.title}"?`)) return;
    this.orgService.deletePosition(pos.id).subscribe({ next: () => this.loadAll(), error: () => alert('Failed to delete') });
  }

  // ---- Users: assign dept/position ----
  openAssign(user: OrgUser): void {
    this.assigningUser = user;
    this.assignForm = { department: user.department, position: user.position };
    this.modalType = 'assign';
    this.showModal = true;
  }
  saveAssign(): void {
    if (!this.assigningUser) return;
    this.saving = true;
    this.orgService.assignUser(this.assigningUser.id, this.assignForm).subscribe({
      next: updated => {
        this.saving = false;
        const idx = this.orgUsers.findIndex(u => u.id === updated.id);
        if (idx >= 0) this.orgUsers[idx] = { ...this.orgUsers[idx], ...updated };
        this.closeModal();
      },
      error: err => { this.saving = false; alert('Failed: ' + (err.error?.error || err.message)); }
    });
  }

  // ---- Shifts ----
  onShiftUserChange(): void {
    if (!this.shiftUserId) return;
    const u = this.orgUsers.find(u => u.id === Number(this.shiftUserId));
    this.shiftUserName = u?.full_name || '';
    this.loadingShifts = true;
    this.shiftDays = DEFAULT_SHIFT_DAYS.map(d => ({ ...d }));
    this.orgService.getUserShifts(Number(this.shiftUserId)).subscribe({
      next: res => {
        this.loadingShifts = false;
        (res.shifts || []).forEach((s: any) => {
          const day = this.shiftDays.find(d => d.day === s.day_of_week);
          if (day) {
            day.is_day_off = s.is_day_off;
            day.start_time = s.start_time ? s.start_time.substring(0, 5) : '';
            day.end_time   = s.end_time   ? s.end_time.substring(0, 5)   : '';
            day.lunch_break_minutes = s.lunch_break_minutes ?? 60;
          }
        });
      },
      error: () => { this.loadingShifts = false; }
    });
  }
  saveShifts(): void {
    if (!this.shiftUserId) return;
    this.savingShifts = true;
    this.orgService.setUserShifts(Number(this.shiftUserId), this.shiftDays).subscribe({
      next: () => { this.savingShifts = false; alert('Shifts saved successfully!'); },
      error: err => { this.savingShifts = false; alert('Failed: ' + (err.error?.shifts?.[0] || err.message)); }
    });
  }

  // ---- Modal helpers ----
  closeModal(): void {
    this.showModal = false;
    this.editingOrgId = null; this.editingDeptId = null; this.editingPosId = null;
    this.assigningUser = null;
  }
  save(): void {
    if (this.modalType === 'organization') this.saveOrg();
    else if (this.modalType === 'department') this.saveDept();
    else if (this.modalType === 'position') this.savePos();
    else if (this.modalType === 'assign') this.saveAssign();
  }

  addButton(): string {
    const map: Record<Tab, string> = { organizations: '+ Add Organization', departments: '+ Add Department', positions: '+ Add Position', users: '', shifts: '' };
    return map[this.activeTab];
  }
  onAddClick(): void {
    if (this.activeTab === 'organizations') this.openCreateOrg();
    else if (this.activeTab === 'departments') this.openCreateDept();
    else if (this.activeTab === 'positions') this.openCreatePos();
  }

  navigateBack(): void { this.router.navigate(['/dashboard']); }
  logout(): void { this.authService.logout(); this.router.navigate(['/auth/login']); }
}
