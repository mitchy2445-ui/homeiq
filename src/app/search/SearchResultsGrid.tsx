import ListingCard from "@/components/ListingCard";

export default function SearchResultsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Placeholder cards for now */}
      {Array.from({ length: 6 }).map((_, i) => (
        <ListingCard key={i} />
      ))}
    </div>
  );
}
