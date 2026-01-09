// src/app/landlord/new/photos/page.tsx
import { redirect } from "next/navigation";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";
import PhotoUploader from "./PhotoUploader";

export const runtime = "nodejs";

export default async function PhotosStepPage({
  searchParams,
}: {
  // ✅ Next 15: searchParams is a Promise
  searchParams: Promise<{ id?: string }>;
}) {
  // Await params
  const sp = await searchParams;
  const id = (sp?.id || "").trim();

  // Require session
  const s = await getSessionFromCookie();
  if (!s) redirect("/auth/login?next=/landlord/new/photos");

  // Must have listing id from previous step
  if (!id) redirect("/landlord/new/basics");

  // Gate: verified email + verified landlord (or admin)
  const me = await db.user.findUnique({
    where: { id: s.sub },
    select: { role: true, verificationStatus: true, emailVerifiedAt: true },
  });

  const isAdmin = me?.role === "ADMIN";
  const emailVerified = Boolean(me?.emailVerifiedAt);
  const isVerifiedLandlord = me?.verificationStatus === "VERIFIED";

  if (!emailVerified) {
    redirect(`/auth/login?next=/landlord/new/photos?id=${encodeURIComponent(id)}`);
  }
  if (!isVerifiedLandlord && !isAdmin) redirect("/landlord/verify");

  // Pull listing + current photos
  const listing = await db.listing.findUnique({
    where: { id },
    select: {
      id: true,
      landlordId: true,
      title: true,
      photos: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, url: true, alt: true, sortOrder: true },
      },
    },
  });

  if (!listing) redirect("/landlord/new/basics");
  if (!isAdmin && listing.landlordId !== s.sub) redirect("/");

  // Read Cloudinary public env (must exist in .env.local)
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

  // Friendly config message if missing
  if (!cloudName || !uploadPreset) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-semibold mb-2">Photos</h1>
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Missing Cloudinary config. Add <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> and{" "}
          <code>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code> to <code>.env.local</code> and restart the dev server.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Photos</h1>
      <p className="text-sm text-gray-600 mb-6">
        Add clear photos of the property. Homes with 10+ high-quality photos get more views.
      </p>

      <PhotoUploader
        listingId={listing.id}
        initialPhotos={listing.photos}
        cloudName={cloudName}
        uploadPreset={uploadPreset}
        maxCount={30}
        minRecommended={5}
      />

      <div className="mt-8 flex items-center gap-3">
        <a
          href={`/landlord/new/details?id=${encodeURIComponent(listing.id)}`}
          className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Back to Details
        </a>
        <a
          href={`/landlord/new/video?id=${encodeURIComponent(listing.id)}`}
          className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Continue to Video
        </a>
      </div>
    </main>
  );
}
