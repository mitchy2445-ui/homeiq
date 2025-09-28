import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { jwtVerify } from "jose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";

  if (!token) {
    return NextResponse.redirect(`${baseUrl()}/landlord/verify?email=missing`);
  }

  try {
    const key = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

    // Verify signature & exp
    const { payload } = await jwtVerify(token, key);
    const typ = payload.typ;
    const sub = typeof payload.sub === "string" ? payload.sub : "";
    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";

    if (typ !== "email_verify" || !sub || !email) {
      return NextResponse.redirect(`${baseUrl()}/landlord/verify?email=invalid`);
    }

    // Single-use check: token must exist in DB and not be expired
    const row = await db.verificationToken.findUnique({ where: { token } });
    if (!row || row.userId !== sub || row.expires < new Date()) {
      return NextResponse.redirect(`${baseUrl()}/landlord/verify?email=expired`);
    }

    // If the email changed, ensure uniqueness
    const other = await db.user.findUnique({ where: { email } });
    if (other && other.id !== sub) {
      // Someone else already has this email
      await db.verificationToken.delete({ where: { token } }).catch(() => {});
      return NextResponse.redirect(`${baseUrl()}/landlord/verify?email=taken`);
    }

    // Update user (set email if changed) and mark verified
    await db.user.update({
      where: { id: sub },
      data: {
        email,
        emailVerifiedAt: new Date(),
        // keep legacy field in sync if you still use it elsewhere
        emailVerified: new Date(),
      },
    });

    // Invalidate token (single use)
    await db.verificationToken.delete({ where: { token } }).catch(() => {});

    return NextResponse.redirect(`${baseUrl()}/landlord/verify?email=ok`);
  } catch {
    return NextResponse.redirect(`${baseUrl()}/landlord/verify?email=invalid`);
  }
}

function baseUrl() {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
