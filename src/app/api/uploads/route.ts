import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "../../../lib/cloudinary"; // or "@/lib/cloudinary"
import type { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

export const runtime = "nodejs";

function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Upload failed";
}

export async function POST(req: NextRequest) {
  try {
    // Ensure env is present so we always return JSON on failure
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { error: "Cloudinary env vars missing" },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const resourceType = (form.get("resourceType") as string) || "image";
    const folder = process.env.CLOUDINARY_FOLDER || "homeiq/uploads";

    // Stream upload to avoid buffering big files
    const url = await new Promise<string>((resolve, reject) => {
      const cldStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType as "image" | "video",
          format: resourceType === "video" ? "mp4" : undefined,
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined
        ) => {
          if (error || !result?.secure_url) {
            reject(error ?? new Error("Cloudinary upload failed"));
            return;
          }
          resolve(result.secure_url);
        }
      );

      // Cast DOM ReadableStream -> Node's WebReadableStream, then into Node Readable
      const webStream = file.stream() as unknown as WebReadableStream;
      Readable.fromWeb(webStream).pipe(cldStream);
    });

    return NextResponse.json({ url });
  } catch (err: unknown) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
