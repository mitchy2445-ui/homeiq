// prisma/seed.ts
import { PrismaClient, $Enums } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // password for seeded landlord user
  const landlordPassword =
    process.env.SEED_LANDLORD_PASSWORD ?? "landlord123";
  const passwordHash = await hash(landlordPassword, 12);

  // Create or update landlord user
  const landlord = await prisma.user.upsert({
    where: { email: "owner@homeiq.test" },
    update: {
      passwordHash,
      role: $Enums.Role.LANDLORD,
      name: "HOMEIQ Landlord",
    },
    create: {
      email: "owner@homeiq.test",
      name: "HOMEIQ Landlord",
      role: $Enums.Role.LANDLORD,
      passwordHash,
    },
  });

  // >>> ALL LISTINGS MUST HAVE street + province + postal <<<
  const listings = [
    {
      title: "Bright 2-bed near Osborne Village",
      street: "123 River Ave",
      city: "Winnipeg",
      province: "MB",
      postal: "R3L 0B1",
      price: 145000,
      beds: 2,
      baths: 1,
    },
    {
      title: "Downtown studio with skyline view",
      street: "88 King St W",
      city: "Toronto",
      province: "ON",
      postal: "M5X 1A6",
      price: 195000,
      beds: 0,
      baths: 1,
    },
    {
      title: "Family home ready next month",
      street: "450 Harvest Hills Blvd",
      city: "Calgary",
      province: "AB",
      postal: "T3K 4P7",
      price: 250000,
      beds: 3,
      baths: 2,
    },
    {
      title: "Cozy 1-bed close to campus",
      street: "12 Princess Ave",
      city: "Brandon",
      province: "MB",
      postal: "R7A 0N1",
      price: 120000,
      beds: 1,
      baths: 1,
    },
    {
      title: "Modern condo by the park",
      street: "2010 Victoria Ave",
      city: "Regina",
      province: "SK",
      postal: "S4P 0S7",
      price: 160000,
      beds: 2,
      baths: 2,
    },
    {
      title: "Riverfront townhouse",
      street: "601 Spadina Crescent E",
      city: "Saskatoon",
      province: "SK",
      postal: "S7K 3G8",
      price: 210000,
      beds: 3,
      baths: 2,
    },
  ];

  for (const l of listings) {
    await prisma.listing.create({
      data: {
        ...l,
        landlordId: landlord.id,
        status: $Enums.Status.APPROVED,
        // Optional demo media:
        // images: ["https://picsum.photos/seed/" + l.city + "/1200/800"],
      },
    });
  }

  console.log("Seed complete ✅");
}

main()
  .catch((e) => {
    console.error("Seed error ❌", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
