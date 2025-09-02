// src/app/api/cloudinary/sign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Sign error";
}

function readFolderFromBody(body: unknown): string | undefined {
  if (body && typeof body === "object" && "folder" in body) {
    const v = (body as { folder?: unknown }).folder;
    if (typeof v === "string") return v;
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json({ error: "Cloudinary env vars missing" }, { status: 500 });
    }

    // Safely parse JSON body (it may be empty)
    let parsed: unknown = undefined;
    try {
      parsed = await req.json();
    } catch {
      /* ignore non-JSON/empty body */
    }

    const defaultFolder = process.env.CLOUDINARY_FOLDER || "homeiq/uploads";
    const folder = readFolderFromBody(parsed) ?? defaultFolder;

    const timestamp = Math.round(Date.now() / 1000);

    // Type-safe params (avoid `any`)
    const paramsToSign = { timestamp, folder } satisfies Record<string, string | number>;

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign as unknown as Record<string, unknown>,
      process.env.CLOUDINARY_API_SECRET
    );

    return NextResponse.json({
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
