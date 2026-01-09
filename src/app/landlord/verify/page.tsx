// src/app/landlord/verify/page.tsx
import { redirect } from "next/navigation";
import { prisma as db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";
import VerifyClient from "./VerifyClient";

export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login?next=/landlord/verify");

  const me = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phoneVerifiedAt: true,
      emailVerifiedAt: true,
      verificationStatus: true,
    },
  });

  if (!me) redirect("/auth/login?next=/landlord/verify");
  if (me.verificationStatus === "VERIFIED") redirect("/landlord/new/basics");

  return (
    <VerifyClient
      initialEmail={me.email}
      initialPhoneVerified={Boolean(me.phoneVerifiedAt)}
      initialEmailVerified={Boolean(me.emailVerifiedAt)}
    />
  );
}
