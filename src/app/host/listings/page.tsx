// src/app/host/listings/page.tsx
import Link from "next/link";
import Image from "next/image";
import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { submitListing } from "@/app/actions/listings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HostListingsPage() {
  const s = await requireSession("/host/listings");

  // Fetch my listings
  const listings = await db.listing.findMany({
    where: { landlordId: s.sub },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      city: true,
      status: true,
      price: true,
      beds: true,
      baths: true,
      images: true,
    },
  });

  /* ---------- actions ---------- */

  // Wrapper: discard { ok: boolean } so <form action> accepts it
  async function submitListingVoid(formData: FormData): Promise<void> {
    "use server";
    await submitListing(formData);
  }

  // Keep local unpublish for convenience: APPROVED/PENDING -> DRAFT
  async function unpublish(formData: FormData): Promise<void> {
    "use server";
    const ss = await requireSession("/host/listings");
    const id = String(formData.get("id") || "");
    if (!id) return;

    const owned = await db.listing.findFirst({
      where: { id, landlordId: ss.sub },
      select: { id: true, status: true },
    });
    if (!owned) return;

    await db.listing.update({ where: { id }, data: { status: "DRAFT" } });

    // Revalidate affected pages
    revalidatePath("/listings");
    revalidatePath("/host/listings");
    revalidatePath(`/listing/${id}`);
  }

  const counts = listings.reduce(
    (acc, l) => ((acc[l.status as keyof typeof acc] += 1), acc),
    { DRAFT: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 }
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Listings</h1>
        <Link
          href="/host/basics"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-white"
        >
          + New listing
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-700">
        <Badge label={`Drafts: ${counts.DRAFT}`} />
        <Badge label={`Pending: ${counts.PENDING}`} />
        <Badge label={`Approved: ${counts.APPROVED}`} />
        <Badge label={`Rejected: ${counts.REJECTED}`} />
      </div>

      {!listings.length ? (
        <p className="mt-6 text-gray-600">You have no listings yet.</p>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => {
            const imgs = Array.isArray(l.images) ? (l.images as string[]) : [];
            const cover = imgs[0] ?? "/placeholder.svg";
            const price =
              typeof l.price === "number" ? `$${(l.price / 100).toFixed(0)}/mo` : "—";
            return (
              <li key={l.id} className="rounded-2xl border bg-white overflow-hidden">
                <Link href={`/listing/${l.id}`} className="block">
                  <div className="relative aspect-[4/3]">
                    <Image src={cover} alt={l.title} fill className="object-cover" />
                  </div>
                </Link>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-medium line-clamp-1">{l.title}</h2>
                    <span className="text-xs rounded-full border px-2 py-0.5">
                      {l.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {l.city} • {l.beds} bed · {l.baths} bath
                  </p>
                  <div className="mt-2 font-semibold">{price}</div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/host/review?id=${l.id}`}
                      className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      Edit
                    </Link>

                    {/* Submit for review: DRAFT/REJECTED -> PENDING */}
                    {(l.status === "DRAFT" || l.status === "REJECTED") && (
                      <form action={submitListingVoid}>
                        <input type="hidden" name="id" value={l.id} />
                        <button className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm text-white hover:opacity-95">
                          Submit for review
                        </button>
                      </form>
                    )}

                    {/* Unpublish: APPROVED/PENDING -> DRAFT */}
                    {(l.status === "APPROVED" || l.status === "PENDING") && (
                      <form action={unpublish}>
                        <input type="hidden" name="id" value={l.id} />
                        <button className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50">
                          Unpublish
                        </button>
                      </form>
                    )}
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

function Badge({ label }: { label: string }) {
  return <span className="rounded-full border px-3 py-1">{label}</span>;
}
