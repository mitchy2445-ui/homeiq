import { getMyDraft, updateDraftListing } from '@/lib/listings';
import { homeiq } from '@/styles/theme';


export const dynamic = 'force-dynamic';


export default async function InsightsPage() {
const draft = await getMyDraft();
return (
<div className="space-y-6">
<Header step="4" title="Neighbourhood insights" subtitle="Share everyday living details renters care about." />
<form action={saveInsights} className="space-y-4">
<textarea name="insights" rows={10} className="w-full border rounded-xl px-3 py-2" placeholder="Transit: ...
Daily living: ...
Safety: ...
Noise: ...
Parks & recreation: ...
Dining & nightlife: ...
Schools/daycare: ...
Community vibe: Quiet / Moderate / Busy — why?" />
<div className="flex gap-3">
<a href="/landlord/new/pricing" className="rounded-full px-5 py-2 border">Back</a>
<button className="rounded-full px-5 py-2 text-white" style={{ backgroundColor: homeiq.green }}>Save & Continue</button>
</div>
</form>
</div>
);
}


async function saveInsights(formData: FormData) {
'use server';
const raw = (formData.get('insights') as string | null) || '';
// Keep it simple: store freeform in Json with a single key. Later you can parse to structured fields.
await updateDraftListing({ insights: { freeform: raw } });
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