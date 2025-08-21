import ListingCard from "./ListingCard";

export default function CityCarousel({ city }: { city: string }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 min-w-max">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-[260px] shrink-0">
            <ListingCard />
          </div>
        ))}
      </div>
    </div>
  );
}
