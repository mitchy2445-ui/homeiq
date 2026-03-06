// src/app/roommates/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma as db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function RoommateListingDetailPage({ params }: PageProps) {
  const { id } = params;

  const session = await requireSession();
  if (!session) {
    redirect(`/login?redirect=/roommates/${id}`);
  }

  const listing = await db.roommateListing.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          roommateProfile: {
            select: {
              age: true,
              occupation: true,
              cleanliness: true,
              socialLevel: true,
              sleepSchedule: true,
              smoking: true,
              pets: true,
            },
          },
        },
      },
    },
  });

  if (!listing) {
    notFound();
  }

  const { owner } = listing;
  const profile = owner.roommateProfile;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">
        {/* Back link */}
        <div>
          <Link
            href="/roommates"
            className="inline-flex items-center text-neutral-600 hover:text-emerald-600 transition text-sm font-medium"
          >
            ← Back to listings
          </Link>
        </div>

        {/* Header */}
        <header className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
              {listing.type === "ROOM_AVAILABLE" ? "Room Available" : "Looking for Room"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900">
            {listing.title}
          </h1>

          <div className="text-sm text-neutral-600">
            Posted by{" "}
            <span className="font-medium text-neutral-900">
              {owner.name || "HomeIQ User"}
            </span>
          </div>
        </header>

        {/* About */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-neutral-900">About this listing</h2>
          <div className="prose prose-neutral max-w-none">
            <p className="whitespace-pre-line text-neutral-700 leading-relaxed">
              {listing.description}
            </p>
          </div>
        </section>

        {/* Preferences */}
        {(listing.preferredGender || listing.minAge || listing.maxAge) && (
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-neutral-900">Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listing.preferredGender && (
                <div>
                  <dt className="text-sm font-medium text-neutral-600">Preferred gender</dt>
                  <dd className="mt-1 text-neutral-900">{listing.preferredGender}</dd>
                </div>
              )}

              {(listing.minAge || listing.maxAge) && (
                <div>
                  <dt className="text-sm font-medium text-neutral-600">Age range</dt>
                  <dd className="mt-1 text-neutral-900">
                    {listing.minAge ?? "—"} – {listing.maxAge ?? "—"}
                  </dd>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Owner Lifestyle */}
        {profile && (
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-neutral-900">
              About the poster
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50 rounded-xl p-6">
              {profile.age && (
                <div>
                  <dt className="text-sm font-medium text-neutral-600">Age</dt>
                  <dd className="mt-1 text-neutral-900">{profile.age}</dd>
                </div>
              )}

              {profile.occupation && (
                <div>
                  <dt className="text-sm font-medium text-neutral-600">Occupation</dt>
                  <dd className="mt-1 text-neutral-900">{profile.occupation}</dd>
                </div>
              )}

              {profile.cleanliness && (
                <div>
                  <dt className="text-sm font-medium text-neutral-600">Cleanliness</dt>
                  <dd className="mt-1 text-neutral-900">{profile.cleanliness} / 5</dd>
                </div>
              )}

              {profile.socialLevel && (
                <div>
                  <dt className="text-sm font-medium text-neutral-600">Social level</dt>
                  <dd className="mt-1 text-neutral-900">{profile.socialLevel} / 5</dd>
                </div>
              )}

              {profile.sleepSchedule && (
                <div>
                  <dt className="text-sm font-medium text-neutral-600">Sleep schedule</dt>
                  <dd className="mt-1 text-neutral-900">
                    {profile.sleepSchedule === "EARLY"
                      ? "Early riser"
                      : profile.sleepSchedule === "NIGHT_OWL"
                      ? "Night owl"
                      : "Flexible"}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-neutral-600">Smoking</dt>
                <dd className="mt-1 text-neutral-900">
                  {profile.smoking ? "Yes" : "No"}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-neutral-600">Pets</dt>
                <dd className="mt-1 text-neutral-900">
                  {profile.pets ? "Yes" : "No"}
                </dd>
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="pt-8 border-t border-neutral-200 flex justify-center md:justify-end">
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-10 py-6 text-base font-medium transition min-w-[240px]"
          >
            Message roommate
          </Button>
        </div>
      </div>
    </div>
  );
}