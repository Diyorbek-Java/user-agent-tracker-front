import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductivityService } from '../../core/services/productivity.service';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeProductivityDetail, DailyTrend } from '../../core/models/productivity.model';
import { User } from '../../core/models/user.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-productivity-trends',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productivity-trends.component.html',
  styleUrls: ['./productivity-trends.component.css']
})
export class ProductivityTrendsComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  productivityData: EmployeeProductivityDetail | null = null;
  loading = true;
  error = '';

  selectedPeriod: 'weekly' | 'monthly' = 'weekly';

  private chart: Chart | null = null;
  private _chartRef: ElementRef<HTMLCanvasElement> | undefined;

  @ViewChild('trendChart')
  set chartRef(ref: ElementRef<HTMLCanvasElement>) {
    this._chartRef = ref;
    if (ref && this.productivityData && this.productivityData.daily_trend.length > 0) {
      setTimeout(() => this.renderChart(), 0);
    }
  }

  get days(): number {
    return this.selectedPeriod === 'weekly' ? 7 : 30;
  }

  constructor(
    private productivityService: ProductivityService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  onPeriodChange(): void {
    this.loadData();
  }

  loadData(): void {
    if (!this.currentUser) return;
    this.loading = true;
    this.error = '';

    this.productivityService.getEmployeeDetail(this.currentUser.id, this.days).subscribe({
      next: (data) => {
        this.productivityData = data;
        this.loading = false;
        // Chart rendering is triggered by the @ViewChild setter when the canvas becomes available
      },
      error: (err) => {
        this.error = 'Failed to load productivity data';
        console.error('Trends error:', err);
        this.loading = false;
      }
    });
  }

  renderChart(): void {
    if (!this.productivityData || !this._chartRef) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const trend = this.productivityData.daily_trend;
    const labels = trend.map(d => this.formatDateShort(d.date));
    const scores = trend.map(d => d.score);
    const hours = trend.map(d => d.hours);

    const ctx = this._chartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Productivity Score (%)',
            data: scores,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: scores.map(s => this.getScoreColor(s)),
            pointBorderColor: scores.map(s => this.getScoreColor(s)),
            pointRadius: 5,
            pointHoverRadius: 8,
            yAxisID: 'y'
          },
          {
            label: 'Hours Tracked',
            data: hours,
            borderColor: '#a78bfa',
            backgroundColor: 'rgba(167, 139, 250, 0.05)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { size: 13 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 12,
            titleFont: { size: 14 },
            bodyFont: { size: 13 },
            callbacks: {
              label: (ctx) => {
                if (ctx.datasetIndex === 0) {
                  return `Score: ${ctx.parsed.y}%`;
                }
                return `Hours: ${this.formatHours(ctx.parsed.y ?? 0)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 12 },
              maxRotation: 45
            }
          },
          y: {
            type: 'linear',
            position: 'left',
            min: 0,
            max: 100,
            title: {
              display: true,
              text: 'Score (%)',
              font: { size: 13 }
            },
            grid: { color: 'rgba(0,0,0,0.06)' }
          },
          y1: {
            type: 'linear',
            position: 'right',
            min: 0,
            title: {
              display: true,
              text: 'Hours',
              font: { size: 13 }
            },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  getScoreColor(score: number): string {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'productive': return 'status-productive';
      case 'needs_improvement': return 'status-warning';
      case 'unproductive': return 'status-danger';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'productive': return 'Productive';
      case 'needs_improvement': return 'Needs Improvement';
      case 'unproductive': return 'Unproductive';
      default: return status;
    }
  }

  getCategoryClass(category: string): string {
    switch (category) {
      case 'PRODUCTIVE': return 'cat-productive';
      case 'NON_PRODUCTIVE': return 'cat-unproductive';
      default: return 'cat-neutral';
    }
  }

  formatDateShort(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  formatDuration(hours: number): string {
    const totalSeconds = Math.round(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m ${s}s`;
  }

  navigateBack(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
