// src/app/admin/listings/page.tsx
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";
import { $Enums } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Allow if role === ADMIN or email matches env
function canAdmin(session: { email?: string; role?: string } | null) {
  const envEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();
  return session?.role === "ADMIN" || session?.email?.toLowerCase() === envEmail;
}

export default async function AdminListingsPage() {
  const session = await getSessionFromCookie();

  if (!canAdmin(session)) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Unauthorized</h1>
        <p className="text-gray-600 mt-2">
          Provide a valid admin email or sign in as an admin.
        </p>
        <div className="mt-4 text-sm text-gray-500">
          <div><strong>Logged in as:</strong> {session?.email ?? "guest"}</div>
          <div><strong>Required email:</strong> {process.env.NEXT_PUBLIC_ADMIN_EMAIL || "(not set)"} </div>
        </div>
      </main>
    );
  }

  const listings = await db.listing.findMany({
    where: { status: $Enums.Status.PENDING },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      city: true,
      price: true,
      beds: true,
      baths: true,
      createdAt: true,
      landlord: { select: { email: true, name: true } },
    },
  });

  // --- Server actions ---
  async function approve(formData: FormData) {
    "use server";
    const s = await getSessionFromCookie();
    if (!canAdmin(s)) throw new Error("Unauthorized");
    const id = String(formData.get("id") || "");
    if (!id) return;
    await db.listing.update({ where: { id }, data: { status: $Enums.Status.APPROVED } });
    // refresh admin and homepage
    revalidatePath("/admin/listings");
    revalidatePath("/");
  }

  async function reject(formData: FormData) {
    "use server";
    const s = await getSessionFromCookie();
    if (!canAdmin(s)) throw new Error("Unauthorized");
    const id = String(formData.get("id") || "");
    if (!id) return;
    await db.listing.update({ where: { id }, data: { status: $Enums.Status.REJECTED } });
    revalidatePath("/admin/listings");
    revalidatePath("/");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Pending listings</h1>
      <p className="text-gray-600 mt-1">
        {listings.length === 0 ? "No pending items." : "Review and approve or reject each listing."}
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Beds</th>
              <th className="px-4 py-3">Baths</th>
              <th className="px-4 py-3">Price (CAD)</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="px-4 py-3">
                  <a className="underline" href={`/listing/${l.id}`} target="_blank">
                    {l.title || "(no title)"}
                  </a>
                </td>
                <td className="px-4 py-3">{l.city}</td>
                <td className="px-4 py-3">{l.beds}</td>
                <td className="px-4 py-3">{l.baths}</td>
                <td className="px-4 py-3">${(l.price / 100).toLocaleString()}</td>
                <td className="px-4 py-3">{l.landlord?.name || l.landlord?.email || "—"}</td>
                <td className="px-4 py-3">{new Date(l.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <form action={approve}>
                      <input type="hidden" name="id" value={l.id} />
                      <button className="rounded-lg bg-green-600 text-white px-3 py-1.5 hover:opacity-90">
                        Approve
                      </button>
                    </form>
                    <form action={reject}>
                      <input type="hidden" name="id" value={l.id} />
                      <button className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">
                        Reject
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
