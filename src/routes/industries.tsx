import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Search, Sparkles, Video, X } from "lucide-react";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import {
  INDUSTRIES,
  INDUSTRY_CATEGORIES,
  type Industry,
  type IndustryCategory,
} from "@/lib/industries";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export const Route = createFileRoute("/industries")({
  head: () => ({
    meta: [
      { title: "Industries — AI Ad & Video Campaigns | Echo Your Influence" },
      {
        name: "description",
        content:
          "Real estate, SaaS, e-commerce, local services, restaurants, and professional services: paste any URL and get multi-ratio ad cards plus 15–30s vertical video shorts.",
      },
      { property: "og:title", content: "AI Campaign Engine for Every Industry" },
      {
        property: "og:description",
        content:
          "Fluid 1:1, 9:16, and 16:9 ad cards plus AI video shorts, tailored to your niche from a single URL.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/industries" },
    ],
    links: [{ rel: "canonical", href: "/industries" }],
  }),
  component: IndustriesPage,
});

function IndustriesPage() {
  const [category, setCategory] = useState<IndustryCategory>("All");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Industry | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INDUSTRIES.filter((ind) => {
      if (category !== "All" && ind.category !== category) return false;
      if (!q) return true;
      return [
        ind.name,
        ind.headline,
        ind.description,
        ind.category,
        ind.hookAngle,
        ...(ind.subCareers || []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [category, query]);

  return (
    <div className="min-h-screen bg-slate-50 bg-grain text-slate-900">
      <PublicNav />

      <section className="mx-auto max-w-6xl px-6 pt-12 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" /> Vertical solution matrix
        </div>
        <h1 className="mt-6 max-w-3xl text-balance font-display text-5xl font-semibold leading-[0.95] tracking-tight text-slate-900 md:text-6xl">
          AI campaign engine for every industry.
        </h1>
        <p className="mt-5 max-w-2xl text-balance text-lg text-slate-600">
          Paste any URL. Echo Your Influence generates multi-ratio fluid ad cards and vertical video
          shorts tailored to your specific niche.
        </p>

        {/* Search + filters */}
        <div className="mt-9 flex flex-col gap-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              data-testid="industry-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search industries or sub-careers e.g. realtor, pizza, bakery, SaaS…"
              aria-label="Search industries"
              className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {INDUSTRY_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                data-testid={`industry-filter-${c.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                  category === c
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((ind) => (
            <article
              key={ind.slug}
              data-testid={`industry-card-${ind.slug}`}
              className={`group relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-500/10 ${
                ind.featured ? "border-indigo-500/60 ring-2 ring-indigo-500/20" : "border-slate-200"
              }`}
            >
              {/* Vibrant Icon Avatar & Category Badge */}
              <div className="flex items-center justify-between gap-3">
                <div
                  className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${ind.avatarGradient} text-white shadow-md shadow-indigo-500/20 glow-indigo`}
                >
                  <ind.icon className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-100/80 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {ind.category}
                </span>
              </div>

              {ind.featured && ind.featuredBadge && (
                <span className="mt-3.5 inline-flex w-fit rounded-full bg-rose-500 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                  {ind.featuredBadge}
                </span>
              )}

              {/* Title & Tagline */}
              <h2 className="mt-4 font-display text-xl uppercase font-semibold text-slate-900 leading-tight">
                {ind.name}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 font-medium">
                {ind.headline}
              </p>

              {/* Itemized Sub-careers List */}
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-3.5 flex-1">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Sub-Careers &amp; Niches
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ind.subCareers.map((sub) => (
                    <span
                      key={sub}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800 transition-colors group-hover:border-indigo-200 group-hover:bg-indigo-50/50"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              {/* Output Ratio Pills */}
              <div className="mt-4 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                {ind.outputs.map((o) => (
                  <span
                    key={o.label}
                    className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600"
                  >
                    {o.ratio === "video" ? "9:16 Video" : o.ratio}
                  </span>
                ))}
              </div>

              {/* Bright Primary CTA Button */}
              <button
                type="button"
                data-testid={`industry-explore-${ind.slug}`}
                onClick={() => setActive(ind)}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 glow-indigo transition-all hover:bg-indigo-700 hover:shadow-indigo-500/40 w-full"
              >
                Explore {ind.category} Kits <ArrowRight className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>

        {results.length === 0 && (
          <p className="py-16 text-center text-slate-500">
            No industries match “{query}”. Every vertical still works — paste any URL and Echo
            adapts the hook.
          </p>
        )}

        {/* Real estate spotlight */}
        <div className="mt-14 flex flex-col items-start justify-between gap-6 rounded-3xl border border-indigo-200 bg-white p-8 shadow-lg shadow-indigo-500/5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Real estate spotlight
            </p>
            <p className="mt-2 font-display text-3xl text-slate-900">
              Marketing a real estate office? Unlock Agency team access.
            </p>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              30 video shorts and 500 fluid ad images a month — enough to keep every agent&rsquo;s
              listings posting across feed, stories, and landscape.
            </p>
          </div>
          <Link
            to="/pricing"
            data-testid="industries-agency-cta"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-rose-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 glow-coral transition-all hover:bg-rose-600 hover:-translate-y-0.5"
          >
            Unlock Agency team access <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <IndustryDrawer industry={active} onClose={() => setActive(null)} />
      <PublicFooter />
    </div>
  );
}

function IndustryDrawer({ industry, onClose }: { industry: Industry | null; onClose: () => void }) {
  return (
    <Sheet open={!!industry} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-border bg-background sm:max-w-xl"
      >
        {industry && (
          <div className="pb-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <industry.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {industry.category}
                  </p>
                  <h2 className="font-display text-2xl leading-tight">{industry.name}</h2>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {industry.headline}
            </p>

            {/* Before */}
            <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Before — what you paste
            </p>
            <div className="mt-3 space-y-2">
              {industry.before.map((b) => (
                <div
                  key={b}
                  className="flex items-center gap-2 rounded-2xl border border-dashed border-border bg-surface px-4 py-3 font-mono text-xs text-muted-foreground"
                >
                  <span className="text-primary">https://</span>
                  {b}
                </div>
              ))}
            </div>

            {/* After */}
            <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              After — one pass, every surface
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {industry.outputs.map((o) => (
                <div
                  key={o.label}
                  className="rounded-2xl border border-border bg-card p-3 shadow-pop"
                >
                  <div
                    className={`grid w-full place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 text-primary ${
                      o.ratio === "1:1"
                        ? "aspect-square"
                        : o.ratio === "16:9"
                          ? "aspect-video"
                          : "aspect-[9/16]"
                    }`}
                  >
                    {o.ratio === "video" ? (
                      <Video className="h-6 w-6" />
                    ) : (
                      <Sparkles className="h-6 w-6" />
                    )}
                  </div>
                  <p className="mt-2 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {o.ratio === "video" ? "9:16 video" : o.ratio}
                  </p>
                  <p className="text-xs leading-snug">{o.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hook angle
              </p>
              <p className="mt-2 text-sm leading-relaxed">{industry.hookAngle}</p>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Previews above are illustrative layouts, not rendered customer campaigns.
            </p>

            <Link
              to="/auth"
              className="mt-6 flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-pop transition-opacity hover:opacity-90"
            >
              Start Test Pass ($29.95) <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
