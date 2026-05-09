"use client";

import { Phone, Search, ShoppingCart, User, Menu, ChevronDown, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { cn } from "@/lib/utils";

import { SearchDropdown } from "@/components/product/SearchDropdown";

export function Header() {
  const { items, setDrawerOpen } = useCartStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // Mobile search
  
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      {/* Top Black Strip */}
      <div className="bg-black text-white text-xs py-2 px-4 flex justify-between items-center z-50 relative">
        <div className="max-w-[1440px] mx-auto w-full flex justify-between items-center px-4 overflow-hidden">
          <div className="truncate flex-1 pr-4 whitespace-nowrap">
            Stylonbd is a fashion brand of specially designed ethnic wear like panjabi, pajama, kabli set, koty, sherowani etc. It also sells fashion
          </div>
          <div className="flex items-center gap-4 shrink-0 font-medium">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> +88 01741-476000
            </span>
            <span className="flex items-center gap-1">
              {/* WhatsApp Icon using Lucide Phone for now */}
              <Phone className="w-3 h-3" /> +88 01741-476000
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="bg-white sticky top-0 z-40 border-b border-border-color shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-[72px] flex items-center justify-between gap-4">
          
          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-4 lg:w-1/4">
            <button 
              className="lg:hidden p-1 text-dark-gray"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="text-primary font-bold text-2xl flex items-center gap-1 tracking-tight">
                {/* Purple Icon/Logo representation */}
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white">
                  <span className="text-lg">S</span>
                </div>
                STYLON
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-center gap-8 font-medium text-[15px] flex-1">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <div className="relative group flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
              <Link href="/products">All Products</Link>
              <ChevronDown className="w-4 h-4 text-muted-text group-hover:text-primary" />
            </div>
            <Link href="#" className="hover:text-primary transition-colors">Blog</Link>
            <Link href="#" className="hover:text-primary transition-colors">About</Link>
            <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-3 lg:gap-5 lg:w-1/4">
            {/* Search (Desktop) */}
            <div className="hidden lg:flex relative w-full max-w-[280px]">
              <SearchDropdown />
              <button className="bg-primary text-white px-4 rounded-r-full flex items-center justify-center hover:bg-primary-dark transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Search Icon */}
            <button className="lg:hidden p-2 text-dark-gray" onClick={() => setIsSearchOpen(!isSearchOpen)}>
              <Search className="w-5 h-5" />
            </button>

            {/* Cart Icon */}
            <button 
              className="relative p-2 text-dark-gray hover:text-primary transition-colors"
              onClick={() => setDrawerOpen(true)}
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-sale-red text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User Icon */}
            <button className="hidden lg:flex p-2 text-dark-gray hover:text-primary transition-colors">
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Mobile Search Bar Dropdown */}
        {isSearchOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-border-color p-3 flex gap-2 shadow-md">
            <input 
              type="text" 
              placeholder="search products..." 
              className="flex-1 border border-border-color rounded-md py-2 px-3 outline-none text-sm"
            />
            <button className="bg-primary text-white px-4 py-2 rounded-md">
              <Search className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Mobile Menu Drawer Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-50 transition-opacity lg:hidden",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <div 
        className={cn(
          "fixed top-0 left-0 h-full w-[280px] bg-white z-50 transform transition-transform duration-300 lg:hidden flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-border-color flex justify-between items-center">
          <div className="text-primary font-bold text-xl flex items-center gap-1">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white">
              <span className="text-sm">S</span>
            </div>
            STYLON
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-muted-text">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-4">
          <Link href="/" className="font-medium text-lg border-b border-border-color pb-2" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
          <Link href="/products" className="font-medium text-lg border-b border-border-color pb-2" onClick={() => setIsMobileMenuOpen(false)}>All Products</Link>
          <Link href="#" className="font-medium text-lg border-b border-border-color pb-2" onClick={() => setIsMobileMenuOpen(false)}>Blog</Link>
          <Link href="#" className="font-medium text-lg border-b border-border-color pb-2" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
          <Link href="#" className="font-medium text-lg border-b border-border-color pb-2" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
        </nav>
      </div>
    </>
  );
}
