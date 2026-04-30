import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../login/login.component.css']
})
export class ForgotPasswordComponent {
  stage: 'request' | 'reset' = 'request';
  loading = false;
  errorMessage = '';
  infoMessage = '';

  requestForm: FormGroup;
  resetForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.requestForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetForm = this.fb.group({
      otp: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', [Validators.required]]
    }, { validators: this.matchPasswords });
  }

  matchPasswords(group: AbstractControl): ValidationErrors | null {
    const a = group.get('new_password')?.value;
    const b = group.get('confirm_password')?.value;
    return a && b && a !== b ? { mismatch: true } : null;
  }

  submitRequest(): void {
    if (this.requestForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.authService.requestPasswordReset(this.requestForm.value.email).subscribe({
      next: () => {
        this.stage = 'reset';
        this.infoMessage = 'If the email exists, a reset code has been sent. Check your inbox.';
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to send reset code.';
        this.loading = false;
      }
    });
  }

  submitReset(): void {
    if (this.resetForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';

    const email = this.requestForm.value.email;
    const { otp, new_password } = this.resetForm.value;

    this.authService.resetPassword(email, otp, new_password).subscribe({
      next: () => {
        this.router.navigate(['/auth/login'], {
          queryParams: { reset: '1' }
        });
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to reset password.';
        this.loading = false;
      }
    });
  }

  backToRequest(): void {
    this.stage = 'request';
    this.errorMessage = '';
    this.infoMessage = '';
    this.resetForm.reset();
  }

  get email() { return this.requestForm.get('email'); }
  get otp() { return this.resetForm.get('otp'); }
  get newPassword() { return this.resetForm.get('new_password'); }
  get confirmPassword() { return this.resetForm.get('confirm_password'); }
}
