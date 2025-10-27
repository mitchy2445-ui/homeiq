// src/components/listings/DetailsForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** JSON value type for safe parsing/serialization (no `any`) */
type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

type EnumLaundry = "IN_UNIT" | "SHARED" | "NONE";
type EnumParking = "STREET" | "ON_SITE" | "NONE";
type EnumPet = "NONE" | "CATS" | "DOGS" | "CATS_AND_DOGS" | "RESTRICTED";
type EnumVibe = "QUIET" | "MODERATE" | "BUSY";
type EnumArea = "URBAN" | "SUBURBAN" | "RURAL";

const LAUNDRY_OPTIONS: ReadonlyArray<"" | EnumLaundry> = ["", "IN_UNIT", "SHARED", "NONE"];
const PARKING_OPTIONS: ReadonlyArray<"" | EnumParking> = ["", "STREET", "ON_SITE", "NONE"];
const PET_OPTIONS: ReadonlyArray<"" | EnumPet> = ["", "NONE", "CATS", "DOGS", "CATS_AND_DOGS", "RESTRICTED"];
const VIBE_OPTIONS: ReadonlyArray<"" | EnumVibe> = ["", "QUIET", "MODERATE", "BUSY"];
const AREA_OPTIONS: ReadonlyArray<"" | EnumArea> = ["", "URBAN", "SUBURBAN", "RURAL"];

type Initial = {
  furnished: boolean;
  laundry: EnumLaundry | null;
  parkingType: EnumParking | null;
  petPolicy: EnumPet | null;
  smokingAllowed: boolean;
  heating: string;
  cooling: string;
  maxOccupants: number | "";
  minLeaseMonths: number | "";
  accessibility: Json | null; // ✅ typed JSON (no any)
  neighborhoodVibe: EnumVibe | null;
  areaType: EnumArea | null;
  distanceBusMeters: number | "";
  distanceGroceryMeters: number | "";
  distanceSchoolMeters: number | "";
  distanceParkMeters: number | "";
  distancePharmacyMeters: number | "";
  distanceGymMeters: number | "";
};

export default function DetailsForm({
  listingId,
  initial,
}: {
  listingId: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // Keep the textarea value as a string; parse to Json on submit.
  const [form, setForm] = useState({
    furnished: Boolean(initial.furnished),
    laundry: (initial.laundry ?? "") as "" | EnumLaundry,
    parkingType: (initial.parkingType ?? "") as "" | EnumParking,
    petPolicy: (initial.petPolicy ?? "") as "" | EnumPet,
    smokingAllowed: Boolean(initial.smokingAllowed),
    heating: initial.heating || "",
    cooling: initial.cooling || "",
    maxOccupants: initial.maxOccupants === "" ? "" : String(initial.maxOccupants ?? ""),
    minLeaseMonths: initial.minLeaseMonths === "" ? "" : String(initial.minLeaseMonths ?? ""),
    accessibilityStr: JSON.stringify(initial.accessibility ?? null, null, 0), // <- string
    neighborhoodVibe: (initial.neighborhoodVibe ?? "") as "" | EnumVibe,
    areaType: (initial.areaType ?? "") as "" | EnumArea,
    distanceBusMeters: initial.distanceBusMeters === "" ? "" : String(initial.distanceBusMeters ?? ""),
    distanceGroceryMeters: initial.distanceGroceryMeters === "" ? "" : String(initial.distanceGroceryMeters ?? ""),
    distanceSchoolMeters: initial.distanceSchoolMeters === "" ? "" : String(initial.distanceSchoolMeters ?? ""),
    distanceParkMeters: initial.distanceParkMeters === "" ? "" : String(initial.distanceParkMeters ?? ""),
    distancePharmacyMeters: initial.distancePharmacyMeters === "" ? "" : String(initial.distancePharmacyMeters ?? ""),
    distanceGymMeters: initial.distanceGymMeters === "" ? "" : String(initial.distanceGymMeters ?? ""),
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toIntOrNull(v: string) {
    if (v === "" || v == null) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
  }

  function clampMetersStr(v: string): number | null {
    const n = toIntOrNull(v);
    if (n == null) return null;
    if (n < 0) return 0;
    if (n > 100_000) return 100_000; // 100km cap
    return n;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);

    const maxOccupants = toIntOrNull(form.maxOccupants);
    const minLeaseMonths = toIntOrNull(form.minLeaseMonths);

    // Parse textarea JSON safely
    let accessibility: Json;
    try {
      const parsed = JSON.parse(form.accessibilityStr || "null");
      // quick runtime check to ensure parsed is Json-ish (basic)
      if (parsed === undefined) throw new Error("Invalid JSON");
      accessibility = parsed as Json;
    } catch {
      setError("Accessibility must be valid JSON (or leave it empty).");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch(`/api/host/listings/${encodeURIComponent(listingId)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          furnished: Boolean(form.furnished),
          laundry: form.laundry || null,
          parkingType: form.parkingType || null,
          petPolicy: form.petPolicy || null,
          smokingAllowed: Boolean(form.smokingAllowed),
          heating: form.heating.trim() || null,
          cooling: form.cooling.trim() || null,
          maxOccupants,
          minLeaseMonths,
          accessibility, // ✅ typed Json sent to server
          neighborhoodVibe: form.neighborhoodVibe || null,
          areaType: form.areaType || null,
          distanceBusMeters: clampMetersStr(form.distanceBusMeters),
          distanceGroceryMeters: clampMetersStr(form.distanceGroceryMeters),
          distanceSchoolMeters: clampMetersStr(form.distanceSchoolMeters),
          distanceParkMeters: clampMetersStr(form.distanceParkMeters),
          distancePharmacyMeters: clampMetersStr(form.distancePharmacyMeters),
          distanceGymMeters: clampMetersStr(form.distanceGymMeters),
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? "Failed to save details.");
        setBusy(false);
        return;
      }

      // Go to next step: Photos
      router.replace(`/landlord/new/photos?id=${encodeURIComponent(listingId)}`);
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit} noValidate>
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={form.furnished}
            onChange={(e) => set("furnished", e.target.checked)}
          />
          Furnished
        </label>

        <div>
          <div className="text-sm font-medium">Laundry</div>
          <select
            className="mt-2 block w-full rounded-md border px-3 py-2 text-sm"
            value={form.laundry}
            onChange={(e) => set("laundry", e.target.value as "" | EnumLaundry)}
          >
            {LAUNDRY_OPTIONS.map((v) => (
              <option key={v || "blank"} value={v}>
                {v === "" ? "Select…" : v.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-sm font-medium">Parking</div>
          <select
            className="mt-2 block w-full rounded-md border px-3 py-2 text-sm"
            value={form.parkingType}
            onChange={(e) => set("parkingType", e.target.value as "" | EnumParking)}
          >
            {PARKING_OPTIONS.map((v) => (
              <option key={v || "blank"} value={v}>
                {v === "" ? "Select…" : v.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <div className="text-sm font-medium">Pet policy</div>
          <select
            className="mt-2 block w-full rounded-md border px-3 py-2 text-sm"
            value={form.petPolicy}
            onChange={(e) => set("petPolicy", e.target.value as "" | EnumPet)}
          >
            {PET_OPTIONS.map((v) => (
              <option key={v || "blank"} value={v}>
                {v === "" ? "Select…" : v.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={form.smokingAllowed}
            onChange={(e) => set("smokingAllowed", e.target.checked)}
          />
          Smoking allowed
        </label>

        <div />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium" htmlFor="heating">Heating</label>
          <Input
            id="heating"
            className="mt-2"
            value={form.heating}
            onChange={(e) => set("heating", e.target.value)}
            placeholder="Baseboard, forced air, radiant…"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="cooling">Cooling</label>
          <Input
            id="cooling"
            className="mt-2"
            value={form.cooling}
            onChange={(e) => set("cooling", e.target.value)}
            placeholder="Central AC, window unit…"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium" htmlFor="maxOcc">Max occupants</label>
          <Input
            id="maxOcc"
            type="number"
            min={1}
            step={1}
            className="mt-2"
            value={form.maxOccupants}
            onChange={(e) => set("maxOccupants", e.target.value)}
            placeholder="e.g., 3"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="minLease">Minimum lease (months)</label>
          <Input
            id="minLease"
            type="number"
            min={1}
            step={1}
            className="mt-2"
            value={form.minLeaseMonths}
            onChange={(e) => set("minLeaseMonths", e.target.value)}
            placeholder="e.g., 12"
          />
        </div>
      </div>

      <div>
        <div className="text-sm font-medium">Accessibility (JSON)</div>
        <textarea
          className="mt-2 w-full min-h-24 rounded-md border px-3 py-2 text-sm"
          value={form.accessibilityStr}
          onChange={(e) => set("accessibilityStr", e.target.value)}
          placeholder='e.g., {"stepFreeAccess": true, "elevator": true}'
        />
        <p className="mt-1 text-xs text-gray-500">Leave empty if not applicable.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-medium">Neighborhood vibe</div>
          <select
            className="mt-2 block w-full rounded-md border px-3 py-2 text-sm"
            value={form.neighborhoodVibe}
            onChange={(e) => set("neighborhoodVibe", e.target.value as "" | EnumVibe)}
          >
            {VIBE_OPTIONS.map((v) => (
              <option key={v || "blank"} value={v}>
                {v === "" ? "Select…" : v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-sm font-medium">Area type</div>
          <select
            className="mt-2 block w-full rounded-md border px-3 py-2 text-sm"
            value={form.areaType}
            onChange={(e) => set("areaType", e.target.value as "" | EnumArea)}
          >
            {AREA_OPTIONS.map((v) => (
              <option key={v || "blank"} value={v}>
                {v === "" ? "Select…" : v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Proximity (meters)</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            placeholder="Bus"
            inputMode="numeric"
            value={form.distanceBusMeters}
            onChange={(e) => set("distanceBusMeters", e.target.value)}
          />
          <Input
            placeholder="Grocery"
            inputMode="numeric"
            value={form.distanceGroceryMeters}
            onChange={(e) => set("distanceGroceryMeters", e.target.value)}
          />
          <Input
            placeholder="School"
            inputMode="numeric"
            value={form.distanceSchoolMeters}
            onChange={(e) => set("distanceSchoolMeters", e.target.value)}
          />
          <Input
            placeholder="Park"
            inputMode="numeric"
            value={form.distanceParkMeters}
            onChange={(e) => set("distanceParkMeters", e.target.value)}
          />
          <Input
            placeholder="Pharmacy"
            inputMode="numeric"
            value={form.distancePharmacyMeters}
            onChange={(e) => set("distancePharmacyMeters", e.target.value)}
          />
          <Input
            placeholder="Gym"
            inputMode="numeric"
            value={form.distanceGymMeters}
            onChange={(e) => set("distanceGymMeters", e.target.value)}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">Leave blank for any you don’t know.</p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy} className="rounded-full px-5">
          {busy ? "Saving…" : "Save & continue"}
        </Button>
        <a
          href={`/landlord/new/basics?id=${encodeURIComponent(listingId)}`}
          className="text-sm underline"
        >
          Back to Basics
        </a>
      </div>
    </form>
  );
}
