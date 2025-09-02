// src/components/Section.tsx
"use client";

import React, { useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ListingCard from "./ListingCard";
import type { ListingCardProps } from "./ListingCard";

export type SectionProps = {
  title: string;
  href?: string; // optional "See all" link
  listings: ListingCardProps[];
  className?: string;
};

export default function Section({ title, href, listings, className }: SectionProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollByCards = useCallback((dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>("a, [data-card]");
    const fallback = Math.min(el.clientWidth * 0.85, 480);
    const delta = firstCard?.clientWidth ?? fallback;
    el.scrollBy({ left: dir * (delta + 16), behavior: "smooth" });
  }, []);

  if (!Array.isArray(listings) || listings.length === 0) return null;

  return (
    <section className={["space-y-3", className].filter(Boolean).join(" ")}>
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollByCards(-1)}
            className="hidden rounded-full border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 active:scale-95 sm:inline-flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollByCards(1)}
            className="hidden rounded-full border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 active:scale-95 sm:inline-flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {href ? (
            <Link
              href={href}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              See all
            </Link>
          ) : null}
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="scroll-container -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2"
      >
        {listings.map((l) => (
          <ListingCard key={String(l.id)} {...l} />
        ))}
      </div>

      <style jsx>{`
        .scroll-container {
          scrollbar-width: none; /* Firefox */
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        .scroll-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
