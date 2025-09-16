import { prisma as db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';


export async function requireSession(next?: string) {
const session = await getSessionFromCookie();
if (!session?.user?.id) {
const dest = next ? `/login?next=${encodeURIComponent(next)}` : '/login';
redirect(dest);
}
return session;
}


export async function requireVerifiedUser() {
const session = await requireSession('/landlord/verify');
const user = await db.user.findUnique({
where: { id: session.user.id },
select: { verificationStatus: true },
});
if (!user) redirect('/login');
if (user.verificationStatus !== 'VERIFIED') redirect('/landlord/verify');
return session;
}


export async function getUserVerificationStatus() {
const session = await getSessionFromCookie();
if (!session?.user?.id) return 'UNAUTHENTICATED' as const;
const u = await db.user.findUnique({
where: { id: session.user.id },
select: { verificationStatus: true },
});
return (u?.verificationStatus ?? 'UNVERIFIED') as
| 'UNVERIFIED'
| 'PENDING'
| 'VERIFIED'
| 'REJECTED';
}