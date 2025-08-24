export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-8 w-2/3 bg-gray-200 rounded mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3">
        <div className="md:col-span-2 md:row-span-2 h-80 bg-gray-200 rounded-2xl" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        <div className="lg:col-span-8">
          <div className="h-6 w-44 bg-gray-200 rounded mb-3" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
        <div className="lg:col-span-4">
          <div className="h-44 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
