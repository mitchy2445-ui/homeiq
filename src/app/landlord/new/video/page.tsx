// src/app/landlord/new/video/page.tsx
import { redirect } from "next/navigation";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";
import VideoUploader from "./VideoUploader";

export const runtime = "nodejs";

export default async function VideoStepPage({
  searchParams,
}: { searchParams: Promise<{ id?: string }> }) {
  // Next 15: await params
  const sp = await searchParams;
  const id = (sp?.id || "").trim();

  const s = await getSessionFromCookie();
  if (!s) redirect("/auth/login?next=/landlord/new/video");
  if (!id) redirect("/landlord/new/basics");

  const me = await db.user.findUnique({
    where: { id: s.sub },
    select: { role: true, verificationStatus: true, emailVerifiedAt: true },
  });

  const isAdmin = me?.role === "ADMIN";
  const emailVerified = Boolean(me?.emailVerifiedAt);
  const isVerifiedLandlord = me?.verificationStatus === "VERIFIED";

  if (!emailVerified) {
    redirect(`/auth/login?next=/landlord/new/video?id=${encodeURIComponent(id)}`);
  }
  if (!isVerifiedLandlord && !isAdmin) redirect("/landlord/verify");

  const listing = await db.listing.findUnique({
    where: { id },
    select: {
      id: true,
      landlordId: true,
      title: true,
      videoUrl: true,
    },
  });

  if (!listing) redirect("/landlord/new/basics");
  if (!isAdmin && listing.landlordId !== s.sub) redirect("/");

  // Public envs for Cloudinary (video)
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
  // Prefer a dedicated video preset; fall back to the image preset if you enabled videos there
  const uploadPreset =
    process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_PRESET ??
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ??
    "";

  if (!cloudName || !uploadPreset) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-semibold mb-2">Video tour</h1>
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Missing Cloudinary config. Add <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> and{" "}
          <code>NEXT_PUBLIC_CLOUDINARY_VIDEO_PRESET</code> (or{" "}
          <code>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code> that allows videos) to{" "}
          <code>.env.local</code>, then restart the dev server.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Video tour</h1>
      <p className="text-sm text-gray-600 mb-6">
        Upload a short walkthrough of the property. Max length: <strong>5 minutes</strong>. Accepted: MP4 / MOV / WEBM.
      </p>

      <VideoUploader
        listingId={listing.id}
        initialUrl={listing.videoUrl ?? ""}
        cloudName={cloudName}
        uploadPreset={uploadPreset}
        maxDurationSec={300}
      />

      <div className="mt-8 flex items-center gap-3">
        <a
          href={`/landlord/new/photos?id=${encodeURIComponent(listing.id)}`}
          className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Back to Photos
        </a>
        <a
          href={`/landlord/new/insights?id=${encodeURIComponent(listing.id)}`}
          className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Continue to Insights
        </a>
      </div>
    </main>
  );
}
