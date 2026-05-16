"use client";
 
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { getCategories } from "@/lib/api";
import { Category } from "@/types";

export function CategorySidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get all selected categories from the URL using the [] notation
  const activeCategories = searchParams.getAll("category[]");
  const searchQuery = searchParams.get("search") || "";
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [catSearch, setCatSearch] = useState("");
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch.trim() !== searchQuery) {
        handleSearch(localSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, searchQuery]);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(err => console.error("Failed to fetch categories:", err));
  }, []);

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );

  const updateFilters = (newCategories: string[], search?: string) => {
    const params = new URLSearchParams();
    
    // Add categories using [] notation for PHP/Laravel compatibility
    newCategories.forEach(cat => {
      params.append("category[]", cat);
    });

    // Add search if present
    const finalSearch = search !== undefined ? search : searchQuery;
    if (finalSearch) {
      params.set("search", finalSearch);
    }

    // Add other existing params
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);

    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  const handleCategoryClick = (slug: string) => {
    let newCategories: string[];
    if (activeCategories.includes(slug)) {
      newCategories = activeCategories.filter(c => c !== slug);
    } else {
      newCategories = [...activeCategories, slug];
    }
    updateFilters(newCategories);
  };

  const handleSearch = (value: string) => {
    updateFilters(activeCategories, value.trim());
  };

  const handleClearAll = () => {
    setLocalSearch("");
    router.push("/shop");
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    handleSearch("");
  };

  return (
    <div className="w-full lg:w-[260px] shrink-0 space-y-6">
      {/* Filter By Name */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-[14px]">Filter By Name</h3>
          <button 
            onClick={handleClearSearch}
            className="text-[12px] text-muted-text hover:text-primary transition-colors font-medium"
          >
            Clear
          </button>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Enter Product Name" 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full border border-border-color rounded py-2 px-3 text-sm focus:border-primary outline-none pr-8"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(localSearch);
              }
            }}
          />
          {localSearch && (
            <button 
              onClick={() => {
                setLocalSearch("");
                handleSearch("");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-text hover:text-sale-red"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
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
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <div 
                    key={category.id} 
                    className={`flex items-center gap-2 cursor-pointer group ${activeCategories.includes(category.slug) ? 'text-primary' : ''}`}
                    onClick={() => handleCategoryClick(category.slug)}
                  >
                    <input 
                      type="checkbox" 
                      checked={activeCategories.includes(category.slug)}
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
                ))
              ) : (
                <div className="text-center py-4 text-muted-text text-xs">
                  No categories found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
