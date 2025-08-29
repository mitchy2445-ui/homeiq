import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await requireSession(); // logged-in only
  const form = await req.formData();
  const files = form.getAll("files") as File[];

  if (!files?.length) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];
  for (const f of files) {
    const buf = Buffer.from(await f.arrayBuffer());
    const ext = f.type === "image/jpeg" ? ".jpg"
      : f.type === "image/png" ? ".png"
      : f.type === "image/webp" ? ".webp"
      : f.type === "video/mp4" ? ".mp4"
      : path.extname(f.name) || "";
    const name = `${Date.now()}_${crypto.randomBytes(5).toString("hex")}${ext}`;
    await fs.writeFile(path.join(uploadDir, name), buf);
    urls.push(`/uploads/${name}`);
  }

  return NextResponse.json({ urls });
}
