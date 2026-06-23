"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { searchProducts, getProduct } from "@/lib/api";
import { Product } from "@/types";
import { stashProductForHandoff } from "@/components/product/ProductCard";
import { useRouter } from "next/navigation";

export function SearchDropdown({ onClose }: { onClose?: () => void }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
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

  const handleClick = () => {
    router.push(`/shop?search=${encodeURIComponent(query)}`);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex w-full group">
        <input
          type="text"
          placeholder="search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
          className="flex-1 border border-border-color border-r-0 rounded-l-full py-2.5 px-5 outline-none focus:border-primary transition-all text-sm bg-white"
        />
        <button
          className="bg-primary text-white px-5 rounded-r-full flex items-center justify-center hover:bg-black transition-all shrink-0 border border-primary border-l-0"
          onClick={handleClick}
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
      {isOpen && (results.length > 0 || loading) && (
        <div className="absolute top-[calc(100%+8px)] left-0 lg:left-auto lg:right-0 w-[calc(100vw-32px)] md:w-[450px] bg-white rounded-xl shadow-2xl border border-border-color z-50 py-2 max-h-[75vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {loading && results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-text text-center">Searching...</div>
          ) : (
            results.map(product => (
              <Link
                href={`/shop/${product.slug}`}
                key={product.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-none"
                onMouseEnter={() => {
                  getProduct(product.slug).catch(() => {});
                }}
                onClick={() => {
                  setIsOpen(false);
                  setQuery("");
                  onClose?.();
                  stashProductForHandoff(product);
                }}
              >
                <div className="w-14 h-18 bg-gray-100 rounded relative overflow-hidden shrink-0 border border-border-color">
                  <Image src={product.image} alt={product.name || "Search Result"} fill sizes="56px" className="object-cover" />
                  {product.discountPercentage && product.discountPercentage > 0 && (
                    <div className="absolute top-0 right-0 bg-discount-green text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl">
                      {product.discountPercentage}% Off
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-black line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h4>
                  <span className="text-[10px] text-muted-text bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block uppercase font-medium">{product.category}</span>
                  <div className="flex gap-2 items-center mt-1">
                    {product.salePrice && product.salePrice < product.regularPrice ? (
                      <>
                        <span className="text-[11px] text-muted-text line-through">{product.regularPrice} Tk</span>
                        <span className="text-[14px] font-bold text-sale-red">{product.salePrice} Tk</span>
                      </>
                    ) : (
                      <span className="text-[14px] font-bold text-black">{product.regularPrice} Tk</span>
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