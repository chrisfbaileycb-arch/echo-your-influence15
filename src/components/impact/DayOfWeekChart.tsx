import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import type { DayEngagement } from "@/lib/impact/types";

interface DayOfWeekChartProps {
  data: DayEngagement[];
}

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  const highestDay = data.reduce(
    (max, d) => (d.avgEngagementRate > max.avgEngagementRate ? d : max),
    data[0] || { day: "Wednesday", avgEngagementRate: 7.1, peakHour: "7:00 PM" },
  );

  return (
    <Card
      id="day-of-week-chart-card"
      className="border border-border bg-card p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight">Best Posting Windows</h2>
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
          >
            Peak: {highestDay.day} ({highestDay.peakHour})
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Average audience responsiveness by day of the week, with optimal dispatch windows.
        </p>

        <div className="mt-6 h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.9 0 0)" />
              <XAxis
                dataKey="shortDay"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "oklch(0.5 0 0)", fontSize: 12 }}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "oklch(0.5 0 0)", fontSize: 12 }}
                tickFormatter={(val) => `${val}%`}
                domain={[0, 9]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as DayEngagement;
                    return (
                      <div className="rounded-xl border border-border bg-popover p-3 shadow-lg text-xs space-y-1">
                        <p className="font-semibold text-foreground border-b border-border/60 pb-1">
                          {d.day}
                        </p>
                        <p className="text-muted-foreground pt-1">
                          Avg Engagement:{" "}
                          <span className="font-bold text-amber-600 font-mono">
                            {d.avgEngagementRate}%
                          </span>
                        </p>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3 inline text-primary" />
                          Recommended slot:{" "}
                          <span className="font-semibold text-foreground">{d.peakHour}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Weekly volume:{" "}
                          <span className="font-mono text-foreground">
                            {d.interactionVolume.toLocaleString()}
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="avgEngagementRate" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-day-${index}`}
                    fill={entry.day === highestDay.day ? "#6366F1" : "#A5B4FC"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>Midweek posts (Tue–Thu 6–7 PM) yield 32% higher comment completion</span>
      </div>
    </Card>
  );
}
