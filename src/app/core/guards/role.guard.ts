import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

const ORG_ROLES = ['ORG_MANAGER', 'ORG_ADMIN'];

/**
 * Factory guard that checks authentication AND role membership.
 * Usage in routes:  canActivate: [roleGuard(['ADMIN', 'MANAGER'])]
 *
 * Redirect logic:
 *  - Not authenticated         → /auth/login
 *  - ORG role hitting non-org  → /organization
 *  - Other unauthorised role   → /dashboard
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated) {
      router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    const user = authService.currentUserValue;
    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    const fallback = user && ORG_ROLES.includes(user.role) ? '/organization' : '/dashboard';
    router.navigate([fallback]);
    return false;
  };
};
