import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'user-management',
    loadComponent: () => import('./features/user-management/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [authGuard]
  },
  {
    path: 'productivity',
    loadComponent: () => import('./features/productivity-dashboard/productivity-dashboard.component').then(m => m.ProductivityDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'app-categories',
    loadComponent: () => import('./features/app-categories/app-categories.component').then(m => m.AppCategoriesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'organization',
    loadComponent: () => import('./features/organization/organization.component').then(m => m.OrganizationComponent),
    canActivate: [authGuard]
  },
  {
    path: 'department-rules',
    loadComponent: () => import('./features/department-rules/department-rules.component').then(m => m.DepartmentRulesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'position-weights',
    loadComponent: () => import('./features/position-weights/position-weights.component').then(m => m.PositionWeightsComponent),
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
