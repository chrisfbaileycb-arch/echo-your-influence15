import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Heart, MessageCircle, Share2, UserPlus, Flame } from "lucide-react";
import type { TopPerformingContent } from "@/lib/impact/types";

interface TopPerformingContentTableProps {
  content: TopPerformingContent[];
}

export function TopPerformingContentTable({ content }: TopPerformingContentTableProps) {
  return (
    <Card id="top-performing-content-card" className="border border-border bg-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">Top Converting Content</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranked by follower acquisition velocity and interaction resonance.
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-xs self-start sm:self-auto bg-primary/5 text-primary border-primary/20"
        >
          Ranked by Follower ROI
        </Badge>
      </div>

      <div className="mt-5 divide-y divide-border">
        {content.map((item, idx) => (
          <div
            key={item.id}
            className="group flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 transition hover:bg-muted/30 px-3 rounded-xl"
          >
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted border border-border">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 text-[9px] font-medium text-white">
                  #{idx + 1}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="capitalize text-[11px] font-semibold text-primary">
                    {item.platform}
                  </span>
                  <Badge variant="secondary" className="text-[10px] h-4 py-0">
                    {item.format}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{item.publishedAt}</span>
                </div>
                <h3 className="mt-1 text-sm font-semibold text-foreground truncate group-hover:text-primary transition">
                  {item.title}
                </h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {item.views.toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-rose-500" />
                    {item.likes.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-indigo-500" />
                    {item.comments.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="h-3 w-3 text-emerald-500" />
                    {item.shares.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 self-end md:self-auto border-t md:border-t-0 pt-2 md:pt-0 border-border/60 w-full md:w-auto justify-between md:justify-end">
              <div className="text-left md:text-right">
                <div className="flex items-center md:justify-end gap-1 text-xs text-muted-foreground">
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  <span>Engagement</span>
                </div>
                <div className="font-display text-base font-bold text-foreground font-mono">
                  {item.engagementRate}%
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                  <UserPlus className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Followers Gained</span>
                </div>
                <div className="font-display text-base font-bold text-emerald-600 font-mono">
                  +{item.followersGained.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
