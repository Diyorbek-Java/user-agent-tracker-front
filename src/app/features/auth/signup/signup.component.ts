import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['../login/login.component.css']
})
export class SignupComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      organization_name: ['', [Validators.required, Validators.minLength(2)]],
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', [Validators.required]]
    }, { validators: this.matchPasswords });
  }

  matchPasswords(group: AbstractControl): ValidationErrors | null {
    const a = group.get('password')?.value;
    const b = group.get('confirm_password')?.value;
    return a && b && a !== b ? { mismatch: true } : null;
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = '';

    const { organization_name, full_name, email, password } = this.form.value;
    this.authService.signupOrganization({ organization_name, full_name, email, password }).subscribe({
      next: () => {
        this.router.navigate(['/organization']);
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Signup failed.';
        this.loading = false;
      },
      complete: () => { this.loading = false; }
    });
  }

  get organizationName() { return this.form.get('organization_name'); }
  get fullName() { return this.form.get('full_name'); }
  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }
  get confirmPassword() { return this.form.get('confirm_password'); }
}
