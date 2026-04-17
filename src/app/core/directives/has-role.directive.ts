import { Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Structural directive that shows content only when the current user has
 * one of the specified roles.
 *
 * Usage:
 *   <button *hasRole="['ADMIN', 'MANAGER']">Delete</button>
 *   <div *hasRole="['EMPLOYEE']">Your personal stats</div>
 */
@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit {
  private allowedRoles: string[] = [];
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  @Input() set hasRole(roles: string[]) {
    this.allowedRoles = roles ?? [];
    this.updateView();
  }

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const user = this.authService.currentUserValue;
    const allowed = !!user && this.allowedRoles.includes(user.role);

    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
