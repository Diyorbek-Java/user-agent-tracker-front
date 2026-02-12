export interface WorkingShift {
  id: number;
  user: number;
  user_name: string;
  day_of_week: number;
  day_name: string;
  start_time: string | null;
  end_time: string | null;
  is_day_off: boolean;
  lunch_break_minutes: number;
  duration_hours: number;
  created_at: string;
  updated_at: string;
}

export interface ShiftInput {
  day_of_week: number;
  start_time?: string;
  end_time?: string;
  is_day_off: boolean;
  lunch_break_minutes?: number;
}

export interface UserShiftsResponse {
  user: {
    id: number;
    name: string;
    employee_id: string;
  };
  total_weekly_hours: number;
  shifts: WorkingShift[];
}

export interface UserShiftSummary {
  id: number;
  full_name: string;
  employee_id: string;
  department: string | null;
  role: string;
  total_weekly_hours: number;
  working_days: number;
  days_off: number;
  has_shifts: boolean;
}

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
