// src/app/host/(steps)/review/page.tsx
import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { $Enums } from "@prisma/client";
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ReviewStep() {
  const s = await requireSession("/host/review");

  const draft = await db.listing.findFirst({
    where: { landlordId: s.sub, status: $Enums.Status.DRAFT },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, city: true, price: true, images: true, videoUrl: true },
  });

  if (!draft) {
    redirect("/host/basics");
  }

  async function publish() {
    "use server";
    const ss = await requireSession("/host/review");

    // Re-fetch to confirm ownership + latest data
    const d = await db.listing.findFirst({
      where: { id: draft!.id, landlordId: ss.sub },
      select: { id: true, title: true, city: true, price: true },
    });

    if (!d?.title || !d.city || !d.price || d.price <= 0) {
      throw new Error("Please complete title, city, and price before publishing.");
    }

    await db.listing.update({
      where: { id: draft!.id, landlordId: ss.sub },
      data: { status: $Enums.Status.PENDING },
    });

    redirect(`/listing/${draft!.id}`);
  }

  const priceText = draft!.price ? `$${Math.round(draft!.price / 100)}/mo` : "Price not set";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Review & Publish</h2>

      <div className="rounded-xl border p-4">
        <div className="font-medium">{draft!.title || "(Untitled)"}</div>
        <div className="text-gray-600">{draft!.city || "(No city)"}</div>
        <div className="text-gray-600">{priceText}</div>
      </div>

      <div className="flex justify-between">
        <a className="underline" href="/host/pricing">Back</a>
        <form action={publish}>
          <button className="rounded-xl bg-brand-600 text-white px-5 py-3 font-medium">
            Publish
          </button>
        </form>
      </div>
    </div>
  );
}
