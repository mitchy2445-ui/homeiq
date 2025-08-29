// src/app/host/(steps)/basics/page.tsx
import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { $Enums } from "@prisma/client";
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getOrCreateDraft(userId: string) {
  const existing = await db.listing.findFirst({
    where: { landlordId: userId, status: $Enums.Status.DRAFT },
    select: { id: true, title: true, city: true, beds: true, baths: true },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) return existing;

  const draft = await db.listing.create({
    data: {
      title: "",
      city: "",
      price: 0,
      beds: 0,
      baths: 0,
      landlordId: userId,
      status: $Enums.Status.DRAFT, // explicit
    },
    select: { id: true, title: true, city: true, beds: true, baths: true },
  });
  return draft;
}

export default async function BasicsStep() {
  const s = await requireSession("/host/basics");
  const draft = await getOrCreateDraft(s.sub);

  async function saveBasics(formData: FormData) {
    "use server";
    const ss = await requireSession("/host/basics");
    const title = String(formData.get("title") || "");
    const city  = String(formData.get("city") || "");
    const beds  = Number(formData.get("beds") || 0);
    const baths = Number(formData.get("baths") || 0);

    await db.listing.update({
      where: { id: draft.id, landlordId: ss.sub },
      data: { title, city, beds, baths },
    });
    redirect("/host/media");
  }

  return (
    <form action={saveBasics} className="space-y-5">
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          name="title"
          defaultValue={draft.title || ""}
          className="mt-1 w-full rounded-md border px-3 py-2"
          placeholder="Bright 2-bed near Osborne Village"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">City</label>
        <input
          name="city"
          defaultValue={draft.city || ""}
          className="mt-1 w-full rounded-md border px-3 py-2"
          placeholder="Winnipeg"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Beds</label>
          <input
            name="beds"
            type="number"
            min="0"
            defaultValue={draft.beds ?? 0}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Baths</label>
          <input
            name="baths"
            type="number"
            min="0"
            defaultValue={draft.baths ?? 0}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button className="rounded-xl bg-brand-600 text-white px-5 py-3 font-medium">
          Continue
        </button>
      </div>
    </form>
  );
}
