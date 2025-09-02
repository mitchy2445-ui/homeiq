// src/app/host/new/page.tsx
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import NewListingForm from "./NewListingForm";

export const dynamic = "force-dynamic";

// ---- small, safe helpers (no `any`) ----
function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getString(obj: unknown, key: string): string | null {
  if (!isObj(obj)) return null;
  const val = obj[key];
  return typeof val === "string" ? val : null;
}
function extractUserId(session: unknown): string | null {
  if (!isObj(session)) return null;

  // { userId: "..." }
  const userId = getString(session, "userId");
  if (userId) return userId;

  // { id: "..." }
  const id = getString(session, "id");
  if (id) return id;

  // { user: { id: "..." } } or { user: { sub: "..." } }
  const user = isObj((session as Record<string, unknown>).user)
    ? ((session as Record<string, unknown>).user as Record<string, unknown>)
    : null;
  if (user) {
    const uid = getString(user, "id") ?? getString(user, "sub");
    if (uid) return uid;
  }

  // { claims: { sub: "..." } }
  const claims = isObj((session as Record<string, unknown>).claims)
    ? ((session as Record<string, unknown>).claims as Record<string, unknown>)
    : null;
  if (claims) {
    const sub = getString(claims, "sub");
    if (sub) return sub;
  }

  return null;
}

export default async function Page() {
  // Protect route; adapt to your auth impl
  const session = await requireSession().catch(() => null);
  const landlordId = extractUserId(session);

  if (!landlordId) {
    // not signed in → send to home where your login modal can read ?login=1
    redirect("/?login=1");
  }

  return <NewListingForm landlordId={landlordId} />;
}
