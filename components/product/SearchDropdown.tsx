"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { searchProducts } from "@/lib/api";
import { Product } from "@/types";

export function SearchDropdown() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);

    // Debounce API calls
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchProducts(query);
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="relative w-full">
      <input 
        type="text" 
        placeholder="search products..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="w-full border border-border-color rounded-l-full py-2 px-4 outline-none focus:border-primary text-sm bg-white"
      />

      {isOpen && (results.length > 0 || loading) && (
        <div className="absolute top-full left-0 w-[400px] mt-2 bg-white rounded-lg shadow-xl border border-border-color z-50 py-2 max-h-[400px] overflow-y-auto">
          {loading && results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-text text-center">Searching...</div>
          ) : (
            results.map(product => (
              <Link 
                href={`/products/${product.slug}`} 
                key={product.id}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-none"
              >
                <div className="w-12 h-16 bg-gray-100 rounded relative overflow-hidden shrink-0 border border-border-color">
                  <Image src={product.image} alt={product.name || "Search Result"} fill sizes="48px" className="object-cover" />
                  {product.discountPercentage && product.discountPercentage > 0 && (
                    <div className="absolute top-0 right-0 bg-discount-green text-white text-[8px] font-bold px-1 py-0.5 rounded-bl">
                      {product.discountPercentage}% Off
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-black line-clamp-1">{product.name}</h4>
                  <span className="text-[11px] text-muted-text bg-gray-100 px-1.5 py-0.5 rounded mt-1 inline-block">{product.category}</span>
                  <div className="flex gap-2 items-center mt-1">
                    {product.salePrice && product.salePrice < product.regularPrice ? (
                      <>
                        <span className="text-[12px] text-sale-red line-through">{product.regularPrice} Tk</span>
                        <span className="text-[13px] font-bold text-black">{product.salePrice} Tk</span>
                      </>
                    ) : (
                      <span className="text-[13px] font-bold text-black">{product.regularPrice} Tk</span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
