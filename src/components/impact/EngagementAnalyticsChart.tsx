import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, MessageCircle, Share2, Bookmark } from "lucide-react";
import type { DailyImpactMetric } from "@/lib/impact/types";

interface EngagementAnalyticsChartProps {
  data: DailyImpactMetric[];
  avgEngagementRate: number;
}

type MetricType = "rate" | "breakdown";

export function EngagementAnalyticsChart({
  data,
  avgEngagementRate,
}: EngagementAnalyticsChartProps) {
  const [metricType, setMetricType] = useState<MetricType>("rate");

  const peakDay = data.reduce(
    (max, d) => (d.engagementRate > max.engagementRate ? d : max),
    data[0] || { engagementRate: 0, date: "" },
  );

  return (
    <Card id="engagement-analytics-chart-card" className="border border-border bg-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-bold tracking-tight">Engagement Dynamics</h2>
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs"
            >
              <Flame className="mr-1 h-3 w-3 inline" />
              Peak: {peakDay.engagementRate}% ({peakDay.date})
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Tracking interaction velocity, comment-to-view ratios, and community sentiment signals.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-1">
          <Button
            size="sm"
            variant={metricType === "rate" ? "default" : "ghost"}
            className="h-8 text-xs font-medium"
            onClick={() => setMetricType("rate")}
          >
            Engagement Rate (%)
          </Button>
          <Button
            size="sm"
            variant={metricType === "breakdown" ? "default" : "ghost"}
            className="h-8 text-xs font-medium"
            onClick={() => setMetricType("breakdown")}
          >
            Interactions Breakdown
          </Button>
        </div>
      </div>

      <div className="mt-6 h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {metricType === "rate" ? (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                tickFormatter={(val) => `${val}%`}
                domain={[0, "dataMax + 2"]}
              />
              <ReferenceLine
                y={avgEngagementRate}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                label={{
                  value: `Avg: ${avgEngagementRate}%`,
                  position: "insideTopRight",
                  fill: "#D97706",
                  fontSize: 11,
                }}
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
                          <span>Engagement Rate:</span>
                          <span className="font-bold text-amber-600 font-mono text-sm">
                            {d.engagementRate}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Total Interactions:</span>
                          <span className="font-mono text-foreground">
                            {d.interactions.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Post Impressions:</span>
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
              <Line
                type="monotone"
                dataKey="engagementRate"
                name="Engagement Rate"
                stroke="#F59E0B"
                strokeWidth={3}
                dot={{ fill: "#F59E0B", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 6, stroke: "#FFF", strokeWidth: 2 }}
              />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as DailyImpactMetric;
                    return (
                      <div className="rounded-xl border border-border bg-popover p-3 shadow-lg text-xs space-y-1.5 min-w-[170px]">
                        <p className="font-semibold text-foreground border-b border-border/60 pb-1">
                          {label}
                        </p>
                        <div className="flex justify-between items-center text-indigo-600">
                          <span>Likes:</span>
                          <span className="font-mono font-semibold">
                            {d.likes.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-pink-600">
                          <span>Comments:</span>
                          <span className="font-mono font-semibold">
                            {d.comments.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-600">
                          <span>Shares:</span>
                          <span className="font-mono font-semibold">
                            {d.shares.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-amber-600">
                          <span>Saves:</span>
                          <span className="font-mono font-semibold">
                            {d.saves.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-foreground font-semibold pt-1 border-t border-border/60">
                          <span>Total:</span>
                          <span className="font-mono">{d.interactions.toLocaleString()}</span>
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
                dataKey="likes"
                name="Likes"
                stackId="interactions"
                fill="#6366F1"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="comments"
                name="Comments"
                stackId="interactions"
                fill="#EC4899"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="shares"
                name="Shares"
                stackId="interactions"
                fill="#10B981"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="saves"
                name="Saves"
                stackId="interactions"
                fill="#F59E0B"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-border pt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <span className="font-bold">62%</span>
          </div>
          <div>
            <p className="font-medium text-foreground">Likes Share</p>
            <p className="text-muted-foreground">Primary volume</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-50 text-pink-600">
            <MessageCircle className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="font-medium text-foreground">Comments (15%)</p>
            <p className="text-muted-foreground">High intent chat</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Share2 className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="font-medium text-foreground">Shares (14%)</p>
            <p className="text-muted-foreground">Virality multiplier</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Bookmark className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="font-medium text-foreground">Saves (9%)</p>
            <p className="text-muted-foreground">High utility value</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
