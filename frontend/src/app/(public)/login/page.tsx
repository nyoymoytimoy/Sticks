"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Ticket, ShieldCheck, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Ticket, label: "5 request types, one place to track them" },
  { icon: ShieldCheck, label: "Role-gated approvals, down to the individual" },
  { icon: Workflow, label: "Every change logged to a full audit trail" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(searchParams.get("callbackUrl") ?? "/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-ink-900">Welcome back</h1>
        <p className="text-sm text-ink-500">Sign in to your Sticks account.</p>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
        Email
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@standard-insurance.com"
            className="h-11 w-full rounded-lg border border-border bg-surface-base pl-10 pr-3 text-sm outline-none focus:border-teal"
          />
        </div>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
        Password
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11 w-full rounded-lg border border-border bg-surface-base pl-10 pr-3 text-sm outline-none focus:border-teal"
          />
        </div>
      </label>

      {error && (
        <p className="rounded-md bg-status-error/10 px-3 py-2 text-sm text-status-error">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} size="lg" className="mt-1 w-full">
        Sign in
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Branding panel -- hidden below md, this is the "imitate the reference's
          dark panel + decorative dot grid" half; colors stay ours (ink-900 +
          gold/teal), not the reference's own navy/green. */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink-900 p-12 text-white md:flex">
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(232,170,51,0.8) 1.5px, transparent 1.5px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, var(--color-teal), transparent 70%)" }}
        />

        <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold text-ink-900">
            🎫
          </span>
          Sticks
        </span>

        <div className="flex flex-col gap-6">
          <h2 className="max-w-sm text-3xl font-semibold leading-tight">
            Internal <span className="text-gold">ticketing</span>, built for how Standard
            Insurance actually works.
          </h2>
          <ul className="flex flex-col gap-4">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-sm text-white/80">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-gold">
                  <f.icon className="h-4 w-4" />
                </span>
                {f.label}
              </li>
            ))}
          </ul>
        </div>

        <span className="text-xs text-white/40">© 2026 Standard Insurance</span>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 items-center justify-center bg-surface-base px-6 md:w-1/2">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
