"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getCategories } from "@/lib/api";
import { Category } from "@/types";

export function CategorySidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "";
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [catSearch, setCatSearch] = useState("");

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(err => console.error("Failed to fetch categories:", err));
  }, []);

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );

  const handleCategoryClick = (slug: string) => {
    if (activeCategory === slug) {
      router.push("/products");
    } else {
      router.push(`/products?category=${slug}`);
    }
  };

  return (
    <div className="w-full lg:w-[260px] shrink-0 space-y-6">
      {/* Filter By Name */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-[14px]">Filter By Name</h3>
          <button className="text-[12px] text-muted-text hover:text-primary">Clear</button>
        </div>
        <input 
          type="text" 
          placeholder="Enter Product Name" 
          className="w-full border border-border-color rounded py-2 px-3 text-sm focus:border-primary outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const value = (e.target as HTMLInputElement).value;
              if (value.trim()) {
                router.push(`/products?search=${encodeURIComponent(value.trim())}`);
              }
            }
          }}
        />
      </div>

      {/* Filter By Category */}
      <div>
        <div 
          className="flex justify-between items-center mb-2 cursor-pointer"
          onClick={() => setIsCategoryOpen(!isCategoryOpen)}
        >
          <h3 className="font-bold text-[14px]">Filter By Category</h3>
          {isCategoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
        
        {isCategoryOpen && (
          <div className="space-y-2 border border-border-color p-3 rounded">
            <input 
              type="text" 
              placeholder="search category . . ." 
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
              className="w-full border border-border-color rounded py-1.5 px-3 text-sm focus:border-primary outline-none mb-3"
            />
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredCategories.map((category) => (
                <div 
                  key={category.id} 
                  className={`flex items-center gap-2 cursor-pointer group ${activeCategory === category.slug ? 'text-primary' : ''}`}
                  onClick={() => handleCategoryClick(category.slug)}
                >
                  <input 
                    type="checkbox" 
                    checked={activeCategory === category.slug}
                    readOnly
                    className="w-4 h-4 accent-primary rounded border-border-color text-primary focus:ring-primary cursor-pointer" 
                  />
                  <label className="text-[13px] flex-1 cursor-pointer truncate group-hover:text-primary transition-colors">
                    {category.name}
                  </label>
                  <span className="text-[11px] text-muted-text bg-gray-100 px-1.5 py-0.5 rounded">
                    ({category.productCount})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
