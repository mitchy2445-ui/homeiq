"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Heart } from "lucide-react";
import Image from "next/image";
import type { $Enums } from "@prisma/client";

/* ---------------------------------------------
 * Types
 * --------------------------------------------*/

export type ListingCardData = {
  id: string;
  title: string;
  city: string;
  imageUrl?: string;          // from homepage toCard fallback
  images?: string[];          // preferred array (if passed)
  priceCents: number;
  beds: number;
  baths: number;
  status?: $Enums.Status;
};

export type ListingCardProps =
  | {
      listing: ListingCardData;
      hrefBase?: string;
    }
  | (Partial<ListingCardData> & { hrefBase?: string });

/* ---------------------------------------------
 * Component
 * --------------------------------------------*/

export default function ListingCard(props: ListingCardProps) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const startX = useRef<number | null>(null);

  /* Normalize props */
  const listing =
    "listing" in props ? props.listing : (props as ListingCardData);

  const id = listing?.id;

  /* Favorite state */
  useEffect(() => {
    if (!id) return;

    let mounted = true;

    fetch("/api/favorites", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: { listingId: string }[]) => {
        if (!mounted) return;
        setIsFavorite(rows.some((r) => r.listingId === id));
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [id]);

  /* Skeleton */
  if (!listing?.id) {
    return (
      <div className="w-[260px] rounded-2xl border bg-white p-3">
        <div className="aspect-[4/3] rounded-xl bg-gray-200 animate-pulse" />
        <div className="mt-3 h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
        <div className="mt-2 h-3 w-1/2 rounded bg-gray-200 animate-pulse" />
      </div>
    );
  }

  /* Data – prioritize images array, fallback to single imageUrl */
  const {
    title = "Untitled listing",
    city = "",
    images = [],                       // array from DB/component
    imageUrl,                          // single from homepage
    priceCents = 0,
    beds = 0,
    baths = 0,
    status,
  } = listing;

  // Build photo list: prefer images array, fallback to imageUrl as single-item array
  const photoList = images.length > 0 
    ? images 
    : (imageUrl ? [imageUrl] : []);
  
  const hasImages = photoList.length > 0;
  const currentImage = photoList[index] || "/placeholder-house.jpg"; // only if truly no image

  const href = `${props.hrefBase ?? "/listing"}/${id}`;
  const price = Math.round(priceCents / 100);
  const hasMultiple = photoList.length > 1;

  /* Favorite toggle */
  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const next = !isFavorite;
    setIsFavorite(next);

    await fetch("/api/favorites", {
      method: next ? "POST" : "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id }),
    });
  };

  /* Carousel helpers */
  const next = () =>
    hasMultiple && setIndex((i) => (i + 1) % photoList.length);

  const prev = () =>
    hasMultiple && setIndex((i) => (i - 1 + photoList.length) % photoList.length);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    startX.current = null;
  };

  /* Render */
  return (
    <Link
      href={href}
      data-card
      className="
        group block w-[260px] overflow-hidden rounded-2xl border bg-white
        transition-all duration-200
        hover:-translate-y-0.5
        hover:shadow-xl
        hover:border-emerald-700
        hover:ring-1 hover:ring-emerald-700
      "
    >
      {/* Image / Carousel */}
      <div
        className="relative aspect-[4/3] overflow-hidden bg-gray-100"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          src={currentImage}
          alt={title}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 640px) 100vw, 260px"
          onLoad={() => setLoaded(true)}
          priority={index === 0}
        />

        {/* Favorite button */}
        <button
          onClick={toggleFavorite}
          aria-label="Toggle favorite"
          className="
            absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow
            opacity-0 transition group-hover:opacity-100
          "
        >
          <Heart
            className={`h-4 w-4 ${
              isFavorite
                ? "fill-emerald-700 text-emerald-700"
                : "text-gray-600 hover:text-emerald-700"
            }`}
          />
        </button>

        {/* Status badge */}
        {status === "APPROVED" && (
          <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium shadow">
            Guest favorite
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-medium">{title}</h3>
          <div className="text-sm text-gray-700">
            ${price.toLocaleString()}/mo
          </div>
        </div>

        <div className="mt-1 truncate text-sm text-gray-600">
          {city} • {beds} bed • {baths} bath
        </div>
      </div>
    </Link>
  );
}