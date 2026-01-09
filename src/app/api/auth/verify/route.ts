import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get("token");
    if (!token) return NextResponse.json({ message: "Missing token" }, { status: 400 });

    const vt = await db.verificationToken.findUnique({ where: { token } });
    if (!vt || vt.expires < new Date()) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
    }

    const now = new Date();
    // src/app/auth/verify/route.ts
await db.user.update({
  where: { id: vt.userId },
  data: {
    emailVerifiedAt: new Date(),   // ✅ current field used in your schema
    emailVerified:   new Date(),   // (optional) keep legacy in sync
  },
});

    await db.verificationToken.delete({ where: { id: vt.id } });

    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(new URL("/auth/login?verified=1", base));
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
