import type {
  DailyImpactMetric,
  ImpactDashboardData,
  PlatformDistribution,
  PlatformId,
  TimeRange,
  TopPerformingContent,
  DayEngagement,
} from "./types";

export const PLATFORM_CONFIG: Record<
  PlatformId,
  { name: string; color: string; baseFollowers: number; avgEngRate: number }
> = {
  all: { name: "All Channels", color: "#6366F1", baseFollowers: 148500, avgEngRate: 5.6 },
  tiktok: { name: "TikTok", color: "#000000", baseFollowers: 64200, avgEngRate: 7.2 },
  instagram: { name: "Instagram", color: "#E1306C", baseFollowers: 42800, avgEngRate: 5.4 },
  youtube: { name: "YouTube Shorts", color: "#FF0000", baseFollowers: 23600, avgEngRate: 4.8 },
  linkedin: { name: "LinkedIn", color: "#0A66C2", baseFollowers: 11400, avgEngRate: 3.9 },
  x: { name: "X (Twitter)", color: "#1DA1F2", baseFollowers: 6500, avgEngRate: 3.2 },
};

function getDaysForRange(range: TimeRange): number {
  switch (range) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "ytd":
      return 120;
    default:
      return 30;
  }
}

// Deterministic seedable random variation generator for realistic smooth chart series
function seededNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function generateImpactData(
  platform: PlatformId = "all",
  timeRange: TimeRange = "30d",
  seedMultiplier: number = 1.0,
): ImpactDashboardData {
  const days = getDaysForRange(timeRange);
  const config = PLATFORM_CONFIG[platform];
  const now = new Date();

  const timeSeries: DailyImpactMetric[] = [];
  const baseFollowers = Math.round(config.baseFollowers * seedMultiplier);
  const startingFollowers = Math.round(baseFollowers * (1 - (days * 0.0035 + 0.05)));

  let runningFollowers = startingFollowers;
  let totalNetNew = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalSaves = 0;
  let totalViews = 0;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);

    const dateStr = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const isoDate = d.toISOString().split("T")[0];

    // Simulate steady upward trend with weekday peaks and viral spikes
    const dayOfWeek = d.getDay();
    const isMidweek = dayOfWeek >= 2 && dayOfWeek <= 4;
    const noise = seededNoise(i * 17 + (platform === "all" ? 1 : platform.length * 3));
    const spikeChance = seededNoise(i * 31);
    const hasSpike = spikeChance > 0.88;

    const baseDailyAdd = Math.round(baseFollowers * 0.0028 * (isMidweek ? 1.3 : 0.85));
    const dailyFluctuation = Math.round((noise - 0.25) * (baseDailyAdd * 0.7));
    const spikeBoost = hasSpike ? Math.round(baseDailyAdd * (1.8 + noise * 1.5)) : 0;

    const netFollowers = Math.max(12, baseDailyAdd + dailyFluctuation + spikeBoost);
    const organicGrowth = Math.round(netFollowers * (0.65 + noise * 0.15));
    const campaignGrowth = netFollowers - organicGrowth;

    runningFollowers += netFollowers;
    totalNetNew += netFollowers;

    // Engagement metrics
    const dailyViews = Math.round(netFollowers * (45 + noise * 35));
    const baseEngRate = config.avgEngRate + (noise - 0.5) * 1.6 + (hasSpike ? 1.4 : 0);
    const engagementRate = Math.min(12.5, Math.max(2.1, Number(baseEngRate.toFixed(2))));

    const dailyInteractions = Math.round(dailyViews * (engagementRate / 100));
    const likes = Math.round(dailyInteractions * 0.62);
    const comments = Math.round(dailyInteractions * 0.15);
    const shares = Math.round(dailyInteractions * 0.14);
    const saves = dailyInteractions - likes - comments - shares;

    totalLikes += likes;
    totalComments += comments;
    totalShares += shares;
    totalSaves += saves;
    totalViews += dailyViews;

    timeSeries.push({
      date: dateStr,
      isoDate,
      totalFollowers: runningFollowers,
      netFollowers,
      organicGrowth,
      campaignGrowth,
      engagementRate,
      interactions: dailyInteractions,
      likes,
      comments,
      shares,
      saves,
      views: dailyViews,
    });
  }

  // Cross-platform breakdown
  const platformDistribution: PlatformDistribution[] = [
    {
      platform: "tiktok",
      name: "TikTok",
      followers: Math.round(64200 * seedMultiplier),
      sharePercentage: 43.2,
      growthRate: 18.6,
      engagementRate: 7.4,
      interactions: Math.round(92400 * seedMultiplier),
      color: "#000000",
      iconName: "Music2",
    },
    {
      platform: "instagram",
      name: "Instagram Reels",
      followers: Math.round(42800 * seedMultiplier),
      sharePercentage: 28.8,
      growthRate: 14.1,
      engagementRate: 5.6,
      interactions: Math.round(64800 * seedMultiplier),
      color: "#E1306C",
      iconName: "Instagram",
    },
    {
      platform: "youtube",
      name: "YouTube Shorts",
      followers: Math.round(23600 * seedMultiplier),
      sharePercentage: 15.9,
      growthRate: 21.4,
      engagementRate: 5.1,
      interactions: Math.round(38200 * seedMultiplier),
      color: "#EF4444",
      iconName: "Youtube",
    },
    {
      platform: "linkedin",
      name: "LinkedIn",
      followers: Math.round(11400 * seedMultiplier),
      sharePercentage: 7.7,
      growthRate: 9.8,
      engagementRate: 4.1,
      interactions: Math.round(14900 * seedMultiplier),
      color: "#0A66C2",
      iconName: "Linkedin",
    },
    {
      platform: "x",
      name: "X (Twitter)",
      followers: Math.round(6500 * seedMultiplier),
      sharePercentage: 4.4,
      growthRate: 6.2,
      engagementRate: 3.3,
      interactions: Math.round(8600 * seedMultiplier),
      color: "#1DA1F2",
      iconName: "Twitter",
    },
  ];

  // Top performing content
  const topContent: TopPerformingContent[] = [
    {
      id: "cnt_viral_01",
      title: "Why 90% of Creators Give Up in Month 3 (and the 1 fix)",
      platform: "tiktok",
      format: "Short Video",
      publishedAt: "2 days ago",
      views: 184500,
      engagementRate: 8.9,
      likes: 14200,
      comments: 1840,
      shares: 3210,
      followersGained: 1420,
      thumbnailUrl: "https://images.unsplash.com/photo-1579389083078-4e7018379f7e?w=400&q=80",
    },
    {
      id: "cnt_viral_02",
      title: "Step-by-step: Repurposing 1 long video into 12 high-converting clips",
      platform: "instagram",
      format: "Reel",
      publishedAt: "4 days ago",
      views: 122400,
      engagementRate: 7.4,
      likes: 9100,
      comments: 720,
      shares: 2150,
      followersGained: 890,
      thumbnailUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80",
    },
    {
      id: "cnt_viral_03",
      title: "The Zero-Dollar Distribution Flywheel breakdown for B2B Founders",
      platform: "linkedin",
      format: "Carousel",
      publishedAt: "6 days ago",
      views: 48900,
      engagementRate: 6.2,
      likes: 2840,
      comments: 490,
      shares: 680,
      followersGained: 520,
      thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80",
    },
    {
      id: "cnt_viral_04",
      title: "How an AI Avatar scaled our organic revenue 4.2x without camera fatigue",
      platform: "youtube",
      format: "Short Video",
      publishedAt: "1 week ago",
      views: 94200,
      engagementRate: 6.8,
      likes: 6400,
      comments: 530,
      shares: 1120,
      followersGained: 680,
      thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80",
    },
    {
      id: "cnt_viral_05",
      title: "Content hooks that stop the doomscroll in 1.4 seconds",
      platform: "tiktok",
      format: "Short Video",
      publishedAt: "10 days ago",
      views: 146800,
      engagementRate: 7.9,
      likes: 11500,
      comments: 1100,
      shares: 2400,
      followersGained: 1140,
      thumbnailUrl: "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=400&q=80",
    },
  ];

  // Day of week engagement
  const dayOfWeekMetrics: DayEngagement[] = [
    {
      day: "Monday",
      shortDay: "Mon",
      avgEngagementRate: 4.8,
      peakHour: "12:00 PM",
      interactionVolume: 22400,
    },
    {
      day: "Tuesday",
      shortDay: "Tue",
      avgEngagementRate: 6.4,
      peakHour: "6:30 PM",
      interactionVolume: 34100,
    },
    {
      day: "Wednesday",
      shortDay: "Wed",
      avgEngagementRate: 7.1,
      peakHour: "7:00 PM",
      interactionVolume: 38900,
    },
    {
      day: "Thursday",
      shortDay: "Thu",
      avgEngagementRate: 6.9,
      peakHour: "5:45 PM",
      interactionVolume: 36200,
    },
    {
      day: "Friday",
      shortDay: "Fri",
      avgEngagementRate: 5.5,
      peakHour: "4:00 PM",
      interactionVolume: 28700,
    },
    {
      day: "Saturday",
      shortDay: "Sat",
      avgEngagementRate: 5.9,
      peakHour: "11:00 AM",
      interactionVolume: 31200,
    },
    {
      day: "Sunday",
      shortDay: "Sun",
      avgEngagementRate: 6.2,
      peakHour: "8:00 PM",
      interactionVolume: 33500,
    },
  ];

  const totalInteractions = totalLikes + totalComments + totalShares + totalSaves;
  const avgEngagementRate = Number(
    (timeSeries.reduce((acc, c) => acc + c.engagementRate, 0) / timeSeries.length).toFixed(1),
  );
  const conversionRate = Number((totalNetNew / (totalViews / 1000)).toFixed(1));

  const engagementByType = [
    {
      name: "Likes",
      value: totalLikes,
      color: "#6366F1",
      percentage: Math.round((totalLikes / totalInteractions) * 100),
    },
    {
      name: "Comments",
      value: totalComments,
      color: "#EC4899",
      percentage: Math.round((totalComments / totalInteractions) * 100),
    },
    {
      name: "Shares",
      value: totalShares,
      color: "#10B981",
      percentage: Math.round((totalShares / totalInteractions) * 100),
    },
    {
      name: "Saves & Bookmarks",
      value: totalSaves,
      color: "#F59E0B",
      percentage: Math.round((totalSaves / totalInteractions) * 100),
    },
  ];

  return {
    timeRange,
    platform,
    lastUpdated: "Just now",
    kpis: {
      totalFollowers: runningFollowers,
      followerGrowthRate: 16.4,
      netNewFollowers: totalNetNew,
      avgEngagementRate,
      engagementRateDelta: 0.9,
      totalInteractions,
      interactionsGrowthRate: 22.8,
      totalViews,
      viewsGrowthRate: 19.5,
      conversionRate,
    },
    timeSeries,
    platformDistribution,
    topContent,
    dayOfWeekMetrics,
    engagementByType,
  };
}
