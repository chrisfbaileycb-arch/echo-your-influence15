import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, Film, Loader2, Send, Share2, Sparkles } from "lucide-react";
import {
  attachCampaignKit,
  generateContentPack,
  generateStrategy,
  getWorkflow,
  ingestBriefFromUrl,
  saveBrief,
  saveStrategy,
} from "@/lib/workflows.functions";
import { listCampaigns } from "@/lib/campaigns.functions";

export type WorkflowData = Awaited<ReturnType<typeof getWorkflow>>;

export interface StepProps {
  id: string;
  data: WorkflowData;
  refresh: () => void;
}

export function Field({
  label,
  value,
  onChange,
  rows = 3,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  testId?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Textarea
        className="mt-1"
        rows={rows}
        value={value}
        data-testid={testId}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
        {items.map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ul>
    </div>
  );
}

export function BriefStep({ id, data, refresh }: StepProps) {
  const save = useServerFn(saveBrief);
  const ingest = useServerFn(ingestBriefFromUrl);
  const brief = data.brief;
  const [offer, setOffer] = useState(brief?.offer ?? "");
  const [audience, setAudience] = useState(brief?.audience ?? "");
  const [proof, setProof] = useState(((brief?.proof_points as string[]) ?? []).join("\n"));
  const [constraints, setConstraints] = useState(brief?.constraints ?? "");
  const [url, setUrl] = useState(brief?.source_url ?? "");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const payload = (approve: boolean) => ({
    data: {
      workflow_id: id,
      offer,
      audience,
      proof_points: proof
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      constraints,
      source_url: url.trim() || null,
      product_id: brief?.product_id ?? null,
      approve,
    },
  });

  const m = useMutation({
    mutationFn: (approve: boolean) => save(payload(approve)),
    onSuccess: (r) => {
      setSavedAt(r.savedAt);
      refresh();
      toast.success("Brief saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ing = useMutation({
    mutationFn: () =>
      ingest({ data: { workflow_id: id, url: url.trim(), asset_kind: "ecommerce" } }),
    onSuccess: (r) => {
      if (r.product) {
        setOffer(`${r.product.title}\n\n${r.product.description ?? ""}`.trim());
        setProof(r.angles.join("\n"));
      }
      refresh();
      toast.success("Page ingested");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="max-w-3xl space-y-4 p-6">
      <div>
        <Label htmlFor="brief-url">Product URL</Label>
        <div className="mt-1 flex gap-2">
          <Input
            id="brief-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
          <Button
            variant="outline"
            data-testid="ingest-url"
            disabled={!url.trim() || ing.isPending}
            onClick={() => ing.mutate()}
          >
            {ing.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingest"}
          </Button>
        </div>
      </div>
      <Field label="Offer" value={offer} onChange={setOffer} rows={5} testId="brief-offer" />
      <Field
        label="Audience"
        value={audience}
        onChange={setAudience}
        rows={3}
        testId="brief-audience"
      />
      <Field
        label="Proof points (one per line — real facts only)"
        value={proof}
        onChange={setProof}
        rows={4}
        testId="brief-proof"
      />
      <Field
        label="Constraints"
        value={constraints}
        onChange={setConstraints}
        rows={3}
        testId="brief-constraints"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          data-testid="save-brief"
          disabled={m.isPending}
          onClick={() => m.mutate(false)}
        >
          Save draft
        </Button>
        <Button
          data-testid="approve-brief"
          disabled={m.isPending || !offer.trim()}
          onClick={() => m.mutate(true)}
        >
          Approve &amp; continue
        </Button>
        <span className="text-xs text-muted-foreground">
          {savedAt
            ? `Saved ${new Date(savedAt).toLocaleTimeString()}`
            : brief?.approved_at
              ? "Approved"
              : "Not saved yet"}
        </span>
      </div>
    </Card>
  );
}

const ROLLOUT_PLATFORMS = ["TikTok", "YouTube", "Instagram", "Facebook", "X", "Reddit"] as const;

function ResultBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((x, i) => (
          <li key={i} className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Echo writes the strategy — the customer only says what they're selling.
 * This page generates automatically from the brief and shows the result;
 * editing is opt-in, not homework.
 */
export function StrategyStep({ id, data, refresh }: StepProps) {
  const gen = useServerFn(generateStrategy);
  const save = useServerFn(saveStrategy);
  const s = data.strategy;
  const hasBrief = Boolean(data.brief?.offer?.trim());
  const [editing, setEditing] = useState(false);
  const [positioning, setPositioning] = useState(s?.positioning ?? "");
  const [angles, setAngles] = useState(((s?.angles as string[]) ?? []).join("\n"));
  const [pillars, setPillars] = useState(((s?.pillars as string[]) ?? []).join("\n"));
  const [objections, setObjections] = useState(((s?.objections as string[]) ?? []).join("\n"));
  const [cta, setCta] = useState(s?.cta ?? "");
  const autoRan = useRef(false);

  const g = useMutation({
    mutationFn: () => gen({ data: { workflow_id: id } }),
    onSuccess: (r) => {
      setPositioning(r.positioning);
      setAngles(r.angles.join("\n"));
      setPillars(r.pillars.join("\n"));
      setObjections(r.objections.join("\n"));
      setCta(r.cta);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // First visit with a brief and no strategy: just build it. No button hunt.
  useEffect(() => {
    if (autoRan.current) return;
    if (!hasBrief || s || g.isPending) return;
    autoRan.current = true;
    g.mutate();
  }, [hasBrief, s, g]);

  const lines = (v: string) =>
    v
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
  const m = useMutation({
    mutationFn: () =>
      save({
        data: {
          workflow_id: id,
          positioning,
          angles: lines(angles),
          pillars: lines(pillars),
          objections: lines(objections),
          cta,
          approve: true,
        },
      }),
    onSuccess: () => {
      setEditing(false);
      refresh();
      toast.success("Your edits are saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!hasBrief) {
    return (
      <Card className="max-w-2xl space-y-3 p-6">
        <p className="text-sm font-medium">Tell us what you're selling first.</p>
        <p className="text-sm text-muted-foreground">
          Paste your page or describe the product in one paragraph — we take it from there and write
          the strategy for you.
        </p>
        <Button asChild data-testid="strategy-go-intake">
          <Link to="/intake">Go to “What you're selling” →</Link>
        </Button>
      </Card>
    );
  }

  if (g.isPending && !s) {
    return (
      <Card className="max-w-2xl space-y-2 p-6" data-testid="strategy-building">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Loader2 className="h-4 w-4 animate-spin" /> Writing your strategy…
        </p>
        <p className="text-sm text-muted-foreground">
          Reading your brief, then drafting positioning, campaign angles and messaging pillars.
        </p>
      </Card>
    );
  }

  if (!s) {
    return (
      <Card className="max-w-2xl space-y-3 p-6">
        <p className="text-sm font-medium">We couldn't build the strategy yet.</p>
        <Button data-testid="generate-strategy" onClick={() => g.mutate()} disabled={g.isPending}>
          Try again
        </Button>
      </Card>
    );
  }

  const icpEntries = Object.entries((s.icp as Record<string, string | string[]>) ?? {});

  return (
    <div className="max-w-3xl space-y-4">
      <Card className="space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Here's the strategy we wrote for you</p>
            <p className="text-xs text-muted-foreground">
              {s.generated_at ? `Built ${new Date(s.generated_at).toLocaleString()}` : null}
              {" · Nothing here is required of you — edit only if you disagree."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              data-testid="edit-strategy"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "Done editing" : "Edit"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-testid="generate-strategy"
              disabled={g.isPending}
              onClick={() => g.mutate()}
            >
              {g.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Rewrite
            </Button>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <Field
              label="Positioning"
              value={positioning}
              onChange={setPositioning}
              rows={4}
              testId="strategy-positioning"
            />
            <Field
              label="Campaign angles (one per line)"
              value={angles}
              onChange={setAngles}
              rows={4}
            />
            <Field label="Messaging pillars" value={pillars} onChange={setPillars} rows={4} />
            <Field
              label="Objections we'll answer"
              value={objections}
              onChange={setObjections}
              rows={3}
            />
            <div>
              <Label>Primary CTA</Label>
              <Input className="mt-1" value={cta} onChange={(e) => setCta(e.target.value)} />
            </div>
            <Button
              data-testid="approve-strategy"
              disabled={m.isPending}
              onClick={() => m.mutate()}
            >
              {m.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {s.positioning ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Positioning
                </p>
                <p className="mt-1 text-sm">{s.positioning}</p>
              </div>
            ) : null}
            {icpEntries.length ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Who we're selling to
                </p>
                <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                  {icpEntries.map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-border bg-card px-3 py-2">
                      <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {k.replace(/_/g, " ")}
                      </dt>
                      <dd className="text-sm">{Array.isArray(v) ? v.join(", ") : v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
            <ResultBlock title="Campaign angles" items={(s.angles as string[]) ?? []} />
            <ResultBlock title="Messaging pillars" items={(s.pillars as string[]) ?? []} />
            <ResultBlock title="Objections we'll answer" items={(s.objections as string[]) ?? []} />
            {s.cta ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Primary call to action
                </p>
                <p className="mt-1 text-sm font-medium">{s.cta}</p>
              </div>
            ) : null}
          </div>
        )}
      </Card>

      <Card className="space-y-3 p-6">
        <div>
          <p className="text-sm font-medium">Where this gets used</p>
          <p className="text-sm text-muted-foreground">
            These angles and pillars feed the scripts, captions and ad copy we write for each
            platform you post to.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLLOUT_PLATFORMS.map((p) => (
            <span
              key={p}
              className="rounded-full border border-border px-3 py-1 font-mono text-xs tracking-wide"
            >
              {p}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild size="sm" data-testid="strategy-to-plan">
            <Link to="/plan">Budget &amp; channels →</Link>
          </Button>
          <Button asChild size="sm" variant="outline" data-testid="strategy-to-content">
            <Link to="/content">Content by platform →</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

const ALL_PLATFORMS_DATA = [
  {
    id: "tiktok",
    name: "TikTok",
    url: "https://www.tiktok.com/upload",
    desc: "Short video (9:16), bold hook, trending audio, high energy.",
  },
  {
    id: "youtube",
    name: "YouTube Shorts",
    url: "https://studio.youtube.com",
    desc: "Short video (9:16), clear value promise in first 2 seconds.",
  },
  {
    id: "instagram",
    name: "Instagram Reels",
    url: "https://www.instagram.com",
    desc: "Short video (9:16) + aesthetic cover, concise story.",
  },
  {
    id: "facebook",
    name: "Facebook",
    url: "https://www.facebook.com",
    desc: "Video or carousel post + detailed description & discussion prompt.",
  },
  {
    id: "x",
    name: "X (Twitter)",
    url: "https://x.com/compose/post",
    desc: "Punchy thread opener or short clip + strong opinion angle.",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    url: "https://www.linkedin.com/feed",
    desc: "Professional takeaway + narrative context & industry insight.",
  },
  {
    id: "reddit",
    name: "Reddit",
    url: "https://www.reddit.com/submit",
    desc: "Community-first text post or demo, authentic non-salesy tone.",
  },
] as const;

export function ContentStep({
  id,
  data,
  refresh,
  selectedPlatform = "all",
}: StepProps & { selectedPlatform?: string }) {
  const gen = useServerFn(generateContentPack);
  const attach = useServerFn(attachCampaignKit);
  const list = useServerFn(listCampaigns);
  const kits = useQuery({ queryKey: ["campaigns"], queryFn: () => list() });
  const pack = data.contentPack;

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [postedPlatforms, setPostedPlatforms] = useState<Record<string, boolean>>({});

  const g = useMutation({
    mutationFn: () => gen({ data: { workflow_id: id } }),
    onSuccess: () => {
      refresh();
      toast.success("Content pack generated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const a = useMutation({
    mutationFn: (campaign_id: string) => attach({ data: { workflow_id: id, campaign_id } }),
    onSuccess: () => {
      refresh();
      toast.success("Campaign kit linked");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyText = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const platformsToDisplay =
    selectedPlatform === "all"
      ? ALL_PLATFORMS_DATA
      : ALL_PLATFORMS_DATA.filter((p) => p.id === selectedPlatform);

  const hooks = (pack?.hooks as string[]) ?? [];
  const scripts = (pack?.scripts as Array<{ title: string; script: string }>) ?? [];
  const captions = (pack?.captions as string[]) ?? [];
  const hashtags = (pack?.hashtags as string[]) ?? [];

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Campaign Content Pack</p>
            <p className="text-xs text-muted-foreground">
              {pack?.generated_at
                ? `Generated ${new Date(pack.generated_at).toLocaleString()}`
                : "Not generated yet"}
            </p>
          </div>
          <Button
            variant="outline"
            data-testid="generate-content"
            disabled={g.isPending}
            onClick={() => g.mutate()}
          >
            {g.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {pack ? "Regenerate Content Pack" : "Generate Content Pack"}
          </Button>
        </div>

        {!pack ? (
          <p className="text-sm text-muted-foreground">
            Click "Generate Content Pack" above to write platform-optimized hooks, scripts,
            captions, and hashtags.
          </p>
        ) : null}
      </Card>

      {/* Linked Kit Banner */}
      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Linked Campaign Kit (Studio Media)
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Render video in Studio and link the kit here to attach media assets directly to each
              platform workflow.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {kits.data?.length ? (
              kits.data.map((c) => (
                <Button
                  key={c.id}
                  size="sm"
                  variant={data.workflow.campaign_id === c.id ? "default" : "outline"}
                  onClick={() => a.mutate(c.id)}
                >
                  {c.name}
                </Button>
              ))
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link to="/studio">Build in Studio →</Link>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Platform Continuous Workflows */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">
            {selectedPlatform === "all"
              ? "Continuous Workflow by Platform"
              : `${platformsToDisplay[0]?.name ?? "Platform"} Workflow`}
          </h2>
          <span className="text-xs text-muted-foreground">
            {platformsToDisplay.length} platform lane{platformsToDisplay.length === 1 ? "" : "s"}
          </span>
        </div>

        {platformsToDisplay.map((p, idx) => {
          const platformHook =
            hooks[idx % (hooks.length || 1)] || "Stop scrolling and check this out!";
          const platformScript = scripts[idx % (scripts.length || 1)];
          const platformCaption =
            captions[idx % (captions.length || 1)] ||
            pack?.email_angle ||
            "Check out this amazing product! Link in bio #ad";
          const platformHashtags = hashtags.slice(0, 5).join(" ");

          const fullPostCopy = `${platformCaption}\n\n${platformHashtags}`.trim();
          const isPosted = Boolean(postedPlatforms[p.id]);

          return (
            <Card
              key={p.id}
              className="overflow-hidden border-border transition-all hover:shadow-md"
            >
              <div className="border-b border-border bg-muted/30 px-6 py-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                    {isPosted ? (
                      <Badge className="bg-emerald-600 text-white gap-1 text-[11px]">
                        <Check className="h-3 w-3" /> Published
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px]">
                        Ready for Execution
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                </div>
                <Button asChild size="sm" variant="ghost" className="text-xs">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1"
                  >
                    Open {p.name} <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Step 1: Hook & Script */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Step 1: Hook &amp; Script
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() =>
                        copyText(platformScript?.script || platformHook, "Script", `${p.id}-script`)
                      }
                    >
                      {copiedId === `${p.id}-script` ? (
                        <Check className="mr-1 h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="mr-1 h-3 w-3" />
                      )}
                      Copy Script
                    </Button>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                    <p className="text-xs font-mono text-muted-foreground uppercase">Hook</p>
                    <p className="text-sm font-medium italic">"{platformHook}"</p>
                    {platformScript ? (
                      <div className="pt-2 border-t border-border/60">
                        <p className="text-xs font-mono text-muted-foreground uppercase mb-1">
                          {platformScript.title}
                        </p>
                        <p className="text-sm whitespace-pre-wrap text-foreground/90">
                          {platformScript.script}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Step 2: Caption & Hashtags */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Step 2: Caption &amp; Hashtags
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => copyText(fullPostCopy, "Caption", `${p.id}-caption`)}
                    >
                      {copiedId === `${p.id}-caption` ? (
                        <Check className="mr-1 h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="mr-1 h-3 w-3" />
                      )}
                      Copy Caption
                    </Button>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                    <p className="text-sm whitespace-pre-wrap">{fullPostCopy}</p>
                  </div>
                </div>

                {/* Step 3: Media Asset & Publish Action */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Step 3: Render &amp; Publish
                    </span>
                    <Badge variant="secondary" className="text-[11px]">
                      Continuous Hand-off
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 p-4 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Film className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Ready to post on {p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Copy caption above, launch {p.name}, or hand-off directly to mobile/web.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1.5"
                        onClick={() => {
                          copyText(fullPostCopy, "Caption", `${p.id}-publish`);
                          window.open(p.url, "_blank");
                        }}
                      >
                        <Share2 className="h-4 w-4" /> Post to {p.name}
                      </Button>

                      <Button
                        size="sm"
                        variant={isPosted ? "secondary" : "outline"}
                        onClick={() => {
                          setPostedPlatforms((prev) => ({ ...prev, [p.id]: !prev[p.id] }));
                          if (!isPosted) toast.success(`Marked as published on ${p.name}!`);
                        }}
                      >
                        {isPosted ? (
                          <Check className="mr-1 h-4 w-4 text-emerald-600" />
                        ) : (
                          <Send className="mr-1 h-4 w-4" />
                        )}
                        {isPosted ? "Published" : "Mark as Posted"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
