export default function SearchFiltersSidebar() {
  return (
    <div className="rounded-2xl border bg-white p-4 space-y-6">
      <h2 className="font-semibold text-sm">Filters</h2>

      <FilterSection title="Price range">
        <p className="text-xs text-gray-500">Coming soon</p>
      </FilterSection>

      <FilterSection title="Beds">
        <p className="text-xs text-gray-500">Coming soon</p>
      </FilterSection>

      <FilterSection title="Listing type">
        <p className="text-xs text-gray-500">
          Entire place · Room · Sublet
        </p>
      </FilterSection>
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </div>
  );
}
