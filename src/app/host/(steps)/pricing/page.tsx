import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { $Enums } from "@prisma/client";
import { redirect } from "next/navigation";
import HostStepper from "@/components/HostStepper";
import ConfirmLeave from "@/components/ConfirmLeave";
import { BadgeDollarSign, Users, Ban, BookmarkCheck, ArrowLeft, ArrowRight, Info } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PricingPolicies() {
  const s = await requireSession("/host/pricing");
  const draft = await db.listing.findFirst({ where: { landlordId: s.sub, status: $Enums.Status.DRAFT }, orderBy: { updatedAt: "desc" } });
  if (!draft) redirect("/host/basics");

  async function save(formData: FormData) {
    "use server";
    const ss = await requireSession("/host/pricing");
    const price = Number(formData.get("price") || 0);
    const deposit = Number(formData.get("deposit") || 0) || null;
    const minLeaseMonths = Number(formData.get("minLeaseMonths") || 0) || null;
    const maxOccupants = Number(formData.get("maxOccupants") || 0) || null;
    const smokingAllowed = formData.get("smokingAllowed") ? true : false;

    await db.listing.update({
      where: { id: draft!.id, landlordId: ss.sub },
      data: {
        price: Math.round(price * 100),
        depositCents: deposit ? Math.round(deposit * 100) : null,
        minLeaseMonths, maxOccupants, smokingAllowed,
      } as any,
    });
    redirect("/host/review");
  }

  return (
    <>
      <HostStepper current="pricing" />
      <div className="mb-4 rounded-xl border border-gray-100 p-4 bg-gray-50/60 text-sm text-gray-700 flex gap-2">
        <Info className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
        <p>Set price and policies. You can adjust after publishing.</p>
      </div>

      <ConfirmLeave enabled={true} />

      <form action={save} className="space-y-5">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field name="price" label="Monthly price (CAD)" icon={<BadgeDollarSign className="h-4 w-4 text-gray-400" />} type="number" min={0} defaultValue={draft!.price ? Math.round(draft!.price / 100) : 0} required />
          <Field name="deposit" label="Deposit (optional)" type="number" min={0} defaultValue={(draft as any)?.depositCents ? Math.round(((draft as any).depositCents as number) / 100) : ""} />
          <Field name="minLeaseMonths" label="Minimum lease (months)" type="number" min={0} defaultValue={draft?.minLeaseMonths ?? ""} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field name="maxOccupants" label="Max occupants" icon={<Users className="h-4 w-4 text-gray-400" />} type="number" min={0} defaultValue={draft?.maxOccupants ?? ""} />
          <label className="flex items-center gap-2">
            <input type="checkbox" name="smokingAllowed" defaultChecked={!!draft?.smokingAllowed} />
            <span className="text-sm flex items-center gap-2"><Ban className="h-4 w-4" /> Smoking allowed</span>
          </label>
        </div>

        <div className="flex justify-between">
          <a href="/host/neighborhood" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-gray-50"><ArrowLeft className="h-4 w-4" /> Back</a>
          <button className="inline-flex items-center gap-2 rounded-xl bg-brand-600 text-white px-5 py-3 font-medium hover:opacity-95">
            <BookmarkCheck className="h-4 w-4" /> Continue
          </button>
        </div>
      </form>
    </>
  );
}

function Field({ name, label, type="text", min, defaultValue, required=false, icon }:{
  name:string; label:string; type?:string; min?:number; defaultValue?:any; required?:boolean; icon?:React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}{required && " *"}</span>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}
        <input name={name} defaultValue={defaultValue ?? ""} type={type} min={min}
          required={required}
          className={`w-full rounded-lg border border-gray-300 bg-white ${icon ? "pl-9" : "pl-3"} pr-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100`} />
      </div>
    </label>
  );
}
