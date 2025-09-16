'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';


export default function Navbar() {
const [status, setStatus] = useState<
'UNAUTHENTICATED' | 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
>('UNAUTHENTICATED');


useEffect(() => {
let mounted = true;
fetch('/api/me/verification-status')
.then((r) => r.json())
.then((d) => {
if (mounted) setStatus(d.status);
})
.catch(() => {});
return () => {
mounted = false;
};
}, []);


const ctaLabel = status === 'VERIFIED' ? 'Post a listing' : 'Become a Landlord';
const ctaHref = status === 'VERIFIED' ? '/landlord/new/basics' : '/landlord/verify';


return (
<nav className="w-full border-b bg-white/70 backdrop-blur sticky top-0 z-40">
<div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
<Link href="/" className="font-semibold tracking-tight text-gray-900">
HOMEIQ
</Link>
<div className="flex items-center gap-4">
<Link
href={ctaHref}
className="rounded-full px-4 py-2 text-white shadow-sm transition hover:shadow-md"
style={{ backgroundColor: '#1a7f5a' }}
>
{ctaLabel}
</Link>
</div>
</div>
</nav>
);
}