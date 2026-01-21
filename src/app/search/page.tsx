import SearchFiltersBar from "./SearchFiltersBar";
import SearchFiltersSidebar from "./SearchFiltersSidebar";
import SearchResultsGrid from "./SearchResultsGrid";

export default function SearchPage() {
  return (
    <main className="mx-auto max-w-[1440px] px-4 md:px-6 lg:px-8 py-6">
      {/* Top filter bar */}
      <SearchFiltersBar />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden lg:block">
          <SearchFiltersSidebar />
        </aside>

        {/* Results */}
        <section>
          <SearchResultsGrid />
        </section>
      </div>
    </main>
  );
}
