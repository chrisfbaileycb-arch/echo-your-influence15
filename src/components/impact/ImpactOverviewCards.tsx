import { Card } from "@/components/ui/card";
import { Users, UserPlus, Flame, HeartHandshake, Eye, TrendingUp } from "lucide-react";
import type { ImpactSummaryKPIs } from "@/lib/impact/types";

interface ImpactOverviewCardsProps {
  kpis: ImpactSummaryKPIs;
  timeRangeLabel: string;
}

export function ImpactOverviewCards({ kpis, timeRangeLabel }: ImpactOverviewCardsProps) {
  const cards = [
    {
      id: "card-total-followers",
      label: "Total Audience",
      value: kpis.totalFollowers.toLocaleString(),
      delta: `+${kpis.followerGrowthRate}%`,
      isPositive: true,
      subtext: `vs prior ${timeRangeLabel}`,
      icon: Users,
      accent: "text-primary",
      bgAccent: "bg-primary/10",
    },
    {
      id: "card-net-followers",
      label: "Net New Followers",
      value: `+${kpis.netNewFollowers.toLocaleString()}`,
      delta: `+${kpis.conversionRate} / 1k views`,
      isPositive: true,
      subtext: "follower conversion rate",
      icon: UserPlus,
      accent: "text-emerald-600",
      bgAccent: "bg-emerald-500/10",
    },
    {
      id: "card-engagement-rate",
      label: "Avg Engagement Rate",
      value: `${kpis.avgEngagementRate}%`,
      delta: `+${kpis.engagementRateDelta}%`,
      isPositive: true,
      subtext: "industry bench: 3.8%",
      icon: Flame,
      accent: "text-amber-600",
      bgAccent: "bg-amber-500/10",
    },
    {
      id: "card-interactions",
      label: "Total Interactions",
      value: kpis.totalInteractions.toLocaleString(),
      delta: `+${kpis.interactionsGrowthRate}%`,
      isPositive: true,
      subtext: "likes, comments & shares",
      icon: HeartHandshake,
      accent: "text-purple-600",
      bgAccent: "bg-purple-500/10",
    },
    {
      id: "card-views",
      label: "Content Impressions",
      value: kpis.totalViews.toLocaleString(),
      delta: `+${kpis.viewsGrowthRate}%`,
      isPositive: true,
      subtext: "reach across channels",
      icon: Eye,
      accent: "text-blue-600",
      bgAccent: "bg-blue-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card
            key={c.id}
            id={c.id}
            className="group relative overflow-hidden border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {c.label}
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bgAccent}`}>
                <Icon className={`h-4 w-4 ${c.accent}`} />
              </div>
            </div>

            <div className="mt-3">
              <div className="font-display text-2xl font-bold tracking-tight text-foreground">
                {c.value}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600">
                  <TrendingUp className="h-3 w-3" />
                  {c.delta}
                </span>
                <span className="text-muted-foreground truncate">{c.subtext}</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
