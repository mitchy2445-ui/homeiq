// src/components/ListingCard.tsx
import Link from "next/link";
import Image from "next/image";

type Props = {
  href?: string;
  imageSrc?: string;     // NEW: optional image
  title?: string;        // NEW: optional title for alt/aria
  price?: string;        // e.g., "$1,450 / mo"
  meta?: string;         // e.g., "2 bd · 1 ba"
  location?: string;     // e.g., "Downtown"
};

export default function ListingCard({
  href = "#",
  imageSrc,
  title = "Listing",
  price = "$X,XXX / mo",
  meta = "2 bd · 1 ba",
  location = "Downtown",
}: Props) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 hover:scale-[1.015] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black/10 min-w-[280px] max-w-[300px] flex-shrink-0"
      aria-label={`View listing: ${title} in ${location}`}
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={`${title} in ${location}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 80vw, 300px"
            priority={false}
          />
        ) : (
          // graceful fallback if no image yet
          <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">
            No photo
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="font-semibold leading-tight truncate">{price}</div>
        <div className="text-sm text-gray-600 truncate">{meta}</div>
        <div className="text-sm text-gray-500 truncate">{location}</div>
      </div>
    </Link>
  );
}
