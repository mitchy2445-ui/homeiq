import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await requireSession(req);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const profile = await prisma.roommateProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        age: true,
        gender: true,
        occupation: true,
        bio: true,
        budgetMin: true,
        budgetMax: true,
        moveInDate: true,
        cleanliness: true,
        socialLevel: true,
        sleepSchedule: true,
        smoking: true,
        pets: true,
      },
    });

    return NextResponse.json(profile ?? {});
  } catch (err) {
    console.error(err);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireSession(req);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const formData = await req.formData();

    const data: any = {};

    // Parse only provided fields
    if (formData.has("age")) data.age = parseInt(formData.get("age") as string) || undefined;
    if (formData.has("gender")) data.gender = (formData.get("gender") as string) || undefined;
    if (formData.has("occupation")) data.occupation = (formData.get("occupation") as string) || undefined;
    if (formData.has("bio")) data.bio = (formData.get("bio") as string) || undefined;

    if (formData.has("budgetMin")) data.budgetMin = parseInt(formData.get("budgetMin") as string) || undefined;
    if (formData.has("budgetMax")) data.budgetMax = parseInt(formData.get("budgetMax") as string) || undefined;
    if (formData.has("moveInDate")) data.moveInDate = formData.get("moveInDate") ? new Date(formData.get("moveInDate") as string) : undefined;

    if (formData.has("cleanliness")) data.cleanliness = parseInt(formData.get("cleanliness") as string) || undefined;
    if (formData.has("socialLevel")) data.socialLevel = parseInt(formData.get("socialLevel") as string) || undefined;
    if (formData.has("sleepSchedule")) data.sleepSchedule = formData.get("sleepSchedule") as string;
    if (formData.has("smoking")) data.smoking = formData.get("smoking") === "true";
    if (formData.has("pets")) data.pets = formData.get("pets") === "true";

    await prisma.roommateProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...data,
      },
      update: data,
    });

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to save profile", { status: 500 });
  }
}