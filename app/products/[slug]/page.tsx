"use client";

import { use, useState } from "react";
import Image from "next/image";
import { mockProducts } from "@/data/mock";
import { Minus, Plus, ChevronDown, ChevronUp, ShoppingCart, FileText, Video, Share2, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { ProductCard } from "@/components/product/ProductCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

export function generateStaticParams() {
  return mockProducts.map((product) => ({
    slug: product.slug,
  }));
}

function ZoomableImage({ src, alt, priority }: { src: string, alt: string, priority?: boolean }) {
  const [position, setPosition] = useState({ x: '50%', y: '50%' });
  const [isZoomed, setIsZoomed] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x: `${x}%`, y: `${y}%` });
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden cursor-crosshair group"
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={() => setIsZoomed(false)}
      onMouseMove={handleMouseMove}
    >
      <Image 
        src={src} 
        alt={alt} 
        fill 
        sizes="(max-width: 1024px) 100vw, 540px" 
        className={`object-cover transition-transform ${isZoomed ? "duration-0" : "duration-300"}`} 
        priority={priority}
        style={{
          transformOrigin: `${position.x} ${position.y}`,
          transform: isZoomed ? 'scale(2)' : 'scale(1)'
        }}
      />
    </div>
  );
}

export default function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const product = mockProducts.find(p => p.slug === slug) || mockProducts[0];
  
  const { addItem, setOrderModalOpen } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState<string>("description");
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

  const allImages = [product.image, ...(product.thumbnails || [])];
  
  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  const handleOrderNow = () => {
    addItem(product, quantity);
    setOrderModalOpen(true);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-8 flex flex-col gap-12">
      
      {/* Product Top Section */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left - Images */}
        <div className="w-full lg:w-[480px] xl:w-[540px] shrink-0 space-y-4">
          <div className="aspect-[4/5] relative bg-gray-100 rounded-lg overflow-hidden border border-border-color shadow-sm group">
            <Swiper
              style={{
                "--swiper-navigation-color": "#000",
                "--swiper-pagination-color": "#000",
              } as React.CSSProperties}
              spaceBetween={10}
              navigation={true}
              thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
              modules={[FreeMode, Navigation, Thumbs]}
              className="w-full h-full"
            >
              {allImages.map((img, idx) => (
                <SwiperSlide key={idx} className="relative w-full h-full">
                  <ZoomableImage src={img} alt={`${product.name} ${idx}`} priority={idx === 0} />
                </SwiperSlide>
              ))}
            </Swiper>
            {product.discountPercentage && (
              <div className="absolute top-3 right-3 bg-sale-red text-white text-xs font-bold px-2 py-1 rounded shadow-sm z-10">
                {product.discountPercentage}% Off
              </div>
            )}
          </div>
          
          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="h-24 relative">
              <Swiper
                onSwiper={setThumbsSwiper}
                spaceBetween={12}
                slidesPerView={4}
                freeMode={true}
                watchSlidesProgress={true}
                modules={[FreeMode, Navigation, Thumbs]}
                className="h-full thumbs-slider"
              >
                {allImages.map((img, idx) => (
                  <SwiperSlide key={idx} className="cursor-pointer overflow-hidden rounded border border-transparent opacity-60 hover:opacity-100 transition-opacity [&.swiper-slide-thumb-active]:border-black [&.swiper-slide-thumb-active]:opacity-100 relative bg-gray-100">
                    <Image src={img} alt={`${product.name} thumb ${idx}`} fill sizes="80px" className="object-cover" priority={idx === 0} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </div>

        {/* Right - Product Info */}
        <div className="flex-1 flex flex-col pt-2 lg:pt-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-black mb-2 leading-tight">
            {product.name}
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-muted-text mb-6">
            <span>Category: <span className="font-medium text-black">{product.category}</span></span>
            {product.brand && <span>Brand: <span className="font-medium text-black">{product.brand}</span></span>}
          </div>

          {/* Pricing */}
          <div className="flex items-center gap-4 mb-6">
            {product.salePrice ? (
              <>
                <span className="text-sale-red line-through text-lg font-medium">{product.regularPrice} Tk</span>
                <span className="text-black font-bold text-3xl">{product.salePrice} Tk</span>
              </>
            ) : (
              <span className="text-black font-bold text-3xl">{product.regularPrice} Tk</span>
            )}
            {product.discountPercentage && (
              <span className="bg-black text-white px-3 py-1 rounded-full text-[11px] font-bold ml-2 shadow-md">
                Save {product.regularPrice - (product.salePrice || 0)} Tk
              </span>
            )}
          </div>

          <p className="text-black mb-6 leading-relaxed text-[15px]">
            {product.description || "অত্যন্ত আকর্ষণীয় ডিজাইনের এই ড্রেসটি আপনাকে দেবে এক প্রিমিয়াম লুক। উন্নত মানের ফেব্রিক এবং চমৎকার ফিনিশিং।"}
          </p>

          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 bg-[#e8f5e9] text-discount-green px-3 py-1.5 rounded text-xs font-bold border border-[#c8e6c9]">
              Stock Status : <span className="text-discount-green">In Stock</span>
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full border-b border-border-color pb-8 mb-8">
            <div className="flex items-center border border-border-color rounded w-full sm:w-auto h-[48px]">
              <button 
                className="px-4 py-2 text-black hover:bg-gray-100 h-full flex items-center justify-center disabled:opacity-50 transition-colors"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-base text-black text-center min-w-[50px] border-x border-border-color font-bold flex items-center justify-center h-full bg-white">
                {quantity}
              </span>
              <button 
                className="px-4 py-2 text-black hover:bg-gray-100 h-full flex items-center justify-center transition-colors"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex gap-4 w-full sm:w-auto flex-1">
              <button 
                onClick={handleAddToCart}
                className="relative flex-1 bg-white border-[2px] border-black text-black hover:bg-black hover:text-white font-bold py-3 px-6 rounded-md transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] text-center h-[48px] flex items-center justify-center gap-2 group overflow-hidden"
              >
                <div className="absolute bottom-0 left-0 w-6 h-6 bg-black group-hover:bg-white transition-colors" style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}></div>
                <ShoppingCart className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" />
                <span className="relative z-10">Add To Cart</span>
              </button>
              <button 
                onClick={handleOrderNow}
                className="flex-1 bg-black border-[2px] border-black text-white hover:bg-gray-800 font-bold py-3 px-6 rounded-md transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] text-center h-[48px] flex items-center justify-center"
              >
                অর্ডার করুন
              </button>
            </div>
          </div>

          {/* Accordions */}
          <div className="space-y-4">
            <AccordionItem 
              title="Product Description" 
              icon={<FileText className="w-4 h-4" />}
              isOpen={activeAccordion === "description"}
              onClick={() => setActiveAccordion(activeAccordion === "description" ? "" : "description")}
            >
              <p className="text-sm text-muted-text">
                This exclusive dress is designed to give you a premium and elegant look. Made from high-quality materials to ensure maximum comfort and durability. The perfect choice for any party or festive occasion.
              </p>
            </AccordionItem>
            
            <AccordionItem 
              title="Product Video" 
              icon={<Video className="w-4 h-4" />}
              isOpen={activeAccordion === "video"}
              onClick={() => setActiveAccordion(activeAccordion === "video" ? "" : "video")}
            >
              <div className="aspect-video bg-gray-200 rounded flex items-center justify-center text-muted-text">
                Video Unavailable
              </div>
            </AccordionItem>
            
            <AccordionItem 
              title="Why Choose Us" 
              icon={<Share2 className="w-4 h-4" />}
              isOpen={activeAccordion === "whyus"}
              onClick={() => setActiveAccordion(activeAccordion === "whyus" ? "" : "whyus")}
            >
              <ul className="list-disc pl-5 text-sm text-muted-text space-y-1">
                <li>Premium quality products</li>
                <li>Fast and secure delivery</li>
                <li>24/7 customer support</li>
                <li>Easy return policy</li>
              </ul>
            </AccordionItem>

            <AccordionItem 
              title="Return Policy" 
              icon={<ShieldCheck className="w-4 h-4" />}
              isOpen={activeAccordion === "return"}
              onClick={() => setActiveAccordion(activeAccordion === "return" ? "" : "return")}
            >
              <p className="text-sm text-muted-text">
                We offer a 3-day return policy for unused and unwashed products with all original tags intact. Please contact our support team for any return queries.
              </p>
            </AccordionItem>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-[72px] left-0 right-0 bg-white border-t border-border-color p-2 px-3 z-40 flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        
        {/* Left Side: Thumbnail, Price, Qty */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-12 bg-gray-100 rounded relative overflow-hidden border border-border-color shrink-0">
            <Image src={product.image} alt={product.name} fill sizes="40px" className="object-cover" priority={true} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[13px] text-primary leading-tight">{product.salePrice || product.regularPrice} Tk</span>
            <div className="flex items-center gap-1 mt-0.5">
              <button 
                className="w-5 h-5 rounded-full border border-border-color flex items-center justify-center text-muted-text bg-white"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-bold text-black min-w-[12px] text-center">{quantity}</span>
              <button 
                className="w-5 h-5 rounded-full border border-border-color flex items-center justify-center text-muted-text bg-white"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleAddToCart}
            className="bg-black text-white px-3 py-2 rounded text-[13px] font-bold flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart
          </button>
          <button 
            onClick={handleOrderNow}
            className="bg-gray-200 text-black px-3 py-2 rounded text-[13px] font-bold active:scale-95 transition-transform"
          >
            অর্ডার করুন
          </button>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-8">
        <div className="mb-8 relative">
          <h2 className="text-xl lg:text-2xl font-bold text-black border-l-4 border-primary pl-3">
            <span className="text-primary text-xs tracking-wider block mb-1 uppercase">PRODUCTS</span>
            Related Product
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
          {mockProducts.filter(p => p.id !== product.id).slice(0, 5).map((related, idx) => (
            <ProductCard key={related.id} product={related} priority={idx < 4} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AccordionItem({ title, icon, children, isOpen, onClick }: { title: string, icon: React.ReactNode, children: React.ReactNode, isOpen: boolean, onClick: () => void }) {
  return (
    <div className="border border-border-color rounded-md overflow-hidden bg-white hover:shadow-sm transition-shadow">
      <button 
        className={`w-full flex justify-between items-center p-4 font-medium text-[15px] text-left transition-colors ${isOpen ? "text-black" : "text-black"}`}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <span className="text-muted-text">{icon}</span>
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-text" /> : <ChevronDown className="w-4 h-4 text-muted-text" />}
      </button>
      <div 
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-0 border-t border-transparent">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
