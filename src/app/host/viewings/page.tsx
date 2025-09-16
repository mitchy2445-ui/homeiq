// src/app/host/viewings/page.tsx
import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import DecideForm from "./DecideForm";
import { redirect } from "next/navigation";
import type { Prisma, ViewingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function fmt(dt?: Date | null) {
  return dt
    ? new Intl.DateTimeFormat("en-CA", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(dt)
    : "—";
}

function toViewingStatus(param?: string): ViewingStatus | undefined {
  if (!param) return undefined;
  const up = param.toUpperCase();
  const options: ViewingStatus[] = ["PENDING", "APPROVED", "DECLINED", "CANCELLED"];
  return options.includes(up as ViewingStatus) ? (up as ViewingStatus) : undefined;
}

export default async function ViewingsPage({
  searchParams,
}: {
  searchParams?: { status?: string; page?: string };
}) {
  const session = await requireSession();
  const isHost = session.role === "LANDLORD" || session.role === "ADMIN";
  if (!isHost) redirect("/");

  const statusParam = (searchParams?.status ?? "ALL").toUpperCase();
  const statusEnum = toViewingStatus(statusParam);

  const page = Math.max(parseInt(searchParams?.page ?? "1", 10) || 1, 1);
  const pageSize = 10;

  const where: Prisma.ViewingRequestWhereInput = {
    landlordId: session.sub,
    ...(statusEnum ? { status: statusEnum } : {}),
  };

  const [items, total] = await Promise.all([
    db.viewingRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        listing: { select: { id: true, title: true, city: true } },
        renter: { select: { id: true, name: true, email: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.viewingRequest.count({ where }),
  ]);

  const pages = Math.max(Math.ceil(total / pageSize), 1);

  const tabs: Array<{ key: "ALL" | ViewingStatus; label: string }> = [
    { key: "ALL", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "APPROVED", label: "Approved" },
    { key: "DECLINED", label: "Declined" },
    { key: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Viewing Requests</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => {
          const active =
            (statusParam === "ALL" && t.key === "ALL") ||
            (statusEnum && t.key === statusEnum);
          const href = `/host/viewings?status=${t.key}`;
          return (
            <a
              key={t.key}
              href={href}
              className={`px-3 py-1.5 rounded-xl border ${
                active ? "bg-black text-white" : "hover:bg-gray-50"
              }`}
            >
              {t.label}
            </a>
          );
        })}
      </div>

      <div className="space-y-4">
        {items.map((r) => (
          <div key={r.id} className="rounded-2xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium">
                  {r.listing.title} — {r.listing.city}
                </div>
                <div className="text-sm text-zinc-600">
                  From {r.renter.name ?? r.renter.email} • {r.status}
                </div>
              </div>
              <div className="text-sm text-zinc-600">Created {fmt(r.createdAt)}</div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
              <div>
                <div className="text-xs text-zinc-500">Slot 1</div>
                <div>
                  {fmt(r.slot1Start)} – {fmt(r.slot1End)}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Slot 2</div>
                <div>
                  {fmt(r.slot2Start)} – {fmt(r.slot2End)}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Slot 3</div>
                <div>
                  {fmt(r.slot3Start)} – {fmt(r.slot3End)}
                </div>
              </div>
            </div>

            {r.note && <p className="mt-3 text-sm">{r.note}</p>}

            <div className="mt-4">
              <DecideForm
                req={{
                  id: r.id,
                  status: r.status,
                  slot1Start: r.slot1Start?.toISOString() ?? null,
                  slot1End: r.slot1End?.toISOString() ?? null,
                  slot2Start: r.slot2Start?.toISOString() ?? null,
                  slot2End: r.slot2End?.toISOString() ?? null,
                  slot3Start: r.slot3Start?.toISOString() ?? null,
                  slot3End: r.slot3End?.toISOString() ?? null,
                }}
              />
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-sm text-zinc-600">
            No requests{statusParam !== "ALL" ? ` (${statusParam.toLowerCase()})` : ""}.
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <a
            href={`/host/viewings?status=${statusParam}&page=${Math.max(page - 1, 1)}`}
            className={`px-3 py-1.5 rounded-xl border ${
              page === 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-50"
            }`}
          >
            Prev
          </a>
          <div className="text-sm">
            Page {page} of {pages}
          </div>
          <a
            href={`/host/viewings?status=${statusParam}&page=${Math.min(page + 1, pages)}`}
            className={`px-3 py-1.5 rounded-xl border ${
              page === pages ? "pointer-events-none opacity-50" : "hover:bg-gray-50"
            }`}
          >
            Next
          </a>
        </div>
      )}
    </div>
  );
}
