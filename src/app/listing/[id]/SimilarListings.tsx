import Link from "next/link";
import Image from "next/image";
import { prisma as db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

function jsonToStringArray(v: Prisma.JsonValue | null | undefined): string[] {
  if (!v) return [];
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v as string[];
  return [];
}

export default async function SimilarListings({
  city,
  excludeId,
}: { city: string; excludeId: string }) {
  const results = await db.listing.findMany({
    where: { city, NOT: { id: excludeId } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  if (results.length === 0) return null;

  return (
    <section className="mt-12">
      <h3 className="mb-4 text-xl font-semibold">More homes in {city}</h3>
      <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {results.map((l) => {
          const imgs = jsonToStringArray(l.images);
          return (
            <Link
              key={l.id}
              href={`/listing/${l.id}`}
              className="min-w-[260px] flex-1 rounded-2xl border transition hover:shadow-sm"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
                {imgs[0] ? (
                  <Image src={imgs[0]} alt={l.title} fill className="object-cover" />
                ) : (
                  <div className="h-full w-full bg-gray-200" />
                )}
              </div>
              <div className="p-3">
                <div className="line-clamp-1 font-medium">{l.title}</div>
                <div className="text-sm text-muted-foreground">{l.city}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
