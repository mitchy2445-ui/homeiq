import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import MediaFormClient from "@/components/forms/MediaFormClient";
import { redirect } from "next/navigation";
import { Image as ImageIcon, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const listingId = params.id;

  const session = await requireSession("/host/media");

  if (!listingId) {
    redirect("/host/basics");
  }

  const listing = await db.listing.findFirst({
    where: {
      id: listingId,
      landlordId: session.sub,
    },
    select: {
      id: true,
      images: true,
      videoUrl: true,
    },
  });

  if (!listing) {
    redirect("/host/basics");
  }

  /* ---------------- Server Actions ---------------- */

  async function saveMedia(formData: FormData): Promise<void> {
    "use server";

    const ss = await requireSession("/host/media");

    const id = String(formData.get("listingId") || "");
    if (!id) throw new Error("Missing listing id.");

    const photosJson = String(formData.get("photosJson") || "[]");
    const videoUrl = String(formData.get("videoUrl") || "").trim() || null;

    let photos: string[] = [];
    try {
      const parsed = JSON.parse(photosJson);
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
        photos = parsed;
      }
    } catch {
      // ignore invalid JSON
    }

    const res = await db.listing.updateMany({
      where: { id, landlordId: ss.sub },
      data: {
        images: photos as unknown as Prisma.JsonArray,
        videoUrl,
      },
    });

    if (res.count === 0) {
      throw new Error("Not allowed to modify this listing.");
    }
  }

  async function continueNext(formData: FormData): Promise<void> {
    "use server";
    await saveMedia(formData);
    redirect(`/host/neighborhood?id=${listingId}`);
  }

  /* ---------------- Initial Data ---------------- */

  const initialPhotos = Array.isArray(listing.images)
    ? (listing.images as unknown as string[])
    : [];

  const initialVideo = listing.videoUrl ?? null;

  /* ---------------- Render ---------------- */

  return (
    <div className="min-h-screen bg-neutral-50/40">
      <div className="mx-auto max-w-4xl px-5 sm:px-8 py-12 lg:py-16 space-y-16">
        {/* Header – exact match to Basics */}
        <header className="space-y-4 max-w-2xl">
          <div className="text-sm font-medium tracking-wide text-neutral-500 uppercase">
            Step 3 of 5 · Media
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
            Add photos and a video
          </h1>
          <p className="text-lg text-neutral-600">
            High-quality photos help renters trust your listing.
          </p>
        </header>

        {/* Section 1: Photos */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-6 w-6 text-neutral-700" />
            <h2 className="text-2xl font-semibold">Photos</h2>
          </div>

          <div className="space-y-6">
            <MediaFormClient
              initialPhotos={initialPhotos}
              initialVideoUrl={initialVideo}
            />
          </div>
        </section>

        {/* Section 2: Optional Video */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <Video className="h-6 w-6 text-neutral-700" />
            <h2 className="text-2xl font-semibold">Optional video</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl" className="text-sm font-medium text-neutral-700">
              Video URL (YouTube, Vimeo, or direct link)
            </Label>
            <Input
              id="videoUrl"
              defaultValue={initialVideo ?? ""}
              placeholder="https://youtube.com/watch?v=..."
              className="rounded-xl border border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <p className="text-sm text-neutral-500">
              Short walkthrough videos increase booking rates significantly.
            </p>
          </div>
        </section>

        {/* Footer – identical to Basics */}
        <footer className="pt-12 border-t flex items-center justify-between">
          <a
            href={`/host/details?id=${listingId}`}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            ← Back
          </a>

          <div className="flex gap-4">
            <button
              form="media-form"
              type="submit"
              className="rounded-xl border px-6 py-3 hover:bg-gray-50 text-sm font-medium transition"
            >
              Save
            </button>

            <button
              form="media-form"
              formAction={continueNext}
              type="submit"
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 font-medium transition"
            >
              Continue
            </button>
          </div>
        </footer>

        {/* Form for server actions */}
        <form id="media-form" action={saveMedia}>
          <input type="hidden" name="listingId" value={listing.id} />
          <input id="photos-json" name="photosJson" type="hidden" defaultValue="[]" />
          <input id="video-url" name="videoUrl" type="hidden" defaultValue={initialVideo ?? ""} />
        </form>
      </div>
    </div>
  );
}