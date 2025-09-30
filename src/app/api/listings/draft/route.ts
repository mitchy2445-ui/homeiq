// src/app/api/listings/draft/route.ts
import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
// import { getCurrentUserId } from "@/lib/currentUser"; // if you attach ownerId

export async function POST() {
  try {
    // const userId = await getCurrentUserId();
    // if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const listing = await db.listing.create({
      data: {
        title: "",
        description: "",
        houseRules: "",

        // Required fields with safe defaults — adjust to your schema
        city: "Draft",
        price: 0,
        beds: 0,
        baths: 0,

        // ownerId: userId,
        // status: "DRAFT",
      },
      select: { id: true },
    });

    return NextResponse.json({ id: listing.id }, { status: 201 });
  } catch (error) {
    // Use the variable (fixes no-unused-vars) and keep logs out of prod if you want
    console.error("[listings/draft] Failed to create draft:", error);
    return NextResponse.json(
      { message: "Failed to create draft" },
      { status: 500 }
    );
  }
}
