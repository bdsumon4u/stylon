export default function Loading() {
  return (
    <div className="max-w-[1320px] mx-auto px-4 lg:px-8 py-8 flex flex-col gap-12 animate-pulse">
      {/* Product Top Section Skeleton */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left - Images Skeleton */}
        <div className="w-full lg:w-[500px] shrink-0 space-y-4">
          <div className="aspect-square bg-gray-200 rounded-lg" />
          <div className="h-24 relative">
            <div className="flex gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-1 h-full bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>

        {/* Right - Product Info Skeleton */}
        <div className="flex-1 flex flex-col pt-2 lg:pt-6">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />

          {/* Pricing Skeleton */}
          <div className="flex items-center gap-4 mb-4">
            <div className="h-6 bg-gray-200 rounded w-24" />
            <div className="h-8 bg-gray-200 rounded w-20" />
          </div>

          <div className="h-16 bg-gray-200 rounded w-full mb-4" />

          {/* Variation Options Skeleton */}
          <div className="mb-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 bg-gray-200 rounded w-12" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-gray-200" />
                ))}
              </div>
            </div>
          </div>

          <div className="h-12 bg-gray-200 rounded w-32 mb-6" />

          <div className="h-12 bg-gray-200 rounded w-full mb-6" />
        </div>
      </div>

      {/* Related Products Skeleton */}
      <div className="mt-8">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg aspect-[4/5]" />
          ))}
        </div>
      </div>
    </div>
  );
}