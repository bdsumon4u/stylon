"use client";

import { useCartStore } from "@/store/cart";
import { cn } from "@/lib/utils";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function CartDrawer() {
  const { isDrawerOpen, setDrawerOpen, items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const router = useRouter();

  const handleCheckout = () => {
    setDrawerOpen(false);
    router.push("/checkout");
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-50 transition-opacity",
          isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-[340px] max-w-[100vw] bg-white z-50 transform transition-transform duration-300 flex flex-col shadow-xl",
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border-color flex justify-between items-center bg-white">
          <div className="font-bold flex items-center gap-2">
            <span className="text-black">Total Item ({totalItems})</span>
          </div>
          <button onClick={() => setDrawerOpen(false)} className="text-muted-text hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-white">
          {items.length === 0 ? (
            <div className="text-center text-muted-text mt-10">Your cart is empty</div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex gap-3 border-b border-border-color pb-4 relative group">
                {/* Delete Button */}
                <button 
                  onClick={() => removeItem(item.product.id)}
                  className="absolute -top-1 -right-1 bg-sale-red text-white p-0.5 rounded-full z-10 hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>

                <div className="w-16 h-20 bg-gray-100 rounded relative overflow-hidden shrink-0 border border-border-color">
                  <Image 
                    src={item.product.image} 
                    alt={item.product.name} 
                    fill 
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[12px] font-semibold text-black line-clamp-2 leading-tight">
                      {item.product.name}
                    </h4>
                    <div className="text-[11px] text-muted-text mt-0.5">
                      Tk {item.product.salePrice || item.product.regularPrice}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-border-color rounded">
                      <button 
                        className="px-2 py-0.5 text-black hover:bg-gray-50 disabled:opacity-50"
                        onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 py-0.5 text-[12px] text-black text-center min-w-[28px] border-x border-border-color">
                        {item.quantity}
                      </span>
                      <button 
                        className="px-2 py-0.5 text-black hover:bg-gray-50"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="font-bold text-[13px] text-sale-red">
                      Tk {(item.product.salePrice || item.product.regularPrice) * item.quantity}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border-color bg-white p-4 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <button 
              onClick={handleCheckout}
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded flex justify-between items-center px-4 transition-colors"
            >
              <span>অর্ডার করুন</span>
              <span>Tk {getTotalPrice()}</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
