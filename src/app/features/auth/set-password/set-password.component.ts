import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './set-password.component.html',
  styleUrls: ['../login/login.component.css']
})
export class SetPasswordComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  email = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.email = this.route.snapshot.queryParams['email'] || '';

    this.form = this.fb.group({
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', [Validators.required]]
    }, { validators: this.matchPasswords });

    if (!this.email) {
      this.router.navigate(['/auth/login']);
    }
  }

  matchPasswords(group: AbstractControl): ValidationErrors | null {
    const a = group.get('new_password')?.value;
    const b = group.get('confirm_password')?.value;
    return a && b && a !== b ? { mismatch: true } : null;
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = '';

    this.authService.setPassword({
      email: this.email,
      new_password: this.form.value.new_password
    }).subscribe({
      next: (res) => {
        if (res.user?.role === 'ORG_MANAGER' || res.user?.role === 'ORG_ADMIN') {
          this.router.navigate(['/organization']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to set password.';
        this.loading = false;
      },
      complete: () => { this.loading = false; }
    });
  }

  get newPassword() { return this.form.get('new_password'); }
  get confirmPassword() { return this.form.get('confirm_password'); }
}
