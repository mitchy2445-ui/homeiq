// src/app/listing/[id]/loading.tsx
export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 animate-pulse">
      {/* Back link */}
      <div className="mb-6 h-4 w-28 rounded bg-gray-200" />

      {/* Title + location */}
      <div className="mb-2 h-8 w-2/3 rounded bg-gray-200" />
      <div className="mb-6 h-4 w-40 rounded bg-gray-200" />

      {/* Gallery: 1 large + 4 small */}
      <div className="mb-8 grid grid-cols-1 gap-2 md:grid-cols-4">
        <div className="aspect-[16/11] rounded-2xl bg-gray-200 md:col-span-2 md:row-span-2 md:aspect-[4/3]" />
        <div className="hidden aspect-[4/3] rounded-2xl bg-gray-200 md:block" />
        <div className="hidden aspect-[4/3] rounded-2xl bg-gray-200 md:block" />
        <div className="hidden aspect-[4/3] rounded-2xl bg-gray-200 md:block" />
        <div className="hidden aspect-[4/3] rounded-2xl bg-gray-200 md:block" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT: details */}
        <section className="space-y-8">
          {/* Quick facts chips */}
          <div className="flex flex-wrap gap-3">
            <div className="h-6 w-20 rounded-full border bg-gray-100" />
            <div className="h-6 w-20 rounded-full border bg-gray-100" />
          </div>

          {/* About section */}
          <div>
            <div className="mb-3 h-6 w-44 rounded bg-gray-200" />
            <div className="h-20 w-full rounded bg-gray-200" />
          </div>

          {/* Location block */}
          <div>
            <div className="mb-3 h-6 w-36 rounded bg-gray-200" />
            <div className="h-64 w-full rounded-2xl border bg-gray-50" />
          </div>

          {/* Virtual viewing placeholder */}
          <div>
            <div className="mb-3 h-6 w-40 rounded bg-gray-200" />
            <div className="aspect-video w-full rounded-2xl bg-gray-200" />
          </div>
        </section>

        {/* RIGHT: sticky booking/contact card */}
        <aside className="md:sticky md:top-24">
          <div className="rounded-3xl border p-6 shadow-sm">
            <div className="mb-5 space-y-2">
              <div className="h-8 w-40 rounded bg-gray-200" />
              <div className="h-4 w-28 rounded bg-gray-200" />
            </div>
            <div className="space-y-3">
              <div className="h-12 w-full rounded-xl bg-gray-200" />
              <div className="h-12 w-full rounded-xl border bg-gray-50" />
            </div>
            <div className="mt-5 h-16 w-full rounded-xl bg-gray-50" />
          </div>
        </aside>
      </div>

      {/* Similar listings (optional) */}
      <section className="mt-12">
        <div className="mb-4 h-6 w-60 rounded bg-gray-200" />
        <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-[260px] flex-1 rounded-2xl border">
              <div className="relative aspect-[4/3] w-full rounded-t-2xl bg-gray-200" />
              <div className="p-3">
                <div className="mb-2 h-5 w-40 rounded bg-gray-200" />
                <div className="h-4 w-24 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
