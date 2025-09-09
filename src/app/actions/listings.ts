// src/app/actions/listings.ts
"use server";

import { prisma as db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Helpers
 */
function assert(cond: any, msg = "Invalid request"): asserts cond {
  if (!cond) throw new Error(msg);
}

async function ensureOwner(listingId: string, userId: string) {
  const li = await db.listing.findUnique({
    where: { id: listingId },
    select: { id: true, landlordId: true, status: true },
  });
  assert(li, "Listing not found");
  assert(li!.landlordId === userId, "Forbidden");
  return li!;
}

/**
 * Landlord: submit listing for review (DRAFT/REJECTED -> PENDING)
 * Accepts FormData with: id
 */
export async function submitListing(formData: FormData) {
  const s = await requireSession();
  const id = String(formData.get("id") ?? "");
  assert(id, "Missing listing id");

  // must be owner
  const li = await ensureOwner(id, s.sub);
  assert(li.status === "DRAFT" || li.status === "REJECTED", "Listing cannot be submitted");

  await db.listing.update({
    where: { id },
    data: { status: "PENDING" },
  });

  // Revalidate relevant pages
  revalidatePath("/listings");
  revalidatePath("/host/listings");
  revalidatePath(`/listing/${id}`);

  return { ok: true };
}

/**
 * Admin: approve (PENDING -> APPROVED)
 * Accepts FormData with: id
 */
export async function approveListing(formData: FormData) {
  const s = await requireSession();
  const isAdmin = s.role === "ADMIN";
  assert(isAdmin, "Admin only");

  const id = String(formData.get("id") ?? "");
  assert(id, "Missing listing id");

  const li = await db.listing.findUnique({
    where: { id },
    select: { status: true },
  });
  assert(li, "Listing not found");
  assert(li!.status === "PENDING", "Only pending listings can be approved");

  await db.listing.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  revalidatePath("/listings");
  revalidatePath("/admin/listings");
  revalidatePath(`/listing/${id}`);

  return { ok: true };
}

/**
 * Admin: reject (PENDING -> REJECTED)
 * Accepts FormData with: id
 */
export async function rejectListing(formData: FormData) {
  const s = await requireSession();
  const isAdmin = s.role === "ADMIN";
  assert(isAdmin, "Admin only");

  const id = String(formData.get("id") ?? "");
  assert(id, "Missing listing id");

  const li = await db.listing.findUnique({
    where: { id },
    select: { status: true },
  });
  assert(li, "Listing not found");
  assert(li!.status === "PENDING", "Only pending listings can be rejected");

  await db.listing.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  revalidatePath("/admin/listings");
  revalidatePath("/host/listings");
  revalidatePath(`/listing/${id}`);

  return { ok: true };
}
