// src/app/landlord/new/photos/page.tsx
import { redirect } from "next/navigation";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";
import PhotoUploader from "./PhotoUploader";

export const runtime = "nodejs";

export default async function PhotosStepPage({
  searchParams,
}: { searchParams: { id?: string } }) {
  const s = await getSessionFromCookie();
  if (!s) redirect("/auth/login?next=/landlord/new/photos");

  const id = (searchParams?.id || "").trim();
  if (!id) redirect("/landlord/new/basics");

  const me = await db.user.findUnique({
    where: { id: s.sub },
    select: { role: true, verificationStatus: true, emailVerifiedAt: true },
  });

  const isAdmin = me?.role === "ADMIN";
  const emailVerified = Boolean(me?.emailVerifiedAt);
  const isVerifiedLandlord = me?.verificationStatus === "VERIFIED";

  if (!emailVerified) redirect(`/auth/login?next=/landlord/new/photos?id=${encodeURIComponent(id)}`);
  if (!isVerifiedLandlord && !isAdmin) redirect("/landlord/verify");

  const listing = await db.listing.findUnique({
    where: { id },
    select: {
      id: true,
      landlordId: true,
      status: true,
      title: true,
      photos: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, url: true, alt: true, sortOrder: true },
      },
    },
  });

  if (!listing) redirect("/landlord/new/basics");
  if (!isAdmin && listing.landlordId !== s.sub) redirect("/");

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Photos</h1>
      <p className="text-sm text-gray-600 mb-6">
        Add clear photos of the property. Homes with 10+ high-quality photos get more views.
      </p>

      <PhotoUploader
        listingId={listing.id}
        initialPhotos={listing.photos}
        cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ""}
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? ""}
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
