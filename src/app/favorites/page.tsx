// src/app/favorites/page.tsx
import { prisma as db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import Image from "next/image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const s = await requireSession("/favorites");

  const favorites = await db.favorite.findMany({
    where: { userId: s.sub },
    orderBy: { createdAt: "desc" },
    select: {
      listingId: true,
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          price: true, // cents
          beds: true,
          baths: true,
          images: true, // Json string[]
        },
      },
    },
  });

  async function removeFavorite(formData: FormData) {
    "use server";
    const ss = await requireSession("/favorites");
    const listingId = String(formData.get("listingId") || "").trim();
    if (!listingId) return;
    await db.favorite.delete({
      where: { userId_listingId: { userId: ss.sub, listingId } },
    });
    revalidatePath("/favorites");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Saved listings</h1>

      {favorites.length === 0 ? (
        <div className="mt-6 rounded-2xl border bg-gray-50 p-6">
          <p className="text-gray-700">
            You haven’t saved any places yet. Browse listings and tap
            <span className="mx-1 rounded-md border px-2 py-0.5 text-sm">Save to favorites</span>.
          </p>
          <a
            href="/listings"
            className="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:opacity-95"
          >
            Browse listings
          </a>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((f) => {
            const l = f.listing!;
            const imgs =
              Array.isArray(l.images) && l.images.every((x) => typeof x === "string")
                ? (l.images as string[])
                : [];
            const cover = imgs[0] ?? "/placeholder.svg";
            const price = `$${(l.price / 100).toFixed(0)}`;

            return (
              <li key={l.id} className="rounded-2xl border overflow-hidden bg-white">
                <a href={`/listing/${l.id}`} className="block">
                  <div className="relative aspect-[16/10] bg-gray-100">
                    <Image src={cover} alt={l.title} fill className="object-cover" />
                  </div>
                </a>
                <div className="p-4">
                  <div className="font-medium">{l.title}</div>
                  <div className="text-sm text-gray-600">
                    {l.city} • {l.beds} bed • {l.baths} bath
                  </div>
                  <div className="mt-1 font-semibold">{price}/mo</div>
                  <div className="mt-4 flex items-center gap-2">
                    <a
                      href={`/listing/${l.id}`}
                      className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      View listing
                    </a>
                    <form action={removeFavorite}>
                      <input type="hidden" name="listingId" value={l.id} />
                      <button
                        className="rounded-xl px-3 py-2 text-sm border hover:bg-gray-50"
                        type="submit"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
