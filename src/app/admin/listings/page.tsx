// src/app/admin/listings/page.tsx
import { prisma as db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { approveListing, rejectListing } from "@/app/actions/listings";

export const dynamic = "force-dynamic";

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams?: { status?: string; page?: string };
}) {
  const s = await requireSession("/admin/listings");
  if (s.role !== "ADMIN") redirect("/");

  const statusParam = (searchParams?.status ?? "PENDING").toUpperCase();
  const allowed = new Set(["PENDING", "APPROVED", "REJECTED", "DRAFT"]);
  const filterStatus = allowed.has(statusParam) ? (statusParam as any) : "PENDING";

  const page = Math.max(parseInt(searchParams?.page ?? "1", 10) || 1, 1);
  const pageSize = 15;

  const where = { status: filterStatus as any };

  const [items, total] = await Promise.all([
    db.listing.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        city: true,
        price: true,
        beds: true,
        baths: true,
        status: true,
        images: true,
        landlord: {
          select: {
            email: true,
            landlordProfile: { select: { fullName: true } },
          },
        },
        updatedAt: true,
        createdAt: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.listing.count({ where }),
  ]);

  const pages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Admin • Listings Review</h1>

      <div className="flex items-center gap-2 mb-4">
        {["PENDING", "APPROVED", "REJECTED", "DRAFT"].map((k) => {
          const href = `/admin/listings?status=${k}`;
          const active = k === filterStatus;
          return (
            <a
              key={k}
              href={href}
              className={`px-3 py-1.5 rounded-xl border ${active ? "bg-black text-white" : "hover:bg-gray-50"}`}
            >
              {k[0] + k.slice(1).toLowerCase()}
            </a>
          );
        })}
        <div className="ml-auto text-sm text-zinc-600">{total} results</div>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((l) => (
          <li key={l.id} className="rounded-2xl border overflow-hidden">
            <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
              <img
                src={(Array.isArray(l.images) ? l.images[0] : null) ?? "/placeholder.svg"}
                alt={l.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 space-y-2">
              <div className="font-medium line-clamp-1">{l.title}</div>
              <div className="text-sm text-zinc-600">{l.city}</div>
              <div className="text-sm">
                ${Math.round(l.price / 100)} / <span className="text-zinc-500">month</span>
              </div>
              <div className="text-xs text-zinc-600">
                {l.beds} bed • {l.baths} bath
              </div>
              <div className="text-xs text-zinc-500">
                Host: {l.landlord.landlordProfile?.fullName ?? l.landlord.email}
              </div>
              <div className="text-xs text-zinc-500">Status: {l.status}</div>

              {/* Actions */}
              {l.status === "PENDING" ? (
                <div className="pt-2 flex gap-2">
                  <form action={approveListing}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="rounded-xl px-3 py-1.5 border bg-black text-white">
                      Approve
                    </button>
                  </form>
                  <form action={rejectListing}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="rounded-xl px-3 py-1.5 border">Reject</button>
                  </form>
                </div>
              ) : (
                <div className="pt-2 text-xs text-zinc-500">
                  No actions available for this status.
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <PageLink status={filterStatus} page={Math.max(page - 1, 1)} disabled={page === 1}>
            Prev
          </PageLink>
          <div className="text-sm">
            Page {page} of {pages}
          </div>
          <PageLink
            status={filterStatus}
            page={Math.min(page + 1, pages)}
            disabled={page === pages}
          >
            Next
          </PageLink>
        </div>
      )}
    </main>
  );
}

function PageLink({
  status,
  page,
  disabled,
  children,
}: {
  status: string;
  page: number;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const href = `/admin/listings?status=${encodeURIComponent(status)}&page=${page}`;
  return (
    <a
      href={href}
      className={`px-3 py-1.5 rounded-xl border ${
        disabled ? "pointer-events-none opacity-50" : "hover:bg-gray-50"
      }`}
    >
      {children}
    </a>
  );
}
