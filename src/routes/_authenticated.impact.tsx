import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { TrendingUp, Flame, Sparkles, Share2, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateImpactData } from "@/lib/impact/mockData";
import type { PlatformId, TimeRange } from "@/lib/impact/types";
import { ImpactOverviewCards } from "@/components/impact/ImpactOverviewCards";
import { FollowerGrowthChart } from "@/components/impact/FollowerGrowthChart";
import { EngagementAnalyticsChart } from "@/components/impact/EngagementAnalyticsChart";
import { PlatformBreakdownCard } from "@/components/impact/PlatformBreakdownCard";
import { DayOfWeekChart } from "@/components/impact/DayOfWeekChart";
import { TopPerformingContentTable } from "@/components/impact/TopPerformingContentTable";
import { ImpactFilterBar } from "@/components/impact/ImpactFilterBar";

export const Route = createFileRoute("/_authenticated/impact")({
  head: () => ({
    meta: [
      { title: "Impact Dashboard — Echo Your Influence" },
      {
        name: "description",
        content:
          "Visualize cross-channel follower growth, audience momentum, and engagement analytics.",
      },
      { property: "og:title", content: "Impact Dashboard — Echo Your Influence" },
      {
        property: "og:description",
        content: "Track follower acquisition velocity and content engagement metrics.",
      },
    ],
  }),
  component: ImpactDashboardPage,
});

function ImpactDashboardPage() {
  const [platform, setPlatform] = useState<PlatformId>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [spikeMultiplier, setSpikeMultiplier] = useState<number>(1.0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Derive mock impact data based on active filters & simulated surge
  const impactData = useMemo(() => {
    return generateImpactData(platform, timeRange, spikeMultiplier);
  }, [platform, timeRange, spikeMultiplier]);

  const timeRangeLabels: Record<TimeRange, string> = {
    "7d": "7 days",
    "30d": "30 days",
    "90d": "90 days",
    ytd: "YTD",
  };

  const handleSimulateSpike = () => {
    setIsRefreshing(true);
    const newMultiplier = spikeMultiplier === 1.0 ? 1.35 : 1.0;
    setSpikeMultiplier(newMultiplier);

    setTimeout(() => {
      setIsRefreshing(false);
      if (newMultiplier > 1.0) {
        toast.success("Simulated viral surge applied! (+35% follower & engagement spike)");
      } else {
        toast.info("Reset to baseline impact metrics.");
      }
    }, 400);
  };

  const handleExport = () => {
    const report = {
      exportedAt: new Date().toISOString(),
      platform,
      timeRange,
      kpis: impactData.kpis,
      totalDataPoints: impactData.timeSeries.length,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `echo-impact-report-${platform}-${timeRange}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Impact report exported successfully.");
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Analytics & Insights
            </p>
            <Badge
              variant="outline"
              className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            >
              Live Mock Engine Active
            </Badge>
          </div>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">Impact Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Real-time visualization of cross-channel follower acquisition velocity, engagement
            resonance, and audience conversion benchmarks.
          </p>
        </div>
      </header>

      {/* Filter and Control Bar */}
      <ImpactFilterBar
        platform={platform}
        timeRange={timeRange}
        onPlatformChange={setPlatform}
        onTimeRangeChange={setTimeRange}
        onSimulateSpike={handleSimulateSpike}
        onExport={handleExport}
        isRefreshing={isRefreshing}
      />

      {/* 5 High-Impact KPI Overview Cards */}
      <ImpactOverviewCards kpis={impactData.kpis} timeRangeLabel={timeRangeLabels[timeRange]} />

      {/* Primary Recharts Visualization: Follower Growth */}
      <FollowerGrowthChart
        data={impactData.timeSeries}
        platformName={
          platform === "all"
            ? "All Channels Combined"
            : impactData.platformDistribution.find((p) => p.platform === platform)?.name || platform
        }
      />

      {/* Tabbed / Segmented Analytical Deep-Dives */}
      <Tabs defaultValue="engagement" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="engagement" className="text-xs gap-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              Engagement & Channels
            </TabsTrigger>
            <TabsTrigger value="timing" className="text-xs gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-500" />
              Optimal Timing & Heatmap
            </TabsTrigger>
            <TabsTrigger value="content" className="text-xs gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              Top Converting Clips
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Engagement Dynamics + Channel Distribution */}
        <TabsContent value="engagement" className="space-y-6 m-0">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <EngagementAnalyticsChart
                data={impactData.timeSeries}
                avgEngagementRate={impactData.kpis.avgEngagementRate}
              />
            </div>
            <div className="lg:col-span-5">
              <PlatformBreakdownCard
                distribution={impactData.platformDistribution}
                activePlatform={platform}
                onSelectPlatform={setPlatform}
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Best Timing & Cadence */}
        <TabsContent value="timing" className="space-y-6 m-0">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <DayOfWeekChart data={impactData.dayOfWeekMetrics} />
            </div>
            <div className="lg:col-span-6">
              <PlatformBreakdownCard
                distribution={impactData.platformDistribution}
                activePlatform={platform}
                onSelectPlatform={setPlatform}
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Content Conversion Roster */}
        <TabsContent value="content" className="space-y-6 m-0">
          <TopPerformingContentTable content={impactData.topContent} />
        </TabsContent>
      </Tabs>

      {/* Top Converting Content Section */}
      <section className="pt-2">
        <TopPerformingContentTable content={impactData.topContent} />
      </section>
    </div>
  );
}
