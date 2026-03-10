import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landing',
  standalone: true,
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent {
  downloadUrl = `${environment.apiUrl}/frontend/download/agent/`;

  constructor(private router: Router, private http: HttpClient) {}

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  downloadAgent(): void {
    this.http.get(this.downloadUrl, { responseType: 'blob' }).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'UserBehaviorTracker-Setup.exe';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
