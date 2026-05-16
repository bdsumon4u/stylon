"use client";

import { Phone, Search, ShoppingCart, User, Menu, ChevronDown, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cart";
import { cn } from "@/lib/utils";

import { SearchDropdown } from "@/components/product/SearchDropdown";
import { getSettings, getMediaUrl, getMenus, getNestedCategories } from "@/lib/api";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Menu as MenuType, Category } from "@/types";

export function Header({ initialSettings }: { initialSettings?: any }) {
  const { 
    items, 
    setDrawerOpen, 
    isMobileMenuOpen, 
    setMobileMenuOpen, 
    mobileActiveTab, 
    setMobileActiveTab 
  } = useCartStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false); // Mobile search
  const [settings, setSettings] = useState<any>(initialSettings || null);
  const [menus, setMenus] = useState<MenuType[]>([]);
  const [nestedCategories, setNestedCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    getSettings().then(setSettings).catch(console.error);
    getMenus().then(setMenus).catch(console.error);
    getNestedCategories().then(setNestedCategories).catch(console.error);
  }, []);

  const headerMenu = menus.find(m => m.slug === "header-menu");

  return (
    <>
      {/* ... (Top Black Strip remains same) ... */}
      <div className="bg-black text-white text-xs py-2 px-4 flex justify-between items-center z-50 relative overflow-hidden">
        <div className="max-w-[1320px] mx-auto w-full flex justify-between items-center px-4">
          <div className="flex-1 pr-4 whitespace-nowrap">
            <div className="animate-marquee inline-block">
              {settings?.scroll_text || ""}
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 font-medium">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> {settings?.company?.phone || ""}
            </span>
            {settings?.company?.whatsapp && (
              <a 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="WhatsApp" 
                title="Chat on WhatsApp" 
                href={`https://wa.me/${settings.company.whatsapp.replace(/[^0-9]/g, "")}`}
                className="flex items-center gap-1 hover:text-[#25D366] transition-colors"
              >
                <WhatsAppIcon className="w-3 h-3" /> {settings.company.whatsapp}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="bg-white sticky top-0 z-40 border-b border-border-color shadow-sm">
        <div className="max-w-[1320px] mx-auto px-4 lg:px-8 h-[72px] flex items-center justify-between gap-4">
          
          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-4 lg:w-[200px] shrink-0">
            <button 
              className="lg:hidden p-1 text-dark-gray"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              {settings?.logo ? (
                <div className="relative h-10 w-32 md:w-40">
                  {/* Desktop Logo */}
                  <Image 
                    src={getMediaUrl(settings.logo.desktop)} 
                    alt={settings?.company?.name || "Logo"} 
                    fill 
                    className="object-contain hidden md:block" 
                  />
                  {/* Mobile Logo */}
                  <Image 
                    src={getMediaUrl(settings.logo.mobile || settings.logo.desktop)} 
                    alt={settings?.company?.name || "Logo"} 
                    fill 
                    className="object-contain md:hidden" 
                  />
                </div>
              ) : (
                <div className="text-primary font-bold text-2xl flex items-center gap-1 tracking-tight">
                  HOTASH
                </div>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center flex-[1_1_0%] min-w-0 h-full">
            {/* All Products with Nested Categories Dropdown - Fixed */}
            <div className="relative group flex items-center gap-1 cursor-pointer hover:text-primary transition-colors shrink-0 py-6 pr-6 border-r border-border-color/50">
              <Link href="/shop" className="font-bold text-black group-hover:text-primary whitespace-nowrap">All Products</Link>
              <ChevronDown className="w-4 h-4 text-muted-text group-hover:text-primary transition-transform group-hover:rotate-180" />
              
              {/* Dropdown Container */}
              <div className="absolute top-full left-0 w-[500px] bg-white border border-border-color shadow-2xl rounded-b-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] flex overflow-hidden">
                {/* Level 1 Categories */}
                <div className="w-1/2 border-r border-border-color bg-gray-50 py-2">
                  {nestedCategories.map((cat) => (
                    <div 
                      key={cat.id}
                      className={cn(
                        "px-4 py-2.5 flex justify-between items-center transition-colors hover:bg-white hover:text-primary",
                        activeCategory?.id === cat.id ? "bg-white text-primary" : "text-black"
                      )}
                      onMouseEnter={() => setActiveCategory(cat)}
                    >
                      <Link href={`/shop?category[]=${encodeURIComponent(cat.slug)}`} className="flex-1 text-[14px]">
                        {cat.name}
                      </Link>
                      {(cat.children?.length ?? 0) > 0 && (
                        <ChevronDown className="w-4 h-4 -rotate-90 opacity-50" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Level 2/3 Categories */}
                <div className="w-1/2 bg-white p-4 min-h-[300px]">
                  {activeCategory ? (
                    <div className="space-y-4">
                      <h3 className="font-bold text-black border-b border-border-color pb-2 flex items-center justify-between">
                        {activeCategory.name}
                        <Link 
                          href={`/shop?category[]=${encodeURIComponent(activeCategory.slug)}`} 
                          className="text-[11px] text-primary font-normal hover:underline"
                        >
                          View All
                        </Link>
                      </h3>
                      <div className="grid grid-cols-1 gap-y-3">
                        {activeCategory.children?.map((child) => (
                          <div key={child.id} className="group/sub">
                            <Link 
                              href={`/shop?category[]=${encodeURIComponent(child.slug)}`}
                              className="text-[14px] text-muted-text hover:text-primary transition-colors block font-medium"
                            >
                              {child.name}
                            </Link>
                            {child.children && child.children.length > 0 && (
                              <div className="ml-3 mt-1.5 space-y-1.5 border-l border-border-color/60 pl-3">
                                {child.children.map(subChild => (
                                  <Link 
                                    key={subChild.id}
                                    href={`/shop?category[]=${encodeURIComponent(subChild.slug)}`}
                                    className="text-[13px] text-muted-text/80 hover:text-primary block"
                                  >
                                    {subChild.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-text text-sm italic">
                      Hover over a category to see subcategories
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Other Menu Items - Scrolling */}
            <nav className="flex-1 min-w-0 overflow-x-auto hide-scrollbar whitespace-nowrap px-6 flex items-center gap-8 h-full">
              {headerMenu && headerMenu.items.map((item) => (
                <Link key={item.id} href={item.href} className="hover:text-primary transition-colors font-medium text-[15px]">
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-3 lg:gap-5 lg:w-[360px] shrink-0">
            {/* Search (Desktop) */}
            <div className="hidden lg:flex relative w-full max-w-[320px]">
              <SearchDropdown />
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

            {/* Hamburger Menu (Mobile) */}
            <button 
              className="lg:hidden p-2 text-dark-gray hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Mobile Search Bar Dropdown */}
        {isSearchOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-border-color p-3 shadow-md">
            <SearchDropdown onClose={() => setIsSearchOpen(false)} />
          </div>
        )}
      </header>

      {/* Mobile Menu Drawer Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-50 transition-opacity lg:hidden",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <div 
        className={cn(
          "fixed top-0 left-0 h-full w-[280px] bg-white z-50 transform transition-transform duration-300 lg:hidden flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-border-color flex justify-between items-center">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            {settings?.logo ? (
              <div className="relative h-8 w-32">
                <Image 
                  src={getMediaUrl(settings.logo.mobile || settings.logo.desktop)} 
                  alt={settings?.company?.name || "Logo"} 
                  fill 
                  className="object-contain object-left" 
                />
              </div>
            ) : (
              <div className="text-primary font-bold text-xl flex items-center gap-1">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white">
                  <span className="text-sm">{(settings?.company?.name?.[0] || "B").toUpperCase()}</span>
                </div>
                {settings?.company?.name || "BRAND"}
              </div>
            )}
          </Link>
          <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-muted-text">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-2 bg-gray-100 flex gap-1">
          <button 
            className={cn(
              "flex-1 py-2 text-sm font-bold rounded-md transition-all",
              mobileActiveTab === "categories" ? "bg-white text-black shadow-sm" : "text-muted-text hover:text-black"
            )}
            onClick={() => setMobileActiveTab("categories")}
          >
            CATEGORIES
          </button>
          <button 
            className={cn(
              "flex-1 py-2 text-sm font-bold rounded-md transition-all",
              mobileActiveTab === "menu" ? "bg-white text-black shadow-sm" : "text-muted-text hover:text-black"
            )}
            onClick={() => setMobileActiveTab("menu")}
          >
            MENU
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {mobileActiveTab === "categories" ? (
            <div className="flex flex-col">
              {nestedCategories.map((cat) => (
                <MobileCategoryItem 
                  key={cat.id} 
                  category={cat} 
                  onClose={() => setMobileMenuOpen(false)} 
                />
              ))}
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-4">
              {headerMenu ? (
                headerMenu.items.map((item) => (
                  <Link 
                    key={item.id} 
                    href={item.href} 
                    className="font-medium text-lg border-b border-border-color pb-2 block" 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))
              ) : (
                <>
                  <Link href="/" className="font-medium text-lg border-b border-border-color pb-2" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                  <Link href="/shop" className="font-medium text-lg border-b border-border-color pb-2" onClick={() => setMobileMenuOpen(false)}>All Products</Link>
                  <Link href="#" className="font-medium text-lg border-b border-border-color pb-2" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
                  <Link href="#" className="font-medium text-lg border-b border-border-color pb-2" onClick={() => setMobileMenuOpen(false)}>About</Link>
                  <Link href="#" className="font-medium text-lg border-b border-border-color pb-2" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
                </>
              )}
            </div>
          )}
        </nav>
      </div>
    </>
  );
}

function MobileCategoryItem({ category, onClose, level = 0 }: { category: Category; onClose: () => void; level?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="relative">
      <div className={cn(
        "flex items-center gap-1 transition-all duration-200",
        isOpen && level === 0 ? "bg-primary/5" : ""
      )}>
        {/* Toggle Button (Left) */}
        {hasChildren ? (
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 flex items-center justify-center text-muted-text hover:text-primary transition-colors shrink-0"
          >
            <div className={cn(
              "w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center transition-all",
              isOpen ? "bg-primary/10 text-primary" : ""
            )}>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isOpen ? "rotate-180" : "-rotate-90")} />
            </div>
          </button>
        ) : (
          <div className="w-10 h-10 shrink-0 flex items-center justify-center">
             {level > 0 && <div className="w-1.5 h-1.5 rounded-full bg-border-color" />}
          </div>
        )}

        <Link 
          href={`/shop?category[]=${encodeURIComponent(category.slug)}`} 
          className={cn(
            "flex-1 py-3 text-[14px] transition-colors",
            level === 0 ? "font-bold text-black uppercase tracking-tight" : "font-medium text-muted-text",
            isOpen && level === 0 ? "text-primary" : ""
          )}
          onClick={onClose}
        >
          {category.name}
        </Link>
      </div>

      {/* Children with Tree Lines */}
      {hasChildren && isOpen && (
        <div className="relative ml-5 border-l border-border-color/60 pl-2">
          {category.children!.map((child, idx) => (
            <div key={child.id} className="relative">
              {/* L-shape connector */}
              <div className="absolute left-[-8px] top-5 w-2 h-px bg-border-color/60" />
              <MobileCategoryItem 
                category={child} 
                onClose={onClose} 
                level={level + 1} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
