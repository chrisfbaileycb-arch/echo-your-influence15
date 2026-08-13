import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createWorkflow,
  deleteWorkflow,
  getWorkflow,
  listWorkflows,
  MAX_ACTIVE_CAMPAIGNS,
} from "@/lib/workflows.functions";
import type { WorkflowData } from "./steps";

const STORAGE_KEY = "eyi.active-workflow";

const MODULES = [
  { to: "/intake", label: "1. What you're selling" },
  { to: "/strategy", label: "2. Strategy" },
  { to: "/plan", label: "3. Budget & channels" },
  { to: "/content", label: "4. Content by platform" },
  { to: "/publishing", label: "5. Publish" },
] as const;

/** Remembers which campaign every module page is working on. */
export function useActiveWorkflowId() {
  const list = useServerFn(listWorkflows);
  const workflows = useQuery({ queryKey: ["workflows"], queryFn: () => list() });
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const rows = workflows.data ?? [];
    if (stored && rows.some((w) => w.id === stored)) setId(stored);
    else if (rows.length) setId(rows[0]!.id);
    else setId(null);
  }, [workflows.data]);

  const choose = (next: string | null) => {
    setId(next);
    if (typeof window !== "undefined") {
      if (next) window.localStorage.setItem(STORAGE_KEY, next);
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  return { id, choose, workflows };
}

interface ShellProps {
  title: string;
  description: string;
  children: (ctx: { id: string; data: WorkflowData; refresh: () => void }) => ReactNode;
}

/**
 * Shared chrome for the standalone modules: campaign picker, module tabs, and
 * the loaded workflow. Nothing is shown as done that the data does not support.
 */
export function ModuleShell({ title, description, children }: ShellProps) {
  const { id, choose, workflows } = useActiveWorkflowId();
  const qc = useQueryClient();
  const load = useServerFn(getWorkflow);
  const create = useServerFn(createWorkflow);
  const removeWf = useServerFn(deleteWorkflow);
  const [newName, setNewName] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const wf = useQuery({
    queryKey: ["workflow", id],
    queryFn: () => load({ data: { id: id! } }),
    enabled: !!id,
  });

  const activeCount = (workflows.data ?? []).length;
  const atLimit = activeCount >= MAX_ACTIVE_CAMPAIGNS;

  const make = useMutation({
    mutationFn: () => create({ data: { name: newName.trim() } }),
    onSuccess: async (r) => {
      setNewName("");
      await qc.invalidateQueries({ queryKey: ["workflows"] });
      choose(r.id);
      toast.success("Campaign created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (wfId: string) => removeWf({ data: { id: wfId } }),
    onSuccess: async (_, wfId) => {
      toast.success("Campaign removed");
      await qc.invalidateQueries({ queryKey: ["workflows"] });
      if (id === wfId) {
        const remaining = (workflows.data ?? []).filter((w) => w.id !== wfId);
        choose(remaining.length ? remaining[0]!.id : null);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {MODULES.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            data-testid={`module-${m.to.slice(1)}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              pathname === m.to
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-primary/50"
            }`}
          >
            {m.label}
          </Link>
        ))}
      </nav>

      <Card className="flex flex-wrap items-center gap-2 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Working on
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
            {activeCount}/{MAX_ACTIVE_CAMPAIGNS} active
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(workflows.data ?? []).map((w) => (
            <div key={w.id} className="group relative flex items-center">
              <Button
                size="sm"
                variant={w.id === id ? "default" : "outline"}
                data-testid={`pick-campaign-${w.id}`}
                className="pr-7"
                onClick={() => choose(w.id)}
              >
                {w.name}
              </Button>
              <button
                type="button"
                title={`Delete ${w.name}`}
                aria-label={`Delete ${w.name}`}
                disabled={del.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete campaign “${w.name}”? This cannot be undone.`)) {
                    del.mutate(w.id);
                  }
                }}
                className="absolute right-1.5 text-muted-foreground hover:text-destructive opacity-70 hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Input
            className="h-9 w-48"
            placeholder={atLimit ? "Limit reached (5 max)" : "New campaign name"}
            value={newName}
            disabled={atLimit}
            onChange={(e) => setNewName(e.target.value)}
            data-testid="new-campaign-name"
          />
          <Button
            size="sm"
            variant="outline"
            data-testid="create-campaign"
            disabled={newName.trim().length < 2 || make.isPending || atLimit}
            onClick={() => make.mutate()}
          >
            {make.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
          </Button>
        </div>
      </Card>

      {!id ? (
        <Card className="max-w-xl p-6 text-sm text-muted-foreground">
          Create a campaign above to start. Everything in these modules works on one campaign at a
          time.
        </Card>
      ) : wf.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading campaign…</p>
      ) : wf.error ? (
        <Card className="max-w-xl p-6 text-sm">
          <p className="font-medium">This campaign could not be opened.</p>
          <p className="mt-1 text-muted-foreground">{(wf.error as Error).message}</p>
        </Card>
      ) : (
        children({
          id,
          data: wf.data!,
          refresh: () => qc.invalidateQueries({ queryKey: ["workflow", id] }),
        })
      )}
    </div>
  );
}
