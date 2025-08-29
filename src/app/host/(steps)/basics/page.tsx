import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { $Enums } from "@prisma/client";
import { redirect } from "next/navigation";
import HostStepper from "@/components/HostStepper";
import { Home, MapPin, BedDouble, Bath, Info, ArrowRight } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getOrCreateDraft(userId: string) {
  const existing = await db.listing.findFirst({
    where: { landlordId: userId, status: $Enums.Status.DRAFT },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, city: true, beds: true, baths: true },
  });
  if (existing) return existing;
  return await db.listing.create({
    data: { title: "", city: "", price: 0, beds: 0, baths: 0, landlordId: userId, status: $Enums.Status.DRAFT },
    select: { id: true, title: true, city: true, beds: true, baths: true },
  });
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
    await db.listing.update({ where: { id: draft.id, landlordId: ss.sub }, data: { title, city, beds, baths } });
    redirect("/host/media");
  }

  return (
    <>
      <HostStepper current="basics" />

      <div className="mb-6 rounded-xl border border-gray-100 p-4 bg-gray-50/60 text-sm text-gray-700 flex gap-2">
        <Info className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
        <p>
          Clear titles & accurate details get approved faster. Example: <em>“Bright 2-bed near Osborne Village”</em>.
        </p>
      </div>

      <form action={saveBasics} className="space-y-5">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Title</span>
          <div className="relative">
            <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              name="title"
              defaultValue={draft.title || ""}
              placeholder="Bright 2-bed near Osborne Village"
              className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">City</span>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              name="city"
              defaultValue={draft.city || ""}
              placeholder="Winnipeg"
              className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Beds</span>
            <div className="relative">
              <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                name="beds"
                type="number"
                min={0}
                defaultValue={draft.beds ?? 0}
                className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Baths</span>
            <div className="relative">
              <Bath className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                name="baths"
                type="number"
                min={0}
                defaultValue={draft.baths ?? 0}
                className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </label>
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
