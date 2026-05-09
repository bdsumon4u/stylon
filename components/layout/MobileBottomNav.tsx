"use client";

import Link from "next/link";
import { Home, Grid, ShoppingCart, User, Phone } from "lucide-react";
import { useCartStore } from "@/store/cart";

export function MobileBottomNav() {
  const { items, setDrawerOpen } = useCartStore();
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 w-full bg-light-bg border-t border-border-color z-40 flex justify-between px-2 py-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <Link href="/" className="flex flex-col items-center gap-1 p-2 flex-1 text-black hover:text-primary transition-colors">
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-medium">Home</span>
      </Link>
      <Link href="/products" className="flex flex-col items-center gap-1 p-2 flex-1 text-black hover:text-primary transition-colors">
        <Grid className="w-5 h-5" />
        <span className="text-[10px] font-medium">Categories</span>
      </Link>
      <button 
        onClick={() => setDrawerOpen(true)}
        className="flex flex-col items-center gap-1 p-2 flex-1 text-black hover:text-primary transition-colors relative"
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-sale-red text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium">Cart</span>
      </button>
      <Link href="#" className="flex flex-col items-center gap-1 p-2 flex-1 text-black hover:text-primary transition-colors">
        <User className="w-5 h-5" />
        <span className="text-[10px] font-medium">Account</span>
      </Link>
      <Link href="#" className="flex flex-col items-center gap-1 p-2 flex-1 text-black hover:text-primary transition-colors">
        <Phone className="w-5 h-5" />
        <span className="text-[10px] font-medium">Call</span>
      </Link>
    </div>
  );
}
