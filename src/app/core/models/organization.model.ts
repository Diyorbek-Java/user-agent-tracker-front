export interface Organization {
  id: number;
  name: string;
  description: string;
  head_of_organization: number | null;
  head_name: string | null;
  is_active: boolean;
  department_count: number;
  admin_user_id: number | null;
  admin_user_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationCreate {
  name: string;
  description?: string;
  head_of_organization?: number | null;
  is_active?: boolean;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  organization: number | null;
  organization_name: string | null;
  head_of_department: number | null;
  head_name: string | null;
  is_active: boolean;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

export interface DepartmentCreate {
  name: string;
  description?: string;
  organization?: number | null;
  head_of_department?: number | null;
  is_active?: boolean;
}

export interface OrgUser {
  id: number;
  full_name: string;
  employee_id: string;
  role: string;
  department: number | null;
  department_name: string | null;
  position: number | null;
  position_title: string | null;
}

export interface ShiftDay {
  day: number;
  name: string;
  is_day_off: boolean;
  start_time: string;
  end_time: string;
  lunch_break_minutes: number;
}

export interface JobPosition {
  id: number;
  title: string;
  description: string;
  level: string;
  is_active: boolean;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

export interface JobPositionCreate {
  title: string;
  description?: string;
  level?: string;
  is_active?: boolean;
}

export interface DepartmentAppRule {
  id: number;
  department: number;
  department_name: string;
  app_category: number;
  app_display_name: string;
  app_process_name: string;
  category_override: 'PRODUCTIVE' | 'NEUTRAL' | 'NON_PRODUCTIVE';
  reason: string;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_name: string | null;
}

export interface DepartmentAppRuleCreate {
  department: number;
  app_category: number;
  category_override: 'PRODUCTIVE' | 'NEUTRAL' | 'NON_PRODUCTIVE';
  reason?: string;
}

export interface PositionAppWeight {
  id: number;
  position: number;
  position_title: string;
  app_category: number;
  app_display_name: string;
  app_process_name: string;
  weight: number;
  reason: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_name: string | null;
}

export interface PositionAppWeightCreate {
  position: number;
  app_category: number;
  weight: number;
  reason?: string;
}

export interface ProductivitySettingsModel {
  default_weight: number;
  productive_threshold: number;
  needs_improvement_threshold: number;
  updated_at: string;
}
