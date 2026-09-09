import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Download, RefreshCw } from "lucide-react";
import type { PlatformId, TimeRange } from "@/lib/impact/types";

interface ImpactFilterBarProps {
  platform: PlatformId;
  timeRange: TimeRange;
  onPlatformChange: (p: PlatformId) => void;
  onTimeRangeChange: (t: TimeRange) => void;
  onSimulateSpike: () => void;
  onExport: () => void;
  isRefreshing?: boolean;
}

const PLATFORMS: { id: PlatformId; label: string }[] = [
  { id: "all", label: "All Channels" },
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "youtube", label: "YouTube Shorts" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "x", label: "X (Twitter)" },
];

const TIME_RANGES: { id: TimeRange; label: string }[] = [
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "90d", label: "Last 90 Days" },
  { id: "ytd", label: "Year-To-Date" },
];

export function ImpactFilterBar({
  platform,
  timeRange,
  onPlatformChange,
  onTimeRangeChange,
  onSimulateSpike,
  onExport,
  isRefreshing,
}: ImpactFilterBarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border pb-5">
      {/* Platform Chips */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
        {PLATFORMS.map((p) => {
          const isActive = platform === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPlatformChange(p.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface text-foreground/80 hover:bg-muted border border-border/80"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Right controls: Time Range + Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1">
          {TIME_RANGES.map((t) => {
            const isActive = timeRange === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTimeRangeChange(t.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  isActive
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onSimulateSpike}
          disabled={isRefreshing}
          className="h-8 text-xs gap-1.5"
          title="Simulates a viral surge in engagement and follower growth"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Simulate Surge</span>
        </Button>

        <Button variant="outline" size="sm" onClick={onExport} className="h-8 text-xs gap-1.5">
          <Download className="h-3.5 w-3.5" />
          <span>Export</span>
        </Button>
      </div>
    </div>
  );
}
