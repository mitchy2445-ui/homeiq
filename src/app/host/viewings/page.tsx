import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import DecideForm from "./DecideForm";

export const dynamic = "force-dynamic";

function fmt(dt?: Date | null) {
  return dt ? new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium", timeStyle: "short"
  }).format(dt) : "—";
}

export default async function ViewingsPage() {
  const session = await requireSession();
  // Only landlords (or admins) should access; adjust your role guard as needed
  // if (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN") redirect("/");

  const requests = await db.viewingRequest.findMany({
    where: { landlordId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { id: true, title: true, city: true } },
      renter: { select: { id: true, name: true, email: true } },
    },
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Viewing Requests</h1>
      <div className="space-y-4">
        {requests.map((r) => (
          <div key={r.id} className="rounded-2xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium">{r.listing.title} — {r.listing.city}</div>
                <div className="text-sm text-zinc-600">
                  From {r.renter.name ?? r.renter.email} • {r.status}
                </div>
              </div>
              <div className="text-sm text-zinc-600">
                Created {fmt(r.createdAt)}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
              <div>
                <div className="text-xs text-zinc-500">Slot 1</div>
                <div>{fmt(r.slot1Start)} – {fmt(r.slot1End)}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Slot 2</div>
                <div>{fmt(r.slot2Start)} – {fmt(r.slot2End)}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Slot 3</div>
                <div>{fmt(r.slot3Start)} – {fmt(r.slot3End)}</div>
              </div>
            </div>

            {r.note && <p className="mt-3 text-sm">{r.note}</p>}

            <div className="mt-4">
              <DecideForm req={r} />
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="text-sm text-zinc-600">No requests yet.</div>
        )}
      </div>
    </div>
  );
}
