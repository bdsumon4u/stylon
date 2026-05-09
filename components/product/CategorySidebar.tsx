"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { mockCategories } from "@/data/mock";

export function CategorySidebar() {
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);

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
        />
      </div>

      {/* Filter By Price */}
      <div>
        <h3 className="font-bold text-[14px] mb-2">Filter By Price</h3>
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Min - 0 Tk" 
            className="w-full border border-border-color rounded py-2 px-3 text-sm focus:border-primary outline-none"
          />
          <input 
            type="text" 
            placeholder="Max - 2800 Tk" 
            className="w-full border border-border-color rounded py-2 px-3 text-sm focus:border-primary outline-none"
          />
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
              className="w-full border border-border-color rounded py-1.5 px-3 text-sm focus:border-primary outline-none mb-3"
            />
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {mockCategories.map((category) => (
                <div key={category.id} className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 accent-primary rounded border-border-color text-primary focus:ring-primary" />
                  <label className="text-[13px] flex-1 cursor-pointer truncate">
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

      {/* Filter By Brand */}
      <div>
        <h3 className="font-bold text-[14px] mb-2">Filter By Brand</h3>
        <div className="border border-border-color p-3 rounded space-y-2">
          <input 
            type="text" 
            placeholder="search brand . . ." 
            className="w-full border border-border-color rounded py-1.5 px-3 text-sm focus:border-primary outline-none mb-3"
          />
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4 accent-primary rounded border-border-color text-primary focus:ring-primary" />
            <label className="text-[13px] flex items-center gap-2 cursor-pointer">
              <div className="w-4 h-4 bg-gray-200 rounded border border-border-color flex items-center justify-center text-[8px] font-bold">
                S
              </div>
              stylon
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
