import { getSessionFromCookie } from "@/lib/auth";

/**
 * Normalizes user id regardless of your session shape.
 * Supports: { user: { id } } | { userId } | { id } | null/undefined
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session: any = await getSessionFromCookie();

  if (!session) return null;

  // Common shapes:
  if (session.user?.id) return session.user.id as string;
  if (session.userId) return session.userId as string;
  if (typeof session.id === "string") return session.id;

  return null;
}
