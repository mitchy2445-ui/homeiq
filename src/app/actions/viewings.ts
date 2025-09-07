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
  slot1Start: iso, slot1End: iso,
  slot2Start: iso, slot2End: iso,
  slot3Start: iso, slot3End: iso,
});

export async function createViewingRequest(input: z.infer<typeof createSchema>) {
  const s = await requireSession(); // your session has `sub`, not `user`
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid input");
  }

  const {
    listingId,
    landlordId,
    note,
    slot1Start, slot1End,
    slot2Start, slot2End,
    slot3Start, slot3End,
  } = parsed.data;

  const vr = await db.viewingRequest.create({
    data: {
      listingId,
      renterId: s.sub,         // <- use sub
      landlordId,
      note,
      slot1Start: slot1Start ? new Date(slot1Start) : null,
      slot1End:   slot1End   ? new Date(slot1End)   : null,
      slot2Start: slot2Start ? new Date(slot2Start) : null,
      slot2End:   slot2End   ? new Date(slot2End)   : null,
      slot3Start: slot3Start ? new Date(slot3Start) : null,
      slot3End:   slot3End   ? new Date(slot3End)   : null,
    },
    select: { id: true, listingId: true },
  });

  revalidatePath(`/listing/${vr.listingId}`);
  revalidatePath(`/host/viewings`);
  return { ok: true, id: vr.id };
}

const decideSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["APPROVE","DECLINE","CANCEL"]),
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
    },
  });

  if (!vr) throw new Error("Not found");

  const isLandlord = s.sub === vr.landlordId;
  const isRenter   = s.sub === vr.renterId;

  if (action === "CANCEL") {
    if (!isRenter && !isLandlord) throw new Error("Forbidden");
    await db.viewingRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  } else {
    if (!isLandlord) throw new Error("Forbidden");
    if (action === "APPROVE") {
      if (!chosenStart || !chosenEnd) throw new Error("Choose a slot to approve");
      await db.viewingRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          chosenStart: new Date(chosenStart),
          chosenEnd: new Date(chosenEnd),
        },
      });
    } else if (action === "DECLINE") {
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
