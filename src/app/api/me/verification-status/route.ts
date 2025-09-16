import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { prisma as db } from '@/lib/db';


export async function GET() {
const session = await getSessionFromCookie();
if (!session?.user?.id) return NextResponse.json({ status: 'UNAUTHENTICATED' });
const u = await db.user.findUnique({
where: { id: session.user.id },
select: { verificationStatus: true },
});
return NextResponse.json({ status: u?.verificationStatus ?? 'UNVERIFIED' });
}