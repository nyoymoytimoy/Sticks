"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

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
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border bg-surface-secondary p-8"
    >
      <span className="w-fit rounded-pill border border-border bg-surface-base px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal">
        Sticks
      </span>
      <h1 className="text-2xl font-semibold text-ink-900">Sign in</h1>

      <label className="flex flex-col gap-1 text-sm text-ink-700">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 rounded-md border border-border bg-surface-base px-3 outline-none focus:border-teal"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-ink-700">
        Password
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10 rounded-md border border-border bg-surface-base px-3 outline-none focus:border-teal"
        />
      </label>

      {error && <p className="text-sm text-status-error">{error}</p>}

      <Button type="submit" loading={loading} className="mt-2">
        Sign in
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-surface-base px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
