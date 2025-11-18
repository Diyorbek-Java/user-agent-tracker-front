export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  employee_id: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  department?: string;
  position?: string;
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
