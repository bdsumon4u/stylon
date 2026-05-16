"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { CategorySidebar } from "@/components/product/CategorySidebar";
import { Filter, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProducts } from "@/lib/api";
import { Product, PaginationMeta } from "@/types";

function Products() {
  const searchParams = useSearchParams();
  const categorySlugs = searchParams.getAll("category[]");
  const searchQuery = searchParams.get("search") || undefined;

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Reset when filters change
    setPage(1);
    setProducts([]);
    setLoading(true);

    async function fetchProducts() {
      try {
        const res = await getProducts({
          category: categorySlugs.length > 0 ? categorySlugs : undefined,
          search: searchQuery,
          page: 1,
          per_page: 20,
        });
        setProducts(res.data);
        setPagination(res.pagination);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [JSON.stringify(categorySlugs), searchQuery]);

  const loadMore = async () => {
    if (!pagination?.has_more || loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await getProducts({
        category: categorySlugs.length > 0 ? categorySlugs : undefined,
        search: searchQuery,
        page: nextPage,
        per_page: 20,
      });
      setProducts(prev => [...prev, ...res.data]);
      setPagination(res.pagination);
      setPage(nextPage);
    } catch (error) {
      console.error("Failed to load more:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto px-4 lg:px-8 py-6 flex gap-6 relative">
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-[260px] shrink-0">
        <CategorySidebar />
      </div>

      {/* Mobile Filter Button */}
      <button 
        className="lg:hidden fixed bottom-[72px] right-4 bg-primary text-white p-3 rounded-full shadow-xl z-40"
        onClick={() => setIsMobileFilterOpen(true)}
      >
        <Filter className="w-6 h-6" />
      </button>

      {/* Mobile Filter Drawer */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity",
          isMobileFilterOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileFilterOpen(false)}
      >
        <div 
          className={cn(
            "fixed inset-y-0 left-0 w-[280px] bg-white p-4 overflow-y-auto transform transition-transform duration-300",
            isMobileFilterOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Filters</h2>
            <button onClick={() => setIsMobileFilterOpen(false)} className="text-muted-text">✕</button>
          </div>
          <CategorySidebar />
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-[10px] aspect-[4/5]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-muted-text">
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm mt-2">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
              {products.map((product, idx) => (
                <ProductCard key={product.id} product={product} priority={idx < 4} />
              ))}
            </div>

            {pagination?.has_more && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-black text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Load More (${pagination.total - products.length} remaining)`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <Products />
    </Suspense>
  );
}
