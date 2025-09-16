import { prisma as db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/auth';


export async function getOrCreateDraftListing() {
const session = await getSessionFromCookie();
if (!session?.user?.id) throw new Error('Unauthorized');


const existing = await db.listing.findFirst({
where: { landlordId: session.user.id, status: 'DRAFT' },
});
if (existing) return existing;


return db.listing.create({
data: {
landlordId: session.user.id,
title: 'Untitled listing',
city: '',
price: 0,
beds: 0,
baths: 0,
status: 'DRAFT',
},
});
}


export async function updateDraftListing(data: any) {
const session = await getSessionFromCookie();
if (!session?.user?.id) throw new Error('Unauthorized');


const draft = await db.listing.findFirst({
where: { landlordId: session.user.id, status: 'DRAFT' },
});
if (!draft) throw new Error('No draft listing');


return db.listing.update({
where: { id: draft.id },
data,
});
}


export async function getMyDraft() {
const session = await getSessionFromCookie();
if (!session?.user?.id) throw new Error('Unauthorized');
return db.listing.findFirst({ where: { landlordId: session.user.id, status: 'DRAFT' } });
}