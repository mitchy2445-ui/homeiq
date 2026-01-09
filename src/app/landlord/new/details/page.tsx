"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { prevPath, nextPath, type WizardStep } from "@/lib/listingWizard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

const CURRENT_STEP: WizardStep = "details";

type EnumVibe = "QUIET" | "MODERATE" | "BUSY";
type EnumArea = "URBAN" | "SUBURBAN" | "RURAL";
type EnumNoise = "VERY_QUIET" | "MOSTLY_QUIET" | "AVERAGE" | "LIVELY";
type EnumLight = "LOW" | "MODERATE" | "BRIGHT" | "VERY_BRIGHT";

type Accessibility = {
  stepFree?: boolean;
  elevator?: boolean;
  wideDoors?: boolean;
  accessibleBathroom?: boolean;
  accessibleParking?: boolean;
  notes?: string;
};

type ListingDetailsFromApi = {
  smokingAllowed: boolean | null;
  heating: string | null;
  cooling: string | null;
  noiseLevel: EnumNoise | null;
  naturalLight: EnumLight | null;
  interiorNotes: string | null;
  buildingAmenitiesNotes: string | null;
  rulesNotes: string | null;
  accessibility: Accessibility | null;
  neighborhoodVibe: EnumVibe | null;
  areaType: EnumArea | null;
  distanceBusMeters: number | null;
  distanceGroceryMeters: number | null;
  distanceSchoolMeters: number | null;
  distanceParkMeters: number | null;
  distancePharmacyMeters: number | null;
  distanceGymMeters: number | null;
};

const NOISE_OPTIONS = [
  { value: "VERY_QUIET", label: "Very quiet" },
  { value: "MOSTLY_QUIET", label: "Mostly quiet" },
  { value: "AVERAGE", label: "Average" },
  { value: "LIVELY", label: "Lively / busy" },
] as const;

const LIGHT_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MODERATE", label: "Moderate" },
  { value: "BRIGHT", label: "Bright" },
  { value: "VERY_BRIGHT", label: "Very bright" },
] as const;

const VIBE_OPTIONS = [
  { value: "QUIET", label: "Calm & quiet" },
  { value: "MODERATE", label: "Moderate / mixed" },
  { value: "BUSY", label: "Busy / lively" },
] as const;

const AREA_OPTIONS = [
  { value: "URBAN", label: "Urban" },
  { value: "SUBURBAN", label: "Suburban" },
  { value: "RURAL", label: "Rural" },
] as const;

const INTERIOR_OPTIONS = [
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

const AMENITY_OPTIONS = [
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

export default function ListingDetailsPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id") ?? "";

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const [smokingAllowed, setSmokingAllowed] = React.useState(false);
  const [heating, setHeating] = React.useState("");
  const [cooling, setCooling] = React.useState("");
  const [noiseLevel, setNoiseLevel] = React.useState<EnumNoise | "">("");
  const [naturalLight, setNaturalLight] = React.useState<EnumLight | "">("");

  const [interiorSelected, setInteriorSelected] = React.useState<string[]>([]);
  const [interiorOther, setInteriorOther] = React.useState("");

  const [amenitySelected, setAmenitySelected] = React.useState<string[]>([]);
  const [amenityOther, setAmenityOther] = React.useState("");

  const [rulesNotes, setRulesNotes] = React.useState("");

  const [accessibility, setAccessibility] = React.useState<Accessibility>({
    stepFree: false,
    elevator: false,
    wideDoors: false,
    accessibleBathroom: false,
    accessibleParking: false,
    notes: "",
  });

  const [neighborhoodVibe, setNeighborhoodVibe] =
    React.useState<EnumVibe | "">("");
  const [areaType, setAreaType] = React.useState<EnumArea | "">("");

  const [distanceBusMeters, setDistanceBusMeters] = React.useState("");
  const [distanceGroceryMeters, setDistanceGroceryMeters] =
    React.useState("");
  const [distanceSchoolMeters, setDistanceSchoolMeters] =
    React.useState("");
  const [distanceParkMeters, setDistanceParkMeters] = React.useState("");
  const [distancePharmacyMeters, setDistancePharmacyMeters] =
    React.useState("");
  const [distanceGymMeters, setDistanceGymMeters] = React.useState("");

  function buildFeatureCsv(ids: string[], other: string): string | null {
    const tokens = [...ids];
    if (other.trim()) tokens.push(`OTHER:${other.trim()}`);
    return tokens.length ? tokens.join(",") : null;
  }

  function parseFeatureCsv(raw: string | null | undefined) {
    if (!raw) return { ids: [], other: "" };

    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const ids: string[] = [];
    let other = "";

    for (const p of parts) {
      if (p.startsWith("OTHER:")) {
        other = p.slice(6).trim();
      } else {
        ids.push(p);
      }
    }
    return { ids, other };
  }

  function toggleFromArray(
    value: string,
    current: string[],
    setter: (v: string[]) => void
  ) {
    setter(
      current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value]
    );
  }

  const back = () => {
    if (!id) return;
    router.push(prevPath(CURRENT_STEP, id));
  };

  React.useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let active = true;
    const ac = new AbortController();

    async function load() {
      try {
        const res = await fetch(`/api/listings/${encodeURIComponent(id)}`, {
          cache: "no-store",
          signal: ac.signal,
        });

        const txt = await res.text();
        if (!active) return;

        if (!res.ok) {
          setError(`Failed to load listing (${res.status})`);
          setLoading(false);
          return;
        }

        const listing = JSON.parse(txt) as ListingDetailsFromApi;

        setSmokingAllowed(Boolean(listing.smokingAllowed));
        setHeating(listing.heating ?? "");
        setCooling(listing.cooling ?? "");
        setNoiseLevel(listing.noiseLevel ?? "");
        setNaturalLight(listing.naturalLight ?? "");

        const iParsed = parseFeatureCsv(listing.interiorNotes);
        setInteriorSelected(iParsed.ids);
        setInteriorOther(iParsed.other);

        const aParsed = parseFeatureCsv(listing.buildingAmenitiesNotes);
        setAmenitySelected(aParsed.ids);
        setAmenityOther(aParsed.other);

        setRulesNotes(listing.rulesNotes ?? "");

        const acc = listing.accessibility ?? {};
        setAccessibility({
          stepFree: !!acc.stepFree,
          elevator: !!acc.elevator,
          wideDoors: !!acc.wideDoors,
          accessibleBathroom: !!acc.accessibleBathroom,
          accessibleParking: !!acc.accessibleParking,
          notes: acc.notes ?? "",
        });

        setNeighborhoodVibe(listing.neighborhoodVibe ?? "");
        setAreaType(listing.areaType ?? "");

        setDistanceBusMeters(
          listing.distanceBusMeters != null
            ? String(listing.distanceBusMeters)
            : ""
        );

        setDistanceGroceryMeters(
          listing.distanceGroceryMeters != null
            ? String(listing.distanceGroceryMeters)
            : ""
        );

        setDistanceSchoolMeters(
          listing.distanceSchoolMeters != null
            ? String(listing.distanceSchoolMeters)
            : ""
        );

        setDistanceParkMeters(
          listing.distanceParkMeters != null
            ? String(listing.distanceParkMeters)
            : ""
        );

        setDistancePharmacyMeters(
          listing.distancePharmacyMeters != null
            ? String(listing.distancePharmacyMeters)
            : ""
        );

        setDistanceGymMeters(
          listing.distanceGymMeters != null
            ? String(listing.distanceGymMeters)
            : ""
        );

        setLoading(false);
      } catch {
        if (!active) return;
        setError("Failed to load listing.");
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
      ac.abort();
    };
  }, [id]);

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    setError("");

    try {
      const interiorNotes = buildFeatureCsv(
        interiorSelected,
        interiorOther
      );
      const buildingAmenitiesNotes = buildFeatureCsv(
        amenitySelected,
        amenityOther
      );

      const payload = {
        smokingAllowed,
        heating: heating.trim() || null,
        cooling: cooling.trim() || null,
        noiseLevel: noiseLevel || null,
        naturalLight: naturalLight || null,
        interiorNotes,
        buildingAmenitiesNotes,
        rulesNotes: rulesNotes.trim() || null,
        accessibility,
        neighborhoodVibe: neighborhoodVibe || null,
        areaType: areaType || null,
        distanceBusMeters: distanceBusMeters ? Number(distanceBusMeters) : null,
        distanceGroceryMeters: distanceGroceryMeters
          ? Number(distanceGroceryMeters)
          : null,
        distanceSchoolMeters: distanceSchoolMeters
          ? Number(distanceSchoolMeters)
          : null,
        distanceParkMeters: distanceParkMeters ? Number(distanceParkMeters) : null,
        distancePharmacyMeters: distancePharmacyMeters
          ? Number(distancePharmacyMeters)
          : null,
        distanceGymMeters: distanceGymMeters ? Number(distanceGymMeters) : null,
      };

      const res = await fetch(`/api/host/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      router.push(nextPath(CURRENT_STEP, id));
    } catch {
      setError("Failed to save listing details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <div className="text-sm text-gray-500">Step 2 of 5</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Listing details
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tell renters what it&apos;s like to live here – heating, cooling,
          noise, accessibility, and what&apos;s nearby.
        </p>
        <div className="mt-4">
          <Progress value={60} className="h-2" />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
          className="space-y-6"
        >
          <Card className="border rounded-2xl shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">
                Comfort &amp; environment
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">
                    Heating
                    <Input
                      className="mt-1"
                      placeholder="e.g. Electric heaters, baseboard"
                      value={heating}
                      onChange={(e) => setHeating(e.target.value)}
                    />
                  </label>
                </div>

                <div>
                  <label className="text-sm text-gray-600">
                    Cooling
                    <Input
                      className="mt-1"
                      placeholder="e.g. Window AC unit(s)"
                      value={cooling}
                      onChange={(e) => setCooling(e.target.value)}
                    />
                  </label>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Noise level</div>
                  <select
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={noiseLevel}
                    onChange={(e) =>
                      setNoiseLevel(
                        (e.target.value || "") as EnumNoise | ""
                      )
                    }
                  >
                    <option value="">—</option>
                    {NOISE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    Natural light
                  </div>
                  <select
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={naturalLight}
                    onChange={(e) =>
                      setNaturalLight(
                        (e.target.value || "") as EnumLight | ""
                      )
                    }
                  >
                    <option value="">—</option>
                    {LIGHT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-sm text-gray-600 mb-1">Smoking</div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <button
                      type="button"
                      className={`rounded-full border px-3 py-1 ${
                        !smokingAllowed
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-gray-300 text-gray-700"
                      }`}
                      onClick={() => setSmokingAllowed(false)}
                    >
                      No smoking inside
                    </button>

                    <button
                      type="button"
                      className={`rounded-full border px-3 py-1 ${
                        smokingAllowed
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-gray-300 text-gray-700"
                      }`}
                      onClick={() => setSmokingAllowed(true)}
                    >
                      Smoking allowed inside
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border rounded-2xl shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">
                Interior &amp; building amenities
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-2">
                    Interior features
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {INTERIOR_OPTIONS.map((opt) => {
                      const active = interiorSelected.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className={`rounded-full border px-3 py-1 ${
                            active
                              ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                              : "border-gray-300 text-gray-700"
                          }`}
                          onClick={() =>
                            toggleFromArray(
                              opt.id,
                              interiorSelected,
                              setInteriorSelected
                            )
                          }
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <Input
                    className="mt-3"
                    placeholder="Other interior details (optional)"
                    value={interiorOther}
                    onChange={(e) => setInteriorOther(e.target.value)}
                  />
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2">
                    Building amenities & services
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {AMENITY_OPTIONS.map((opt) => {
                      const active = amenitySelected.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className={`rounded-full border px-3 py-1 ${
                            active
                              ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                              : "border-gray-300 text-gray-700"
                          }`}
                          onClick={() =>
                            toggleFromArray(
                              opt.id,
                              amenitySelected,
                              setAmenitySelected
                            )
                          }
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <Input
                    className="mt-3"
                    placeholder="Other building details (optional)"
                    value={amenityOther}
                    onChange={(e) => setAmenityOther(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 block">
                  Additional notes / rules (optional)
                  <Textarea
                    className="mt-1"
                    rows={3}
                    placeholder="Anything else renters should know about the building or quiet hours, visitors, etc."
                    value={rulesNotes}
                    onChange={(e) => setRulesNotes(e.target.value)}
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="border rounded-2xl shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Accessibility</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!accessibility.stepFree}
                      onChange={(e) =>
                        setAccessibility((a) => ({
                          ...a,
                          stepFree: e.target.checked,
                        }))
                      }
                    />
                    <span>Step-free entrance</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!accessibility.elevator}
                      onChange={(e) =>
                        setAccessibility((a) => ({
                          ...a,
                          elevator: e.target.checked,
                        }))
                      }
                    />
                    <span>Elevator to unit</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!accessibility.wideDoors}
                      onChange={(e) =>
                        setAccessibility((a) => ({
                          ...a,
                          wideDoors: e.target.checked,
                        }))
                      }
                    />
                    <span>Wide doorways</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!accessibility.accessibleBathroom}
                      onChange={(e) =>
                        setAccessibility((a) => ({
                          ...a,
                          accessibleBathroom: e.target.checked,
                        }))
                      }
                    />
                    <span>Accessible bathroom</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!accessibility.accessibleParking}
                      onChange={(e) =>
                        setAccessibility((a) => ({
                          ...a,
                          accessibleParking: e.target.checked,
                        }))
                      }
                    />
                    <span>Reserved accessible parking</span>
                  </label>
                </div>

                <div>
                  <label className="text-sm text-gray-600 block">
                    Accessibility notes (optional)
                    <Textarea
                      className="mt-1"
                      rows={4}
                      value={accessibility.notes ?? ""}
                      onChange={(e) =>
                        setAccessibility((a) => ({
                          ...a,
                          notes: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border rounded-2xl shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">
                Neighborhood & distances
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    Neighborhood vibe
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {VIBE_OPTIONS.map((opt) => {
                      const active = neighborhoodVibe === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`rounded-full border px-3 py-1 text-xs ${
                            active
                              ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                              : "border-gray-300 text-gray-700"
                          }`}
                          onClick={() =>
                            setNeighborhoodVibe(active ? "" : opt.value)
                          }
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Area type</div>
                  <div className="flex flex-wrap gap-2">
                    {AREA_OPTIONS.map((opt) => {
                      const active = areaType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`rounded-full border px-3 py-1 text-xs ${
                            active
                              ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                              : "border-gray-300 text-gray-700"
                          }`}
                          onClick={() => setAreaType(active ? "" : opt.value)}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-2">
                  Nearby (approximate walking distance in metres)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">

                  {(
                    [
                      ["Bus", distanceBusMeters, setDistanceBusMeters],
                      ["Grocery store", distanceGroceryMeters, setDistanceGroceryMeters],
                      ["School", distanceSchoolMeters, setDistanceSchoolMeters],
                      ["Park", distanceParkMeters, setDistanceParkMeters],
                      ["Pharmacy", distancePharmacyMeters, setDistancePharmacyMeters],
                      ["Gym", distanceGymMeters, setDistanceGymMeters],
                    ] as [string, string, React.Dispatch<React.SetStateAction<string>>][]
                  ).map(([label, value, setter]) => (
                    <label key={label} className="block">
                      <span className="text-xs text-gray-600">{label}</span>
                      <Input
                        className="mt-1"
                        type="number"
                        min={0}
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                      />
                    </label>
                  ))}

                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={!id || saving}
            >
              Back
            </Button>

            <Button
              type="submit"
              className="bg-emerald-600 text-white"
              disabled={!id || saving}
            >
              {saving ? "Saving…" : "Save & continue"}
            </Button>
          </div>
        </form>
      )}
    </main>
  );
}
