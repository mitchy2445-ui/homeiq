// src/app/actions/viewings.ts
"use server";

import { prisma as db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const iso = z.string().datetime().optional();

const createSchema = z.object({
  listingId: z.string().min(1),
  landlordId: z.string().min(1),
  note: z.string().max(2000).optional(),
  slot1Start: iso,
  slot1End: iso,
  slot2Start: iso,
  slot2End: iso,
  slot3Start: iso,
  slot3End: iso,
});

function toDate(s?: string | null) {
  return s ? new Date(s) : undefined;
}
function isValidRange(a?: Date, b?: Date) {
  return !!(a && b && a < b);
}

export async function createViewingRequest(input: z.infer<typeof createSchema>) {
  const s = await requireSession(); // session has `sub`
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid input");
  }

  const {
    listingId,
    landlordId,
    note,
    slot1Start,
    slot1End,
    slot2Start,
    slot2End,
    slot3Start,
    slot3End,
  } = parsed.data;

  // --- Normalize slot pairs
  const S1 = { start: toDate(slot1Start), end: toDate(slot1End) };
  const S2 = { start: toDate(slot2Start), end: toDate(slot2End) };
  const S3 = { start: toDate(slot3Start), end: toDate(slot3End) };

  // Disallow half-filled slots
  for (const [i, s] of [S1, S2, S3].entries()) {
    const bothUndefined = !s.start && !s.end;
    const bothDefined = !!(s.start && s.end);
    if (!bothUndefined && !bothDefined) {
      throw new Error(`Slot ${i + 1} must have both start and end.`);
    }
  }

  // Require at least one valid slot (start < end)
  const validSlots = [S1, S2, S3].filter((s) => isValidRange(s.start, s.end));
  if (validSlots.length === 0) {
    throw new Error("Please provide at least one valid time slot.");
  }

  // Disallow multiple PENDING requests for the same listing by the same renter
  const existingPending = await db.viewingRequest.findFirst({
    where: { listingId, renterId: s.sub, status: "PENDING" },
    select: { id: true },
  });
  if (existingPending) {
    throw new Error("You already have a pending request for this listing.");
  }

  const vr = await db.viewingRequest.create({
    data: {
      listingId,
      renterId: s.sub,
      landlordId,
      note,
      slot1Start: S1.start ?? null,
      slot1End: S1.end ?? null,
      slot2Start: S2.start ?? null,
      slot2End: S2.end ?? null,
      slot3Start: S3.start ?? null,
      slot3End: S3.end ?? null,
    },
    select: { id: true, listingId: true },
  });

  revalidatePath(`/listing/${vr.listingId}`);
  revalidatePath(`/host/viewings`);
  return { ok: true, id: vr.id };
}

const decideSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["APPROVE", "DECLINE", "CANCEL"]),
  chosenStart: iso,
  chosenEnd: iso,
});

export async function decideViewingRequest(input: z.infer<typeof decideSchema>) {
  const s = await requireSession(); // has `sub`
  const { id, action, chosenStart, chosenEnd } = decideSchema.parse(input);

  const vr = await db.viewingRequest.findUnique({
    where: { id },
    select: {
      id: true,
      listingId: true,
      renterId: true,
      landlordId: true,
      status: true,
      // bring slots for validation
      slot1Start: true,
      slot1End: true,
      slot2Start: true,
      slot2End: true,
      slot3Start: true,
      slot3End: true,
    },
  });

  if (!vr) throw new Error("Not found");

  const isLandlord = s.sub === vr.landlordId;
  const isRenter = s.sub === vr.renterId;

  if (action === "CANCEL") {
    if (!isRenter && !isLandlord) throw new Error("Forbidden");
    await db.viewingRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  } else {
    if (!isLandlord) throw new Error("Forbidden");

    if (action === "APPROVE") {
      if (vr.status !== "PENDING") {
        throw new Error("Only pending requests can be approved.");
      }
      if (!chosenStart || !chosenEnd) {
        throw new Error("Choose a slot to approve");
      }
      const CS = new Date(chosenStart);
      const CE = new Date(chosenEnd);
      if (!(CS < CE)) {
        throw new Error("Invalid approval times (end must be after start).");
      }

      // chosen must match one of the proposed slots exactly
      const matchesProposed =
        (vr.slot1Start && vr.slot1End && +vr.slot1Start === +CS && +vr.slot1End === +CE) ||
        (vr.slot2Start && vr.slot2End && +vr.slot2Start === +CS && +vr.slot2End === +CE) ||
        (vr.slot3Start && vr.slot3End && +vr.slot3Start === +CS && +vr.slot3End === +CE);

      if (!matchesProposed) {
        throw new Error("Chosen time must match one of the proposed slots.");
      }

      // Prevent overlapping approvals for this listing
      const conflict = await db.viewingRequest.findFirst({
        where: {
          landlordId: vr.landlordId,
          listingId: vr.listingId,
          status: "APPROVED",
          AND: [{ chosenStart: { lte: CE } }, { chosenEnd: { gte: CS } }],
        },
      });
      if (conflict) {
        throw new Error("This time overlaps another approved viewing.");
      }

      await db.viewingRequest.update({
        where: { id },
        data: { status: "APPROVED", chosenStart: CS, chosenEnd: CE },
      });
    } else if (action === "DECLINE") {
      if (vr.status !== "PENDING") {
        throw new Error("Only pending requests can be declined.");
      }
      await db.viewingRequest.update({
        where: { id },
        data: { status: "DECLINED" },
      });
    }
  }

  revalidatePath(`/host/viewings`);
  revalidatePath(`/listing/${vr.listingId}`);
  return { ok: true };
}
