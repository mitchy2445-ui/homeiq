// src/app/search/page.tsx
import { prisma } from "@/lib/db";
import type { Listing, Prisma } from "@prisma/client";
import ListingCard from "@/components/ListingCard";
import SearchFilters from "@/components/SearchFilters";

export const dynamic = "force-dynamic"; // fresh queries in dev

type SearchParams = {
  city?: string;
  q?: string;
  minPrice?: string; // cents
  maxPrice?: string; // cents
  beds?: string;
  baths?: string;
};

function jsonToStringArray(v: Prisma.JsonValue | null | undefined): string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : [];
}

function toCard(l: Listing) {
  return {
    id: l.id,
    title: l.title ?? "Untitled",
    city: l.city ?? undefined,
    priceCents: typeof l.price === "number" ? l.price : 0,
    beds: typeof l.beds === "number" ? l.beds : undefined,
    baths: typeof l.baths === "number" ? l.baths : undefined,
    images: jsonToStringArray(l.images),
  };
}

function asInt(s?: string): number | undefined {
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const city = (searchParams.city ?? "").trim();
  const q = (searchParams.q ?? "").trim();

  const minPrice = asInt(searchParams.minPrice);
  const maxPrice = asInt(searchParams.maxPrice);
  const beds = asInt(searchParams.beds);
  const baths = asInt(searchParams.baths);

  // NOTE: On SQLite, StringFilter doesn't support `mode: 'insensitive'`.
  // Use plain `contains` (SQLite LIKE is already case-insensitive for ASCII).
  const where: Prisma.ListingWhereInput = {
    status: "APPROVED",
    ...(city ? { city } : null),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { city: { contains: q } },
          ],
        }
      : null),
    ...(typeof beds === "number" ? { beds: { gte: beds } } : null),
    ...(typeof baths === "number" ? { baths: { gte: baths } } : null),
    ...(typeof minPrice === "number" || typeof maxPrice === "number"
      ? {
          price: {
            ...(typeof minPrice === "number" ? { gte: minPrice } : null),
            ...(typeof maxPrice === "number" ? { lte: maxPrice } : null),
          },
        }
      : null),
  };

  const results = await prisma.listing.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: 60,
  });

  const cards = results.map(toCard);

  return (
    <main className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-semibold">Search homes</h1>
      <p className="mt-1 text-gray-600">
        Filter by city, price, bedrooms, and bathrooms.
      </p>

      <div className="mt-6">
        <SearchFilters />
      </div>

      {cards.length === 0 ? (
        <div className="mt-12 rounded-2xl border bg-white p-8 text-center text-gray-600">
          No listings match your filters. Try widening your search.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c) => (
            <ListingCard key={String(c.id)} {...c} />
          ))}
        </div>
      )}
    </main>
  );
}
