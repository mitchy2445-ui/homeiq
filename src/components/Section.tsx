// src/components/Section.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react"; // npm i lucide-react
import ListingCard from "./ListingCard";

type CardData = {
  id: string | number;
  href?: string;
  imageSrc?: string;
  title?: string;
  price?: string;
  meta?: string;
  location?: string;
};

type Props = {
  title: string;
  listings: CardData[];
};

export default function Section({ title, listings }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth, scrollWidth } = el;
    // small epsilon to avoid off-by-1 on some browsers
    const epsilon = 1;
    setCanLeft(scrollLeft > epsilon);
    setCanRight(scrollLeft + clientWidth < scrollWidth - epsilon);
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.9; // ~one viewport minus a bit
    el.scrollTo({
      left: dir === "left" ? el.scrollLeft - amount : el.scrollLeft + amount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    updateArrows();
    const onResize = () => updateArrows();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-xl font-bold">{title}</h2>

        {/* Chevron buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canLeft}
            aria-label="Scroll left"
            aria-hidden={!canLeft}
            className={`p-2 rounded-full bg-white shadow transition
              hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/10
              ${!canLeft ? "opacity-0 pointer-events-none" : "opacity-100"}
            `}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => scroll("right")}
            disabled={!canRight}
            aria-label="Scroll right"
            aria-hidden={!canRight}
            className={`p-2 rounded-full bg-white shadow transition
              hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/10
              ${!canRight ? "opacity-0 pointer-events-none" : "opacity-100"}
            `}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Optional edge fade (nice Airbnb-like polish) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />

        <div
          ref={scrollRef}
          onScroll={updateArrows}
          className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide px-2 snap-x snap-mandatory"
        >
          {listings.map((listing) => (
            <div key={listing.id} className="snap-start">
              <ListingCard {...listing} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
