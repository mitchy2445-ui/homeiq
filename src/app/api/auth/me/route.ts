import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const token = (await cookies()).get("homeiq_session")?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 200 });
  const payload = await verifySession(token);
  return NextResponse.json({ user: payload ?? null }, { status: 200 });
}
