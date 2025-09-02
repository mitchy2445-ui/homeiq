// src/app/listing/[id]/SimilarListings.tsx
import Section from "@/components/Section";
import type { ListingCardProps } from "@/components/ListingCard";
import { prisma as db } from "@/lib/db";
import type { Listing, Prisma } from "@prisma/client";

type Props = {
  city: string;
  excludeId: string;
};

function jsonToStringArray(v: Prisma.JsonValue | null | undefined): string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : [];
}

function toCard(l: Listing): ListingCardProps {
  return {
    id: l.id,
    title: l.title ?? "Untitled",
    city: l.city ?? undefined,
    priceCents: typeof l.price === "number" ? l.price : 0, // your schema uses `price` in cents
    beds: typeof l.beds === "number" ? l.beds : undefined,
    baths: typeof l.baths === "number" ? l.baths : undefined,
    images: jsonToStringArray(l.images),
  };
}

export default async function SimilarListings({ city, excludeId }: Props) {
  const rows = await db.listing.findMany({
    where: {
      status: "APPROVED",       // keep consistency with public pages
      city,
      NOT: { id: excludeId },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  if (rows.length === 0) return null;

  const items = rows.map(toCard);

  return (
    <section className="mt-12">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
        <Section title={`Similar homes in ${city}`} listings={items} />
      </div>
    </section>
  );
}
