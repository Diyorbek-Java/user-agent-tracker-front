export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  employee_id: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'ORG_MANAGER' | 'ORG_ADMIN';
  managed_organization?: number | null;
  department?: number | null;
  department_name?: string | null;
  position?: { id: number; name: string } | null;
  computer_name?: string;
  is_admin?: boolean;
  last_login?: string;
  date_joined?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  first_login: boolean;
  token: string;
  user: User;
  message: string;
}

export interface SetPasswordRequest {
  email: string;
  new_password: string;
}
