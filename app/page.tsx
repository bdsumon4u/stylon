"use client";

import Image from "next/image";
import Link from "next/link";
import { mockCategories, mockProducts } from "@/data/mock";
import { ProductCard } from "@/components/product/ProductCard";

// Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Home() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Hero Section */}
      <section className="bg-primary/5 py-8 md:py-12 px-4">
        <div className="max-w-[1440px] mx-auto rounded-2xl overflow-hidden bg-primary/10 relative">
           <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={0}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }}
            className="w-full aspect-[21/9] md:aspect-[21/7]"
          >
            <SwiperSlide>
              <div className="w-full h-full relative bg-purple-100 flex items-center px-8 md:px-20">
                <div className="w-1/2 z-10">
                  <h2 className="text-3xl md:text-5xl font-bold text-black mb-4">New Ethnic Collection</h2>
                  <p className="text-muted-text mb-6">Discover the latest trends in fashion</p>
                  <Link href="/products" className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-md font-medium transition-colors">
                    Shop Now
                  </Link>
                </div>
                {/* Hero Image placeholder */}
                <div className="absolute right-0 top-0 w-1/2 h-full opacity-80 mix-blend-multiply">
                  <div className="w-full h-full bg-primary/20"></div>
                </div>
              </div>
            </SwiperSlide>
            {/* Add more slides if needed */}
          </Swiper>
        </div>
      </section>

      {/* Categories Slider */}
      <section className="max-w-[1440px] mx-auto px-4 w-full">
        <Swiper
          modules={[Navigation]}
          spaceBetween={16}
          slidesPerView={4}
          navigation
          breakpoints={{
            320: { slidesPerView: 3, spaceBetween: 10 },
            480: { slidesPerView: 4, spaceBetween: 12 },
            768: { slidesPerView: 6, spaceBetween: 16 },
            1024: { slidesPerView: 8, spaceBetween: 20 },
          }}
          className="categories-swiper"
        >
          {mockCategories.map((category) => (
            <SwiperSlide key={category.id}>
              <Link href={`/products?category=${category.slug}`} className="flex flex-col items-center gap-2 group">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white border border-border-color shadow-sm overflow-hidden flex items-center justify-center p-1 group-hover:border-primary transition-colors">
                   <div className="w-full h-full rounded-full bg-gray-100 relative overflow-hidden">
                     <Image src={category.image} alt={category.name} fill sizes="(max-width: 768px) 64px, 80px" className="object-cover" />
                   </div>
                </div>
                <span className="text-[11px] md:text-xs text-center font-medium text-black group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                  {category.name}
                </span>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* Trending Looks */}
      <section className="max-w-[1440px] mx-auto px-4 w-full">
        <div className="mb-4 border-b border-border-color pb-2 relative">
          <h2 className="text-xl font-bold text-black uppercase">Trending Looks</h2>
          <div className="absolute bottom-[-1px] left-0 w-16 h-[2px] bg-primary"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
          {mockProducts.slice(0, 10).map((product, idx) => (
            <ProductCard key={product.id} product={product} priority={idx < 4} />
          ))}
        </div>
      </section>

      {/* Pure Cotton Dress */}
      <section className="max-w-[1440px] mx-auto px-4 w-full">
        <div className="mb-4 border-b border-border-color pb-2 relative flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-black uppercase">Pure Cotton Dress</h2>
            <div className="absolute bottom-[-1px] left-0 w-16 h-[2px] bg-primary"></div>
          </div>
          <Link href="/products?category=pure-cotton-dress" className="text-sm font-medium text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
          {mockProducts.filter(p => p.category === 'Pure Cotton Dress').slice(0, 5).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      
      {/* Organza Party Dress */}
      <section className="max-w-[1440px] mx-auto px-4 w-full">
        <div className="mb-4 border-b border-border-color pb-2 relative flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-black uppercase">Organza Party Dress</h2>
            <div className="absolute bottom-[-1px] left-0 w-16 h-[2px] bg-primary"></div>
          </div>
          <Link href="/products?category=organza-party-dress" className="text-sm font-medium text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
          {mockProducts.filter(p => p.category === 'Organza Party Dress').slice(0, 5).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

    </div>
  );
}
