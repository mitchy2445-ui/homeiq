// src/app/auth/login/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { FiMail, FiLock } from "react-icons/fi";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);
    if (res.ok) {
      window.location.href = "/";
    } else {
      const data = await res.json().catch(() => ({}));
      setErr(data?.error ?? "Invalid email or password");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block text-2xl font-semibold tracking-wide text-brand-700">
            HOMEIQ
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-gray-600">Log in to continue to HOMEIQ.</p>
        </div>

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Email</span>
              <div className="relative">
                <FiMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-300 bg-white px-9 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Password</span>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Your password"
                  className="w-full rounded-lg border border-gray-300 bg-white px-9 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </label>

            {err && <p className="text-sm text-red-600">{err}</p>}

            <button
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-brand-600 px-5 py-3 font-medium text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link href="/auth/register" className="font-medium text-brand-700 hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
