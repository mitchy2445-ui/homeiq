// scripts/peek-users.ts
import { prisma } from "../src/lib/db";

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, emailVerified: true, passwordHash: true },
    orderBy: { createdAt: "desc" },
  });
  for (const u of users) {
    const hasHash = !!u.passwordHash && u.passwordHash.startsWith("$2");
    console.log(`${u.email}  | verified=${!!u.emailVerified} | hash=${hasHash}`);
  }
}
main().finally(() => prisma.$disconnect());
