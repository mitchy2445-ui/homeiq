import { prisma as db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";

/**
 * Get a draft listing for the current landlord, or create one.
 * If a listingId is provided, it must belong to the current user.
 */
export async function getOrCreateDraftListing(listingId?: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");

  // If a listing id is passed (e.g. ?listing=abc), prefer that — but only if it belongs to the user
  if (listingId) {
    const owned = await db.listing.findFirst({
      where: { id: listingId, landlordId: userId },
    });
    if (owned) return owned;
  }

  // Reuse the most recent draft for this landlord if it exists
  const existing = await db.listing.findFirst({
    where: { landlordId: userId, status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) return existing;

  // Otherwise create a minimal draft (use safe defaults for required fields)
  return await db.listing.create({
    data: {
      landlordId: userId,
      status: "DRAFT",
      title: "Draft listing",
      city: "TBD",
      beds: 0,
      baths: 0,
      price: 0, // cents
      description: "",
      locationVerified: false,
      insights: {},
    },
  });
}
