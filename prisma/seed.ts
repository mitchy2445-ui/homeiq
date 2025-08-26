// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1) Ensure landlord exists
  const landlord = await prisma.user.upsert({
    where: { email: "owner@homeiq.test" },
    update: {},
    create: { email: "owner@homeiq.test", name: "HOMEIQ Landlord", role: "LANDLORD" },
  });

  // 2) Clean slate (safe for dev)
  await prisma.listing.deleteMany();

  // 3) Seed listings with images (picsum) + optional videoUrl
  const listings: Array<{
    title: string;
    city: string;
    price: number;
    beds: number;
    baths: number;
    status?: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
    images: string[];
    videoUrl?: string | null;
  }> = [
    {
      title: "Bright 2‑bed near Osborne Village",
      city: "Winnipeg",
      price: 145000,
      beds: 2,
      baths: 1,
      status: "APPROVED",
      images: [
        "https://picsum.photos/seed/osborne1/1200/800",
        "https://picsum.photos/seed/osborne2/800/600",
        "https://picsum.photos/seed/osborne3/800/600",
      ],
      videoUrl: null,
    },
    {
      title: "Downtown studio with skyline view",
      city: "Toronto",
      price: 195000,
      beds: 0,
      baths: 1,
      status: "APPROVED",
      images: [
        "https://picsum.photos/seed/toronto1/1200/800",
        "https://picsum.photos/seed/toronto2/800/600",
        "https://picsum.photos/seed/toronto3/800/600",
      ],
      videoUrl: null,
      // example if you later use Cloudinary for video:
      // videoUrl: "https://res.cloudinary.com/<cloud>/video/upload/v1720000000/homeiq/tour.mp4",
    },
    {
      title: "Family home ready next month",
      city: "Calgary",
      price: 250000,
      beds: 3,
      baths: 2,
      status: "APPROVED",
      images: [
        "https://picsum.photos/seed/calgary1/1200/800",
        "https://picsum.photos/seed/calgary2/800/600",
        "https://picsum.photos/seed/calgary3/800/600",
      ],
      videoUrl: null,
    },
    {
      title: "Cozy 1‑bed close to campus",
      city: "Brandon",
      price: 120000,
      beds: 1,
      baths: 1,
      status: "APPROVED",
      images: [
        "https://picsum.photos/seed/brandon1/1200/800",
        "https://picsum.photos/seed/brandon2/800/600",
        "https://picsum.photos/seed/brandon3/800/600",
      ],
      videoUrl: null,
    },
    {
      title: "Modern condo by the park",
      city: "Regina",
      price: 160000,
      beds: 2,
      baths: 2,
      status: "APPROVED",
      images: [
        "https://picsum.photos/seed/regina1/1200/800",
        "https://picsum.photos/seed/regina2/800/600",
        "https://picsum.photos/seed/regina3/800/600",
      ],
      videoUrl: null,
    },
    {
      title: "Riverfront townhouse",
      city: "Saskatoon",
      price: 210000,
      beds: 3,
      baths: 2,
      status: "APPROVED",
      images: [
        "https://picsum.photos/seed/saskatoon1/1200/800",
        "https://picsum.photos/seed/saskatoon2/800/600",
        "https://picsum.photos/seed/saskatoon3/800/600",
      ],
      videoUrl: null,
    },
  ];

  await prisma.$transaction(
    listings.map((l) =>
      prisma.listing.create({
        data: {
          title: l.title,
          city: l.city,
          price: l.price,
          beds: l.beds,
          baths: l.baths,
          status: l.status ?? "APPROVED",
          images: l.images,
          videoUrl: l.videoUrl ?? null,
          landlordId: landlord.id,
        },
      })
    )
  );

  console.log("Seed complete ✅");
}

main().finally(() => prisma.$disconnect());
