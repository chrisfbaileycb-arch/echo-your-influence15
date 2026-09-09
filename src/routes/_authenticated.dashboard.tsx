import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listVideos } from "@/lib/videos.functions";
import { listProducts } from "@/lib/products.functions";
import { listPersonas } from "@/lib/personas.functions";
import { listPrograms } from "@/lib/affiliate.functions";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ArrowRight,
  Video as VideoIcon,
  Package,
  TrendingUp,
  Flame,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Echo Your Influence" },
      {
        name: "description",
        content:
          "Your Echo Your Influence command center: recent videos, quota usage, and one-tap product ingestion.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const lv = useServerFn(listVideos);
  const lp = useServerFn(listProducts);
  const lpe = useServerFn(listPersonas);
  const lpr = useServerFn(listPrograms);
  const videos = useQuery({ queryKey: ["videos"], queryFn: () => lv() });
  const products = useQuery({ queryKey: ["products"], queryFn: () => lp() });
  const personas = useQuery({ queryKey: ["personas"], queryFn: () => lpe() });
  const programs = useQuery({ queryKey: ["programs"], queryFn: () => lpr() });

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Studio
          </p>
          <h1 className="mt-1 font-display text-4xl">Let&apos;s echo another one.</h1>
        </div>
        <Button
          onClick={() => navigate({ to: "/products/new" })}
          className="rounded-full"
          size="lg"
        >
          <Plus className="mr-2 h-4 w-4" /> New product
        </Button>
      </header>

      <OnboardingChecklist
        hasPersona={(personas.data?.length ?? 0) > 0}
        hasProduct={(products.data?.length ?? 0) > 0}
        hasProgram={(programs.data?.length ?? 0) > 0}
        hasVideo={(videos.data?.length ?? 0) > 0}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Videos generated" value={videos.data?.length ?? 0} icon={VideoIcon} />
        <StatCard label="Products ingested" value={products.data?.length ?? 0} icon={Package} />
        <Card className="flex items-center justify-between bg-gradient-brand p-6 text-primary-foreground shadow-pop">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Quick start</p>

            <p className="mt-1 font-display text-2xl">Paste a product URL</p>
          </div>
          <Link
            to="/products/new"
            className="rounded-full bg-background/20 p-3 backdrop-blur hover:bg-background/30"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Card>
      </div>

      {/* Impact & Follower Growth Spotlight */}
      <Card className="border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                <TrendingUp className="h-3.5 w-3.5" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Impact Dashboard
              </p>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                +16.4% growth
              </span>
            </div>
            <h3 className="font-display text-xl font-bold">Follower Growth & Engagement</h3>
            <p className="text-sm text-muted-foreground max-w-xl">
              Audience momentum reached{" "}
              <strong className="text-foreground">148.5k followers</strong> across TikTok, Reels,
              and Shorts with a{" "}
              <strong className="text-foreground">5.6% avg engagement rate</strong>.
            </p>
          </div>

          <Link
            to="/impact"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-pop transition hover:bg-primary/90 shrink-0"
          >
            Open Impact Dashboard
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Card>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Recent videos</h2>
          <Link to="/videos" className="text-sm text-muted-foreground hover:text-foreground">
            View all →
          </Link>
        </div>
        {videos.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : videos.data?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {videos.data.slice(0, 8).map((v) => (
              <Link to="/videos/$id" params={{ id: v.id }} key={v.id} className="group">
                <Card className="overflow-hidden p-0 transition group-hover:-translate-y-1 group-hover:shadow-pop">
                  <div className="aspect-[9/16] bg-secondary">
                    {v.thumbnail_url ? (
                      <img
                        src={v.thumbnail_url}
                        alt={v.hook ? `Video thumbnail: ${v.hook}` : "Recent video thumbnail"}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-medium">{v.hook || "Untitled hook"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{v.status}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No videos yet"
            desc="Paste a product URL to generate your first 15-second video."
            cta={
              <Button onClick={() => navigate({ to: "/products/new" })}>
                <Plus className="mr-2 h-4 w-4" /> Start
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="p-6 shadow-pop">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-3 font-display text-4xl">{value}</p>
    </Card>
  );
}

function EmptyState({ title, desc, cta }: { title: string; desc: string; cta?: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 border-dashed p-10 text-center">
      <p className="font-display text-2xl">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{desc}</p>
      {cta}
    </Card>
  );
}
