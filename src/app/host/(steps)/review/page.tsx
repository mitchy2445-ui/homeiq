import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { $Enums } from "@prisma/client";
import { redirect } from "next/navigation";
import HostStepper from "@/components/HostStepper";
import { CheckCircle2, ImageIcon, MapPin, Home, ArrowLeft } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ReviewStep() {
  const s = await requireSession("/host/review");
  const draft = await db.listing.findFirst({
    where: { landlordId: s.sub, status: $Enums.Status.DRAFT },
    orderBy: { updatedAt: "desc" },
  });
  if (!draft) redirect("/host/basics");

  async function publish() {
    "use server";
    const ss = await requireSession("/host/review");
    const d = await db.listing.findFirst({
      where: { id: draft!.id, landlordId: ss.sub },
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

  const images = Array.isArray(draft!.images) ? (draft!.images as string[]) : [];
  const cover = images[0];

  return (
    <>
      <HostStepper current="review" />

      <div className="grid gap-6">
        <div className="rounded-2xl border ring-1 ring-gray-100 p-4">
          <div className="flex items-start gap-4">
            <div className="w-36 h-28 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              {cover ? (
                <img src={cover} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold flex items-center gap-2">
                <Home className="h-5 w-5 text-brand-600" />
                {draft!.title || "(Untitled)"}
              </div>
              <div className="mt-1 text-gray-600 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {draft!.city || "(No city)"}
              </div>
              <div className="mt-1 text-gray-800 font-medium">
                {draft!.price ? `$${Math.round(draft!.price / 100)}/mo` : "Price not set"}
              </div>
            </div>
          </div>

          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {images.slice(1, 5).map((src, i) => (
                <div key={i} className="h-16 rounded-lg overflow-hidden bg-gray-100">
                  <img src={src} alt={`Image ${i + 2}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border p-4 bg-gray-50/60 text-sm text-gray-700">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            When you publish, your listing is submitted for review. You can still edit later.
          </p>
        </div>

        <div className="flex justify-between">
          <a href="/host/pricing" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" /> Back
          </a>
          <form action={publish}>
            <button className="inline-flex items-center gap-2 rounded-xl bg-brand-600 text-white px-5 py-3 font-medium hover:opacity-95">
              Publish for review
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
