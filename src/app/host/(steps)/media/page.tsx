import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { $Enums } from "@prisma/client";
import { redirect } from "next/navigation";
import HostStepper from "@/components/HostStepper";
import { Images, Film, Info, ArrowLeft, ArrowRight } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MediaStep() {
  const s = await requireSession("/host/media");
  const draft = await db.listing.findFirst({
    where: { landlordId: s.sub, status: $Enums.Status.DRAFT },
    orderBy: { updatedAt: "desc" },
  });
  if (!draft) redirect("/host/basics");

  const imagesCsv = Array.isArray(draft!.images) ? (draft!.images as string[]).join("\n") : "";

  async function saveMedia(formData: FormData) {
    "use server";
    const ss = await requireSession("/host/media");
    const images =
      String(formData.get("imagesCsv") || "")
        .split(/[\n,]/g)
        .map((q) => q.trim())
        .filter(Boolean);
    const videoUrl = String(formData.get("videoUrl") || "");
    await db.listing.update({ where: { id: draft!.id, landlordId: ss.sub }, data: { images, videoUrl: videoUrl || null } });
    redirect("/host/pricing");
  }

  return (
    <>
      <HostStepper current="media" />

      <div className="mb-6 rounded-xl border border-gray-100 p-4 bg-gray-50/60 text-sm text-gray-700 flex gap-2">
        <Info className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
        <p>Add 5–10 high-quality photos (first becomes the cover). Landscape shots work best.</p>
      </div>

      <form action={saveMedia} className="space-y-5">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Image URLs</span>
          <div className="relative">
            <Images className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <textarea
              name="imagesCsv"
              rows={6}
              defaultValue={imagesCsv}
              placeholder={"https://...\nhttps://..."}
              className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Video URL (optional)</span>
          <div className="relative">
            <Film className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              name="videoUrl"
              type="url"
              defaultValue={draft!.videoUrl ?? ""}
              placeholder="https://res.cloudinary.com/.../tour.mp4"
              className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </label>

        <div className="flex justify-between">
          <a href="/host/basics" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-gray-50">
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
