import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { $Enums } from "@prisma/client";
import { redirect } from "next/navigation";
import HostStepper from "@/components/HostStepper";
import ConfirmLeave from "@/components/ConfirmLeave";
import { Home, MapPin, BedDouble, Bath, ArrowRight, Info } from "lucide-react";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  title: z.string().min(3),
  city: z.string().min(2),
  beds: z.coerce.number().int().min(0),
  baths: z.coerce.number().int().min(0),
  propertyType: z.string().min(3),
});

async function getOrCreateDraft(userId: string) {
  const existing = await db.listing.findFirst({
    where: { landlordId: userId, status: $Enums.Status.DRAFT },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) return existing;
  return await db.listing.create({ data: { title: "", city: "", price: 0, beds: 0, baths: 0, landlordId: userId, status: $Enums.Status.DRAFT } });
}

export default async function BasicsStep() {
  const s = await requireSession("/host/basics");
  const draft = await getOrCreateDraft(s.sub);

  async function save(formData: FormData) {
    "use server";
    const ss = await requireSession("/host/basics");
    const raw = Object.fromEntries(formData) as Record<string,string>;
    const p = Schema.safeParse(raw);
    if (!p.success) throw new Error("Invalid");
    await db.listing.update({
      where: { id: draft.id, landlordId: ss.sub },
      data: { ...p.data },
    });
    redirect("/host/media");
  }

  return (
    <>
      <HostStepper current="basics" />
      <div className="mb-4 rounded-xl border border-gray-100 p-4 bg-gray-50/60 text-sm text-gray-700 flex gap-2">
        <Info className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
        <p>Complete all fields to continue. You can edit later.</p>
      </div>

      <ConfirmLeave enabled={true} />

      <form action={save} className="space-y-5">
        <Field name="title" label="Title" icon={<Home className="h-4 w-4 text-gray-400" />} defaultValue={draft.title || ""} required />
        <Field name="city" label="City" icon={<MapPin className="h-4 w-4 text-gray-400" />} defaultValue={draft.city || ""} required />
        <div className="grid sm:grid-cols-3 gap-4">
          <Field name="beds" label="Beds" type="number" defaultValue={draft.beds ?? 0} required />
          <Field name="baths" label="Baths" type="number" defaultValue={draft.baths ?? 0} required />
          <Select name="propertyType" label="Property type" defaultValue={draft.propertyType ?? ""} options={["Apartment","House","Basement Suite","Townhouse"]} />
        </div>
        <div className="flex justify-end">
          <button className="inline-flex items-center gap-2 rounded-xl bg-brand-600 text-white px-5 py-3 font-medium hover:opacity-95">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </>
  );
}

function Field({ name, label, type="text", defaultValue, required=true, icon }:{
  name:string; label:string; type?:string; defaultValue?:any; required?:boolean; icon?:React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}{required && " *"}</span>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}
        <input name={name} defaultValue={defaultValue ?? ""} type={type}
          required={required}
          className={`w-full rounded-lg border border-gray-300 bg-white ${icon ? "pl-9" : "pl-3"} pr-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100`} />
      </div>
    </label>
  );
}
function Select({ name, label, options, defaultValue="" }:{
  name:string; label:string; options:string[]; defaultValue?:string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label} *</span>
      <select name={name} defaultValue={defaultValue} required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
        <option value="" disabled>Select</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
