import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { $Enums } from "@prisma/client";
import { redirect } from "next/navigation";
import HostStepper from "@/components/HostStepper";
import ConfirmLeave from "@/components/ConfirmLeave";
import { MapPin, Bus, ShoppingCart, School, Trees, Dumbbell, Hospital, Car, PawPrint, Accessibility, Thermometer, Snowflake, Home, CheckSquare, ArrowLeft, ArrowRight } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NeighborhoodStep() {
  const s = await requireSession("/host/neighborhood");
  const draft = await db.listing.findFirst({ where: { landlordId: s.sub, status: $Enums.Status.DRAFT }, orderBy: { updatedAt: "desc" } });
  if (!draft) redirect("/host/basics");

  async function save(formData: FormData) {
    "use server";
    const ss = await requireSession("/host/neighborhood");
    const getI = (k: string) => Number(formData.get(k) || 0) || null;
    const utilitiesIncluded = formData.getAll("utilitiesIncluded").map(String);
    const accessibility = formData.getAll("accessibility").map(String);

    await db.listing.update({
      where: { id: draft!.id, landlordId: ss.sub },
      data: {
        neighborhoodVibe: (formData.get("neighborhoodVibe") as any) || null,
        areaType: (formData.get("areaType") as any) || null,
        distanceBusMeters: getI("distanceBusMeters"),
        distanceGroceryMeters: getI("distanceGroceryMeters"),
        distanceSchoolMeters: getI("distanceSchoolMeters"),
        distanceParkMeters: getI("distanceParkMeters"),
        distancePharmacyMeters: getI("distancePharmacyMeters"),
        distanceGymMeters: getI("distanceGymMeters"),
        parkingType: (formData.get("parkingType") as any) || null,
        petPolicy: (formData.get("petPolicy") as any) || null,
        laundry: (formData.get("laundry") as any) || null,
        heating: String(formData.get("heating") || "") || null,
        cooling: String(formData.get("cooling") || "") || null,
        furnished: formData.get("furnished") ? true : false,
        utilitiesIncluded,
        accessibility,
        houseRules: String(formData.get("houseRules") || "") || null,
      },
    });
    redirect("/host/pricing");
  }

  return (
    <>
      <HostStepper current="neighborhood" />
      <ConfirmLeave enabled={true} />

      <form action={save} className="space-y-6">
        <Section title="Neighborhood profile" icon={<MapPin className="h-4 w-4" />}>
          <div className="grid sm:grid-cols-3 gap-4">
            <Select name="neighborhoodVibe" label="Vibe" options={["QUIET","MODERATE","BUSY"]} defaultValue={draft?.neighborhoodVibe ?? ""} />
            <Select name="areaType" label="Area type" options={["URBAN","SUBURBAN","RURAL"]} defaultValue={draft?.areaType ?? ""} />
            <Select name="parkingType" label="Parking" options={["STREET","ON_SITE","NONE"]} defaultValue={draft?.parkingType ?? ""} />
          </div>
        </Section>

        <Section title="Nearby essentials (meters)" icon={<Bus className="h-4 w-4" />}>
          <div className="grid sm:grid-cols-3 gap-4">
            <Num name="distanceBusMeters" label="Bus stop" defaultValue={draft?.distanceBusMeters ?? undefined} />
            <Num name="distanceGroceryMeters" label="Grocery" defaultValue={draft?.distanceGroceryMeters ?? undefined} />
            <Num name="distanceSchoolMeters" label="School" defaultValue={draft?.distanceSchoolMeters ?? undefined} />
            <Num name="distanceParkMeters" label="Park" defaultValue={draft?.distanceParkMeters ?? undefined} />
            <Num name="distancePharmacyMeters" label="Pharmacy" defaultValue={draft?.distancePharmacyMeters ?? undefined} />
            <Num name="distanceGymMeters" label="Gym" defaultValue={draft?.distanceGymMeters ?? undefined} />
          </div>
        </Section>

        <Section title="Amenities & policies" icon={<Home className="h-4 w-4" />}>
          <div className="grid sm:grid-cols-3 gap-4">
            <Select name="petPolicy" label="Pets" options={["NONE","CATS","DOGS","CATS_AND_DOGS","RESTRICTED"]} defaultValue={draft?.petPolicy ?? ""} />
            <Select name="laundry" label="Laundry" options={["IN_UNIT","SHARED","NONE"]} defaultValue={draft?.laundry ?? ""} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Furnished</span>
              <input type="checkbox" name="furnished" defaultChecked={!!draft?.furnished} className="h-4 w-4" />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-2">
            <Field name="heating" label="Heating (e.g., baseboard, forced air)" defaultValue={draft?.heating ?? ""} icon={<Thermometer className="h-4 w-4 text-gray-400" />} />
            <Field name="cooling" label="Cooling (e.g., central AC, window unit)" defaultValue={draft?.cooling ?? ""} icon={<Snowflake className="h-4 w-4 text-gray-400" />} />
          </div>

          <div className="mt-3">
            <span className="mb-1 block text-sm font-medium flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Utilities included</span>
            <div className="grid sm:grid-cols-3 gap-2 text-sm">
              {["Heat","Water","Electricity","Internet","Parking","Trash"].map(u => (
                <label key={u} className="inline-flex items-center gap-2">
                  <input type="checkbox" name="utilitiesIncluded" value={u} defaultChecked={Array.isArray(draft?.utilitiesIncluded) && (draft!.utilitiesIncluded as string[]).includes(u)} />
                  {u}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <span className="mb-1 block text-sm font-medium flex items-center gap-2"><Accessibility className="h-4 w-4" /> Accessibility</span>
            <div className="grid sm:grid-cols-3 gap-2 text-sm">
              {["Elevator","Step-free entry","Wide doorways","Grab bars","Accessible parking"].map(a => (
                <label key={a} className="inline-flex items-center gap-2">
                  <input type="checkbox" name="accessibility" value={a} defaultChecked={Array.isArray(draft?.accessibility) && (draft!.accessibility as string[]).includes(a)} />
                  {a}
                </label>
              ))}
            </div>
          </div>

          <label className="block mt-3">
            <span className="mb-1 block text-sm font-medium">House rules (optional)</span>
            <textarea name="houseRules" rows={3} defaultValue={draft?.houseRules ?? ""} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          </label>
        </Section>

        <div className="flex justify-between">
          <a href="/host/media" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-gray-50"><ArrowLeft className="h-4 w-4" /> Back</a>
          <button className="inline-flex items-center gap-2 rounded-xl bg-brand-600 text-white px-5 py-3 font-medium hover:opacity-95">
            <ArrowRight className="h-4 w-4" /> Continue
          </button>
        </div>
      </form>
    </>
  );
}

function Section({ title, icon, children }:{title:string; icon:React.ReactNode; children:React.ReactNode;}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm font-medium flex items-center gap-2 mb-3">{icon}{title}</div>
      {children}
    </div>
  );
}
function Select({ name, label, options, defaultValue="" }:{ name:string; label:string; options:string[]; defaultValue?:string; }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <select name={name} defaultValue={defaultValue} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
        <option value="">Select</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
function Num({ name, label, defaultValue }:{ name:string; label:string; defaultValue?:number; }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input name={name} type="number" min={0} defaultValue={defaultValue ?? ""} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
    </label>
  );
}
function Field({ name, label, defaultValue, icon }:{ name:string; label:string; defaultValue?:string; icon?:React.ReactNode; }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}
        <input name={name} defaultValue={defaultValue ?? ""} className={`w-full rounded-lg border border-gray-300 bg-white ${icon ? "pl-9" : "pl-3"} pr-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100`} />
      </div>
    </label>
  );
}
