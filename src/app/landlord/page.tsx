import Link from 'next/link';
desc="Every listing is reviewed before it goes live."
/>
<Card
icon={<Images className="w-5 h-5" />}
title="Simple onboarding"
desc="Step-by-step wizard to publish fast."
/>
<Card
icon={<MapPinned className="w-5 h-5" />}
title="Verified maps"
desc="Google Maps location verification."
/>
</section>


{/* Process Preview */}
<section id="how-it-works" className="mt-14">
<h2 className="text-xl font-semibold mb-4">How it works</h2>
<ol className="grid gap-3 md:grid-cols-2">
{[
'Verify identity (ID, phone, email)',
'Property basics (address, type, beds/baths)',
'Photos & media',
'Pricing & availability',
'Neighbourhood insights',
'Description & house rules',
'Review & publish',
].map((step, i) => (
<li key={i} className="rounded-2xl border p-4 shadow-sm bg-white">
{i + 1}. {step}
</li>
))}
</ol>
</section>


{/* FAQs placeholder */}
<section id="faqs" className="mt-14">
<h2 className="text-xl font-semibold mb-4">Landlord FAQs</h2>
<div className="rounded-2xl border p-6 bg-white shadow-sm text-sm text-gray-600">
We’ll add common questions here (verification time, accepted documents, etc.).
</div>
</section>
</main>
);
}


function Card({
icon,
title,
desc,
}: {
icon: React.ReactNode;
title: string;
desc: string;
}) {
return (
<div className="rounded-2xl border p-5 bg-white shadow-sm">
<div className="flex items-center gap-2 mb-2">
<div
className="rounded-full p-2"
style={{ backgroundColor: homeiq.greenSoft, color: homeiq.green }}
>
{icon}
</div>
<h3 className="font-medium">{title}</h3>
</div>
<p className="text-sm text-gray-600">{desc}</p>
</div>
);
}