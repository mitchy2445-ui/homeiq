import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });
  // No-op save. Switch to Option B once your schema has insights fields.
  return NextResponse.json({ ok: true, id }, { status: 200 });
}
