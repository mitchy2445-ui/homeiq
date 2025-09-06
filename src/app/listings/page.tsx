// src/app/listings/page.tsx
import Image from "next/image";
import type { Prisma } from "@prisma/client";
import { prisma as db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // --- helpers ---
  const getStr = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  const getInt = (v: string | string[] | undefined) => {
    const s = getStr(v);
    if (!s) return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };

  // URL params (treat max as DOLLARS; convert to cents)
  const city = getStr(searchParams.city);
  const beds = getInt(searchParams.beds);
  const maxDollars = getInt(searchParams.max);
  const maxCents = typeof maxDollars === "number" ? maxDollars * 100 : undefined;

  // Build typed where clause (no `mode` on SQLite)
  const where: Prisma.ListingWhereInput = { status: "APPROVED" };
  if (city) where.city = { contains: city }; // SQLite: no `mode` support
  if (typeof beds === "number") where.beds = { gte: beds };
  if (typeof maxCents === "number") where.price = { lte: maxCents };

  const listings = await db.listing.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 24,
    select: {
      id: true,
      title: true,
      city: true,
      price: true,
      beds: true,
      baths: true,
      images: true, // Json string[]
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Browse listings</h1>

      {/* Filters (GET) */}
      <form className="mt-4 grid gap-2 sm:grid-cols-4" method="get">
        <input
          name="city"
          defaultValue={city}
          placeholder="City (e.g., Winnipeg)"
          className="rounded-xl border px-3 py-2"
        />
        <select name="beds" defaultValue={beds ?? ""} className="rounded-xl border px-3 py-2">
          <option value="">Beds (min)</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>
        <input
          name="max"
          type="number"
          min={0}
          step={100}
          defaultValue={maxDollars ?? ""}
          placeholder="Max price (USD/mo)"
          className="rounded-xl border px-3 py-2"
        />
        <button className="rounded-xl bg-emerald-600 text-white px-4 py-2">Search</button>
      </form>

      {/* Results */}
      {listings.length === 0 ? (
        <div className="mt-6 rounded-2xl border bg-gray-50 p-6">
          <p className="text-gray-700">No results. Try widening your filters.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => {
            const imgs =
              Array.isArray(l.images) && l.images.every((x) => typeof x === "string")
                ? (l.images as string[])
                : [];
            const cover = imgs[0] ?? "/placeholder.svg";
            const price = `$${(l.price / 100).toFixed(0)}`;

            return (
              <li key={l.id} className="rounded-2xl border overflow-hidden bg-white">
                <a href={`/listing/${l.id}`} className="block">
                  <div className="relative aspect-[16/10] bg-gray-100">
                    <Image src={cover} alt={l.title} fill className="object-cover" />
                  </div>
                </a>
                <div className="p-4">
                  <div className="font-medium line-clamp-1">{l.title}</div>
                  <div className="text-sm text-gray-600">
                    {l.city} • {l.beds} bed • {l.baths} bath
                  </div>
                  <div className="mt-1 font-semibold">{price}/mo</div>
                  <a
                    href={`/listing/${l.id}`}
                    className="mt-3 inline-block rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    View details
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
