export interface NetworkActivity {
  id: number;
  url: string | null;
  domain: string;
  page_title: string | null;
  browser_process: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  duration_minutes: number;
}

export interface DomainSummary {
  domain: string;
  total_duration: number;
  total_duration_hours: number;
  visit_count: number;
}

export interface DomainSummaryResponse {
  days: number;
  domains: DomainSummary[];
}

export interface TopSite {
  domain: string;
  total_duration: number;
  total_duration_hours: number;
  visit_count: number;
}

export interface BrowserStat {
  browser: string;
  total_duration: number;
  total_duration_hours: number;
  visit_count: number;
}

export interface TopSitesResponse {
  days: number;
  total_browsing_seconds: number;
  total_browsing_hours: number;
  top_sites: TopSite[];
  browser_stats: BrowserStat[];
}
