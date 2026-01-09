"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { prevPath, type WizardStep } from "@/lib/listingWizard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** JSON value type */
type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

type EnumVibe = "QUIET" | "MODERATE" | "BUSY";
type EnumArea = "URBAN" | "SUBURBAN" | "RURAL";
type EnumNoise = "VERY_QUIET" | "MOSTLY_QUIET" | "AVERAGE" | "LIVELY";
type EnumLight = "LOW" | "MODERATE" | "BRIGHT" | "VERY_BRIGHT";
type EnumPetPolicy = "NONE" | "CATS" | "DOGS" | "CATS_AND_DOGS" | "RESTRICTED";
type EnumParkingType = "STREET" | "ON_SITE" | "NONE";
type EnumLaundryType = "IN_UNIT" | "SHARED" | "NONE";

type Photo = { id: string; url: string; alt: string | null; sortOrder: number };

type Accessibility = {
  stepFree?: boolean;
  elevator?: boolean;
  wideDoors?: boolean;
  accessibleBathroom?: boolean;
  accessibleParking?: boolean;
  notes?: string | null;
};

type UtilitiesJson = {
  included?: string[];
  notIncluded?: string[];
};

type ListingForReview = {
  id: string;
  title: string | null;
  description: string | null;
  houseRules: string | null;
  city: string | null;
  price: number | null; // cents
  beds: number | null;
  baths: number | null;

  propertyType?: string | null;
  furnished?: boolean | null;
  maxOccupants?: number | null;
  minLeaseMonths?: number | null;
  depositCents?: number | null;
  availableFrom?: Date | null;
  preferredTenantType?: string | null; // For fallback

  utilitiesIncluded?: Json | null;
  insights?: Json | null;

  // NEW: Add Basics summary fields (direct from schema)
  idealRenterSummary?: string | null;
  petSummary?: string | null;
  parkingSummary?: string | null;
  laundrySummary?: string | null;

  // Enums for fallback computation
  petPolicy?: EnumPetPolicy | null;
  parkingType?: EnumParkingType | null;
  laundry?: EnumLaundryType | null;

  // Neighborhood insights (existing)
  neighborhoodNotes?: string | null;
  transit?: string | null;
  amenities?: string | null;

  neighborhoodCommunity?: string | null;
  neighborhoodSafety?: string | null;
  neighborhoodWalkability?: string | null;
  neighborhoodNoise?: string | null;
  neighborhoodTransitNotes?: string | null;
  neighborhoodHighlights?: string | null;

  // Listing Details step fields
  smokingAllowed: boolean;
  heating: string | null;
  cooling: string | null;
  noiseLevel?: EnumNoise | null;
  naturalLight?: EnumLight | null;
  interiorNotes?: string | null;
  buildingAmenitiesNotes?: string | null;
  rulesNotes?: string | null;
  accessibility?: Json | null;
  neighborhoodVibe?: EnumVibe | null;
  areaType?: EnumArea | null;
  distanceBusMeters?: number | null;
  distanceGroceryMeters?: number | null;
  distanceSchoolMeters?: number | null;
  distanceParkMeters?: number | null;
  distancePharmacyMeters?: number | null;
  distanceGymMeters?: number | null;

  photos?: Photo[];
  videoUrl?: string | null;
};

const CURRENT_STEP: WizardStep = "review";

// Maps to turn IDs saved in interiorNotes/buildingAmenitiesNotes into labels
const INTERIOR_LABELS: Record<string, string> = {
  UPDATED_KITCHEN: "Updated / modern kitchen",
  UPDATED_BATHROOM: "Updated bathroom",
  STAINLESS_APPLIANCES: "Stainless appliances",
  HARDWOOD_FLOORS: "Hardwood / laminate floors",
  CARPET_BEDROOMS: "Carpet in bedrooms",
  LARGE_WINDOWS: "Large windows / great light",
  HIGH_CEILINGS: "High ceilings",
  IN_UNIT_STORAGE: "In-unit storage / walk-in closet",
  BALCONY_PATIO: "Balcony / patio",
};

const AMENITY_LABELS: Record<string, string> = {
  ELEVATOR: "Elevator",
  GYM: "Gym / fitness room",
  POOL: "Pool / hot tub",
  ROOFTOP: "Rooftop / shared patio",
  PARTY_ROOM: "Lounge / party room",
  BIKE_STORAGE: "Bike storage",
  STORAGE_LOCKERS: "Storage lockers",
  VISITOR_PARKING: "Visitor parking",
  UNDERGROUND_PARKING: "Underground parking",
  SECURITY: "Security cameras / concierge",
  ON_SITE_MANAGER: "On-site manager / caretaker",
  SNOW_REMOVAL: "Snow removal included",
  LAWN_CARE: "Lawn / yard care included",
  WIFI_INCLUDED: "Wi-Fi included",
};

function prettyNoise(n?: EnumNoise | null): string {
  switch (n) {
    case "VERY_QUIET":
      return "Very quiet";
    case "MOSTLY_QUIET":
      return "Mostly quiet";
    case "AVERAGE":
      return "Average";
    case "LIVELY":
      return "Lively / busy";
    default:
      return "—";
  }
}

function prettyLight(l?: EnumLight | null): string {
  switch (l) {
    case "LOW":
      return "Low";
    case "MODERATE":
      return "Moderate";
    case "BRIGHT":
      return "Bright";
    case "VERY_BRIGHT":
      return "Very bright";
    default:
      return "—";
  }
}

function prettyVibe(v?: EnumVibe | null): string {
  switch (v) {
    case "QUIET":
      return "Calm & quiet";
    case "MODERATE":
      return "Moderate / mixed";
    case "BUSY":
      return "Busy / lively";
    default:
      return "";
  }
}

function prettyArea(a?: EnumArea | null): string {
  switch (a) {
    case "URBAN":
      return "urban";
    case "SUBURBAN":
      return "suburban";
    case "RURAL":
      return "rural";
    default:
      return "";
  }
}

function formatMeters(n?: number | null): string {
  if (n == null) return "—";
  return `${n.toLocaleString("en-CA")} m`;
}

function parseFeatureList(
  raw: string | null | undefined,
  labels: Record<string, string>
): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((token) => {
      if (token.startsWith("OTHER:")) {
        return token.slice("OTHER:".length).trim();
      }
      return labels[token] ?? token;
    });
}

// NEW: Fallback summary generators
function generateIdealRenterSummary(preferredTenantType?: string | null): string {
  if (!preferredTenantType?.trim()) return "Open to all qualified renters.";
  return `Ideal for ${preferredTenantType.toLowerCase()}.`;
}

function generatePetSummary(petPolicy?: EnumPetPolicy | null): string {
  switch (petPolicy) {
    case "NONE":
      return "No pets allowed.";
    case "CATS":
      return "Cats only.";
    case "DOGS":
      return "Dogs only.";
    case "CATS_AND_DOGS":
      return "Cats and dogs OK.";
    case "RESTRICTED":
      return "Pets allowed with restrictions (case-by-case).";
    default:
      return "Pet policy TBD.";
  }
}

function generateParkingSummary(parkingType?: EnumParkingType | null): string {
  switch (parkingType) {
    case "STREET":
      return "Street parking available.";
    case "ON_SITE":
      return "On-site parking included.";
    case "NONE":
      return "No dedicated parking.";
    default:
      return "Parking TBD.";
  }
}

function generateLaundrySummary(laundry?: EnumLaundryType | null): string {
  switch (laundry) {
    case "IN_UNIT":
      return "In-unit washer/dryer.";
    case "SHARED":
      return "Shared laundry facilities.";
    case "NONE":
      return "No laundry on-site.";
    default:
      return "Laundry TBD.";
  }
}

const COMMUNITY_MAP: Record<string, string> = {
  FAMILY_FRIENDLY: "Family-friendly",
  STUDENT_AREA: "Student area",
  TRENDY: "Trendy / nightlife",
  QUIET_SUBURBAN: "Quiet suburban",
  URBAN_CENTRAL: "Urban / central",
  NATURE_FOCUSED: "Close to nature",
};

const SAFETY_MAP: Record<string, string> = {
  VERY_SAFE: "Very safe",
  FAIRLY_SAFE: "Fairly safe",
  MIXED: "Mixed depending on time",
  UNSURE: "Not sure",
};

const WALKABILITY_MAP: Record<string, string> = {
  VERY_WALKABLE: "Very walkable",
  SOMEWHAT_WALKABLE: "Somewhat walkable",
  CAR_DEPENDENT: "Mostly car-dependent",
};

const NOISE_MAP: Record<string, string> = {
  VERY_QUIET: "Very quiet",
  AVERAGE: "Average noise",
  LIVELY: "Lively area",
};

export default function ReviewPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id") ?? "";

  const [data, setData] = React.useState<ListingForReview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [publishing, setPublishing] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  React.useEffect(() => {
    let active = true;
    const ac = new AbortController();

    async function load() {
      try {
        if (!id) {
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/listings/${encodeURIComponent(id)}`, {
          cache: "no-store",
          signal: ac.signal,
        });
        const text = await res.text();
        if (!active) return;

        if (!res.ok) {
          setError(`Load failed (${res.status}): ${text || res.statusText}`);
          setLoading(false);
          return;
        }

        setData(JSON.parse(text) as ListingForReview);
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

  const back = () => id && router.push(prevPath(CURRENT_STEP, id));

  const currency = (cents?: number | null) =>
    typeof cents === "number"
      ? (cents / 100).toLocaleString("en-CA", {
          style: "currency",
          currency: "CAD",
          maximumFractionDigits: 0,
        })
      : "—";

  const issues = React.useMemo(() => {
    const xs: string[] = [];
    if (!data) return xs;
    if (!data.title?.trim()) xs.push("Title is required.");
    if (!data.city?.trim()) xs.push("City is required.");
    if (!data.beds || data.beds <= 0) xs.push("Beds must be greater than 0.");
    if (!data.baths || data.baths <= 0) xs.push("Baths must be greater than 0.");
    if (!data.price || data.price <= 0)
      xs.push("Monthly price must be greater than 0.");
    if (!data.photos || data.photos.length === 0)
      xs.push("At least one photo is required.");
    return xs;
  }, [data]);

  const publish = async () => {
    if (!id) return;
    setPublishing(true);
    setError("");
    try {
      const res = await fetch(`/api/listings/${encodeURIComponent(id)}/publish`, {
        method: "POST",
      });
      const bodyText = await res.text();

      if (!res.ok) {
        let msg = "Failed to publish the listing.";
        try {
          const j = JSON.parse(bodyText);
          if (j?.message) msg = j.message;
          if (Array.isArray(j?.errors) && j.errors.length) {
            msg += " " + j.errors.join(" ");
          }
        } catch {
          if (bodyText) msg = `${msg} ${bodyText}`;
        }
        setError(msg);
        return;
      }

      router.replace("/landlord");
    } catch {
      setError("Failed to publish the listing.");
    } finally {
      setPublishing(false);
    }
  };

  // ---------- Derived helpers ----------

  // Accessibility JSON
  const accessibility: Accessibility =
    data &&
    data.accessibility &&
    typeof data.accessibility === "object" &&
    !Array.isArray(data.accessibility)
      ? (data.accessibility as Accessibility)
      : {};

  // Utilities JSON
  const utilities: UtilitiesJson =
    data &&
    data.utilitiesIncluded &&
    typeof data.utilitiesIncluded === "object" &&
    !Array.isArray(data.utilitiesIncluded)
      ? (data.utilitiesIncluded as UtilitiesJson)
      : {};

  const utilitiesIncluded = utilities.included ?? [];
  const utilitiesNotIncluded = utilities.notIncluded ?? [];

  // FIX: Use summaries if available, else fallback to generating from enums/preferred
  const idealRenter = (data?.idealRenterSummary?.trim() || generateIdealRenterSummary(data?.preferredTenantType)) || "—";
  const petPolicySummary = (data?.petSummary?.trim() || generatePetSummary(data?.petPolicy)) || "—";
  const parkingDetails = (data?.parkingSummary?.trim() || generateParkingSummary(data?.parkingType)) || "—";
  const laundryDetails = (data?.laundrySummary?.trim() || generateLaundrySummary(data?.laundry)) || "—";

  const interiorFeatures = parseFeatureList(
    data?.interiorNotes,
    INTERIOR_LABELS
  );
  const amenityFeatures = parseFeatureList(
    data?.buildingAmenitiesNotes,
    AMENITY_LABELS
  );

  const neighborhoodSummary = React.useMemo(() => {
    if (!data) return "";

    const parts: string[] = [];

    if (data.neighborhoodCommunity) {
      parts.push(COMMUNITY_MAP[data.neighborhoodCommunity as keyof typeof COMMUNITY_MAP] || data.neighborhoodCommunity);
    }

    if (data.neighborhoodSafety) {
      parts.push(SAFETY_MAP[data.neighborhoodSafety as keyof typeof SAFETY_MAP] || data.neighborhoodSafety);
    }

    if (data.neighborhoodWalkability) {
      parts.push(WALKABILITY_MAP[data.neighborhoodWalkability as keyof typeof WALKABILITY_MAP] || data.neighborhoodWalkability);
    }

    if (data.neighborhoodNoise) {
      parts.push(NOISE_MAP[data.neighborhoodNoise as keyof typeof NOISE_MAP] || data.neighborhoodNoise);
    }

    if (parts.length === 0) return "";

    return parts.join(", ") + " neighborhood.";
  }, [data]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <div className="text-sm text-gray-500">Step 5 of 5</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Review &amp; publish
        </h1>
        <div className="mt-4">
          <Progress value={100} className="h-2" />
        </div>
      </div>

      {!id && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No <code>id</code> in the URL. Go back to Basics to start a listing.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading || !data ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <>
          {/* Basics */}
          <Card className="mb-5 border rounded-2xl shadow-sm">
            <CardContent className="p-6 grid gap-4">
              <h2 className="text-lg font-semibold">Basics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500 text-sm">Title</span>
                  <div className="font-medium">{data.title || "—"}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">City</span>
                  <div className="font-medium">{data.city || "—"}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Beds</span>
                  <div className="font-medium">{data.beds ?? "—"}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Baths</span>
                  <div className="font-medium">{data.baths ?? "—"}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">
                    Monthly price
                  </span>
                  <div className="font-medium">{currency(data.price)}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Deposit</span>
                  <div className="font-medium">
                    {currency(data.depositCents ?? null)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">
                    Property type
                  </span>
                  <div className="font-medium">
                    {data.propertyType || "—"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">
                    Max occupants
                  </span>
                  <div className="font-medium">
                    {data.maxOccupants ?? "—"}
                  </div>
                </div>
              </div>

              {data.description?.trim() && (
                <div className="mt-3">
                  <span className="text-gray-500 text-sm block">
                    Description
                  </span>
                  <div className="font-medium whitespace-pre-wrap">
                    {data.description}
                  </div>
                </div>
              )}

              {data.houseRules?.trim() && (
                <div className="mt-3">
                  <span className="text-gray-500 text-sm block">
                    House rules
                  </span>
                  <div className="font-medium whitespace-pre-wrap">
                    {data.houseRules}
                  </div>
                </div>
              )}

              {/* Utilities + ideal renter / pets / parking / laundry */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 text-sm block">
                    Utilities included
                  </span>
                  {utilitiesIncluded.length === 0 ? (
                    <div className="mt-1 text-sm text-gray-500">—</div>
                  ) : (
                    <ul className="mt-1 list-disc pl-5 text-sm">
                      {utilitiesIncluded.map((u) => (
                        <li key={u}>{u}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <span className="text-gray-500 text-sm block">
                    Utilities not included
                  </span>
                  {utilitiesNotIncluded.length === 0 ? (
                    <div className="mt-1 text-sm text-gray-500">—</div>
                  ) : (
                    <ul className="mt-1 list-disc pl-5 text-sm">
                      {utilitiesNotIncluded.map((u) => (
                        <li key={u}>{u}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 text-sm block">
                    Ideal renter
                  </span>
                  <div className="mt-1 font-medium whitespace-pre-wrap">
                    {idealRenter}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm block">Pets</span>
                  <div className="mt-1 font-medium whitespace-pre-wrap">
                    {petPolicySummary}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm block">Parking</span>
                  <div className="mt-1 font-medium whitespace-pre-wrap">
                    {parkingDetails}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm block">
                    Laundry
                  </span>
                  <div className="mt-1 font-medium whitespace-pre-wrap">
                    {laundryDetails}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listing details summary */}
          <Card className="mb-5 border rounded-2xl shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Listing details</h2>

              {/* Comfort & environment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500 text-sm block">Heating</span>
                  <div className="font-medium">{data.heating || "—"}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm block">Cooling</span>
                  <div className="font-medium">{data.cooling || "—"}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm block">
                    Noise level
                  </span>
                  <div className="font-medium">
                    {prettyNoise(data.noiseLevel)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm block">
                    Natural light
                  </span>
                  <div className="font-medium">
                    {prettyLight(data.naturalLight)}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-500 text-sm block">
                    Smoking
                  </span>
                  <div className="font-medium">
                    {data.smokingAllowed
                      ? "Smoking allowed inside"
                      : "No smoking inside"}
                  </div>
                </div>
              </div>

              {/* Interior & building amenities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 text-sm block">
                    Interior features
                  </span>
                  {interiorFeatures.length === 0 ? (
                    <div className="mt-1 text-sm text-gray-500">—</div>
                  ) : (
                    <ul className="mt-1 list-disc pl-5 text-sm">
                      {interiorFeatures.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <span className="text-gray-500 text-sm block">
                    Building amenities &amp; services
                  </span>
                  {amenityFeatures.length === 0 ? (
                    <div className="mt-1 text-sm text-gray-500">—</div>
                  ) : (
                    <ul className="mt-1 list-disc pl-5 text-sm">
                      {amenityFeatures.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Accessibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 text-sm block">
                    Accessibility features
                  </span>
                  <ul className="mt-1 list-disc pl-5">
                    {accessibility.stepFree && <li>Step-free entrance</li>}
                    {accessibility.elevator && <li>Elevator to unit</li>}
                    {accessibility.wideDoors && <li>Wide doorways</li>}
                    {accessibility.accessibleBathroom && (
                      <li>Accessible bathroom</li>
                    )}
                    {accessibility.accessibleParking && (
                      <li>Reserved accessible parking</li>
                    )}
                    {!accessibility.stepFree &&
                      !accessibility.elevator &&
                      !accessibility.wideDoors &&
                      !accessibility.accessibleBathroom &&
                      !accessibility.accessibleParking && (
                        <li>None specified</li>
                      )}
                  </ul>
                </div>
                <div>
                  <span className="text-gray-500 text-sm block">
                    Accessibility notes
                  </span>
                  <div className="mt-1 whitespace-pre-wrap">
                    {accessibility.notes?.trim() || "—"}
                  </div>
                </div>
              </div>

              {/* Nearby distances */}
              <div>
                <span className="text-gray-500 text-sm block">
                  Nearby (approximate distances)
                </span>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-gray-500">Bus</div>
                    <div className="font-medium">
                      {formatMeters(data.distanceBusMeters)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Grocery</div>
                    <div className="font-medium">
                      {formatMeters(data.distanceGroceryMeters)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">School</div>
                    <div className="font-medium">
                      {formatMeters(data.distanceSchoolMeters)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Park</div>
                    <div className="font-medium">
                      {formatMeters(data.distanceParkMeters)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Pharmacy</div>
                    <div className="font-medium">
                      {formatMeters(data.distancePharmacyMeters)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Gym</div>
                    <div className="font-medium">
                      {formatMeters(data.distanceGymMeters)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Neighborhood insights */}
          <Card className="mb-5 border rounded-2xl shadow-sm">
            <CardContent className="p-6 grid gap-4">
              <h2 className="text-lg font-semibold">Neighborhood insights</h2>

              <div>
                <span className="text-gray-500 text-sm block">Overview</span>
                <div className="mt-1 text-sm font-medium whitespace-pre-wrap">
                  {neighborhoodSummary || "—"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500 text-sm">Notes</span>
                  <div className="font-medium whitespace-pre-wrap">
                    {[data?.neighborhoodCommunity?.trim(), data?.neighborhoodSafety?.trim(), data?.neighborhoodWalkability?.trim(), data?.neighborhoodNoise?.trim()].filter(Boolean).join('\n\n') || "—"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Transit</span>
                  <div className="font-medium">
                    {data.neighborhoodTransitNotes?.trim() || "—"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Amenities</span>
                  <div className="font-medium">
                    {data.neighborhoodHighlights?.trim() || "—"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card className="mb-5 border rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Photos</h2>
              {!data.photos || data.photos.length === 0 ? (
                <div className="text-sm text-gray-500">No photos.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {data.photos.map((p) => (
                    <div
                      key={p.id}
                      className="relative aspect-[4/3] overflow-hidden rounded-lg border"
                    >
                      <Image
                        src={p.url}
                        alt={p.alt ?? ""}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video */}
          <Card className="mb-5 border rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Video tour</h2>
              {data.videoUrl ? (
                <div className="aspect-video w-full overflow-hidden rounded-lg border">
                  <video
                    src={data.videoUrl}
                    controls
                    playsInline
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="text-sm text-gray-500">No video uploaded.</div>
              )}
            </CardContent>
          </Card>

          {/* Guardrails */}
          {issues.length > 0 && (
            <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="font-medium mb-1">
                Please fix these before publishing:
              </div>
              <ul className="list-disc ml-5">
                {issues.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-2">
            <Button
              variant="outline"
              onClick={back}
              disabled={!id || publishing}
            >
              Back
            </Button>
            <Button
              className="bg-emerald-600 text-white"
              onClick={publish}
              disabled={!id || publishing || issues.length > 0}
            >
              {publishing ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </>
      )}
    </main>
  );
}