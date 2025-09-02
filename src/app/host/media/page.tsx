// src/app/host/media/page.tsx
import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import HostStepper from "@/components/HostStepper";
import MediaFormClient from "@/components/forms/MediaFormClient";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const s = await requireSession("/host/media");

  const listing = await db.listing.findFirst({
    where: { landlordId: s.sub },
    orderBy: { updatedAt: "desc" },
    select: { id: true, images: true, videoUrl: true },
  });

  if (!listing) redirect("/host/basics");

  // --- server actions ---
  async function saveMedia(formData: FormData): Promise<void> {
    "use server";
    const ss = await requireSession("/host/media");

    const listingId = String(formData.get("listingId") || "");
    if (!listingId) throw new Error("Missing listing id.");

    const photosJson = String(formData.get("photosJson") || "[]");
    const videoUrl = (String(formData.get("videoUrl") || "").trim() || null) as string | null;

    let photos: string[] = [];
    try {
      const parsed = JSON.parse(photosJson);
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) photos = parsed;
    } catch {
      /* ignore */
    }

    const res = await db.listing.updateMany({
      where: { id: listingId, landlordId: ss.sub },
      data: {
        images: photos as unknown as Prisma.JsonArray,
        videoUrl,
      },
    });

    if (res.count === 0) throw new Error("Not allowed to modify this listing.");
  }

  async function continueNext(formData: FormData): Promise<void> {
    "use server";
    await saveMedia(formData);
    redirect("/host/neighborhood");
  }

  const initialPhotos =
    (Array.isArray(listing.images) ? (listing.images as unknown as string[]) : []) ?? [];
  const initialVideo = listing.videoUrl ?? null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <HostStepper current="media" />
      <h1 className="mt-6 text-2xl md:text-3xl font-semibold">Media</h1>
      <p className="text-gray-600 mt-2">
        Upload photos (first becomes the cover) and an optional short video.
      </p>

      <form action={saveMedia} className="mt-6 space-y-8" id="media-form">
        {/* pass the listing id so server actions don't capture a maybe-null object */}
        <input type="hidden" name="listingId" value={listing.id} />
        <MediaFormClient initialPhotos={initialPhotos} initialVideoUrl={initialVideo} />

        <div className="flex justify-between pt-2">
          <a
            href="/host/basics"
            className="rounded-xl border px-4 py-2 hover:bg-gray-50 inline-flex items-center"
          >
            ← Back
          </a>
          <div className="flex gap-2">
            <button
              form="media-form"
              type="submit"
              className="rounded-xl border px-4 py-2 hover:bg-gray-50"
            >
              Save
            </button>
            <button
              formAction={continueNext}
              className="rounded-xl bg-brand-600 text-white px-5 py-3 font-medium hover:opacity-95"
              type="submit"
            >
              Save & Continue
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
