import { requireVerifiedUser } from '@/lib/guards';


export const dynamic = 'force-dynamic';


export default async function LandlordNewLayout({
children,
}: {
children: React.ReactNode;
}) {
await requireVerifiedUser();
return <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>;
}