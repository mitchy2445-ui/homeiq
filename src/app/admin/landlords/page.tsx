// src/app/admin/landlords/page.tsx
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";
import { $Enums } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function canAdmin(session: { email?: string; role?: string } | null) {
  const envEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();
  return session?.role === "ADMIN" || session?.email?.toLowerCase() === envEmail;
}

export default async function AdminLandlords() {
  const session = await getSessionFromCookie();

  if (!canAdmin(session)) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Unauthorized</h1>
        <p className="text-gray-600 mt-2">
          Provide a valid admin email or sign in as an admin.
        </p>
      </main>
    );
  }

  const profiles = await db.landlordProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
  });

  async function setStatus(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "");
    const status = String(formData.get("status") || "") as $Enums.IdStatus;
    if (!id) return;
    await db.landlordProfile.update({ where: { id }, data: { idStatus: status } });
    revalidatePath("/admin/landlords");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Landlords</h1>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2">{p.fullName ?? p.user?.name ?? "—"}</td>
                <td className="px-3 py-2">{p.user?.email ?? "—"}</td>
                <td className="px-3 py-2">{p.phone ?? "—"}</td>
                <td className="px-3 py-2">{p.idStatus}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <form action={setStatus}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="status" value={$Enums.IdStatus.VERIFIED} />
                      <button className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 hover:opacity-95">
                        Verify
                      </button>
                    </form>
                    <form action={setStatus}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="status" value={$Enums.IdStatus.PENDING} />
                      <button className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">
                        Pending
                      </button>
                    </form>
                    <form action={setStatus}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="status" value={$Enums.IdStatus.REJECTED} />
                      <button className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">
                        Reject
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-600">
                  No landlord profiles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
