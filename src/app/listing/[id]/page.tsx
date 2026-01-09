import type React from "react";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma as db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import {
  MapPin,
  BedDouble,
  ShowerHead,
  DollarSign,
  Car,
  PawPrint,
  Plug,
  Sofa,
  Thermometer,
  Wind,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";
import RequestViewingButton from "./RequestViewingButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------ helper types for JSON fields ------------ */

type UtilitiesJson = {
  included?: string[];
  notIncluded?: string[];
};

type Accessibility = {
  stepFree?: boolean;
  elevator?: boolean;
  wideDoors?: boolean;
  accessibleBathroom?: boolean;
  accessibleParking?: boolean;
  notes?: string | null;
};

type EnumNoise = "VERY_QUIET" | "MOSTLY_QUIET" | "AVERAGE" | "LIVELY";
type EnumLight = "LOW" | "MODERATE" | "BRIGHT" | "VERY_BRIGHT";

type Photo = { id: string; url: string; alt: string | null; sortOrder: number };

/* ---- maps copied from Review page so we show amenities nicely ---- */

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

/* ---------------------- main page ---------------------- */

export default async function ListingDetail({
  params,
}: {
  params: { id: string };
}) {
  const listing = await db.listing.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      status: true,
      title: true,
      city: true,
      price: true,
      beds: true,
      baths: true,
      description: true,
      images: true, // legacy
      videoUrl: true,

      // FIXED: Add structured photos
      photos: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, url: true, alt: true, sortOrder: true },
      },

      // basics
      propertyType: true,
      availableFrom: true,
      depositCents: true,
      furnished: true,
      minLeaseMonths: true,
      maxOccupants: true,
      houseRules: true,
      idealRenterSummary: true,
      petSummary: true,
      parkingSummary: true,
      laundrySummary: true,

      // details / comfort
      smokingAllowed: true,
      heating: true,
      cooling: true,
      noiseLevel: true,
      naturalLight: true,
      interiorNotes: true,
      buildingAmenitiesNotes: true,
      rulesNotes: true,
      accessibility: true,

      // neighborhood
      neighborhoodVibe: true,
      areaType: true,
      distanceBusMeters: true,
      distanceGroceryMeters: true,
      distanceSchoolMeters: true,
      distanceParkMeters: true,
      distancePharmacyMeters: true,
      distanceGymMeters: true,
      neighborhoodNotes: true,
      transit: true,
      amenities: true,

      // pricing / utilities
      utilitiesIncluded: true,
      parkingType: true,
      petPolicy: true,
      laundry: true,

      // landlord
      landlordId: true,
      landlord: {
        select: {
          landlordProfile: { select: { fullName: true } },
          name: true,
        },
      },
    },
  });

  if (!listing || listing.status !== "APPROVED") notFound();

  /* ------------ derived data ------------ */

  // FIXED: Normalize photos (fallback to legacy images, like Review)
  const legacyPhotos = jsonStrArr(listing.images);
  const structuredPhotos = listing.photos?.map((p) => ({
    id: p.id,
    url: p.url,
    alt: p.alt,
    sortOrder: p.sortOrder,
  })) ?? [];
  const photos = structuredPhotos.length > 0 ? structuredPhotos : legacyPhotos.map((url, i) => ({
    id: `${i}`,
    url,
    alt: null,
    sortOrder: i,
  }));
  const cover = photos[0]?.url ?? "/placeholder.svg";

  const price = centsToDollars(listing.price);
  const deposit =
    typeof listing.depositCents === "number"
      ? `$${(listing.depositCents / 100).toFixed(0)}`
      : null;

  const utilitiesJson = parseUtilities(listing.utilitiesIncluded);
  const utilitiesIncluded = utilitiesJson.included ?? [];
  const utilitiesNotIncluded = utilitiesJson.notIncluded ?? [];

  const accessibility = parseAccessibility(listing.accessibility);

  const interiorFeatures = parseFeatureList(
    listing.interiorNotes,
    INTERIOR_LABELS
  );
  const buildingAmenities = parseFeatureList(
    listing.buildingAmenitiesNotes,
    AMENITY_LABELS
  );

  const landlordName =
    listing.landlord?.landlordProfile?.fullName ||
    listing.landlord?.name ||
    "Landlord";

  const highlightChips = buildHighlights({
    beds: listing.beds,
    baths: listing.baths,
    furnished: listing.furnished,
    petPolicy: listing.petPolicy,
    parkingType: listing.parkingType,
    laundry: listing.laundry,
    neighborhoodVibe: listing.neighborhoodVibe,
    areaType: listing.areaType,
    minLeaseMonths: listing.minLeaseMonths,
    maxOccupants: listing.maxOccupants,
  });

  const availableFromText = listing.availableFrom
    ? formatDate(listing.availableFrom)
    : "—";

  const vibeSummary = buildNeighborhoodSummary(
    listing.neighborhoodVibe,
    listing.areaType
  );

  /* ---------------- server actions ---------------- */

  async function contactLandlord(): Promise<void> {
    "use server";
    const s = await requireSession(`/listing/${params.id}`);

    const li = await db.listing.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, landlordId: true },
    });

    if (!li?.landlordId) redirect("/messages");
    if (li.landlordId === s.sub) redirect("/messages");

    const existing = await db.conversation.findFirst({
      where: { listingId: li.id, participants: { some: { userId: s.sub } } },
      select: { id: true },
    });

    const convoId =
      existing?.id ??
      (
        await db.conversation.create({
          data: {
            listingId: li.id,
            participants: {
              create: [{ userId: s.sub }, { userId: li.landlordId }],
            },
            lastMessageAt: new Date(),
          },
          select: { id: true },
        })
      ).id;

    if (!existing) {
      await db.message.create({
        data: {
          conversationId: convoId,
          senderId: s.sub,
          body: `Hi there! I'm interested in "${li.title}". Is it still available?`,
        },
      });
      await db.conversation.update({
        where: { id: convoId },
        data: { lastMessageAt: new Date() },
      });
    }

    redirect(`/messages/${convoId}`);
  }

  async function toggleFavorite(): Promise<void> {
    "use server";
    const s = await requireSession(`/listing/${params.id}`);
    const key = { userId: s.sub, listingId: params.id };

    await db.$transaction(async (tx) => {
      const exists = await tx.favorite.findUnique({
        where: { userId_listingId: key },
        select: { listingId: true },
      });
      if (exists) {
        await tx.favorite.delete({ where: { userId_listingId: key } });
      } else {
        await tx.favorite.create({ data: key });
      }
    });

  }

  /* -------------------- UI -------------------- */

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Title + Location */}
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">
          {listing.title}
        </h1>

        <p className="mt-1 flex items-center gap-2 text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{listing.city}</span>
        </p>

        <p className="mt-1 text-sm text-gray-500">
          {[
            listing.propertyType,
            listing.beds ? `${listing.beds} bed` : null,
            listing.baths ? `${listing.baths} bath` : null,
            listing.furnished != null
              ? listing.furnished
                ? "Furnished"
                : "Unfurnished"
              : null,
            availableFromText !== "—"
              ? `Available from ${availableFromText}`
              : null,
          ]
            .filter(Boolean)
            .join(" • ")}
        </p>
      </div>

      {/* FIXED: Media grid with structured photos */}
      <section className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="relative aspect-[16/10] md:col-span-2 overflow-hidden rounded-2xl">
          <Image src={cover} alt="Cover" fill className="object-cover" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {photos.slice(1, 5).map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-[16/10] overflow-hidden rounded-2xl"
            >
              <Image src={photo.url} alt={photo.alt ?? ""} fill className="object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* top facts */}
      <section className="mt-5 flex flex-wrap gap-2">
        <Badge icon={BedDouble} label={`${listing.beds} bedrooms`} />
        <Badge icon={ShowerHead} label={`${listing.baths} bathrooms`} />
        {deposit && <Badge icon={DollarSign} label={`Deposit: ${deposit}`} />}
        {listing.minLeaseMonths && (
          <Badge
            icon={DollarSign}
            label={`Min lease: ${listing.minLeaseMonths} months`}
          />
        )}
        {listing.furnished != null && (
          <Badge
            icon={Sofa}
            label={listing.furnished ? "Furnished" : "Unfurnished"}
          />
        )}
        {listing.videoUrl && (
          <Badge icon={PlayCircle} label="Video tour included" />
        )}
      </section>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="space-y-8">
          {/* About */}
          <Card title="About this place">
            {listing.description && listing.description.trim() ? (
              <p className="leading-7 text-gray-800 whitespace-pre-line">
                {listing.description}
              </p>
            ) : (
              <EmptyAbout fallbackChips={highlightChips} />
            )}
          </Card>

          {/* Key details */}
          <Card title="Key details">
            <ul className="grid sm:grid-cols-2 gap-3 text-sm">
              <Row label="Property type" value={listing.propertyType ?? "—"} />
              <Row label="Available from" value={availableFromText} />
              <Row
                label="Bedrooms"
                value={listing.beds != null ? listing.beds : "—"}
              />
              <Row
                label="Bathrooms"
                value={listing.baths != null ? listing.baths : "—"}
              />
              <Row label="Max occupants" value={listing.maxOccupants ?? "—"} />
              <Row
                label="Min lease"
                value={
                  listing.minLeaseMonths
                    ? `${listing.minLeaseMonths} mo`
                    : "—"
                }
              />
            </ul>
          </Card>

          {/* What this place offers */}
          <Card title="What this place offers">
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <h3 className="text-xs font-semibold text-gray-500">
                  Interior features
                </h3>

                {interiorFeatures.length === 0 ? (
                  <p className="mt-1 text-gray-500">—</p>
                ) : (
                  <ul className="mt-1 list-disc pl-5">
                    {interiorFeatures.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500">
                  Building amenities
                </h3>

                {buildingAmenities.length === 0 ? (
                  <p className="mt-1 text-gray-500">—</p>
                ) : (
                  <ul className="mt-1 list-disc pl-5">
                    {buildingAmenities.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500">
                  Comfort
                </h3>
                <ul className="mt-1 space-y-1">
                  <li>
                    <span className="text-gray-500">Heating: </span>
                    <span className="font-medium">
                      {listing.heating ?? "—"}
                    </span>
                  </li>
                  <li>
                    <span className="text-gray-500">Cooling: </span>
                    <span className="font-medium">
                      {listing.cooling ?? "—"}
                    </span>
                  </li>
                  <li>
                    <span className="text-gray-500">Noise level: </span>
                    <span className="font-medium">
                      {prettyNoise(listing.noiseLevel as EnumNoise | null)}
                    </span>
                  </li>
                  <li>
                    <span className="text-gray-500">Natural light: </span>
                    <span className="font-medium">
                      {prettyLight(listing.naturalLight as EnumLight | null)}
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500">
                  Accessibility
                </h3>

                <ul className="mt-1 list-disc pl-5">
                  {accessibility.stepFree && <li>Step-free entrance</li>}
                  {accessibility.elevator && <li>Elevator</li>}
                  {accessibility.wideDoors && <li>Wide doors</li>}
                  {accessibility.accessibleBathroom && (
                    <li>Accessible bathroom</li>
                  )}
                  {accessibility.accessibleParking && (
                    <li>Accessible parking</li>
                  )}

                  {!accessibility.stepFree &&
                    !accessibility.elevator &&
                    !accessibility.wideDoors &&
                    !accessibility.accessibleBathroom &&
                    !accessibility.accessibleParking && <li>None</li>}
                </ul>

                {accessibility.notes?.trim() && (
                  <p className="mt-1 text-sm whitespace-pre-line">
                    {accessibility.notes}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Ideal renter */}
          <Card title="Who it's ideal for">
            <dl className="grid gap-4 sm:grid-cols-2 text-sm">
              <SummaryItem
                label="Ideal renter"
                text={listing.idealRenterSummary}
              />
              <SummaryItem label="Pets" text={listing.petSummary} />
              <SummaryItem label="Parking" text={listing.parkingSummary} />
              <SummaryItem label="Laundry" text={listing.laundrySummary} />
            </dl>
          </Card>

          {/* House rules */}
          <Card title="House rules">
            {listing.houseRules?.trim() || listing.rulesNotes?.trim() ? (
              <div className="space-y-3 text-sm whitespace-pre-line">
                {listing.houseRules?.trim() && (
                  <p>{listing.houseRules.trim()}</p>
                )}
                {listing.rulesNotes?.trim() && (
                  <p className="text-gray-700">{listing.rulesNotes.trim()}</p>
                )}
                <p className="text-gray-700">
                  Smoking inside:{" "}
                  <span className="font-medium">
                    {listing.smokingAllowed ? "Allowed" : "Not allowed"}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No house rules provided.
              </p>
            )}
          </Card>

          {/* Video */}
          {listing.videoUrl && (
            <Card title="Video tour">
              <video
                controls
                src={listing.videoUrl}
                className="w-full rounded-xl border"
              />
            </Card>
          )}

          {/* Neighborhood */}
          <Card title="Neighborhood">
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs font-semibold text-gray-500">
                  Overview
                </span>

                <p className="mt-1 text-gray-800 whitespace-pre-line">
                  {vibeSummary ||
                    listing.neighborhoodNotes?.trim() ||
                    "No neighborhood details."}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-semibold text-gray-500">
                    Notes
                  </span>
                  <p className="mt-1 whitespace-pre-line">
                    {listing.neighborhoodNotes?.trim() || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-gray-500">
                    Transit
                  </span>
                  <p className="mt-1 whitespace-pre-line">
                    {listing.transit?.trim() || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-gray-500">
                    Nearby amenities
                  </span>
                  <p className="mt-1 whitespace-pre-line">
                    {listing.amenities?.trim() || "—"}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-500">
                  Distances
                </span>

                <ul className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <Row label="Bus stop" value={meters(listing.distanceBusMeters)} />
                  <Row
                    label="Grocery"
                    value={meters(listing.distanceGroceryMeters)}
                  />
                  <Row
                    label="School"
                    value={meters(listing.distanceSchoolMeters)}
                  />
                  <Row label="Park" value={meters(listing.distanceParkMeters)} />
                  <Row
                    label="Pharmacy"
                    value={meters(listing.distancePharmacyMeters)}
                  />
                  <Row label="Gym" value={meters(listing.distanceGymMeters)} />
                </ul>
              </div>
            </div>
          </Card>

          {/* Pricing */}
          <Card title="Pricing & Policies">
            <ul className="grid sm:grid-cols-2 gap-3 text-sm">
              <Row label="Parking" value={enumLabel(listing.parkingType)} icon={Car} />
              <Row label="Pets" value={enumLabel(listing.petPolicy)} icon={PawPrint} />
              <Row label="Laundry" value={enumLabel(listing.laundry)} icon={Sofa} />
              <Row
                label="Utilities included"
                value={
                  utilitiesIncluded.length
                    ? utilitiesIncluded.join(", ")
                    : "—"
                }
                icon={Plug}
              />
              <Row
                label="Not included"
                value={
                  utilitiesNotIncluded.length
                    ? utilitiesNotIncluded.join(", ")
                    : "—"
                }
              />
              <Row
                label="Smoking"
                value={listing.smokingAllowed ? "Yes" : "No"}
              />
              <Row
                label="Furnished"
                value={listing.furnished ? "Yes" : "No"}
                icon={Sofa}
              />
              <Row
                label="Min lease"
                value={
                  listing.minLeaseMonths
                    ? `${listing.minLeaseMonths} mo`
                    : "—"
                }
              />
              <Row
                label="Max occupants"
                value={listing.maxOccupants ?? "—"}
              />
              <Row
                label="Heating"
                value={listing.heating ?? "—"}
                icon={Thermometer}
              />
              <Row
                label="Cooling"
                value={listing.cooling ?? "—"}
                icon={Wind}
              />
            </ul>
          </Card>
        </div>

        {/* Right column: price + actions */}
        <aside className="space-y-4 md:sticky md:top-8 md:self-start">
          <div className="rounded-2xl border p-5">
            <div className="text-4xl font-bold text-gray-900">
              {price ? `${price}/month` : "—"}
            </div>

            <p className="mt-2 text-gray-600">
              {listing.beds} bed • {listing.baths} bath
            </p>

            <div className="mt-2 text-sm text-gray-600">
              {deposit && <div>Deposit: {deposit}</div>}
              {utilitiesIncluded.length > 0 && (
                <div>Utilities: {utilitiesIncluded.join(", ")}</div>
              )}
            </div>

            <div className="mt-6 grid gap-3">
              <form action={contactLandlord}>
                <button className="w-full rounded-xl bg-emerald-600 text-white py-3 font-medium hover:opacity-90 transition-opacity">
                  Contact landlord
                </button>
              </form>

              {listing.landlordId && (
                <RequestViewingButton
                  listingId={listing.id}
                  landlordId={listing.landlordId}
                />
              )}

              <form action={toggleFavorite}>
                <button className="w-full rounded-xl border py-3 font-medium hover:bg-gray-50 transition-colors">
                  Save to favorites
                </button>
              </form>
            </div>

            <div className="mt-6 rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
              <div className="mb-1 text-xs tracking-wide text-gray-500">
                LANDLORD
              </div>
              <div className="font-medium">{landlordName}</div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );

  /* ---------------- helpers & small components ---------------- */

  // FIXED: properly handles stringified JSON + arrays
  function jsonStrArr(v: unknown): string[] {
    if (Array.isArray(v)) {
      return v.filter((x) => typeof x === "string");
    }

    if (typeof v === "string") {
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) {
          return parsed.filter((x) => typeof x === "string");
        }
      } catch {
        return [];
      }
    }

    return [];
  }

  function centsToDollars(cents?: number | null): string | null {
    if (typeof cents !== "number") return null;
    return `$${(cents / 100).toFixed(0)}`;
  }

  function meters(n?: number | null): string {
    return typeof n === "number" ? `${n} m` : "—";
  }

  // FIXED: normalize enum values so Parking / Pets / Laundry show properly
  function enumLabel(v?: string | null): string {
    if (!v) return "—";

    const cleaned = String(v).trim().toUpperCase();

    return cleaned
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function formatDate(d: Date | string): string {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function parseUtilities(v: unknown): UtilitiesJson {
    return v && typeof v === "object" && !Array.isArray(v)
      ? (v as UtilitiesJson)
      : {};
  }

  function parseAccessibility(v: unknown): Accessibility {
    return v && typeof v === "object" && !Array.isArray(v)
      ? (v as Accessibility)
      : {};
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

  function buildNeighborhoodSummary(
    vibe?: string | null,
    areaType?: string | null
  ): string {
    const v = enumLabel(vibe);
    const a = enumLabel(areaType);

    const vValid = v !== "—";
    const aValid = a !== "—";

    if (!vValid && !aValid) return "";
    if (vValid && aValid) return `${v} ${a.toLowerCase()} neighborhood.`;
    if (vValid) return `${v} neighborhood.`;
    return `Located in a ${a.toLowerCase()} area.`;
  }

  function Badge({
    icon: Icon,
    label,
  }: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
  }) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm bg-white/60 hover:bg-white/80 transition-colors">
        <Icon className="h-4 w-4 text-gray-700" />
        <span>{label}</span>
      </span>
    );
  }

  function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <section className="rounded-2xl border p-6 bg-white hover:shadow-sm transition-shadow">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-4">{children}</div>
      </section>
    );
  }

  function Row({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: string | number;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }) {
    return (
      <li className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-gray-50 transition-colors">
        <span className="flex items-center gap-2 text-gray-500">
          {Icon ? <Icon className="h-4 w-4" /> : null}
          {label}
        </span>
        <span className="font-medium">{value}</span>
      </li>
    );
  }

  function EmptyAbout({ fallbackChips }: { fallbackChips: string[] }) {
    return (
      <div className="rounded-xl border bg-gray-50 p-4">
        <p className="text-gray-600">
          The host hasn’t written a description yet. Highlights:
        </p>
        {fallbackChips.length > 0 && (
          <ul className="mt-3 grid sm:grid-cols-2 gap-2">
            {fallbackChips.slice(0, 8).map((h) => (
              <li key={h} className="flex items-center gap-2 text-gray-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  function SummaryItem({ label, text }: { label: string; text?: string | null }) {
    return (
      <div>
        <dt className="text-xs font-semibold text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm whitespace-pre-line">
          {text && text.trim() ? text.trim() : "—"}
        </dd>
      </div>
    );
  }

  function buildHighlights(args: {
    beds?: number | null;
    baths?: number | null;
    furnished?: boolean | null;
    petPolicy?: string | null;
    parkingType?: string | null;
    laundry?: string | null;
    neighborhoodVibe?: string | null;
    areaType?: string | null;
    minLeaseMonths?: number | null;
    maxOccupants?: number | null;
  }): string[] {
    const chips: string[] = [];

    if (typeof args.beds === "number") chips.push(`${args.beds} bedrooms`);
    if (typeof args.baths === "number") chips.push(`${args.baths} bathrooms`);
    if (args.furnished != null)
      chips.push(args.furnished ? "Furnished" : "Unfurnished");
    if (args.petPolicy) chips.push(`Pets: ${enumLabel(args.petPolicy)}`);
    if (args.parkingType) chips.push(`Parking: ${enumLabel(args.parkingType)}`);
    if (args.laundry) chips.push(`Laundry: ${enumLabel(args.laundry)}`);
    if (args.neighborhoodVibe)
      chips.push(`Vibe: ${enumLabel(args.neighborhoodVibe)}`);
    if (args.areaType) chips.push(`Area: ${enumLabel(args.areaType)}`);
    if (typeof args.minLeaseMonths === "number")
      chips.push(`Min lease ${args.minLeaseMonths} mo`);
    if (typeof args.maxOccupants === "number")
      chips.push(`Max ${args.maxOccupants} occupants`);

    return chips;
  }
}