// Force Node runtime so Prisma can run
export const runtime = 'nodejs';
// (optional, prevents caching headaches during dev)
export const dynamic = 'force-dynamic';

// Re-export NextAuth v5 handlers from your auth config
export { GET, POST } from "@/auth";
// If your path alias '@' ever acts up in dev, temporarily use:
// export { GET, POST } from "../../../auth";
