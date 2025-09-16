import { prisma as db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "./currentUser";

export async function requireSession(next?: string) {
  const userId = await getCurrentUserId();
  if (!userId) {
    const dest = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
    redirect(dest);
  }
  // return a minimal shape (add more if you need)
  return { user: { id: userId! } };
}

export async function requireVerifiedUser() {
  const { user } = await requireSession("/landlord/verify");
  const u = await db.user.findUnique({
    where: { id: user.id },
    select: { verificationStatus: true },
  });
  if (!u) redirect("/login");
  if (u.verificationStatus !== "VERIFIED") redirect("/landlord/verify");
  return { user };
}

export async function getUserVerificationStatus() {
  const userId = await getCurrentUserId();
  if (!userId) return "UNAUTHENTICATED" as const;
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { verificationStatus: true },
  });
  return (u?.verificationStatus ?? "UNVERIFIED") as
    | "UNVERIFIED"
    | "PENDING"
    | "VERIFIED"
    | "REJECTED";
}
