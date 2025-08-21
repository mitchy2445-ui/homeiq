import Link from "next/link";

type Props = {
  href?: string;
  price?: string;
  meta?: string;
  location?: string;
};

export default function ListingCard({
  href = "#",
  price = "$X,XXX / mo",
  meta = "2 bd · 1 ba",
  location = "Downtown",
}: Props) {
  return (
    <Link
      href={href}
      className="card card-hover overflow-hidden block"
      aria-label={`View listing in ${location}`}
    >
      <div className="relative aspect-[4/3] bg-gray-200" />
      <div className="p-3">
        <div className="font-semibold">{price}</div>
        <div className="text-sm text-gray-600">{meta}</div>
        <div className="text-sm text-gray-500">{location}</div>
      </div>
    </Link>
  );
}
