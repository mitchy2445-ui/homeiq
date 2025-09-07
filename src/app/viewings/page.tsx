// src/app/viewings/page.tsx
import { prisma as db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function fmt(dt?: Date | null) {
  return dt
    ? new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(dt)
    : "—";
}

export default async function MyViewingsPage() {
  const s = await requireSession("/viewings");
  // renters + landlords can both see their own requests; feel free to restrict to renters only if desired

  const requests = await db.viewingRequest.findMany({
    where: { renterId: s.sub },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { id: true, title: true, city: true } },
      landlord: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">My Viewing Requests</h1>

      <div className="space-y-4">
        {requests.map((r) => (
          <div key={r.id} className="rounded-2xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium">
                  {r.listing.title} — {r.listing.city}
                </div>
                <div className="text-sm text-zinc-600">
                  Landlord: {r.landlord.name ?? r.landlord.email ?? "—"} • {r.status}
                </div>
              </div>
              <div className="text-sm text-zinc-600">Requested {fmt(r.createdAt)}</div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
              <div>
                <div className="text-xs text-zinc-500">Approved time</div>
                <div>
                  {fmt(r.chosenStart)} – {fmt(r.chosenEnd)}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Proposed slot 1</div>
                <div>
                  {fmt(r.slot1Start)} – {fmt(r.slot1End)}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Proposed slot 2</div>
                <div>
                  {fmt(r.slot2Start)} – {fmt(r.slot2End)}
                </div>
              </div>
            </div>

            {r.note && <p className="mt-3 text-sm">{r.note}</p>}

            {/* Cancel action when pending */}
            {r.status === "PENDING" && (
              <form
                action={async () => {
                  "use server";
                  const sess = await requireSession("/viewings");
                  if (sess.sub !== r.renterId) redirect("/viewings");
                  await db.viewingRequest.update({
                    where: { id: r.id },
                    data: { status: "CANCELLED" },
                  });
                  // revalidate server components
                }}
              >
                <button className="mt-4 rounded-xl px-4 py-2 border hover:bg-gray-50">
                  Cancel request
                </button>
              </form>
            )}
          </div>
        ))}

        {requests.length === 0 && (
          <div className="text-sm text-zinc-600">You haven’t made any viewing requests yet.</div>
        )}
      </div>
    </div>
  );
}
