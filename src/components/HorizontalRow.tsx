// src/components/HorizontalRow.tsx
"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ListingCard, { type ListingCardData } from "./ListingCard";

export default function HorizontalRow({
  title,
  subtitle,
  viewAllHref,
  items,
}: {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  items: ListingCardData[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByAmount = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.9) * (dir === "left" ? -1 : 1);
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className="relative">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
          {subtitle ? <p className="text-gray-600 text-sm">{subtitle}</p> : null}
        </div>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            View all →
          </Link>
        ) : null}
      </div>

      <div className="relative">
        {/* Gradient edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent rounded-l-2xl" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent rounded-r-2xl" />

        {/* Controls (desktop) */}
        <button
          aria-label="Scroll left"
          onClick={() => scrollByAmount("left")}
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full border bg-white shadow hover:bg-gray-50"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          aria-label="Scroll right"
          onClick={() => scrollByAmount("right")}
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full border bg-white shadow hover:bg-gray-50"
        >
          <ChevronRight size={18} />
        </button>

        {/* Track */}
        <div
          ref={scrollerRef}
          className="no-scrollbar scroll-smooth overflow-x-auto snap-x snap-mandatory"
        >
          <div className="flex gap-4 pr-2">
            {items.map((it) => (
              <ListingCard key={it.id} listing={it} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
