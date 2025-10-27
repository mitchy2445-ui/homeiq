// src/components/listings/BasicsForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Keep the first step very stable/minimal
type FormState = {
  title: string;
  city: string;
  beds: string;   // store as string locally; validate -> int
  baths: string;  // store as string locally; validate -> int
  propertyType: string;
  description: string;
};

export default function BasicsForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    title: "",
    city: "",
    beds: "",
    baths: "",
    propertyType: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  function onChange<K extends keyof FormState>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // tiny client-side guard to avoid avoidable round-trips
    const title = form.title.trim();
    const city = form.city.trim();
    const beds = Number(form.beds);
    const baths = Number(form.baths);
    const description = form.description.trim();
    if (!title || title.length < 10) {
      setError("Title must be at least 10 characters.");
      return;
    }
    if (!city) {
      setError("City is required.");
      return;
    }
    if (!Number.isFinite(beds) || beds < 0) {
      setError("Beds must be 0 or more.");
      return;
    }
    if (!Number.isFinite(baths) || baths < 1) {
      setError("Baths must be 1 or more.");
      return;
    }
    if (description.length < 80 || description.length > 600) {
      setError("Description must be between 80 and 600 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/host/listings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          city,
          beds,
          baths,
          propertyType: form.propertyType || null,
          description,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? "Could not create listing.");
        setSubmitting(false);
        return;
      }

      const id = body?.id as string | undefined;
      if (!id) {
        setError("Unexpected response. No ID returned.");
        setSubmitting(false);
        return;
      }

      // go to next step (Details)
      router.replace(`/landlord/new/details?id=${encodeURIComponent(id)}`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="text-sm font-medium" htmlFor="title">Title</label>
        <Input
          id="title"
          className="mt-2"
          placeholder="Bright 2-bed, 1-bath near River Heights"
          value={form.title}
          onChange={onChange("title")}
          required
          maxLength={80}
        />
        <p className="mt-1 text-xs text-gray-500">10–80 characters.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium" htmlFor="city">City</label>
          <Input
            id="city"
            className="mt-2"
            placeholder="Winnipeg"
            value={form.city}
            onChange={onChange("city")}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="propertyType">Property type</label>
          <select
            id="propertyType"
            className="mt-2 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.propertyType}
            onChange={onChange("propertyType")}
          >
            <option value="">Select…</option>
            <option>Apartment</option>
            <option>Condo</option>
            <option>House</option>
            <option>Studio</option>
            <option>Basement Suite</option>
            <option>Townhouse</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium" htmlFor="beds">Beds</label>
          <Input
            id="beds"
            type="number"
            min={0}
            step={1}
            className="mt-2"
            value={form.beds}
            onChange={onChange("beds")}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="baths">Baths</label>
          <Input
            id="baths"
            type="number"
            min={1}
            step={1}
            className="mt-2"
            value={form.baths}
            onChange={onChange("baths")}
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="description">Short description</label>
        <textarea
          id="description"
          className="mt-2 w-full min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Tell renters what makes this place great—layout, light, nearby amenities, transit…"
          value={form.description}
          onChange={onChange("description")}
          required
          minLength={80}
          maxLength={600}
        />
        <p className="mt-1 text-xs text-gray-500">80–600 characters.</p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting} className="rounded-full px-5">
          {submitting ? "Saving…" : "Save & continue"}
        </Button>
        <span className="text-sm text-gray-500">Your progress is saved as a draft.</span>
      </div>
    </form>
  );
}
