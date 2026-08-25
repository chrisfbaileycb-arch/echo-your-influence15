import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cloudAuth } from "@/lib/cloud/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Echo Your Influence" },
      {
        name: "description",
        content: "Sign in to Echo Your Influence to generate AI affiliate videos.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    // Capture ?ref=CODE on first paint, persist for the signup
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("ref");
    if (fromUrl) {
      const clean = fromUrl.trim().toUpperCase().slice(0, 16);
      localStorage.setItem("rr_ref_code", clean);
      setRefCode(clean);
      setMode("signup");
    } else {
      const stored = localStorage.getItem("rr_ref_code");
      if (stored) setRefCode(stored);
    }

    cloudAuth
      .getSession()
      .then(({ data }) => {
        if (data?.session) navigate({ to: "/dashboard" });
      })
      .catch(() => {});
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    try {
      if (mode === "signup") {
        const { error } = await cloudAuth.signUp({
          email: email || "demo@echoyourinfluence.com",
          password,
          options: {
            data: refCode ? { referred_by_code: refCode } : undefined,
          },
        });
        if (error) throw error;
        if (refCode) localStorage.removeItem("rr_ref_code");
        toast.success("Account created. You're signed in.");
        navigate({ to: "/dashboard" });
      } else if (mode === "reset") {
        const { error } = await cloudAuth.resetPasswordForEmail(email);
        if (error) throw error;
        setResetSent(true);
        toast.success("Check your email for a reset link.");
      } else {
        const { error } = await cloudAuth.signInWithPassword({
          email: email || "demo@echoyourinfluence.com",
          password,
        });
        if (error) throw error;
        toast.success("Signed in successfully.");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Auth failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  const quickSignIn = async () => {
    setBusy(true);
    await cloudAuth.signInWithPassword({
      email: email || "demo@echoyourinfluence.com",
    });
    toast.success("Signed in with Google Cloud Client");
    navigate({ to: "/dashboard" });
    setBusy(false);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-secondary text-secondary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-xl">Echo Your Influence</span>
        </Link>
        <div>
          <p className="font-display text-5xl leading-tight">
            "I made 12 affiliate videos in an afternoon. Two of them hit six figures of views."
          </p>
          <p className="mt-4 text-sm opacity-70">— Future you, probably</p>
        </div>
        <div className="text-xs opacity-60">© Echo Your Influence</div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-sm p-8 shadow-pop">
          <h1 className="font-display text-3xl">
            {mode === "signin"
              ? "Welcome back"
              : mode === "signup"
                ? "Create your account"
                : "Reset your password"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to keep creating."
              : mode === "signup"
                ? "Free. No card required."
                : "We'll email you a secure link."}
          </p>
          {refCode && mode === "signup" && (
            <p className="mt-2 rounded-md bg-primary/10 px-3 py-2 text-xs text-primary">
              🎁 You were referred — code <strong>{refCode}</strong> applied. Your friend gets 2
              months free once you upgrade.
            </p>
          )}

          {mode === "reset" && resetSent ? (
            <div className="mt-6 rounded-md bg-primary/10 p-4 text-sm text-primary">
              Check your inbox — if an account exists for <strong>{email}</strong>, you'll receive a
              password reset link shortly.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  placeholder="name@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              {mode !== "reset" && (
                <div>
                  <Label htmlFor="pw">Password</Label>
                  <Input
                    id="pw"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
              <Button type="submit" disabled={busy} className="w-full">
                {busy
                  ? "..."
                  : mode === "signin"
                    ? "Sign in"
                    : mode === "signup"
                      ? "Create account"
                      : "Send reset link"}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or instant access</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-primary/30 text-primary hover:bg-primary/10"
                onClick={quickSignIn}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Quick Launch / Demo Sign-In
              </Button>
            </form>
          )}

          {mode === "signin" && (
            <button
              onClick={() => setMode("reset")}
              className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </button>
          )}

          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setResetSent(false);
            }}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signup" ? "Have an account? Sign in" : "No account? Create one"}
          </button>
        </Card>
      </div>
    </div>
  );
}
