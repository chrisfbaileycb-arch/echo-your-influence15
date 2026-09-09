export type PlatformId = "all" | "tiktok" | "instagram" | "youtube" | "linkedin" | "x";

export type TimeRange = "7d" | "30d" | "90d" | "ytd";

export interface DailyImpactMetric {
  date: string;
  isoDate: string;
  totalFollowers: number;
  netFollowers: number;
  organicGrowth: number;
  campaignGrowth: number;
  engagementRate: number; // e.g. 5.4 for 5.4%
  interactions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
}

export interface PlatformDistribution {
  platform: PlatformId;
  name: string;
  followers: number;
  sharePercentage: number;
  growthRate: number; // e.g. +14.2%
  engagementRate: number; // e.g. 6.8%
  interactions: number;
  color: string;
  iconName: string;
}

export interface TopPerformingContent {
  id: string;
  title: string;
  platform: PlatformId;
  format: "Short Video" | "Reel" | "Carousel" | "Story" | "Post";
  publishedAt: string;
  views: number;
  engagementRate: number;
  likes: number;
  comments: number;
  shares: number;
  followersGained: number;
  thumbnailUrl: string;
}

export interface DayEngagement {
  day: string;
  shortDay: string;
  avgEngagementRate: number;
  peakHour: string;
  interactionVolume: number;
}

export interface ImpactSummaryKPIs {
  totalFollowers: number;
  followerGrowthRate: number; // percentage change, e.g. +18.4
  netNewFollowers: number;
  avgEngagementRate: number; // e.g. 5.7%
  engagementRateDelta: number; // e.g. +0.8%
  totalInteractions: number;
  interactionsGrowthRate: number;
  totalViews: number;
  viewsGrowthRate: number;
  conversionRate: number; // followers per 1k views
}

export interface ImpactDashboardData {
  timeRange: TimeRange;
  platform: PlatformId;
  lastUpdated: string;
  kpis: ImpactSummaryKPIs;
  timeSeries: DailyImpactMetric[];
  platformDistribution: PlatformDistribution[];
  topContent: TopPerformingContent[];
  dayOfWeekMetrics: DayEngagement[];
  engagementByType: {
    name: string;
    value: number;
    color: string;
    percentage: number;
  }[];
}
