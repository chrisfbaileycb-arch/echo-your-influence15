import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  Link2,
  Video,
  CalendarDays,
  Share2,
  Image as ImageIcon,
  LayoutGrid,
  Megaphone,
  Clock,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { BrandMark } from "@/components/BrandMark";
import { INDUSTRIES } from "@/lib/industries";

const TITLE = "Echo Your Influence — All we do is marketing for you";
const DESCRIPTION =
  "Plan, create, and schedule your own marketing in one place. AI strategy, video shorts, multi-ratio ad images, a content calendar, and a two-tap posting hand-off.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Echo Your Influence",
              description: "A personal marketing agency in a box.",
              url: "/",
            },
            {
              "@type": "WebSite",
              name: "Echo Your Influence",
              url: "/",
              description: DESCRIPTION,
            },
            {
              "@type": "SoftwareApplication",
              name: "Echo Your Influence",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: [
                { "@type": "Offer", name: "Starter", price: "29.95", priceCurrency: "USD" },
                { "@type": "Offer", name: "Pro Creator", price: "49.00", priceCurrency: "USD" },
                { "@type": "Offer", name: "Agency", price: "99.00", priceCurrency: "USD" },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: Landing,
});

/** The five things the app actually does today. */
const CAPABILITIES = [
  {
    icon: Sparkles,
    accent: "hl-yellow",
    title: "Strategy first",
    body: "Paste a link or describe your business. You get positioning, audience, and the angles worth posting about.",
    meta: "brief · icp · messaging",
  },
  {
    icon: Video,
    accent: "hl-pink",
    title: "Video shorts",
    body: "15–30 second vertical shorts: avatar narration with captions, or silent cinematic b-roll when you want motion only.",
    meta: "9:16 · two engines",
  },
  {
    icon: ImageIcon,
    accent: "hl-green",
    title: "Ad image kits",
    body: "The same concept rendered 1:1, 9:16, and 16:9 in one pass, so no surface sits empty while your budget goes to one boost.",
    meta: "1:1 · 9:16 · 16:9",
  },
  {
    icon: CalendarDays,
    accent: "hl-blue",
    title: "Content calendar",
    body: "Every day gets its own workspace: hook, script, prompts, caption, hashtags, and the disclosure line when one is required.",
    meta: "week · 4-week · month",
  },
  {
    icon: Share2,
    accent: "hl-orange",
    title: "Two-tap hand-off",
    body: "Copy the caption, then open TikTok, Reels, Shorts, or Facebook with the video attached. No account linking, no API keys.",
    meta: "copy · share · mark posted",
  },
  {
    icon: LayoutGrid,
    accent: "hl-yellow",
    title: "One campaign spine",
    body: "Brief, strategy, content pack, calendar, and results live inside a single resumable campaign you can pick back up anytime.",
    meta: "resumable · per campaign",
  },
] as const;

const STEPS = [
  {
    icon: Link2,
    title: "Bring the subject",
    body: "A product URL, your listing, your menu, your app — or type it in by hand.",
  },
  {
    icon: Sparkles,
    title: "Get the plan",
    body: "Positioning, hooks, and a posting rhythm shaped to what you actually sell.",
  },
  {
    icon: Video,
    title: "Generate the assets",
    body: "Shorts and multi-ratio ad images render from the same source in one pass.",
  },
  {
    icon: Megaphone,
    title: "Post on your terms",
    body: "Schedule it on the calendar, then hand it off to the app in two taps.",
  },
] as const;

/** Surfaces the hand-off targets. Honest phrasing: works with, not endorsed by. */
const SURFACES = ["TikTok", "Instagram Reels", "YouTube Shorts", "Facebook", "LinkedIn"] as const;

const FACTS = [
  { value: "3", label: "aspect ratios per concept" },
  { value: "15–30s", label: "vertical short length" },
  { value: "2", label: "video engines" },
  { value: "0", label: "social passwords stored" },
] as const;

function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 bg-grain text-slate-900">
      <PublicNav />

      {/* ===================== HERO (split copy + 9:16 video mockup + floating draft card) ===================== */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36">
        {/* Subtle background ambient glows */}
        <div
          className="pointer-events-none absolute left-1/4 top-20 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-1/4 top-40 -z-10 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse-soft" />
              Your marketing agency in a box
            </div>

            <h1 className="mt-6 text-balance font-display text-5xl uppercase leading-[0.95] text-slate-900 sm:text-6xl lg:text-7xl">
              Echo your{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-indigo-600">influence</span>
                <span
                  className="absolute bottom-1 left-0 h-3.5 w-full -skew-x-6 bg-rose-200/80"
                  aria-hidden="true"
                />
              </span>
            </h1>

            <p className="mt-4 font-display text-lg uppercase tracking-[0.12em] text-indigo-600 font-bold">
              ALL WE DO IS EFFECTIVE MARKETING FOR YOU.
            </p>

            <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-slate-700">
              Whether you're promoting a local business, showcasing a signature service, or scaling
              a digital product — this is the all-in-one platform to plan it, create it, schedule
              it, and post it. You control the flow, the speed, and the spend.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/auth"
                data-testid="hero-start-free-trial"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 glow-indigo transition-all hover:bg-indigo-700 hover:-translate-y-0.5"
              >
                Start free trial <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/how-it-works"
                data-testid="hero-how-it-works"
                className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 glow-coral transition-all hover:bg-rose-600 hover:-translate-y-0.5"
              >
                See how it works
              </Link>
            </div>

            <p className="mt-4 font-mono text-xs text-slate-500">
              No camera required. No social passwords stored.
            </p>
          </div>

          {/* Right side: Clean Feature Card List */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            {/* Soft decorative glow backdrops */}
            <div
              className="pointer-events-none absolute -right-4 -top-6 h-32 w-32 rounded-3xl bg-indigo-400/15 blur-xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-8 -left-4 h-28 w-28 rounded-3xl bg-rose-400/15 blur-xl"
              aria-hidden="true"
            />

            <div className="relative space-y-4">
              {/* Card 1: Automated Content Scheduling */}
              <div
                data-testid="hero-feature-card-1"
                className="group rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg uppercase text-slate-900">
                      Automated Content Scheduling
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      Auto-format videos for TikTok, Reels, &amp; Shorts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Zero Password Sharing */}
              <div
                data-testid="hero-feature-card-2"
                className="group rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all hover:border-rose-300 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg uppercase text-slate-900">
                      Zero Password Sharing
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      Safe, API-based social publishing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Local Business Optimization */}
              <div
                data-testid="hero-feature-card-3"
                className="group rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg uppercase text-slate-900">
                      Local Business Optimization
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      Pre-built campaign templates for food, retail, &amp; services.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SURFACES (honest: works with) ===================== */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-6">
        <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-md px-6 py-5 shadow-sm">
          <p className="text-center font-mono text-[0.7rem] uppercase tracking-[0.2em] text-slate-400 font-bold">
            Hands off directly to
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {SURFACES.map((s) => (
              <span
                key={s}
                className="font-display text-lg uppercase text-slate-700/80 hover:text-indigo-600 transition-colors"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CAPABILITY CARD GRID ===================== */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-600 font-bold">
            What you get
          </p>
          <h2 className="mt-3 font-display text-4xl uppercase leading-tight text-slate-900 sm:text-5xl">
            Everything an agency would do, minus the retainer.
          </h2>
          <p className="mt-4 text-slate-600 text-lg">
            One workspace that carries an idea from &ldquo;I should market this&rdquo; all the way
            to a post going out on the day you chose.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <article
              key={c.title}
              data-testid={`capability-${c.title.toLowerCase().replace(/\s+/g, "-")}`}
              className="lift relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm`}
              >
                <c.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-xl uppercase text-slate-900">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.body}</p>
              <p className="mt-4 font-mono text-xs font-semibold text-indigo-600">{c.meta}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section id="how" className="relative z-10 border-y border-slate-200 bg-slate-100/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-600 font-bold">
              How it works
            </p>
            <h2 className="mt-3 font-display text-4xl uppercase leading-tight text-slate-900 sm:text-5xl">
              Four steps, start to posted.
            </h2>
          </div>

          <ol className="grid gap-5 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="lift relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="absolute right-5 top-4 font-display text-4xl text-indigo-200">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 font-display text-lg uppercase text-slate-900">{s.title}</p>
                <p className="mt-2 text-sm text-slate-600">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===================== WHO IT'S FOR ===================== */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-600 font-bold">
              Who it&apos;s for
            </p>
            <h2 className="mt-3 font-display text-4xl uppercase leading-tight text-slate-900 sm:text-5xl">
              If you sell something, this is for you.
            </h2>
            <p className="mt-4 text-slate-600">
              Pick the mode that matches your work and the hooks, formats, and disclosure rules
              adjust to it. Nothing here assumes you&apos;re an influencer.
            </p>
          </div>
          <Link
            to="/industries"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:bg-slate-50 hover:border-indigo-300"
          >
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind) => (
            <Link
              key={ind.slug}
              to="/industries"
              data-testid={`home-industry-${ind.slug}`}
              className="lift rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all flex flex-col justify-between"
            >
              <div>
                <div
                  className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${ind.avatarGradient} text-white shadow-md shadow-indigo-500/20`}
                >
                  <ind.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 font-display text-lg uppercase text-slate-900">{ind.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{ind.headline}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                {ind.subCareers.slice(0, 3).map((sub) => (
                  <span
                    key={sub}
                    className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===================== FACTS (verifiable product facts only) ===================== */}
      <section className="relative z-10 border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-14 lg:grid-cols-4">
          {FACTS.map((f) => (
            <div key={f.label}>
              <p className="font-mono text-3xl font-bold text-indigo-600">{f.value}</p>
              <p className="mt-1 text-sm text-slate-600">{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== CLOSING CTA ===================== */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="rounded-3xl border border-indigo-200 bg-white p-10 shadow-2xl shadow-indigo-500/10 sm:p-14">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 glow-indigo">
            <Megaphone className="h-7 w-7" />
          </div>
          <h2 className="mt-5 font-display text-4xl uppercase leading-tight text-slate-900 sm:text-5xl">
            Start marketing on your own terms.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-600">
            Build your first campaign, fill a week of the calendar, and hand the first post off from
            your phone.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 glow-indigo transition-all hover:bg-indigo-700 hover:-translate-y-0.5"
            >
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 glow-coral transition-all hover:bg-rose-600 hover:-translate-y-0.5"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
