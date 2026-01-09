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

type EnumVibe = "QUIET" | "MODERATE" | "BUSY";
type EnumArea = "URBAN" | "SUBURBAN" | "RURAL";

// detail enums
type EnumNoise = "VERY_QUIET" | "MOSTLY_QUIET" | "AVERAGE" | "LIVELY";
type EnumLight = "LOW" | "MODERATE" | "BRIGHT" | "VERY_BRIGHT";

const VIBE_OPTIONS: ReadonlyArray<"" | EnumVibe> = ["", "QUIET", "MODERATE", "BUSY"];
const AREA_OPTIONS: ReadonlyArray<"" | EnumArea> = ["", "URBAN", "SUBURBAN", "RURAL"];
const NOISE_OPTIONS: ReadonlyArray<"" | EnumNoise> = [
  "",
  "VERY_QUIET",
  "MOSTLY_QUIET",
  "AVERAGE",
  "LIVELY",
];
const LIGHT_OPTIONS: ReadonlyArray<"" | EnumLight> = [
  "",
  "LOW",
  "MODERATE",
  "BRIGHT",
  "VERY_BRIGHT",
];

// Heating / cooling tick options
const HEATING_OPTIONS = [
  { id: "BASEBOARD", label: "Baseboard" },
  { id: "FORCED_AIR", label: "Forced air" },
  { id: "RADIANT", label: "Radiant / in-floor" },
  { id: "ELECTRIC", label: "Electric heaters" },
  { id: "GAS", label: "Gas furnace" },
  { id: "HEAT_PUMP", label: "Heat pump" },
  { id: "FIREPLACE", label: "Fireplace (gas / electric)" },
] as const;

const COOLING_OPTIONS = [
  { id: "CENTRAL_AC", label: "Central AC" },
  { id: "WINDOW_UNIT", label: "Window AC unit(s)" },
  { id: "PORTABLE_UNIT", label: "Portable AC unit(s)" },
  { id: "CEILING_FANS", label: "Ceiling / box fans" },
  { id: "NO_COOLING", label: "No dedicated cooling" },
] as const;

// IDs we store in interiorNotes (comma-separated)
const INTERIOR_FEATURES = [
  { id: "UPDATED_KITCHEN", label: "Updated / modern kitchen" },
  { id: "UPDATED_BATHROOM", label: "Updated bathroom" },
  { id: "STAINLESS_APPLIANCES", label: "Stainless appliances" },
  { id: "HARDWOOD_FLOORS", label: "Hardwood / laminate floors" },
  { id: "CARPET_BEDROOMS", label: "Carpet in bedrooms" },
  { id: "LARGE_WINDOWS", label: "Large windows / great light" },
  { id: "HIGH_CEILINGS", label: "High ceilings" },
  { id: "IN_UNIT_STORAGE", label: "In-unit storage / walk-in closet" },
  { id: "BALCONY_PATIO", label: "Balcony / patio" },
] as const;

// IDs we store in buildingAmenitiesNotes (comma-separated)
const AMENITY_FEATURES = [
  { id: "ELEVATOR", label: "Elevator" },
  { id: "GYM", label: "Gym / fitness room" },
  { id: "POOL", label: "Pool / hot tub" },
  { id: "ROOFTOP", label: "Rooftop / shared patio" },
  { id: "PARTY_ROOM", label: "Lounge / party room" },
  { id: "BIKE_STORAGE", label: "Bike storage" },
  { id: "STORAGE_LOCKERS", label: "Storage lockers" },
  { id: "VISITOR_PARKING", label: "Visitor parking" },
  { id: "UNDERGROUND_PARKING", label: "Underground parking" },
  { id: "SECURITY", label: "Security cameras / concierge" },
  { id: "ON_SITE_MANAGER", label: "On-site manager / caretaker" },
  { id: "SNOW_REMOVAL", label: "Snow removal included" },
  { id: "LAWN_CARE", label: "Lawn / yard care included" },
  { id: "WIFI_INCLUDED", label: "Wi-Fi included" },
] as const;

type Initial = {
  smokingAllowed: boolean;
  heating: string | null;
  cooling: string | null;

  noiseLevel?: EnumNoise | null;
  naturalLight?: EnumLight | null;

  // will store comma-separated IDs for selected options
  interiorNotes?: string | null;
  buildingAmenitiesNotes?: string | null;
  rulesNotes?: string | null;

  accessibility: Json | null;
  neighborhoodVibe: EnumVibe | null;
  areaType: EnumArea | null;
  distanceBusMeters: number | "";
  distanceGroceryMeters: number | "";
  distanceSchoolMeters: number | "";
  distanceParkMeters: number | "";
  distancePharmacyMeters: number | "";
  distanceGymMeters: number | "";
};

// helper: split existing heating/cooling string back into selected IDs + "other"
function splitInitialOptions(
  raw: string | null | undefined,
  options: readonly { id: string; label: string }[]
): { selected: string[]; other: string } {
  if (!raw) return { selected: [], other: "" };

  const labelToId = new Map(
    options.map((o) => [o.label.toLowerCase(), o.id])
  );

  const parts = raw
    .split(/[;,]/)
    .map((p) => p.trim())
    .filter(Boolean);

  const selected: string[] = [];
  const otherParts: string[] = [];

  for (const part of parts) {
    const id = labelToId.get(part.toLowerCase());
    if (id) {
      if (!selected.includes(id)) selected.push(id);
    } else {
      otherParts.push(part);
    }
  }

  return {
    selected,
    other: otherParts.join("; "),
  };
}

function buildOptionText(
  ids: string[],
  other: string,
  options: readonly { id: string; label: string }[]
): string | null {
  const labels = options
    .filter((o) => ids.includes(o.id))
    .map((o) => o.label);

  const trimmedOther = other.trim();
  if (trimmedOther) labels.push(trimmedOther);

  if (!labels.length) return null;
  return labels.join("; ");
}

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

  // Normalize accessibility from Json into a simple object
  const initialAccessibility =
    initial.accessibility &&
    typeof initial.accessibility === "object" &&
    !Array.isArray(initial.accessibility)
      ? (initial.accessibility as Record<string, Json>)
      : {};

  // Parse the saved comma-separated lists into arrays of IDs
  const parsedInterior = (initial.interiorNotes ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const parsedAmenities = (initial.buildingAmenitiesNotes ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Parse previous heating / cooling strings into options + other
  const heatingInit = splitInitialOptions(initial.heating, HEATING_OPTIONS);
  const coolingInit = splitInitialOptions(initial.cooling, COOLING_OPTIONS);

  const [form, setForm] = useState({
    // comfort & environment
    smokingAllowed: Boolean(initial.smokingAllowed),
    heatingOptions: heatingInit.selected as string[],
    heatingOther: heatingInit.other,
    coolingOptions: coolingInit.selected as string[],
    coolingOther: coolingInit.other,
    noiseLevel: (initial.noiseLevel ?? "") as "" | EnumNoise,
    naturalLight: (initial.naturalLight ?? "") as "" | EnumLight,

    // interior & amenities: list of selected IDs
    interiorFeatures: parsedInterior as string[],
    amenitiesFeatures: parsedAmenities as string[],
    interiorOther: "", // optional free-text
    amenitiesOther: "",

    // accessibility (booleans + notes -> serialize to Json)
    accessStepFree: Boolean(initialAccessibility.stepFree),
    accessElevator: Boolean(initialAccessibility.elevator),
    accessWideDoors: Boolean(initialAccessibility.wideDoors),
    accessBathroom: Boolean(initialAccessibility.accessibleBathroom),
    accessParking: Boolean(initialAccessibility.accessibleParking),
    accessNotes:
      typeof initialAccessibility.notes === "string"
        ? (initialAccessibility.notes as string)
        : "",

    // extra descriptive notes
    rulesNotes: initial.rulesNotes ?? "",

    // neighborhood & proximity
    neighborhoodVibe: (initial.neighborhoodVibe ?? "") as "" | EnumVibe,
    areaType: (initial.areaType ?? "") as "" | EnumArea,
    distanceBusMeters:
      initial.distanceBusMeters === "" || initial.distanceBusMeters == null
        ? ""
        : String(initial.distanceBusMeters),
    distanceGroceryMeters:
      initial.distanceGroceryMeters === "" ||
      initial.distanceGroceryMeters == null
        ? ""
        : String(initial.distanceGroceryMeters),
    distanceSchoolMeters:
      initial.distanceSchoolMeters === "" || initial.distanceSchoolMeters == null
        ? ""
        : String(initial.distanceSchoolMeters),
    distanceParkMeters:
      initial.distanceParkMeters === "" || initial.distanceParkMeters == null
        ? ""
        : String(initial.distanceParkMeters),
    distancePharmacyMeters:
      initial.distancePharmacyMeters === "" ||
      initial.distancePharmacyMeters == null
        ? ""
        : String(initial.distancePharmacyMeters),
    distanceGymMeters:
      initial.distanceGymMeters === "" || initial.distanceGymMeters == null
        ? ""
        : String(initial.distanceGymMeters),
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

  function toggleId(list: string[], id: string, checked: boolean): string[] {
    if (checked) {
      if (list.includes(id)) return list;
      return [...list, id];
    }
    return list.filter((v) => v !== id);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);

    // Build structured accessibility JSON from the form
    const accessibility: Json = {
      stepFree: form.accessStepFree,
      elevator: form.accessElevator,
      wideDoors: form.accessWideDoors,
      accessibleBathroom: form.accessBathroom,
      accessibleParking: form.accessParking,
      notes: form.accessNotes.trim() || null,
    };

    // Convert selected IDs into comma-separated strings for now
    const interiorNotes =
      [
        ...form.interiorFeatures,
        ...(form.interiorOther.trim()
          ? [`OTHER:${form.interiorOther.trim()}`]
          : []),
      ].join(",") || null;

    const buildingAmenitiesNotes =
      [
        ...form.amenitiesFeatures,
        ...(form.amenitiesOther.trim()
          ? [`OTHER:${form.amenitiesOther.trim()}`]
          : []),
      ].join(",") || null;

    // Build heating / cooling strings from selected options + "other"
    const heatingText = buildOptionText(
      form.heatingOptions,
      form.heatingOther,
      HEATING_OPTIONS
    );
    const coolingText = buildOptionText(
      form.coolingOptions,
      form.coolingOther,
      COOLING_OPTIONS
    );

    try {
      const res = await fetch(
        `/api/host/listings/${encodeURIComponent(listingId)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // comfort & environment
            smokingAllowed: Boolean(form.smokingAllowed),
            heating: heatingText,
            cooling: coolingText,
            noiseLevel: form.noiseLevel || null,
            naturalLight: form.naturalLight || null,

            // interior & amenities, saved as strings for now
            interiorNotes,
            buildingAmenitiesNotes,
            rulesNotes: form.rulesNotes.trim() || null,

            // accessibility JSON
            accessibility,

            // neighborhood & proximity
            neighborhoodVibe: form.neighborhoodVibe || null,
            areaType: form.areaType || null,
            distanceBusMeters: clampMetersStr(form.distanceBusMeters),
            distanceGroceryMeters: clampMetersStr(form.distanceGroceryMeters),
            distanceSchoolMeters: clampMetersStr(form.distanceSchoolMeters),
            distanceParkMeters: clampMetersStr(form.distanceParkMeters),
            distancePharmacyMeters: clampMetersStr(form.distancePharmacyMeters),
            distanceGymMeters: clampMetersStr(form.distanceGymMeters),
          }),
        }
      );

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? "Failed to save details.");
        setBusy(false);
        return;
      }

      // Go to next step: Photos
      router.replace(
        `/landlord/new/photos?id=${encodeURIComponent(listingId)}`
      );
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form className="space-y-8" onSubmit={onSubmit} noValidate>
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Comfort & environment */}
      <section className="space-y-4 rounded-xl border bg-white px-4 py-4 sm:px-5 sm:py-5">
        <div>
          <h2 className="text-sm font-semibold">Comfort & environment</h2>
          <p className="mt-1 text-xs text-gray-500">
            Tell renters how the home handles heat, cold, light, and everyday
            comfort.
          </p>
        </div>

        {/* Heating / cooling as tickable options */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-medium">Heating</div>
            <div className="grid grid-cols-1 gap-2">
              {HEATING_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs sm:text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form.heatingOptions.includes(opt.id)}
                    onChange={(e) =>
                      set(
                        "heatingOptions",
                        toggleId(
                          form.heatingOptions,
                          opt.id,
                          e.target.checked
                        )
                      )
                    }
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <Input
              className="mt-1"
              placeholder="Other heating details (optional)"
              value={form.heatingOther}
              onChange={(e) => set("heatingOther", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Cooling</div>
            <div className="grid grid-cols-1 gap-2">
              {COOLING_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs sm:text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form.coolingOptions.includes(opt.id)}
                    onChange={(e) =>
                      set(
                        "coolingOptions",
                        toggleId(
                          form.coolingOptions,
                          opt.id,
                          e.target.checked
                        )
                      )
                    }
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <Input
              className="mt-1"
              placeholder="Other cooling details (optional)"
              value={form.coolingOther}
              onChange={(e) => set("coolingOther", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <div className="text-sm font-medium">Noise level</div>
            <select
              className="mt-2 block w-full rounded-md border px-3 py-2 text-sm"
              value={form.noiseLevel}
              onChange={(e) =>
                set("noiseLevel", e.target.value as "" | EnumNoise)
              }
            >
              {NOISE_OPTIONS.map((v) => (
                <option key={v || "blank"} value={v}>
                  {v === ""
                    ? "Select…"
                    : v === "VERY_QUIET"
                    ? "Very quiet"
                    : v === "MOSTLY_QUIET"
                    ? "Mostly quiet"
                    : v === "AVERAGE"
                    ? "Average"
                    : "Lively / busy"}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Based on typical daytime conditions.
            </p>
          </div>

          <div>
            <div className="text-sm font-medium">Natural light</div>
            <select
              className="mt-2 block w-full rounded-md border px-3 py-2 text-sm"
              value={form.naturalLight}
              onChange={(e) =>
                set("naturalLight", e.target.value as "" | EnumLight)
              }
            >
              {LIGHT_OPTIONS.map((v) => (
                <option key={v || "blank"} value={v}>
                  {v === ""
                    ? "Select…"
                    : v === "LOW"
                    ? "Low"
                    : v === "MODERATE"
                    ? "Moderate"
                    : v === "BRIGHT"
                    ? "Bright"
                    : "Very bright"}
                </option>
              ))}
            </select>
          </div>

          <label className="mt-1 flex items-center gap-2 rounded-md border px-3 py-2 text-sm sm:mt-6">
            <input
              type="checkbox"
              checked={form.smokingAllowed}
              onChange={(e) => set("smokingAllowed", e.target.checked)}
            />
            Smoking allowed inside
          </label>
        </div>
      </section>

      {/* Interior & amenities */}
      <section className="space-y-4 rounded-xl border bg-white px-4 py-4 sm:px-5 sm:py-5">
        <div>
          <h2 className="text-sm font-semibold">Interior & amenities</h2>
          <p className="mt-1 text-xs text-gray-500">
            Tick everything that&apos;s included. This helps your listing feel
            detailed and professional.
          </p>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Interior features
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {INTERIOR_FEATURES.map((feat) => (
              <label
                key={feat.id}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs sm:text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.interiorFeatures.includes(feat.id)}
                  onChange={(e) =>
                    set(
                      "interiorFeatures",
                      toggleId(
                        form.interiorFeatures,
                        feat.id,
                        e.target.checked
                      )
                    )
                  }
                />
                {feat.label}
              </label>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium" htmlFor="interiorOther">
              Other interior details (optional)
            </label>
            <Input
              id="interiorOther"
              className="mt-2"
              value={form.interiorOther}
              onChange={(e) => set("interiorOther", e.target.value)}
              placeholder="E.g., feature wall, smart thermostat, soundproofing…"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Building amenities & services
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {AMENITY_FEATURES.map((feat) => (
              <label
                key={feat.id}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs sm:text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.amenitiesFeatures.includes(feat.id)}
                  onChange={(e) =>
                    set(
                      "amenitiesFeatures",
                      toggleId(
                        form.amenitiesFeatures,
                        feat.id,
                        e.target.checked
                      )
                    )
                  }
                />
                {feat.label}
              </label>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium" htmlFor="amenitiesOther">
              Other amenities / services (optional)
            </label>
            <Input
              id="amenitiesOther"
              className="mt-2"
              value={form.amenitiesOther}
              onChange={(e) => set("amenitiesOther", e.target.value)}
              placeholder="E.g., package room, coworking lounge, secure bike room…"
            />
          </div>
        </div>
      </section>

      {/* House rules */}
      <section className="space-y-4 rounded-xl border bg-white px-4 py-4 sm:px-5 sm:py-5">
        <div>
          <h2 className="text-sm font-semibold">House rules & expectations</h2>
          <p className="mt-1 text-xs text-gray-500">
            Be clear about how renters should treat your home and common areas.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="rulesNotes">
            Additional house rules
          </label>
          <textarea
            id="rulesNotes"
            className="mt-2 w-full min-h-24 rounded-md border px-3 py-2 text-sm"
            value={form.rulesNotes}
            onChange={(e) => set("rulesNotes", e.target.value)}
            placeholder="E.g., quiet hours, no parties, balcony use, garbage days, shared laundry etiquette…"
          />
        </div>
      </section>

      {/* Accessibility */}
      <section className="space-y-4 rounded-xl border bg-white px-4 py-4 sm:px-5 sm:py-5">
        <div>
          <h2 className="text-sm font-semibold">Accessibility</h2>
          <p className="mt-1 text-xs text-gray-500">
            Highlight anything that makes your place easier to access. This can
            be crucial for renters with mobility or health needs.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.accessStepFree}
              onChange={(e) => set("accessStepFree", e.target.checked)}
            />
            Step-free entrance
          </label>
          <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.accessElevator}
              onChange={(e) => set("accessElevator", e.target.checked)}
            />
            Elevator to unit
          </label>
          <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.accessWideDoors}
              onChange={(e) => set("accessWideDoors", e.target.checked)}
            />
            Wide doorways
          </label>
          <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.accessBathroom}
              onChange={(e) => set("accessBathroom", e.target.checked)}
            />
            Accessible bathroom
          </label>
          <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.accessParking}
              onChange={(e) => set("accessParking", e.target.checked)}
            />
            Reserved accessible parking
          </label>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="accessNotes">
            Accessibility notes
          </label>
          <textarea
            id="accessNotes"
            className="mt-2 w-full min-h-24 rounded-md border px-3 py-2 text-sm"
            value={form.accessNotes}
            onChange={(e) => set("accessNotes", e.target.value)}
            placeholder="Include measurements, number of steps, ramp details, door widths, or anything else a renter should know."
          />
        </div>
      </section>

      {/* Neighborhood & proximity */}
      <section className="space-y-4 rounded-xl border bg-white px-4 py-4 sm:px-5 sm:py-5">
        <div>
          <h2 className="text-sm font-semibold">Neighborhood & surroundings</h2>
          <p className="mt-1 text-xs text-gray-500">
            Describe the vibe of the area and how close key places are.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="text-sm font-medium">Neighborhood vibe</div>
            <select
              className="mt-2 block w-full rounded-md border px-3 py-2 text-sm"
              value={form.neighborhoodVibe}
              onChange={(e) =>
                set("neighborhoodVibe", e.target.value as "" | EnumVibe)
              }
            >
              {VIBE_OPTIONS.map((v) => (
                <option key={v || "blank"} value={v}>
                  {v === ""
                    ? "Select…"
                    : v === "QUIET"
                    ? "Calm & quiet"
                    : v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-sm font-medium">Area type</div>
            <select
              className="mt-2 block w-full rounded-md border px-3 py-2 text-sm"
              value={form.areaType}
              onChange={(e) =>
                set("areaType", e.target.value as "" | EnumArea)
              }
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
          <div className="mb-2 text-sm font-medium">Proximity (meters)</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              onChange={(e) =>
                set("distancePharmacyMeters", e.target.value)
              }
            />
            <Input
              placeholder="Gym"
              inputMode="numeric"
              value={form.distanceGymMeters}
              onChange={(e) => set("distanceGymMeters", e.target.value)}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Leave blank for any you don’t know.
          </p>
        </div>
      </section>

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
