// src/components/ListingCard.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";

export type ListingCardProps = {
  id: string | number;
  title: string;
  city?: string | null;
  priceCents: number; // price per month in cents
  beds?: number | null;
  baths?: number | null;
  images?: string[] | null; // array of image URLs
};

function formatCurrencyFromCents(cents: number) {
  return (cents / 100).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
}

export default function ListingCard({
  id,
  title,
  city,
  priceCents,
  beds,
  baths,
  images,
}: ListingCardProps) {
  const img = images && images.length > 0 ? images[0] : "/placeholder.jpg"; // ensure you have public/placeholder.jpg

  return (
    <Link
      href={`/listing/${id}`}
      className="group block w-[76vw] sm:w-[52vw] md:w-[36vw] lg:w-[28vw] xl:w-[22vw] shrink-0 snap-start"
      prefetch
    >
      <div className="overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:shadow-xl">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
          <Image
            src={img}
            alt={title}
            fill
            sizes="(max-width: 640px) 76vw, (max-width: 768px) 52vw, (max-width: 1024px) 36vw, (max-width: 1280px) 28vw, 22vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            priority={false}
          />
        </div>
        <div className="flex items-start justify-between gap-3 p-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-gray-900">
              {title}
            </h3>
            {city ? (
              <p className="truncate text-xs text-gray-500">{city}</p>
            ) : null}
            <p className="mt-1 text-sm text-gray-800">
              <span className="font-semibold">
                {formatCurrencyFromCents(priceCents)}
              </span>
              <span className="text-gray-500"> / month</span>
            </p>
          </div>
          <div className="shrink-0 text-right text-xs text-gray-600">
            {typeof beds === "number" && beds > 0 ? (
              <p>
                {beds} bed{beds > 1 ? "s" : ""}
              </p>
            ) : null}
            {typeof baths === "number" && baths > 0 ? (
              <p>
                {baths} bath{baths > 1 ? "s" : ""}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
