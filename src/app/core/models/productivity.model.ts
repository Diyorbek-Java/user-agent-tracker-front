export interface ProductivityPeriod {
  from: string;
  to: string;
}

export interface ProductivitySummary {
  total_employees: number;
  productive_employees: number;
  average_productivity: number;
}

export interface TopPerformer {
  id: number;
  name: string;
  score: number;
  productive_hours: number;
}

export interface NeedsAttention {
  id: number;
  name: string;
  score: number;
  top_distraction: string | null;
}

export interface TopApp {
  name: string;
  total_hours: number;
}

export interface ProductivityDashboard {
  period: ProductivityPeriod;
  summary: ProductivitySummary;
  top_performers: TopPerformer[];
  needs_attention: NeedsAttention[];
  top_productive_apps: TopApp[];
  top_unproductive_apps: TopApp[];
}

export interface EmployeeProductivity {
  id: number;
  employee_id: string;
  name: string;
  department: string | null;
  department_id: number | null;
  productivity_score: number;
  productive_hours: number;
  neutral_hours: number;
  non_productive_hours: number;
  total_tracked_hours: number;
  status: 'productive' | 'needs_improvement' | 'unproductive';
  top_apps: AppUsage[];
}

export interface EmployeeListResponse {
  period: ProductivityPeriod;
  employees: EmployeeProductivity[];
}

export interface ProductivityBreakdown {
  hours: number;
  percentage: number;
}

export interface DailyTrend {
  date: string;
  score: number;
  hours: number;
}

export interface AppUsage {
  name: string;
  category: 'PRODUCTIVE' | 'NEUTRAL' | 'NON_PRODUCTIVE';
  hours: number;
  seconds: number;
  count: number;
}

export interface EmployeeProductivityDetail {
  user: {
    id: number;
    name: string;
    employee_id: string;
    department: string | null;
  };
  period: ProductivityPeriod;
  productivity_score: number;
  status: 'productive' | 'needs_improvement' | 'unproductive';
  breakdown: {
    productive: ProductivityBreakdown;
    neutral: ProductivityBreakdown;
    non_productive: ProductivityBreakdown;
  };
  total_tracked_hours: number;
  daily_trend: DailyTrend[];
  top_apps: AppUsage[];
}

export interface AppCategory {
  id: number;
  process_name: string;
  display_name: string;
  category: 'PRODUCTIVE' | 'NEUTRAL' | 'NON_PRODUCTIVE';
  description: string | null;
  is_global: boolean;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_name: string | null;
}

export interface AppCategoryCreate {
  process_name: string;
  display_name: string;
  category: 'PRODUCTIVE' | 'NEUTRAL' | 'NON_PRODUCTIVE';
  description?: string;
}

export interface UncategorizedApp {
  process_name: string;
  display_name: string;
  total_hours: number;
  users_count: number;
}

export interface UncategorizedAppsResponse {
  uncategorized_apps: UncategorizedApp[];
}

export interface ManualTimeEntry {
  id: number;
  user: number;
  user_name: string;
  activity_type: string;
  activity_type_display: string;
  description: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_productive: boolean;
  created_at: string;
  updated_at: string;
}

export interface ManualTimeEntryCreate {
  activity_type: string;
  description: string;
  start_time: string;
  end_time: string;
  is_productive: boolean;
}
