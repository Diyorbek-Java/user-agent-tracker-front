import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  infoMessage = '';
  returnUrl = '/dashboard';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    // Get return URL from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    if (this.route.snapshot.queryParams['reset'] === '1') {
      this.infoMessage = 'Password reset successful. Please sign in with your new password.';
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        // Check if this is first-time login and user needs to set password
        if (response.first_login) {
          this.router.navigate(['/auth/set-password'], {
            queryParams: { email: this.loginForm.value.email }
          });
        } else if (response.user?.role === 'ORG_MANAGER' || response.user?.role === 'ORG_ADMIN') {
          this.router.navigate(['/organization']);
        } else {
          this.router.navigate([this.returnUrl]);
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Login failed. Please check your credentials.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
