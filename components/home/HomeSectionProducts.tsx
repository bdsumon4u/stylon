"use client";

import { useState, useEffect, useRef } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { getHomeSectionProducts } from "@/lib/api";
import { Product } from "@/types";

export function HomeSectionProducts({ sectionId }: { sectionId: number }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const sectionRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Initial load when section comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasFetched && !loading) {
          fetchProducts(1);
        }
      },
      {
        rootMargin: "200px",
        threshold: 0,
      }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasFetched, loading]);

  // Infinite scroll load more when bottom indicator comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasFetched && hasMore && !loading) {
          fetchProducts(page + 1);
        }
      },
      {
        rootMargin: "200px",
        threshold: 0,
      }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasFetched, hasMore, loading, page]);

  async function fetchProducts(pageToFetch: number) {
    setLoading(true);
    try {
      const response = await getHomeSectionProducts(sectionId, pageToFetch);
      
      setProducts((prev) => 
        pageToFetch === 1 ? response.data : [...prev, ...response.data]
      );
      
      setHasMore(response.pagination?.has_more ?? false);
      setPage(pageToFetch);
      setHasFetched(true);
    } catch (error) {
      console.error("Failed to fetch products for section", sectionId, error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={sectionRef} className="min-h-[200px]">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
        {loading && !hasFetched && (
          // Initial Skeleton loader
          Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse aspect-[3/4] rounded-lg"></div>
          ))
        )}
        
        {hasFetched && products.map((product, index) => (
          <ProductCard key={`${product.id}-${index}`} product={product} />
        ))}
      </div>

      {/* Infinite Scroll Loader Indicator */}
      {hasFetched && hasMore && (
        <div ref={loadMoreRef} className="col-span-full py-8 flex justify-center items-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {hasFetched && products.length === 0 && (
        <div className="py-8 text-center text-muted-text text-sm">
          No products found.
        </div>
      )}
    </div>
  );
}
