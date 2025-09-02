import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs"; // required for Buffer & upload_stream

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    // resource_type: "image" | "video" (client sends it)
    const resourceType = (form.get("resourceType") as string) || "image";
    const folder = process.env.CLOUDINARY_FOLDER || "homeiq/uploads";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const url: string = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType as "image" | "video",
          // images: keep original, video: mp4 recommended
          format: resourceType === "video" ? "mp4" : undefined,
        },
        (err, result) => {
          if (err || !result?.secure_url) return reject(err || new Error("Upload failed"));
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json({ url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
