"use client";

import { useState } from "react";
import { mockProducts } from "@/data/mock";
import { ProductCard } from "@/components/product/ProductCard";
import { CategorySidebar } from "@/components/product/CategorySidebar";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-6 flex gap-6 relative">
      
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

    </div>
  );
}
