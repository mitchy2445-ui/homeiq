// src/app/landlord/new/description/page.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

type DescriptionForm = {
  title: string;
  description: string;
  houseRules: string;
};

type DraftResponse = { id: string };
type SaveResponse = { ok: boolean; id: string; message?: string };

export default function DescriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // For consistency with the rest of the wizard, use ?id=
  const listingId = searchParams.get("id") ?? "";

  const [form, setForm] = React.useState<DescriptionForm>({
    title: "",
    description: "",
    houseRules: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Safety net: create a draft if URL lacks id
  React.useEffect(() => {
    (async () => {
      if (listingId) return;
      try {
        const res = await fetch("/api/listings/draft", { method: "POST" });
        if (!res.ok) return;
        const data: DraftResponse = await res.json();
        router.replace(
          `/landlord/new/description?id=${encodeURIComponent(data.id)}`
        );
      } catch {
        /* ignore */
      }
    })();
  }, [listingId, router]);

  // Preload existing data
  React.useEffect(() => {
    let active = true;
    (async () => {
      if (!listingId) return;
      try {
        const res = await fetch(
          `/api/listings/${encodeURIComponent(listingId)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as Partial<DescriptionForm>;
        if (!active) return;
        setForm((s) => ({
          title: data.title ?? s.title,
          description: data.description ?? s.description,
          houseRules: data.houseRules ?? s.houseRules,
        }));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      active = false;
    };
  }, [listingId]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!listingId) {
      setError("Missing listing id. Please try again.");
      return;
    }
    if (!form.title.trim() || !form.description.trim()) {
      setError("Please provide a title and a description.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `/api/listings/${encodeURIComponent(listingId)}/description`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form satisfies DescriptionForm),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to save description.");
      }
      const data: SaveResponse = await res.json();
      if (!data.ok) throw new Error(data.message || "Failed to save.");

      // 👉 We’re no longer using the wizard step system here.
      // Send the user to the next real step in your current flow.
      // Adjust this path if your next page is different.
      router.push(`/landlord/new/photos?id=${encodeURIComponent(data.id)}`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    // Back to basics page (no wizard type needed)
    router.push("/landlord/new/basics");
  };

  const descMax = 1000;
  const descMin = 80;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Describe your place</h1>
        <p className="text-sm text-gray-500">
          A clear title, detailed description, and house rules help renters
          know what to expect.
        </p>
      </div>

      {!listingId && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No <code>id</code> found in the URL. Your changes won&apos;t be
          saved.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm((s) => ({ ...s, title: e.target.value }))
            }
            placeholder="Cozy 2-bedroom near downtown"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-emerald-500"
            maxLength={100}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            {form.title.length}/100
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setForm((s) => ({ ...s, description: e.target.value }))
            }
            placeholder="Share the layout, light, nearby transit, and what makes your place special…"
            className="min-h-[160px] w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-emerald-500"
            maxLength={descMax}
            minLength={descMin}
            required
          />
          <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
            <span>{form.description.length}/{descMax}</span>
            <span>
              {form.description.length < descMin
                ? `Add ${descMin - form.description.length} more characters`
                : "Looks good"}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="rules" className="mb-2 block text-sm font-medium">
            House rules (optional)
          </label>
          <textarea
            id="rules"
            name="houseRules"
            value={form.houseRules}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setForm((s) => ({ ...s, houseRules: e.target.value }))
            }
            placeholder="e.g., No parties, quiet hours after 10pm, no smoking indoors…"
            className="min-h-[120px] w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-emerald-500"
            maxLength={600}
          />
          <p className="mt-1 text-xs text-gray-500">
            {form.houseRules.length}/600
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading || !listingId}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save & Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
