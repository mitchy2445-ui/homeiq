// src/app/admin/listings/page.tsx
import { prisma as db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { $Enums } from "@prisma/client";
import Image from "next/image";

type PageProps = { searchParams: { key?: string } };

async function setStatusAction(id: string, status: $Enums.Status) {
  "use server";
  await db.listing.update({ where: { id }, data: { status } });

  // Revalidate key pages that show list data
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath(`/listing/${id}`);
}

export default async function AdminListingsPage({ searchParams }: PageProps) {
  const provided = searchParams.key;
  const required = process.env.ADMIN_KEY;
  if (!required || provided !== required) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold">Unauthorized</h1>
        <p className="text-gray-600 mt-2">
          Add <code>ADMIN_KEY</code> to <code>.env.local</code> and open this page as{" "}
          <code>/admin/listings?key=YOUR_KEY</code>.
        </p>
      </main>
    );
  }

  const pending = await db.listing.findMany({
    where: { status: $Enums.Status.PENDING },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-semibold">Pending listings</h1>
      <p className="text-gray-600 mt-1">Approve or reject new submissions.</p>

      {pending.length === 0 ? (
        <p className="text-gray-600 mt-6">No pending listings 🎉</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pending.map((l) => {
            const preview =
              Array.isArray(l.images) && l.images.length > 0 && typeof l.images[0] === "string"
                ? (l.images[0] as string)
                : "https://picsum.photos/seed/homeiq-admin/800/600";

            async function approve() {
              "use server";
              return setStatusAction(l.id, $Enums.Status.APPROVED);
            }
            async function reject() {
              "use server";
              return setStatusAction(l.id, $Enums.Status.REJECTED);
            }

            return (
              <div key={l.id} className="rounded-2xl border overflow-hidden">
                <div className="relative aspect-[4/3] bg-gray-100">
                  <Image
                    src={preview}
                    alt={l.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="font-semibold line-clamp-1">{l.title}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {l.city} • {l.beds} bd • {l.baths} ba
                  </div>
                  <div className="flex gap-2 mt-4">
                    <form action={approve}>
                      <button className="rounded-lg border px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700">
                        Approve
                      </button>
                    </form>
                    <form action={reject}>
                      <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
