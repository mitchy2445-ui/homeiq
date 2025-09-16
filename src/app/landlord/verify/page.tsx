import { prisma as db } from '@/lib/db';
</div>
);
}


function PhoneOtpAction({ hasPhone }: { hasPhone: boolean }) {
return (
<div className="flex flex-col sm:flex-row gap-3">
{!hasPhone && (
<input
name="phone"
placeholder="Phone (e.g., +1 204‑555‑1234)"
className="border rounded-xl px-3 py-2 w-full"
/>
)}
<button
type="button"
className="rounded-full px-4 py-2 text-white shadow-sm"
style={{ backgroundColor: homeiq.green }}
>
{hasPhone ? 'Send code' : 'Save & send code'}
</button>
<input name="otp" placeholder="Enter code" className="border rounded-xl px-3 py-2 w-40" />
<button
type="button"
className="rounded-full px-4 py-2 border"
style={{ borderColor: '#cbd5e1' }}
>
Verify
</button>
</div>
);
}


function EmailAction() {
return (
<div className="flex items-center gap-3">
<button
type="button"
className="rounded-full px-4 py-2 text-white shadow-sm"
style={{ backgroundColor: homeiq.green }}
>
Send link
</button>
<span className="text-sm text-gray-500">
Check your inbox and click the link to verify.
</span>
</div>
);
}


function mask(p: string) {
const d = p.replace(/\D/g, '');
return d.length >= 4
? `${p.slice(0, Math.max(0, p.length - 4)).replace(/\d/g, '*')}${p.slice(-4)}`
: p;
}