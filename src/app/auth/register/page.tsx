"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HOMEIQ_GREEN = "#1A6E4E";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [sentTo, setSentTo] = React.useState<string>("");

  // Fallback verification URL the API may return in dev
  const [verifyHref, setVerifyHref] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body?.message ?? body?.error ?? "Registration failed.");
        return;
      }

      // If the API returned a fallback verification link (dev),
      // store it so we can show a "Verify now" button.
      if (typeof body?.verifyLink === "string" && body.verifyLink.length > 0) {
        setVerifyHref(body.verifyLink);
      }

      // Success — show "check your email" state
      setSentTo(email);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Check your email</h1>
        <Card className="rounded-2xl shadow-sm border">
          <CardContent className="p-6 space-y-4 text-sm text-gray-700">
            <p>
              We sent a verification link to <span className="font-medium">{sentTo}</span>. Click the
              link to verify your email, then sign in.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Button
                onClick={() => router.replace("/auth/login")}
                className="rounded-full"
                style={{ background: HOMEIQ_GREEN }}
              >
                Go to sign in
              </Button>

              {verifyHref && (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => (window.location.href = verifyHref)}
                  title={verifyHref}
                >
                  Verify now
                </Button>
              )}
            </div>

            {verifyHref && (
              <p className="text-xs text-gray-500">
                Dev note: email sending may be disabled — using a direct verification link.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already verified?{" "}
          <a href="/auth/login" className="font-medium text-gray-800 hover:underline">
            Sign in
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Create your account</h1>

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="rounded-2xl shadow-sm border">
        <CardContent className="p-6">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
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
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                className="mt-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="confirm">
                Confirm password
              </label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                className="mt-2"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full"
              style={{ background: HOMEIQ_GREEN }}
            >
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <a href="/auth/login" className="font-medium text-gray-800 hover:underline">
          Sign in
        </a>
      </div>
    </main>
  );
}
