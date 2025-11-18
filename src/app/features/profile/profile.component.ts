import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  profile: User | null = null;
  loading = true;
  error = '';
  successMessage = '';

  // Edit mode
  isEditing = false;
  editedProfile: Partial<User> = {};

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.error = '';

    this.dashboardService.getUserProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load profile';
        console.error('Profile error:', err);
        this.loading = false;
      }
    });
  }

  startEdit(): void {
    if (this.profile) {
      this.editedProfile = {
        full_name: this.profile.full_name,
        department: this.profile.department,
        position: this.profile.position
      };
      this.isEditing = true;
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editedProfile = {};
    this.error = '';
    this.successMessage = '';
  }

  saveProfile(): void {
    if (!this.editedProfile) return;

    this.error = '';
    this.successMessage = '';

    this.dashboardService.updateProfile(this.editedProfile).subscribe({
      next: (updatedProfile) => {
        this.profile = updatedProfile;
        this.isEditing = false;
        this.successMessage = 'Profile updated successfully';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.error = 'Failed to update profile';
        console.error('Update error:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
