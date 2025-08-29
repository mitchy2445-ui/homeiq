// src/app/host/(steps)/media/page.tsx
import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { $Enums } from "@prisma/client";
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MediaStep() {
  const s = await requireSession("/host/media");

  const draft = await db.listing.findFirst({
    where: { landlordId: s.sub, status: $Enums.Status.DRAFT },
    orderBy: { updatedAt: "desc" },
  });

  if (!draft) {
    redirect("/host/basics");
  }

  // 👇 TS: draft! (non-null) because we redirected above
  const imagesCsv = Array.isArray(draft!.images)
    ? (draft!.images as string[]).join("\n")
    : "";

  async function saveMedia(formData: FormData) {
    "use server";
    const ss = await requireSession("/host/media");
    const images = String(formData.get("imagesCsv") || "")
      .split(/[\n,]/g)
      .map((s) => s.trim())
      .filter(Boolean);
    const videoUrl = String(formData.get("videoUrl") || "");

    await db.listing.update({
      where: { id: draft!.id, landlordId: ss.sub },
      data: { images, videoUrl: videoUrl || null },
    });

    redirect("/host/pricing");
  }

  return (
    <form action={saveMedia} className="space-y-5">
      <div>
        <label className="block text-sm font-medium">Image URLs (comma or new line)</label>
        <textarea
          name="imagesCsv"
          rows={6}
          defaultValue={imagesCsv}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Video URL (optional)</label>
        <input
          name="videoUrl"
          type="url"
          defaultValue={draft!.videoUrl ?? ""}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>

      <div className="flex justify-between">
        <a className="underline" href="/host/basics">Back</a>
        <button className="rounded-xl bg-brand-600 text-white px-5 py-3 font-medium">
          Continue
        </button>
      </div>
    </form>
  );
}
