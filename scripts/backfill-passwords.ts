// scripts/backfill-passwords.ts
import { prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  // Grab only what we need
  const users = await prisma.user.findMany({
    select: { id: true, email: true, passwordHash: true },
  });

  // Keep users with missing or non-bcrypt hashes
  const targets = users.filter(
    (u) => !u.passwordHash || !u.passwordHash.startsWith("$2")
  );

  if (targets.length === 0) {
    console.log("No users to backfill.");
    return;
  }

  console.log(`Backfilling ${targets.length} users...`);

  for (const u of targets) {
    const plaintext =
      u.passwordHash && !u.passwordHash.startsWith("$2")
        ? u.passwordHash
        : "password123";

    const hash = await bcrypt.hash(plaintext, 10);

    await prisma.user.update({
      where: { id: u.id },
      data: { passwordHash: hash },
    });

    console.log(`✓ ${u.email} updated`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
