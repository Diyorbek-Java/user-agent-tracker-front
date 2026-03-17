import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NetworkService } from '../../core/services/network.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import {
  NetworkActivity,
  DomainSummary,
  TopSite,
  BrowserStat,
  TopSitesResponse,
  DailyBrowserStat,
  DailyBrowserResponse
} from '../../core/models/network.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-network-activity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './network-activity.component.html',
  styleUrls: ['./network-activity.component.css']
})
export class NetworkActivityComponent implements OnInit {
  currentUser: User | null = null;
  activeTab: 'overview' | 'sites' | 'history' | 'daily' = 'overview';

  // Overview data
  topSitesData: TopSitesResponse | null = null;
  loadingOverview = true;

  // Sites data
  domainSummaries: DomainSummary[] = [];
  filteredDomains: DomainSummary[] = [];
  domainSearch = '';
  loadingSites = true;

  // History data
  networkActivities: NetworkActivity[] = [];
  historyTotal = 0;
  historyPage = 1;
  historyPageSize = 20;
  loadingHistory = true;

  // Daily browser tab
  dailyData: DailyBrowserStat[] = [];
  dailyGrouped: { date: string; rows: DailyBrowserStat[] }[] = [];
  availableBrowsers: string[] = [];
  selectedBrowser = '';
  loadingDaily = false;

  // Filters
  selectedDays = 7;
  filterDomain = '';
  filterBrowser = '';

  // User selection for admin/manager
  availableUsers: User[] = [];
  selectedUserId: number | null = null;

  error = '';

  get isAdminOrManager(): boolean {
    return this.currentUser?.role === 'ADMIN' || this.currentUser?.role === 'MANAGER';
  }

  get totalPages(): number {
    return Math.ceil(this.historyTotal / this.historyPageSize);
  }

  constructor(
    private networkService: NetworkService,
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;

    if (this.isAdminOrManager) {
      this.dashboardService.getUserList().subscribe({
        next: (users) => {
          this.availableUsers = users;
          this.loadAllData();
        },
        error: () => this.loadAllData()
      });
    } else {
      this.loadAllData();
    }
  }

  onUserChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const val = target.value;
    this.selectedUserId = val === 'me' ? null : parseInt(val, 10);
    this.loadAllData();
  }

  onDaysChange(): void {
    this.loadAllData();
  }

  switchTab(tab: 'overview' | 'sites' | 'history' | 'daily'): void {
    this.activeTab = tab;
    if (tab === 'sites' && this.domainSummaries.length === 0) {
      this.loadDomainSummary();
    }
    if (tab === 'history' && this.networkActivities.length === 0) {
      this.historyPage = 1;
      this.loadHistory();
    }
    if (tab === 'daily' && this.dailyData.length === 0) {
      this.loadDailyBrowserStats();
    }
  }

  loadAllData(): void {
    this.loadOverview();
    this.loadDomainSummary();
    if (this.activeTab === 'history') {
      this.historyPage = 1;
      this.loadHistory();
    }
    if (this.activeTab === 'daily') {
      this.loadDailyBrowserStats();
    }
  }

  loadOverview(): void {
    this.loadingOverview = true;
    const userId = this.selectedUserId || undefined;

    this.networkService.getTopSites(this.selectedDays, 10, userId).subscribe({
      next: (data) => {
        this.topSitesData = data;
        this.loadingOverview = false;
      },
      error: (err) => {
        this.error = 'Failed to load network overview';
        console.error('Network overview error:', err);
        this.loadingOverview = false;
      }
    });
  }

  loadDomainSummary(): void {
    this.loadingSites = true;
    const userId = this.selectedUserId || undefined;

    this.networkService.getDomainSummary(this.selectedDays, userId).subscribe({
      next: (data) => {
        this.domainSummaries = data.domains;
        this.applyDomainFilter();
        this.loadingSites = false;
      },
      error: (err) => {
        console.error('Domain summary error:', err);
        this.loadingSites = false;
      }
    });
  }

  loadHistory(): void {
    this.loadingHistory = true;
    const userId = this.selectedUserId || undefined;
    const filters: any = {};
    if (userId) filters.user_id = userId;
    if (this.filterDomain) filters.domain = this.filterDomain;
    if (this.filterBrowser) filters.browser = this.filterBrowser;

    this.networkService.getNetworkActivities(this.historyPage, this.historyPageSize, filters).subscribe({
      next: (data) => {
        this.networkActivities = data.results;
        this.historyTotal = data.count;
        this.loadingHistory = false;
      },
      error: (err) => {
        console.error('Network history error:', err);
        this.loadingHistory = false;
      }
    });
  }

  applyDomainFilter(): void {
    if (!this.domainSearch) {
      this.filteredDomains = this.domainSummaries;
    } else {
      const search = this.domainSearch.toLowerCase();
      this.filteredDomains = this.domainSummaries.filter(d =>
        d.domain.toLowerCase().includes(search)
      );
    }
  }

  onDomainSearchChange(): void {
    this.applyDomainFilter();
  }

  onHistoryFilterChange(): void {
    this.historyPage = 1;
    this.loadHistory();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.historyPage = page;
    this.loadHistory();
  }

  getMaxDuration(): number {
    if (!this.topSitesData || this.topSitesData.top_sites.length === 0) return 1;
    return this.topSitesData.top_sites[0].total_duration || 1;
  }

  getBarWidth(duration: number): number {
    return Math.max((duration / this.getMaxDuration()) * 100, 2);
  }

  formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  formatBrowserName(processName: string): string {
    const browsers: { [key: string]: string } = {
      'chrome.exe': 'Google Chrome',
      'msedge.exe': 'Microsoft Edge',
      'firefox.exe': 'Firefox',
      'opera.exe': 'Opera',
      'brave.exe': 'Brave',
      'safari.exe': 'Safari',
      'iexplore.exe': 'Internet Explorer',
    };
    const lower = processName.toLowerCase();
    return browsers[lower] || processName.replace(/\.exe$/i, '');
  }

  /** Deduplicate availableBrowsers by their formatted display name. */
  get uniqueBrowserOptions(): { raw: string; label: string }[] {
    const seen = new Set<string>();
    const result: { raw: string; label: string }[] = [];
    for (const b of this.availableBrowsers) {
      const label = this.formatBrowserName(b);
      if (!seen.has(label)) {
        seen.add(label);
        result.push({ raw: b, label });
      }
    }
    return result;
  }

  loadDailyBrowserStats(): void {
    this.loadingDaily = true;
    const userId = this.selectedUserId || undefined;
    this.networkService.getDailyBrowserStats(this.selectedDays, this.selectedBrowser || undefined, userId).subscribe({
      next: (data) => {
        this.availableBrowsers = data.available_browsers;
        this.dailyData = data.results;
        this.groupDailyByDate();
        this.loadingDaily = false;
      },
      error: (err) => {
        console.error('Daily browser stats error:', err);
        this.loadingDaily = false;
      }
    });
  }

  groupDailyByDate(): void {
    const map = new Map<string, DailyBrowserStat[]>();
    for (const row of this.dailyData) {
      const key = row.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    this.dailyGrouped = Array.from(map.entries()).map(([date, rows]) => ({ date, rows }));
  }

  onDailyBrowserFilterChange(): void {
    this.loadDailyBrowserStats();
  }

  getDayTotal(rows: DailyBrowserStat[]): number {
    return rows.reduce((sum, r) => sum + r.total_duration, 0);
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
