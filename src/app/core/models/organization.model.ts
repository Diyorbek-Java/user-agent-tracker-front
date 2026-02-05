export interface Department {
  id: number;
  name: string;
  description: string;
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
  head_of_department?: number | null;
  is_active?: boolean;
}

export interface JobPosition {
  id: number;
  title: string;
  description: string;
  level: number;
  is_active: boolean;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

export interface JobPositionCreate {
  title: string;
  description?: string;
  level?: number;
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
