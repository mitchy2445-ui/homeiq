import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const me = await db.user.findUnique({
      where: { id: session.sub },
      select: { role: true, verificationStatus: true, emailVerifiedAt: true },
    });

    const isAdmin = me?.role === "ADMIN";
    const emailVerified = Boolean(me?.emailVerifiedAt);
    const isVerifiedLandlord = me?.verificationStatus === "VERIFIED";

    if (!emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email first." },
        { status: 403 }
      );
    }

    if (!isVerifiedLandlord && !isAdmin) {
      return NextResponse.json(
        { error: "You must complete landlord verification before listing." },
        { status: 403 }
      );
    }

    // ✅ CREATE TRUE EMPTY DRAFT
    const created = await db.listing.create({
      data: {
        status: "DRAFT",
        landlordId: session.sub,

        title: null,
        description: null,
        houseRules: null,

        street: null,
        aptUnit: null,
        city: null,
        province: null,
        postal: null,
        country: "Canada",

        beds: null,
        baths: null,
        priceCents: null,

        depositCents: null,
        maxOccupants: null,
        minLeaseMonths: null,
        availableFrom: null,

        furnished: null,
        smokingAllowed: null,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/host/listings error", err);
    return NextResponse.json(
      { error: "Could not create listing draft." },
      { status: 500 }
    );
  }
}
