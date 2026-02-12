"use client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Building2, Warehouse, DoorOpen } from "lucide-react";

type BasicsState = {
  propertyType?: string;
  city?: string;
  beds?: number;
  baths?: number;
};

const PROPERTY_TYPES = [
  { label: "Apartment", icon: Building2 },
  { label: "Condo", icon: Building2 },
  { label: "House", icon: Home },
  { label: "Basement suite", icon: Warehouse },
  { label: "Townhouse", icon: Home },
  { label: "Room in shared home", icon: DoorOpen },
];

export default function BasicsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const existingId = params.get("id");

  const [listingId, setListingId] = useState<string | null>(existingId);
  const [state, setState] = useState<BasicsState>({});
  const [saving, setSaving] = useState(false);

  let creating = false;

  const ensureListing = async () => {
    if (listingId) return listingId;
    if (creating) return listingId;
    creating = true;

    const res = await fetch("/api/host/listings", {
      method: "POST",
      credentials: "include",
    });

    const { id } = await res.json();
    setListingId(id);
    creating = false;
    return id;
  };

  const updateField = async <K extends keyof BasicsState>(
    key: K,
    value: BasicsState[K]
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
    setSaving(true);

    const id = await ensureListing();

    await fetch(`/api/host/listings/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });

    setSaving(false);
  };

  const canContinue =
    state.propertyType &&
    state.city?.trim() &&
    state.beds !== undefined &&
    state.baths !== undefined;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-20">
        {/* Header */}
        <header className="space-y-4">
          <div className="text-xs font-medium text-neutral-500">
            STEP 1 OF 5 · ABOUT 1 MINUTE
          </div>

          <h1 className="text-4xl font-semibold text-neutral-900">
            Create your listing
          </h1>

          <p className="text-lg text-neutral-600">
            Start with the basics. You can change everything later.
          </p>
        </header>

        {/* Property Type */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">
            What type of place is this?
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PROPERTY_TYPES.map(({ label, icon: Icon }) => {
              const selected = state.propertyType === label;

              return (
                <button
                  key={label}
                  onClick={() => updateField("propertyType", label)}
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl border transition
                    ${
                      selected
                        ? "border-black bg-neutral-50"
                        : "border-neutral-200 hover:bg-neutral-50"
                    }
                  `}
                >
                  <Icon className="h-7 w-7 text-neutral-700" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              );
            })}
          </div>

          <p className="text-sm text-neutral-500">
            Choose the option that best describes what renters will experience.
          </p>
        </section>

        {/* City */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Which city is this in?
          </h2>

          <Input
            className="h-14 text-base rounded-lg"
            placeholder="e.g. Winnipeg, Vancouver"
            value={state.city ?? ""}
            onChange={(e) => updateField("city", e.target.value)}
          />

          <p className="text-sm text-neutral-500">
            We’ll ask for the full address later. This won’t be shown publicly.
          </p>
        </section>

        {/* Beds & Baths */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">
            How many bedrooms and bathrooms?
          </h2>

          <div className="grid grid-cols-2 gap-6 max-w-sm">
            <div>
              <label className="block text-sm mb-2">Bedrooms</label>
              <Input
                type="number"
                min={0}
                className="h-14"
                value={state.beds ?? ""}
                onChange={(e) =>
                  updateField("beds", Number(e.target.value) || 0)
                }
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Bathrooms</label>
              <Input
                type="number"
                step={0.5}
                min={0}
                className="h-14"
                value={state.baths ?? ""}
                onChange={(e) =>
                  updateField("baths", Number(e.target.value) || 0)
                }
              />
            </div>
          </div>

          <p className="text-sm text-neutral-500">
            Accurate counts help renters filter and trust your listing.
          </p>
        </section>

        {/* Footer */}
        <div className="flex items-center justify-between pt-10 border-t">
          <span className="text-sm text-neutral-500">
            {saving ? "Saving…" : ""}
          </span>

          <Button
            disabled={!canContinue}
            onClick={() =>
              router.push(`/host/details?id=${listingId}`)
            }
            className="px-8 py-4 rounded-full text-base"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
