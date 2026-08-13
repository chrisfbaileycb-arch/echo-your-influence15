import { BrandMark } from "@/components/BrandMark";
import {
  createFileRoute,
  Outlet,
  Link,
  useNavigate,
  useRouterState,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getCustomerZeroState } from "@/lib/customer-zero.functions";
import {
  LayoutDashboard,
  Package,
  Video,
  Wand2,
  BadgeDollarSign,
  LogOut,
  Sparkles,
  Users,
  CreditCard,
  Send,
  Plug,
  Route as RouteIcon,
  CalendarDays,
  ClipboardList,
  Target,
  PieChart,
  LayoutList,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

const PLATFORM_SUBITEMS = [
  { id: "all", label: "All Platforms", search: { platform: "all" } },
  { id: "tiktok", label: "TikTok", search: { platform: "tiktok" } },
  { id: "youtube", label: "YouTube Shorts", search: { platform: "youtube" } },
  { id: "instagram", label: "Instagram Reels", search: { platform: "instagram" } },
  { id: "facebook", label: "Facebook", search: { platform: "facebook" } },
  { id: "x", label: "X (Twitter)", search: { platform: "x" } },
  { id: "linkedin", label: "LinkedIn", search: { platform: "linkedin" } },
  { id: "reddit", label: "Reddit", search: { platform: "reddit" } },
] as const;

function AuthLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const gateFn = useServerFn(getCustomerZeroState);
  const gate = useQuery({
    queryKey: ["customer-zero"],
    queryFn: () => gateFn({}),
    enabled: Boolean(session),
    staleTime: 5 * 60 * 1000,
  });

  const isContentActive = pathname.startsWith("/content") || pathname.startsWith("/publishing");
  const [contentExpanded, setContentExpanded] = useState<boolean>(true);

  useEffect(() => {
    if (isContentActive) setContentExpanded(true);
  }, [isContentActive]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) setSession(s);
    });

    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setSession(data.session);
          return;
        }
      } catch (err) {
        console.warn("[AuthLayout] Supabase session check failed:", err);
      }

      if (typeof window !== "undefined") {
        const storedDemo = localStorage.getItem("echo_demo_session");
        if (storedDemo) {
          try {
            setSession(JSON.parse(storedDemo));
            return;
          } catch (e) {
            localStorage.removeItem("echo_demo_session");
          }
        }
      }

      setSession(null);
    }

    checkAuth();
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null) navigate({ to: "/auth" });
  }, [session, navigate]);

  if (session === undefined) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (session === null) return null;

  const restricted = ["/campaigns", "/settings/integrations", "/publishing"];
  const locked =
    gate.data?.enabled === true &&
    gate.data.allowed === false &&
    restricted.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const currentSearch = new URLSearchParams(location.search);
  const currentPlatform = currentSearch.get("platform") || "all";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-surface px-4 py-6 md:flex">
          <Link to="/dashboard" className="mb-6 flex items-center gap-2 px-2">
            <BrandMark className="h-8 w-8 rounded-lg" />
            <span className="font-display text-lg font-semibold">Echo Your Influence</span>
          </Link>
          <nav className="space-y-1">
            <Link
              to="/dashboard"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                pathname === "/dashboard"
                  ? "bg-primary text-primary-foreground shadow-pop"
                  : "text-foreground/70 hover:bg-card hover:text-foreground",
              )}
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>

            <Link
              to="/intake"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                pathname === "/intake"
                  ? "bg-primary text-primary-foreground shadow-pop"
                  : "text-foreground/70 hover:bg-card hover:text-foreground",
              )}
            >
              <ClipboardList className="h-4 w-4" /> What you're selling
            </Link>

            <Link
              to="/strategy"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                pathname === "/strategy"
                  ? "bg-primary text-primary-foreground shadow-pop"
                  : "text-foreground/70 hover:bg-card hover:text-foreground",
              )}
            >
              <Target className="h-4 w-4" /> Strategy
            </Link>

            <Link
              to="/plan"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                pathname === "/plan"
                  ? "bg-primary text-primary-foreground shadow-pop"
                  : "text-foreground/70 hover:bg-card hover:text-foreground",
              )}
            >
              <PieChart className="h-4 w-4" /> Budget & channels
            </Link>

            {/* Expandable Content by platform */}
            <div className="space-y-1">
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition select-none text-left",
                  isContentActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground/70 hover:bg-card hover:text-foreground",
                )}
                onClick={() => {
                  setContentExpanded((prev) => !prev);
                  if (!pathname.startsWith("/content")) {
                    navigate({ to: "/content", search: { platform: "all" } });
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <LayoutList className="h-4 w-4" />
                  <span>Content by platform</span>
                </div>
                {contentExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {contentExpanded && (
                <div className="ml-4 border-l border-border/60 pl-3 space-y-0.5">
                  {PLATFORM_SUBITEMS.map((sub) => {
                    const isSubActive = pathname === "/content" && currentPlatform === sub.id;
                    return (
                      <Link
                        key={sub.id}
                        to="/content"
                        search={sub.search}
                        className={cn(
                          "block rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                          isSubActive
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "text-foreground/70 hover:bg-card hover:text-foreground",
                        )}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}

                  <Link
                    to="/publishing"
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition mt-1",
                      pathname === "/publishing"
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-foreground/70 hover:bg-card hover:text-foreground",
                    )}
                  >
                    <Send className="h-3.5 w-3.5" /> Publish step
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/campaigns"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                pathname === "/campaigns"
                  ? "bg-primary text-primary-foreground shadow-pop"
                  : "text-foreground/70 hover:bg-card hover:text-foreground",
              )}
            >
              <RouteIcon className="h-4 w-4" /> Campaigns
            </Link>

            <Link
              to="/products"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                pathname === "/products"
                  ? "bg-primary text-primary-foreground shadow-pop"
                  : "text-foreground/70 hover:bg-card hover:text-foreground",
              )}
            >
              <Package className="h-4 w-4" /> Products
            </Link>

            <Link
              to="/personas"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                pathname === "/personas"
                  ? "bg-primary text-primary-foreground shadow-pop"
                  : "text-foreground/70 hover:bg-card hover:text-foreground",
              )}
            >
              <Users className="h-4 w-4" /> Personas
            </Link>

            <Link
              to="/studio"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                pathname === "/studio"
                  ? "bg-primary text-primary-foreground shadow-pop"
                  : "text-foreground/70 hover:bg-card hover:text-foreground",
              )}
            >
              <Wand2 className="h-4 w-4" /> Studio
            </Link>

            <Link
              to="/videos"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                pathname === "/videos"
                  ? "bg-primary text-primary-foreground shadow-pop"
                  : "text-foreground/70 hover:bg-card hover:text-foreground",
              )}
            >
              <Video className="h-4 w-4" /> Videos
            </Link>

            <Link
              to="/calendar"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                pathname === "/calendar"
                  ? "bg-primary text-primary-foreground shadow-pop"
                  : "text-foreground/70 hover:bg-card hover:text-foreground",
              )}
            >
              <CalendarDays className="h-4 w-4" /> Calendar
            </Link>

            <Link
              to="/affiliate-programs"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                pathname === "/affiliate-programs"
                  ? "bg-primary text-primary-foreground shadow-pop"
                  : "text-foreground/70 hover:bg-card hover:text-foreground",
              )}
            >
              <BadgeDollarSign className="h-4 w-4" /> Affiliate IDs
            </Link>

            <Link
              to="/settings/integrations"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                pathname === "/settings/integrations"
                  ? "bg-primary text-primary-foreground shadow-pop"
                  : "text-foreground/70 hover:bg-card hover:text-foreground",
              )}
            >
              <Plug className="h-4 w-4" /> Integrations
            </Link>

            <Link
              to="/billing"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                pathname === "/billing"
                  ? "bg-primary text-primary-foreground shadow-pop"
                  : "text-foreground/70 hover:bg-card hover:text-foreground",
              )}
            >
              <CreditCard className="h-4 w-4" /> Billing
            </Link>
          </nav>
          {gate.data?.badge ? (
            <p
              data-testid="customer-zero-badge"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-foreground"
            >
              <Sparkles className="h-3 w-3" /> {gate.data.badge}
            </p>
          ) : null}
          <div className="mt-auto space-y-2 border-t border-border pt-4 text-xs">
            <p className="truncate px-2 text-muted-foreground">{session.user.email}</p>
            <button
              onClick={async () => {
                if (typeof window !== "undefined") {
                  localStorage.removeItem("echo_demo_session");
                }
                try {
                  await supabase.auth.signOut();
                } catch (err) {
                  console.warn("Sign out warning:", err);
                }
                setSession(null);
                navigate({ to: "/auth" });
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-foreground/70 hover:bg-card hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
          {locked ? <PrivateBeta /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}

function PrivateBeta() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-sm">
      <h1 className="font-display text-2xl font-semibold">Private beta</h1>
      <p className="mt-2 text-muted-foreground">
        Campaigns, outbound integrations and publishing are limited to the Customer Zero test
        account while the engines are validated end to end. Your account is not on the allowlist
        yet, so these actions are disabled — the rest of the studio still works.
      </p>
    </div>
  );
}
