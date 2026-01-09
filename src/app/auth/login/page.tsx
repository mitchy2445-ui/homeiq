"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HOMEIQ_GREEN = "#1A6E4E";
const SESSION_COOKIE_NAME = "homeiq_session";

export default function LoginPage() {
  const sp = useSearchParams();
  const next = sp.get("next");
  const verified = sp.get("verified") === "1";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include", // ✅ ensure Set-Cookie is accepted
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, next: next || "/" }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? body?.message ?? "Login failed.");
        return;
        }

      // ✅ Wait briefly for the cookie to actually be stored
      await waitForSessionCookie(SESSION_COOKIE_NAME, 2000);

      // Optional: warm /api/auth/me once (no-store)
      try {
        await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      } catch {}

      // ✅ Let other tabs know
      try {
        localStorage.setItem("homeiq_auth_changed", Date.now().toString());
      } catch {}

      // ✅ Bulletproof: hard reload so Header re-runs immediately
      window.location.href = body?.next || next || "/";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Sign in</h1>

      {verified && (
        <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Email verified! You can sign in now.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="rounded-2xl shadow-sm border">
        <CardContent className="p-6">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="mt-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <div className="mt-2 flex gap-2">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPwd((s) => !s)}
                >
                  {showPwd ? "Hide" : "Show"}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full"
              style={{ background: HOMEIQ_GREEN }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>

            <div className="mt-2 text-center text-sm">
              <a href="/auth/forgot" className="text-gray-600 hover:underline">
                Forgot your password?
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-gray-600">
        Don’t have an account?{" "}
        <a href="/auth/register" className="font-medium text-gray-800 hover:underline">
          Create one
        </a>
      </div>
    </main>
  );
}

/** Polls briefly for a cookie to appear before navigating. */
async function waitForSessionCookie(name: string, timeoutMs = 2000) {
  if (typeof document === "undefined") return true;
  const key = `${name}=`;
  if (document.cookie.includes(key)) return true;

  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    if (document.cookie.includes(key)) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
}
