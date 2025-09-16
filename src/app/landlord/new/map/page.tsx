import { getMyDraft, updateDraftListing } from '@/lib/listings';
import { homeiq } from '@/styles/theme';


export const dynamic = 'force-dynamic';


export default async function MapPage() {
const draft = await getMyDraft();
return (
<div className="space-y-6">
<Header step="6" title="Map & verified location" subtitle="Confirm the pin to verify location (you can generalize until viewing)." />
<form action={saveMap} className="space-y-4">
<label className="block">
<div className="text-sm text-gray-700 mb-1">Address</div>
<input name="address" placeholder="123 Main St, Winnipeg" className="w-full border rounded-xl px-3 py-2" />
<p className="text-xs text-gray-500 mt-1">(Hook up Google Places autocomplete later)</p>
</label>
<label className="inline-flex items-center gap-2 text-sm">
<input type="checkbox" name="locationVerified" />
Mark location as verified
</label>
<div className="flex gap-3">
<a href="/landlord/new/description" className="rounded-full px-5 py-2 border">Back</a>
<button className="rounded-full px-5 py-2 text-white" style={{ backgroundColor: homeiq.green }}>Save & Continue</button>
</div>
</form>
</div>
);
}


async function saveMap(formData: FormData) {
'use server';
const locationVerified = formData.get('locationVerified') ? true : false;
await updateDraftListing({ locationVerified });
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