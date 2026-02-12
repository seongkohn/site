export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
      <div className="flex gap-6">
        {/* Sidebar skeleton */}
        <div className="hidden md:block w-[200px] flex-shrink-0 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        {/* Product grid skeleton */}
        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
