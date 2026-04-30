import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/signup',
    loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'auth/set-password',
    loadComponent: () => import('./features/auth/set-password/set-password.component').then(m => m.SetPasswordComponent)
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },

  // --- Monitoring routes: ADMIN / MANAGER / EMPLOYEE only ---
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [roleGuard(['ADMIN', 'MANAGER', 'EMPLOYEE'])]
  },
  {
    path: 'shift-management',
    loadComponent: () => import('./features/shift-management/shift-management.component').then(m => m.ShiftManagementComponent),
    canActivate: [roleGuard(['ADMIN', 'MANAGER', 'EMPLOYEE'])]
  },
  {
    path: 'network-activity',
    loadComponent: () => import('./features/network-activity/network-activity.component').then(m => m.NetworkActivityComponent),
    canActivate: [roleGuard(['ADMIN', 'MANAGER', 'EMPLOYEE'])]
  },

  // --- Admin / Manager only routes ---
  {
    path: 'productivity',
    loadComponent: () => import('./features/productivity-dashboard/productivity-dashboard.component').then(m => m.ProductivityDashboardComponent),
    canActivate: [roleGuard(['ADMIN', 'MANAGER'])]
  },
  {
    path: 'app-categories',
    loadComponent: () => import('./features/app-categories/app-categories.component').then(m => m.AppCategoriesComponent),
    canActivate: [roleGuard(['ADMIN', 'MANAGER'])]
  },
  {
    path: 'department-rules',
    loadComponent: () => import('./features/department-rules/department-rules.component').then(m => m.DepartmentRulesComponent),
    canActivate: [roleGuard(['ADMIN', 'MANAGER'])]
  },
  {
    path: 'position-weights',
    loadComponent: () => import('./features/position-weights/position-weights.component').then(m => m.PositionWeightsComponent),
    canActivate: [roleGuard(['ADMIN', 'MANAGER'])]
  },

  // --- User management: ADMIN, MANAGER, ORG_MANAGER ---
  {
    path: 'user-management',
    loadComponent: () => import('./features/user-management/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [roleGuard(['ADMIN', 'MANAGER', 'ORG_MANAGER'])]
  },

  // --- Organization: all management roles ---
  {
    path: 'organization',
    loadComponent: () => import('./features/organization/organization.component').then(m => m.OrganizationComponent),
    canActivate: [roleGuard(['ADMIN', 'MANAGER', 'ORG_MANAGER', 'ORG_ADMIN'])]
  },

  // --- Available to all authenticated users ---
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'productivity-trends',
    loadComponent: () => import('./features/productivity-trends/productivity-trends.component').then(m => m.ProductivityTrendsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'manual-time',
    loadComponent: () => import('./features/manual-time/manual-time.component').then(m => m.ManualTimeComponent),
    canActivate: [authGuard]
  },

  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
