import { prisma as db } from '@/lib/db';
export const dynamic = 'force-dynamic';


export default async function ReviewPage() {
const draft = await getMyDraft();
if (!draft) return <p>No draft found.</p>;


const errors = validateDraft(draft);


return (
<div className="space-y-6">
<Header step="7" title="Review & publish" subtitle="Fix any issues below, then submit for approval." />


{errors.length > 0 ? (
<div className="rounded-2xl border p-4 bg-red-50 text-red-700">
<p className="font-medium mb-2">Please fix the following before publishing:</p>
<ul className="list-disc pl-5 space-y-1">
{errors.map((e, i) => (
<li key={i}>{e}</li>
))}
</ul>
</div>
) : (
<div className="rounded-2xl border p-4 bg-green-50 text-green-800">
Looks good! You can submit your listing for approval.
</div>
)}


<form action={publish}>
<button
disabled={errors.length > 0}
className={`rounded-full px-5 py-2 text-white ${errors.length>0 ? 'opacity-60 cursor-not-allowed' : ''}`}
style={{ backgroundColor: homeiq.green }}
>
Submit for approval
</button>
</form>
</div>
);
}


function validateDraft(d: any): string[] {
const errs: string[] = [];
const imgCount = Array.isArray(d.images) ? d.images.length : 0;
if (imgCount < 8) errs.push('Add at least 8 photos.');
if (!d.title || d.title.trim().length === 0) errs.push('Add a title.');
if (!d.description || d.description.trim().length < 250) errs.push('Description must be at least 250 characters.');
if (!d.locationVerified) errs.push('Verify the address/location on the map.');
return errs;
}


async function publish() {
'use server';
// Revalidate and then mark PENDING for review
const draft = await db.listing.findFirst({ where: { status: 'DRAFT' } });
if (!draft) return;
const errors = validateDraft(draft as any);
if (errors.length > 0) return; // block


await db.listing.update({ where: { id: draft.id }, data: { status: 'PENDING' } });
redirect(`/listing/${draft.id}`);
}


function Header({ step, title, subtitle }:{ step:string; title:string; subtitle:string; }){
return (
<div>
<p className="text-sm text-gray-500">Step {step} of 7</p>
<h1 className="text-2xl font-semibold">{title}</h1>
<p className="text-gray-600">{subtitle}</p>
</div>
);
}