import { getMyDraft, updateDraftListing } from '@/lib/listings';
import { homeiq } from '@/styles/theme';


export const dynamic = 'force-dynamic';


export default async function DescriptionPage() {
const draft = await getMyDraft();
return (
<div className="space-y-6">
<Header step="5" title="Description & house rules" subtitle="Tell renters what makes your place great and set expectations." />
<form action={saveDescription} className="space-y-4">
<label className="block">
<div className="text-sm text-gray-700 mb-1">Title</div>
<input name="title" defaultValue={draft?.title ?? ''} className="w-full border rounded-xl px-3 py-2" />
</label>
<label className="block">
<div className="text-sm text-gray-700 mb-1">Long description</div>
<textarea name="description" rows={10} defaultValue={draft?.description ?? ''} className="w-full border rounded-xl px-3 py-2" placeholder="What makes it unique? Recent renovations? Ideal tenant? Anything to know before applying?" />
</label>
<label className="block">
<div className="text-sm text-gray-700 mb-1">House rules</div>
<textarea name="houseRules" rows={6} defaultValue={draft?.houseRules ?? ''} className="w-full border rounded-xl px-3 py-2" placeholder="Pets, smoking, parties, max occupants, condo bylaws, etc." />
</label>
<div className="flex gap-3">
<a href="/landlord/new/insights" className="rounded-full px-5 py-2 border">Back</a>
<button className="rounded-full px-5 py-2 text-white" style={{ backgroundColor: homeiq.green }}>Save & Continue</button>
</div>
</form>
</div>
);
}


async function saveDescription(formData: FormData) {
'use server';
const title = (formData.get('title') as string | null) || '';
const description = (formData.get('description') as string | null) || '';
const houseRules = (formData.get('houseRules') as string | null) || '';
await updateDraftListing({ title, description, houseRules });
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