// src/app/host/(steps)/pricing/page.tsx
import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { $Enums } from "@prisma/client";
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PricingStep() {
  const s = await requireSession("/host/pricing");

  const draft = await db.listing.findFirst({
    where: { landlordId: s.sub, status: $Enums.Status.DRAFT },
    orderBy: { updatedAt: "desc" },
  });

  if (!draft) {
    redirect("/host/basics");
  }

  async function savePricing(formData: FormData) {
    "use server";
    const ss = await requireSession("/host/pricing");
    const price = Number(formData.get("price") || 0);

    await db.listing.update({
      where: { id: draft!.id, landlordId: ss.sub }, // draft is safe after redirect
      data: { price: Math.round(price * 100) },     // store cents
    });

    redirect("/host/review");
  }

  return (
    <form action={savePricing} className="space-y-5">
      <div>
        <label className="block text-sm font-medium">Monthly price (CAD)</label>
        <input
          name="price"
          type="number"
          min="0"
          step="1"
          defaultValue={draft!.price ? Math.round(draft!.price / 100) : 0}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>

      <div className="flex justify-between">
        <a className="underline" href="/host/media">Back</a>
        <button className="rounded-xl bg-brand-600 text-white px-5 py-3 font-medium">
          Continue
        </button>
      </div>
    </form>
  );
}
