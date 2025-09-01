// scripts/make-admin.ts
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  if (!email) {
    console.error("Usage: npx tsx scripts/make-admin.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: {
      role: Role.ADMIN,
      // make sure admin isn’t blocked by unverified email
      emailVerified: user.emailVerified ?? new Date(),
    },
    select: { id: true, email: true, role: true, emailVerified: true },
  });

  console.log("✅ Promoted to ADMIN:", updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
