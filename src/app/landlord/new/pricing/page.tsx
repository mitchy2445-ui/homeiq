import { getMyDraft, updateDraftListing } from '@/lib/listings';
import { homeiq } from '@/styles/theme';


export const dynamic = 'force-dynamic';


export default async function PricingPage() {
const draft = await getMyDraft();
const price = draft?.price ?? 0;
return (
<div className="space-y-6">
<Header step="3" title="Pricing & availability" subtitle="Set rent, deposit, lease term and move-in date." />
<form action={savePricing} className="space-y-4">
<div className="grid sm:grid-cols-2 gap-4">
<Field label="Monthly rent (CAD)" name="price" defaultValue={(price/100).toString()} type="number" min="0" step="1" />
<Field label="Deposit (CAD)" name="deposit" type="number" min="0" step="1" />
<Field label="Lease term (months)" name="lease" type="number" min="1" step="1" />
<Field label="Available from" name="available" type="date" />
</div>
<div className="flex gap-3">
<a href="/landlord/new/photos" className="rounded-full px-5 py-2 border">Back</a>
<button className="rounded-full px-5 py-2 text-white" style={{ backgroundColor: homeiq.green }}>Save & Continue</button>
</div>
</form>
</div>
);
}


async function savePricing(formData: FormData) {
'use server';
const price = Number(formData.get('price') || '0');
const deposit = Number(formData.get('deposit') || '0');
const lease = Number(formData.get('lease') || '12');
const available = formData.get('available') as string | null;
await updateDraftListing({
price: Math.round(price * 100),
depositCents: Math.round(deposit * 100),
minLeaseMonths: lease || null,
// store available date in an extra Json or new field if you add one later
});
}


function Field(props: any){
const { label, name, ...rest } = props;
return (
<label className="block">
<div className="text-sm text-gray-700 mb-1">{label}</div>
<input name={name} {...rest} className="w-full border rounded-xl px-3 py-2" />
</label>
);
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