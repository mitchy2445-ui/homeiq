"use server";

import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function contactLandlord(listingId: string) {
  const session = await requireSession(`/listings/${listingId}`);

  // ✅ Fetch listing owner correctly
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      landlordId: true,
    },
  });

  if (!listing || !listing.landlordId) {
    redirect("/messages");
  }

  // ❌ Prevent messaging yourself
  if (listing.landlordId === session.sub) {
    redirect("/messages");
  }

  // ✅ Check if conversation already exists
  const existing = await db.conversation.findFirst({
    where: {
      listingId,
      participants: {
        every: {
          userId: {
            in: [session.sub, listing.landlordId],
          },
        },
      },
    },
    select: { id: true },
  });

  if (existing) {
    redirect(`/messages/${existing.id}`);
  }

  // ✅ Create new conversation
  const convo = await db.conversation.create({
    data: {
      listingId,
      participants: {
        create: [
          { userId: session.sub },
          { userId: listing.landlordId },
        ],
      },
      lastMessageAt: new Date(),
    },
    select: { id: true },
  });

  redirect(`/messages/${convo.id}`);
}
