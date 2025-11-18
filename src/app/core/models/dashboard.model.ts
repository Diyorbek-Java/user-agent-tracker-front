export interface Session {
  id: number;
  username: string;
  start_time: string;
  end_time: string | null;
  is_active: boolean;
  total_duration: number;
  duration_hours: number;
}

export interface Activity {
  id: number;
  activity_type: number;
  activity_type_display: string;
  window_title?: string;
  process_name: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  duration_minutes: number;
}

export interface TopApplication {
  name: string;
  duration: number;
  count: number;
}

export interface DashboardStats {
  total_sessions: number;
  total_active_time: number;
  total_activities: number;
  top_applications: TopApplication[];
  recent_sessions: Session[];
  productivity_score: number;
  today_active_time: number;
  week_active_time: number;
}

export interface ActivityTimeline {
  hour: number;
  total_duration: number;
  activity_count: number;
}

export interface ProductivityReport {
  date: string;
  total_active_hours: number;
  total_sessions: number;
  top_app: string;
  productivity_score: number;
}

export interface PaginatedResponse<T> {
  count: number;
  page: number;
  page_size: number;
  results: T[];
}
