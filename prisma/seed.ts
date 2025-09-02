// prisma/seed.ts
import { PrismaClient, $Enums } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // use env or fall back to a sensible default for local dev
  const landlordPassword = process.env.SEED_LANDLORD_PASSWORD ?? "landlord123";
  const passwordHash = await hash(landlordPassword, 12);

  // upsert a landlord user with a passwordHash
  const landlord = await prisma.user.upsert({
    where: { email: "owner@homeiq.test" },
    update: {
      // if the user already exists, ensure they have a hash (and role)
      passwordHash,
      role: $Enums.Role.LANDLORD,
      name: "HOMEIQ Landlord",
    },
    create: {
      email: "owner@homeiq.test",
      name: "HOMEIQ Landlord",
      role: $Enums.Role.LANDLORD,
      passwordHash, // ✅ required by schema
    },
  });

  // sample listings (adjust as you like)
  const listings = [
    { title: "Bright 2-bed near Osborne Village", city: "Winnipeg", price: 145000, beds: 2, baths: 1 },
    { title: "Downtown studio with skyline view", city: "Toronto",  price: 195000, beds: 0, baths: 1 },
    { title: "Family home ready next month",     city: "Calgary",   price: 250000, beds: 3, baths: 2 },
    { title: "Cozy 1-bed close to campus",      city: "Brandon",   price: 120000, beds: 1, baths: 1 },
    { title: "Modern condo by the park",        city: "Regina",    price: 160000, beds: 2, baths: 2 },
    { title: "Riverfront townhouse",            city: "Saskatoon",  price: 210000, beds: 3, baths: 2 },
  ];

  for (const l of listings) {
    await prisma.listing.create({
      data: {
        ...l,
        landlordId: landlord.id,
        status: $Enums.Status.APPROVED,
        // images/videoUrl are optional; add if you want demo media
        // images: ["https://picsum.photos/seed/homeiq/1200/800"],
        // videoUrl: null,
      },
    });
  }

  console.log("Seed complete ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
