import { useState } from "react";
import {
  AreaChart,
  Area,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart2, Layers } from "lucide-react";
import type { DailyImpactMetric } from "@/lib/impact/types";

interface FollowerGrowthChartProps {
  data: DailyImpactMetric[];
  platformName: string;
}

type ViewMode = "cumulative" | "breakdown" | "net";

export function FollowerGrowthChart({ data, platformName }: FollowerGrowthChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("cumulative");

  const totalGrowth =
    data.length > 0 ? data[data.length - 1].totalFollowers - data[0].totalFollowers : 0;
  const growthPercent =
    data.length > 0 && data[0].totalFollowers > 0
      ? ((totalGrowth / data[0].totalFollowers) * 100).toFixed(1)
      : "0.0";

  return (
    <Card id="follower-growth-chart-card" className="border border-border bg-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-bold tracking-tight">
              Follower Growth Trajectory
            </h2>
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20 text-xs"
            >
              {platformName}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Net gain of{" "}
            <span className="font-semibold text-foreground">+{totalGrowth.toLocaleString()}</span> (
            <span className="text-emerald-600 font-semibold">+{growthPercent}%</span>) over the
            selected window.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-1">
          <Button
            size="sm"
            variant={viewMode === "cumulative" ? "default" : "ghost"}
            className="h-8 text-xs font-medium"
            onClick={() => setViewMode("cumulative")}
          >
            <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
            Cumulative
          </Button>
          <Button
            size="sm"
            variant={viewMode === "breakdown" ? "default" : "ghost"}
            className="h-8 text-xs font-medium"
            onClick={() => setViewMode("breakdown")}
          >
            <Layers className="mr-1.5 h-3.5 w-3.5" />
            Organic vs Campaign
          </Button>
          <Button
            size="sm"
            variant={viewMode === "net" ? "default" : "ghost"}
            className="h-8 text-xs font-medium"
            onClick={() => setViewMode("net")}
          >
            <BarChart2 className="mr-1.5 h-3.5 w-3.5" />
            Daily Net
          </Button>
        </div>
      </div>

      <div className="mt-6 h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === "cumulative" ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="followerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.9 0 0)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "oklch(0.5 0 0)", fontSize: 12 }}
                dy={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "oklch(0.5 0 0)", fontSize: 12 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                domain={["dataMin - 1000", "dataMax + 1000"]}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as DailyImpactMetric;
                    return (
                      <div className="rounded-xl border border-border bg-popover p-3 shadow-lg text-xs space-y-1 min-w-[170px]">
                        <p className="font-semibold text-foreground border-b border-border/60 pb-1">
                          {label}
                        </p>
                        <div className="flex justify-between items-center text-muted-foreground pt-1">
                          <span>Total Audience:</span>
                          <span className="font-bold text-foreground font-mono">
                            {d.totalFollowers.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Daily Net Add:</span>
                          <span className="font-semibold text-emerald-600 font-mono">
                            +{d.netFollowers.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Day Impressions:</span>
                          <span className="font-mono text-foreground">
                            {d.views.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="totalFollowers"
                name="Total Followers"
                stroke="#6366F1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#followerGradient)"
              />
            </AreaChart>
          ) : viewMode === "breakdown" ? (
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.9 0 0)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "oklch(0.5 0 0)", fontSize: 12 }}
                dy={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "oklch(0.5 0 0)", fontSize: 12 }}
                tickFormatter={(val) => `+${val}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as DailyImpactMetric;
                    return (
                      <div className="rounded-xl border border-border bg-popover p-3 shadow-lg text-xs space-y-1.5 min-w-[180px]">
                        <p className="font-semibold text-foreground border-b border-border/60 pb-1">
                          {label}
                        </p>
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                            Organic:
                          </span>
                          <span className="font-semibold text-foreground font-mono">
                            +{d.organicGrowth}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block" />
                            Campaigns:
                          </span>
                          <span className="font-semibold text-foreground font-mono">
                            +{d.campaignGrowth}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-foreground font-semibold pt-1 border-t border-border/60">
                          <span>Total Daily Net:</span>
                          <span className="text-emerald-600 font-mono">+{d.netFollowers}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
              />
              <Bar
                dataKey="organicGrowth"
                name="Organic Additions"
                stackId="a"
                fill="#10B981"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="campaignGrowth"
                name="Campaign Additions"
                stackId="a"
                fill="#6366F1"
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          ) : (
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="netBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#818CF8" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.9 0 0)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "oklch(0.5 0 0)", fontSize: 12 }}
                dy={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "oklch(0.5 0 0)", fontSize: 12 }}
                tickFormatter={(val) => `+${val}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as DailyImpactMetric;
                    return (
                      <div className="rounded-xl border border-border bg-popover p-3 shadow-lg text-xs space-y-1">
                        <p className="font-semibold text-foreground border-b border-border/60 pb-1">
                          {label}
                        </p>
                        <div className="flex justify-between items-center text-muted-foreground pt-1">
                          <span>Net Followers:</span>
                          <span className="font-bold text-emerald-600 font-mono">
                            +{d.netFollowers}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Engagement Rate:</span>
                          <span className="font-semibold text-foreground font-mono">
                            {d.engagementRate}%
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="netFollowers"
                name="Daily Net Gain"
                fill="url(#netBarGradient)"
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
