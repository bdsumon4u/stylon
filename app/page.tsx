"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import { HomeSectionProducts } from "@/components/home/HomeSectionProducts";
import { getCategories, getSlides, getHomeSections } from "@/lib/api";
import { Product, Category, Slide } from "@/types";

// Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, Mousewheel, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [homeSections, setHomeSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catsResult, slidesResult, sectionsResult] = await Promise.allSettled([
          getCategories(),
          getSlides(),
          getHomeSections(),
        ]);
        
        if (catsResult.status === "fulfilled") {
          setCategories(catsResult.value);
        } else {
          console.error("Failed to fetch categories:", catsResult.reason);
        }

        if (slidesResult.status === "fulfilled") {
          setSlides(slidesResult.value);
        } else {
          console.error("Failed to fetch slides:", slidesResult.reason);
        }

        if (sectionsResult.status === "fulfilled") {
          setHomeSections(sectionsResult.value);
        } else {
          console.error("Failed to fetch home sections:", sectionsResult.reason);
        }
      } catch (error) {
        console.error("Failed to fetch home data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-8 pb-12">
        {/* Skeleton: Hero */}
        <section className="bg-primary/5 py-8 md:py-12">
          <div className="w-full bg-gray-200 animate-pulse aspect-[21/9] md:aspect-[21/7]" />
        </section>
        {/* Skeleton: Products Grid */}
        <section className="max-w-[1320px] mx-auto px-4 w-full">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-[10px] aspect-[4/5]" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Hero Section */}
      {slides.length > 0 && (
        <section className="bg-primary/5">
          <div className="w-full relative">
             <Swiper
              modules={[Navigation, Pagination, Autoplay, Mousewheel, Keyboard]}
              spaceBetween={0}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 5000 }}
              mousewheel={{ forceToAxis: true }}
              keyboard={true}
              className="w-full aspect-[21/9] md:aspect-[21/7]"
            >
              {slides.map((slide) => (
                <SwiperSlide key={slide.id}>
                  <Link href={slide.btn_href || "/shop"} className="relative w-full h-full block">
                    <div className="hidden md:block w-full h-full relative aspect-[21/7]">
                      <Image src={slide.desktop_image} alt={slide.title || "Hero Slide Desktop"} fill sizes="100vw" quality={80} className="object-cover" priority />
                    </div>
                    <div className="md:hidden w-full h-full relative aspect-[21/9]">
                      <Image src={slide.mobile_image} alt={slide.title || "Hero Slide Mobile"} fill sizes="100vw" quality={80} className="object-cover" priority />
                    </div>
                    {(slide.title || slide.text) && (
                      <div className="absolute inset-0 bg-black/10 flex items-center px-8 md:px-20">
                        <div className="max-w-xl">
                          <h2 className="text-2xl md:text-5xl font-bold text-white mb-2 md:mb-4 drop-shadow-lg">{slide.title}</h2>
                          <p className="text-white text-sm md:text-lg mb-4 md:mb-8 drop-shadow-md line-clamp-2">{slide.text}</p>
                          {slide.btn_name && (
                            <span className="bg-white text-black px-6 py-2.5 rounded-md font-bold transition-all hover:scale-105 inline-block">
                              {slide.btn_name}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}

      {/* Categories Slider */}
      {categories.length > 0 && (
        <section className="max-w-[1320px] mx-auto px-4 w-full">
          <Swiper
            modules={[Navigation, Mousewheel, Keyboard]}
            spaceBetween={16}
            slidesPerView={4}
            navigation
            mousewheel={{ forceToAxis: true }}
            keyboard={true}
            breakpoints={{
              320: { slidesPerView: 3, spaceBetween: 10 },
              480: { slidesPerView: 4, spaceBetween: 12 },
              768: { slidesPerView: 6, spaceBetween: 16 },
              1024: { slidesPerView: 8, spaceBetween: 20 },
            }}
            className="categories-swiper"
          >
            {categories.map((category) => (
              <SwiperSlide key={category.id}>
                <Link href={`/shop?category=${encodeURIComponent(category.slug)}`} className="flex flex-col items-center gap-2 group">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg bg-white border border-border-color shadow-sm overflow-hidden flex items-center justify-center p-1 group-hover:border-primary transition-colors">
                     <div className="w-full h-full rounded-lg bg-gray-100 relative overflow-hidden">
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
      )}

      {/* Dynamic Home Sections */}
      {homeSections.map((section) => (
        <section key={section.id} className="max-w-[1320px] mx-auto px-4 w-full">
          <div className="mb-6 border-b border-border-color pb-2 relative flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold text-black uppercase tracking-wide">{section.title}</h2>
              <div className="absolute bottom-[-1px] left-0 w-20 h-[3px] bg-primary rounded-full"></div>
            </div>
            {/* Optional: Add View All link if there's a related slug in the future */}
          </div>
          <HomeSectionProducts sectionId={section.id} />
        </section>
      ))}

    </div>
  );
}
