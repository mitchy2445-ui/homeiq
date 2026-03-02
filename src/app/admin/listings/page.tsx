// src/app/admin/listings/page.tsx
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Image from "next/image";
import Link from "next/link";

import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ----------------------------------------------------------------------------
 * Helpers
 * --------------------------------------------------------------------------*/

// Authorization: allow ONLY admins (role === "ADMIN")
function canModerate(opts: { role?: string | null; email?: string | null }) {
  return opts.role === "ADMIN";
}

// JSON -> string[] (defensive against historical data)
function jsonToStringArray(v: Prisma.JsonValue | null | undefined): string[] {
  if (!v) return [];
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v as string[];
  return [];
}

// First image URL or undefined
function firstImageUrl(listing: { images?: Prisma.JsonValue | null }): string | undefined {
  const arr = jsonToStringArray(listing.images);
  return arr.length ? arr[0] : undefined;
}

// Currency (monthly CAD)
function toCad(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

/* ----------------------------------------------------------------------------
 * Server actions (all return Promise<void> so <form action={...}> is valid)
 * --------------------------------------------------------------------------*/

export async function approveListing(formData: FormData): Promise<void> {
  "use server";
  const session = await getSessionFromCookie();
  if (!session) notFound();
  if (!canModerate({ role: session.role as string | null, email: session.email })) notFound();

  const id = formData.get("id") as string | null;
  if (!id) return;

  await db.listing.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  revalidatePath("/admin/listings");
}

export async function rejectListing(formData: FormData): Promise<void> {
  "use server";
  const session = await getSessionFromCookie();
  if (!session) notFound();
  if (!canModerate({ role: session.role as string | null, email: session.email })) notFound();

  const id = formData.get("id") as string | null;
  if (!id) return;

  await db.listing.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  revalidatePath("/admin/listings");
}

export async function deleteListing(formData: FormData): Promise<void> {
  "use server";
  const session = await getSessionFromCookie();
  if (!session) notFound();
  if (!canModerate({ role: session.role as string | null, email: session.email })) notFound();

  const id = formData.get("id") as string | null;
  if (!id) return;

  await db.listing.delete({ where: { id } });
  revalidatePath("/admin/listings");
}

/* ----------------------------------------------------------------------------
 * Page
 * --------------------------------------------------------------------------*/

type ListingCardData = Prisma.ListingGetPayload<{
  select: {
    id: true;
    title: true;
    city: true;
    status: true;
    images: true;
    priceCents: true; // <-- use price, not priceMonthly
  };
}>;

async function getData() {
  const session = await getSessionFromCookie();
  if (!session) notFound();
  if (!canModerate({ role: session.role as string | null, email: session.email })) notFound();

  const listings = await db.listing.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      city: true,
      status: true,
      images: true,
     priceCents: true, // <-- select price
    },
  });

  const byStatus = {
    PENDING: listings.filter((l) => l.status === "PENDING"),
    APPROVED: listings.filter((l) => l.status === "APPROVED"),
    REJECTED: listings.filter((l) => l.status === "REJECTED"),
  };

  return { byStatus, userEmail: session.email ?? "" };
}

export default async function AdminListingsPage() {
  const { byStatus, userEmail } = await getData();

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-10">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admin · Listings</h1>
          <p className="text-sm text-muted-foreground">
            Moderating as <span className="font-medium">{userEmail}</span>
          </p>
        </div>
        <Link
          href="/"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-muted transition"
        >
          Back to site
        </Link>
      </header>

      {/* Pending */}
      <section>
        <h2 className="mb-3 text-xl font-semibold">Pending Approval</h2>
        {byStatus.PENDING.length === 0 ? (
          <p className="text-sm text-muted-foreground">No listings awaiting approval.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byStatus.PENDING.map((l) => (
              <li key={l.id} className="rounded-2xl border p-3">
                <ListingCard listing={l} />
                <div className="mt-3 flex gap-2">
                  <form action={approveListing}>
                    <input type="hidden" name="id" value={l.id} />
                    <button
                      type="submit"
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={rejectListing}>
                    <input type="hidden" name="id" value={l.id} />
                    <button
                      type="submit"
                      className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      Reject
                    </button>
                  </form>
                  <form action={deleteListing} className="ml-auto">
                    <input type="hidden" name="id" value={l.id} />
                    <button
                      type="submit"
                      className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Approved */}
      <section>
        <h2 className="mb-3 text-xl font-semibold">Approved</h2>
        {byStatus.APPROVED.length === 0 ? (
          <p className="text-sm text-muted-foreground">No approved listings yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byStatus.APPROVED.map((l) => (
              <li key={l.id} className="rounded-2xl border p-3">
                <ListingCard listing={l} />
                <div className="mt-3 flex gap-2">
                  <form action={rejectListing}>
                    <input type="hidden" name="id" value={l.id} />
                    <button
                      type="submit"
                      className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      Move to Rejected
                    </button>
                  </form>
                  <form action={deleteListing} className="ml-auto">
                    <input type="hidden" name="id" value={l.id} />
                    <button
                      type="submit"
                      className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Rejected */}
      <section>
        <h2 className="mb-3 text-xl font-semibold">Rejected</h2>
        {byStatus.REJECTED.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rejected listings.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byStatus.REJECTED.map((l) => (
              <li key={l.id} className="rounded-2xl border p-3">
                <ListingCard listing={l} />
                <div className="mt-3 flex gap-2">
                  <form action={approveListing}>
                    <input type="hidden" name="id" value={l.id} />
                    <button
                      type="submit"
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      Move to Approved
                    </button>
                  </form>
                  <form action={deleteListing} className="ml-auto">
                    <input type="hidden" name="id" value={l.id} />
                    <button
                      type="submit"
                      className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

/* ----------------------------------------------------------------------------
 * Small card component (server)
 * --------------------------------------------------------------------------*/

function ListingCard({ listing }: { listing: ListingCardData }) {
  const img = firstImageUrl(listing);
  return (
    <div className="flex gap-3">
      <div className="relative h-24 w-32 overflow-hidden rounded-xl bg-muted">
        {img ? (
          <Image src={img} alt={listing.title ?? "Listing"} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{listing.title || "Untitled listing"}</div>
        <div className="text-sm text-muted-foreground">{listing.city}</div>
        <div className="mt-1 text-sm">
          {toCad((listing.priceCents ?? 0) / 100)}/mo
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          {listing.status}
        </div>
        <div className="mt-1">
          <Link
            href={`/listing/${listing.id}`}
            className="text-xs underline underline-offset-4 hover:opacity-80"
          >
            View details
          </Link>
        </div>
      </div>
    </div>
  );
}
