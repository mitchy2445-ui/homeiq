import "server-only";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";

/** Return the current user id from the signed cookie, or null. */
export async function getCurrentUserId(): Promise<string | null> {
  const sess = await getSessionFromCookie();
  return sess?.sub ?? null;
}

/** Return a minimal user object for headers/guards, or null. */
export async function getCurrentUser() {
  const id = await getCurrentUserId();
  if (!id) return null;

  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      emailVerifiedAt: true,
      verificationStatus: true,
    },
  });
}
