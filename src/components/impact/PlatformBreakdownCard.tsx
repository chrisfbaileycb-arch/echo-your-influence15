import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import type { PlatformDistribution, PlatformId } from "@/lib/impact/types";

interface PlatformBreakdownCardProps {
  distribution: PlatformDistribution[];
  activePlatform: PlatformId;
  onSelectPlatform: (platform: PlatformId) => void;
}

export function PlatformBreakdownCard({
  distribution,
  activePlatform,
  onSelectPlatform,
}: PlatformBreakdownCardProps) {
  const chartData = distribution.map((d) => ({
    name: d.name,
    value: d.followers,
    color: d.color,
    platform: d.platform,
    share: d.sharePercentage,
    engRate: d.engagementRate,
  }));

  return (
    <Card
      id="platform-breakdown-card"
      className="border border-border bg-card p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight">Channel Distribution</h2>
          <Badge variant="outline" className="text-xs">
            5 Channels Active
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Audience footprint and engagement efficiency by distribution channel.
        </p>

        <div className="mt-4 flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="h-[200px] w-[200px] shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-border bg-popover p-2.5 shadow-lg text-xs space-y-1">
                          <p className="font-semibold text-foreground">{d.name}</p>
                          <p className="text-muted-foreground">
                            Audience:{" "}
                            <span className="font-bold text-foreground font-mono">
                              {d.value.toLocaleString()}
                            </span>{" "}
                            ({d.share}%)
                          </p>
                          <p className="text-muted-foreground">
                            Avg Eng:{" "}
                            <span className="font-bold text-amber-600 font-mono">{d.engRate}%</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="var(--color-card)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-muted-foreground font-medium">Leading</span>
              <span className="font-display text-sm font-bold text-foreground">TikTok (43%)</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-2.5">
            {distribution.map((item) => {
              const isSelected = activePlatform === item.platform;
              return (
                <button
                  key={item.platform}
                  type="button"
                  onClick={() => onSelectPlatform(item.platform)}
                  className={`flex w-full items-center justify-between rounded-xl p-2 text-left transition text-xs border ${
                    isSelected
                      ? "border-primary bg-primary/5 font-semibold text-foreground shadow-xs"
                      : "border-transparent hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-foreground">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-foreground font-semibold">
                      {item.followers.toLocaleString()}
                    </span>
                    <span className="text-emerald-600 flex items-center font-mono">
                      <TrendingUp className="h-3 w-3 mr-0.5" />+{item.growthRate}%
                    </span>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      {item.engagementRate}% eng
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>Click any channel above to filter the full dashboard</span>
        <button
          onClick={() => onSelectPlatform("all")}
          className="text-primary font-medium hover:underline flex items-center gap-0.5"
        >
          Reset to All <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
    </Card>
  );
}
