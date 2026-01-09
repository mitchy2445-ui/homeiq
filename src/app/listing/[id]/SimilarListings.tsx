// src/app/listing/[id]/SimilarListings.tsx
import Section from "@/components/Section";
import type { ListingCardProps } from "@/components/ListingCard";
import { prisma as db } from "@/lib/db";

type Props = {
  city: string;
  excludeId: string;
};

export default async function SimilarListings({ city, excludeId }: Props) {
  const rows = await db.listing.findMany({
    where: {
      status: "APPROVED",
      city,
      NOT: { id: excludeId },
    },
    orderBy: { createdAt: "desc" },
    take: 12,

    // ✅ THIS FIXES `photos` ACCESS
    include: {
      photos: {
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
    },
  });

  if (rows.length === 0) return null;

  // ✅ CORRECT ListingCardProps SHAPE
  const items: ListingCardProps[] = rows.map((l) => ({
    listing: {
      id: l.id,
      title: l.title ?? "Untitled",
      city: l.city ?? "",
      imageUrl: l.photos?.[0]?.url, // ✅ WORKS NOW
      priceCents: typeof l.price === "number" ? l.price : 0,
      beds: typeof l.beds === "number" ? l.beds : 0,
      baths: typeof l.baths === "number" ? l.baths : 0,
    },
  }));

  return (
    <section className="mt-12">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
        <Section
          title={`Similar homes in ${city}`}
          listings={items}
        />
      </div>
    </section>
  );
}
