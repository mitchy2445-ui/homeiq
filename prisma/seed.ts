// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // optional: create a landlord user
  const landlord = await prisma.user.upsert({
    where: { email: "owner@homeiq.test" },
    update: {},
    create: { email: "owner@homeiq.test", name: "HOMEIQ Landlord", role: "LANDLORD" },
  });

  // basic sample listings across your cities
  const listings = [
    { title: "Bright 2‑bed near Osborne Village", city: "Winnipeg", price: 145000, beds: 2, baths: 1 },
    { title: "Downtown studio with skyline view", city: "Toronto",  price: 195000, beds: 0, baths: 1 },
    { title: "Family home ready next month",     city: "Calgary",   price: 250000, beds: 3, baths: 2 },
    { title: "Cozy 1‑bed close to campus",      city: "Brandon",   price: 120000, beds: 1, baths: 1 },
    { title: "Modern condo by the park",        city: "Regina",    price: 160000, beds: 2, baths: 2 },
    { title: "Riverfront townhouse",            city: "Saskatoon",  price: 210000, beds: 3, baths: 2 },
  ];

  for (const l of listings) {
    await prisma.listing.create({
      data: { ...l, landlordId: landlord.id, status: "APPROVED" },
    });
  }

  console.log("Seed complete ✅");
}

main().finally(() => prisma.$disconnect());
