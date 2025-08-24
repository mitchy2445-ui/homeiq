// src/components/CityRow.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type RowItem = {
  id: string | number;
  href: string;
  priceText: string;
  metaText: string;
  title: string;
  // imageSrc?: string; // hook up when you have images
};

export default function CityRow({
  title,
  items,
}: {
  title: string;
  items: RowItem[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const eps = 1;
    setCanLeft(el.scrollLeft > eps);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - eps);
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.9;
    el.scrollTo({
      left: dir === "left" ? el.scrollLeft - amount : el.scrollLeft + amount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    update();
    const onResize = () => update();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    // FULL‑BLEED WRAPPER (escapes the page max-width)
    <section className="relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw]">
      {/* Inner container keeps nice gutters and a sensible max */}
      <div className="mx-auto max-w-[1440px] px-4 md:px-6 lg:px-8">
        {/* Title + chevrons */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg md:text-xl font-semibold">{title} &gt;</h2>
          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canLeft}
              className={`p-2 rounded-full bg-white shadow hover:bg-gray-100 transition ${
                !canLeft ? "opacity-0 pointer-events-none" : ""
              }`}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canRight}
              className={`p-2 rounded-full bg-white shadow hover:bg-gray-100 transition ${
                !canRight ? "opacity-0 pointer-events-none" : ""
              }`}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional edge fades (Airbnb polish) */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />

          {/* Horizontal scroller */}
          <div
            ref={scrollerRef}
            onScroll={update}
            className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide snap-x snap-mandatory"
          >
            {items.length === 0 ? (
              <div className="text-sm text-gray-500 px-2 py-6">No listings yet.</div>
            ) : (
              items.map((it) => (
                <a
                  key={it.id}
                  href={it.href}
                  className="snap-start bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition w-[260px] shrink-0 overflow-hidden"
                >
                  {/* Replace with Image when you wire photos */}
                  <div className="relative aspect-[4/3] bg-gray-200" />
                  <div className="p-3">
                    <div className="font-semibold">{it.priceText}</div>
                    <div className="text-sm text-gray-600">{it.metaText}</div>
                    <div className="text-sm text-gray-500 truncate">{it.title}</div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
