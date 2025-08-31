// src/app/admin/landlords/page.tsx
import { prisma as db } from "@/lib/db";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { $Enums } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID_STATUSES: $Enums.IdStatus[] = ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"];

async function requireAdmin() {
  const store = await cookies();
  const token = store.get("session")?.value;
  const session = token ? await verifySession(token) : null;

  const ok =
    session?.role === "ADMIN" ||
    (process.env.NEXT_PUBLIC_ADMIN_EMAIL &&
      session?.email?.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_EMAIL.toLowerCase());

  if (!ok) redirect("/");
  return session;
}

export default async function AdminLandlords() {
  await requireAdmin();

  const profiles = await db.landlordProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
  });

  async function setStatus(formData: FormData) {
    "use server";
    await requireAdmin();

    const id = String(formData.get("id") || "");
    const raw = String(formData.get("status") || "");
    if (!ID_STATUSES.includes(raw as $Enums.IdStatus)) {
      throw new Error("Invalid status value");
    }
    const status = raw as $Enums.IdStatus;

    await db.landlordProfile.update({ where: { id }, data: { idStatus: status } });
    revalidatePath("/admin/landlords");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Landlords</h1>
      <div className="mt-6 overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3">{p.user?.name || "—"}</td>
                <td className="px-4 py-3">{p.user?.email || "—"}</td>
                <td className="px-4 py-3">{p.phone || "—"}</td>
                <td className="px-4 py-3">{p.idStatus}</td>
                <td className="px-4 py-3">
                  <form action={setStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <select
                      name="status"
                      defaultValue={p.idStatus}
                      className="rounded border px-2 py-1"
                    >
                      {ID_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">
                      Update
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
