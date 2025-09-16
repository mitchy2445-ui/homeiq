// src/app/listing/[id]/page.tsx
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
      images: true,
      videoUrl: true,
      neighborhoodVibe: true,
      areaType: true,
      distanceBusMeters: true,
      distanceGroceryMeters: true,
      distanceSchoolMeters: true,
      distanceParkMeters: true,
      distancePharmacyMeters: true,
      distanceGymMeters: true,
      depositCents: true,
      parkingType: true,
      petPolicy: true,
      laundry: true,
      utilitiesIncluded: true,
      smokingAllowed: true,
      furnished: true,
      minLeaseMonths: true,
      maxOccupants: true,
      heating: true,
      cooling: true,
      landlordId: true,
      landlord: {
        select: {
          landlordProfile: { select: { fullName: true } },
          name: true,
        },
      },
    },
  });

  if (!listing) notFound();

  const photos = jsonStrArr(listing.images);
  const cover = photos[0] ?? "/placeholder.svg";
  const price = centsToDollars(listing.price);
  const deposit =
    typeof listing.depositCents === "number"
      ? `$${(listing.depositCents / 100).toFixed(0)}`
      : null;
  const utilities = jsonStrArr(listing.utilitiesIncluded);
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

  /* ---------- actions ---------- */
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
            participants: { create: [{ userId: s.sub }, { userId: li.landlordId }] },
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

  // Toggle favorite, then go to /favorites so the user sees it immediately
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

    // Immediate confirmation UX:
    redirect("/favorites");
    // If you prefer to stay on the page, comment the redirect and uncomment:
    // revalidatePath(`/listing/${params.id}`);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Title + Location */}
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">{listing.title}</h1>
        <p className="mt-1 flex items-center gap-2 text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{listing.city}</span>
        </p>
      </div>

      {/* Media grid */}
      <section className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="relative aspect-[16/10] md:col-span-2 overflow-hidden rounded-2xl">
          <Image src={cover} alt="Cover" fill className="object-cover" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {photos.slice(1, 5).map((url) => (
            <div key={url} className="relative aspect-[16/10] overflow-hidden rounded-2xl">
              <Image src={url} alt="Photo" fill className="object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* top facts / badges */}
      <section className="mt-5 flex flex-wrap gap-2">
        <Badge icon={BedDouble} label={`${listing.beds} bedrooms`} />
        <Badge icon={ShowerHead} label={`${listing.baths} bathrooms`} />
        {deposit && <Badge icon={DollarSign} label={`Deposit: ${deposit}`} />}
        {listing.videoUrl && <Badge icon={PlayCircle} label="Video tour included" />}
      </section>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="space-y-8">
          <Card title="About this place">
            {listing.description && listing.description.trim() ? (
              <p className="leading-7 text-gray-800 whitespace-pre-line">
                {listing.description}
              </p>
            ) : (
              <EmptyAbout fallbackChips={highlightChips} />
            )}
          </Card>

          {listing.videoUrl && (
            <Card title="Video tour">
              <video controls src={listing.videoUrl} className="w-full rounded-xl border" />
            </Card>
          )}

          <Card title="Neighborhood">
            <ul className="grid sm:grid-cols-2 gap-3 text-sm">
              <Row label="Vibe" value={enumLabel(listing.neighborhoodVibe)} />
              <Row label="Area type" value={enumLabel(listing.areaType)} />
              <Row label="Bus stop" value={meters(listing.distanceBusMeters)} />
              <Row label="Grocery" value={meters(listing.distanceGroceryMeters)} />
              <Row label="School" value={meters(listing.distanceSchoolMeters)} />
              <Row label="Park" value={meters(listing.distanceParkMeters)} />
              <Row label="Pharmacy" value={meters(listing.distancePharmacyMeters)} />
              <Row label="Gym" value={meters(listing.distanceGymMeters)} />
            </ul>
          </Card>

          <Card title="Pricing & Policies">
            <ul className="grid sm:grid-cols-2 gap-3 text-sm">
              <Row label="Parking" value={enumLabel(listing.parkingType)} icon={Car} />
              <Row label="Pets" value={enumLabel(listing.petPolicy)} icon={PawPrint} />
              <Row label="Laundry" value={enumLabel(listing.laundry)} icon={Sofa} />
              <Row
                label="Utilities included"
                value={utilities.length ? utilities.join(", ") : "—"}
                icon={Plug}
              />
              <Row label="Smoking allowed" value={listing.smokingAllowed ? "Yes" : "No"} />
              <Row label="Furnished" value={listing.furnished ? "Yes" : "No"} icon={Sofa} />
              <Row
                label="Min lease"
                value={listing.minLeaseMonths ? `${listing.minLeaseMonths} mo` : "—"}
              />
              <Row label="Max occupants" value={listing.maxOccupants ?? "—"} />
              <Row label="Heating" value={listing.heating ?? "—"} icon={Thermometer} />
              <Row label="Cooling" value={listing.cooling ?? "—"} icon={Wind} />
            </ul>
          </Card>
        </div>

        {/* Right column: price + actions */}
        <aside className="space-y-4">
          <div className="rounded-2xl border p-5">
            <div className="text-3xl font-semibold">
              {price ? `${price} /` : "— /"}
              <span className="text-xl font-normal text-gray-600"> month</span>
            </div>
            <p className="mt-1 text-gray-600">
              {listing.beds} bed • {listing.baths} bath
            </p>

            <div className="mt-5 grid gap-2">
              <form action={contactLandlord}>
                <button className="w-full rounded-xl bg-emerald-600 text-white py-3 font-medium hover:opacity-95">
                  Contact landlord
                </button>
              </form>

              {/* NEW: Request virtual viewing (requires RequestViewingButton.tsx) */}
              {listing.landlordId && (
                <RequestViewingButton
                  listingId={listing.id}
                  landlordId={listing.landlordId}
                />
              )}

              <form action={toggleFavorite}>
                <button className="w-full rounded-xl border py-2 font-medium hover:bg-gray-50">
                  Save to favorites
                </button>
              </form>
            </div>

            <div className="mt-5 rounded-xl border bg-gray-50 p-3 text-sm text-gray-600">
              <div className="mb-1 text-xs tracking-wide text-gray-500">LANDLORD</div>
              <div className="font-medium">{landlordName}</div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

/* ---------------- helpers & small components ---------------- */

function jsonStrArr(v: unknown): string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : [];
}
function centsToDollars(cents?: number | null): string | null {
  if (typeof cents !== "number") return null;
  return `$${(cents / 100).toFixed(0)}`;
}
function meters(n?: number | null): string {
  return typeof n === "number" ? `${n} m` : "—";
}
function enumLabel(v?: string | null): string {
  if (!v) return "—";
  return String(v).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
function Badge({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm bg-white/60">
      <Icon className="h-4 w-4 text-gray-700" />
      <span>{label}</span>
    </span>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
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
    <li className="flex items-center justify-between rounded-lg border px-3 py-2">
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
        The host hasn’t written a description yet. Here are a few highlights:
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
  if (args.furnished != null) chips.push(args.furnished ? "Furnished" : "Unfurnished");
  if (args.petPolicy) chips.push(`Pets: ${enumLabel(args.petPolicy)}`);
  if (args.parkingType) chips.push(`Parking: ${enumLabel(args.parkingType)}`);
  if (args.laundry) chips.push(`Laundry: ${enumLabel(args.laundry)}`);
  if (args.neighborhoodVibe) chips.push(`Vibe: ${enumLabel(args.neighborhoodVibe)}`);
  if (args.areaType) chips.push(`Area: ${enumLabel(args.areaType)}`);
  if (typeof args.minLeaseMonths === "number") chips.push(`Min lease ${args.minLeaseMonths} mo`);
  if (typeof args.maxOccupants === "number") chips.push(`Max ${args.maxOccupants} occupants`);
  return chips;
}
