import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { $Enums } from "@prisma/client";
import { redirect } from "next/navigation";
import HostStepper from "@/components/HostStepper";
import { BadgeDollarSign, Info, ArrowLeft, ArrowRight } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PricingStep() {
  const s = await requireSession("/host/pricing");
  const draft = await db.listing.findFirst({
    where: { landlordId: s.sub, status: $Enums.Status.DRAFT },
    orderBy: { updatedAt: "desc" },
  });
  if (!draft) redirect("/host/basics");

  async function savePricing(formData: FormData) {
    "use server";
    const ss = await requireSession("/host/pricing");
    const price = Number(formData.get("price") || 0);
    await db.listing.update({
      where: { id: draft!.id, landlordId: ss.sub },
      data: { price: Math.round(price * 100) },
    });
    redirect("/host/review");
  }

  return (
    <>
      <HostStepper current="pricing" />

      <div className="mb-6 rounded-xl border border-gray-100 p-4 bg-gray-50/60 text-sm text-gray-700 flex gap-2">
        <Info className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
        <p>Set a competitive monthly price. You can update pricing after publishing.</p>
      </div>

      <form action={savePricing} className="space-y-5">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Monthly price (CAD)</span>
          <div className="relative">
            <BadgeDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              name="price"
              type="number"
              min={0}
              step={1}
              defaultValue={draft!.price ? Math.round(draft!.price / 100) : 0}
              className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </label>

        <div className="flex justify-between">
          <a href="/host/media" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" /> Back
          </a>
          <button className="inline-flex items-center gap-2 rounded-xl bg-brand-600 text-white px-5 py-3 font-medium hover:opacity-95">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </>
  );
}
