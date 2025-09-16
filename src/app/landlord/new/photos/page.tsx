import { getOrCreateDraftListing, updateDraftListing, getMyDraft } from '@/lib/listings';
import { homeiq } from '@/styles/theme';


export const dynamic = 'force-dynamic';


export default async function PhotosPage() {
const draft = await getOrCreateDraftListing();
return (
<div className="space-y-6">
<Header step="2" title="Photos & media" subtitle="Add at least 8 clear photos. Choose a great cover." />
<form action={savePhotos} className="space-y-4">
<input type="hidden" name="_intent" value="photos" />
<div className="rounded-2xl border p-4 bg-white shadow-sm">
<label className="block text-sm font-medium mb-2">Upload photos</label>
<input name="images" type="file" accept="image/*" multiple className="block w-full" />
<p className="text-xs text-gray-500 mt-2">Hints: living room, bedrooms, kitchen, bathroom, exterior, parking, amenities.</p>
</div>
<div className="flex gap-3">
<a href="/landlord/new/basics" className="rounded-full px-5 py-2 border">Back</a>
<button className="rounded-full px-5 py-2 text-white" style={{ backgroundColor: homeiq.green }}>Save & Continue</button>
</div>
</form>
</div>
);
}


async function savePhotos(formData: FormData) {
'use server';
// NOTE: Wire to your uploader (e.g., Cloudinary) and store URLs in Listing.images (Json)
// For now, we just simulate by keeping whatever is already in the draft.
await updateDraftListing({});
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