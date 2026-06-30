"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ChevronDown, ChevronUp, ShoppingCart, FileText, Share2, ShieldCheck, ChevronLeft, ChevronRight, Star, MessageSquare, CheckCircle, Phone } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { ProductCard, consumeProductHandoff } from "@/components/product/ProductCard";
import { getProduct, getRelatedProducts, getProductReviews, submitProductReview, peekProduct } from "@/lib/api";
import { useSettings } from "@/hooks/useSettings";
import { Product, ProductVariation } from "@/types";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Thumbs, Mousewheel, Keyboard } from "swiper/modules";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { MessengerIcon } from "@/components/icons/BrandIcons";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

// Preload images into the browser cache so they're instant when Swiper displays them
function preloadImage(src: string, highPriority: boolean = false) {
  if (typeof window === "undefined" || !src) return;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "image";
  link.href = src;
  if (highPriority) link.fetchPriority = "high";
  document.head.appendChild(link);
}

// Warm image cache for gallery images without blocking initial render.
function lazyPreloadImages(srcs: string[]) {
  if (typeof window === "undefined" || srcs.length === 0) return;
  const run = () => srcs.forEach((src) => preloadImage(src, false));
  // Defer until idle so gallery prefetch never competes with the LCP image.
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(run, { timeout: 2500 });
  } else {
    setTimeout(run, 1500);
  }
}

function ZoomableImage({ src, alt, priority, loading = "lazy" }: { src: string, alt: string, priority?: boolean, loading?: "eager" | "lazy" }) {
  const [transformOrigin, setTransformOrigin] = useState('50% 50%');
  const [scale, setScale] = useState(1);
  const [isHovering, setIsHovering] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  // Holds initial finger distance when a pinch gesture starts
  const pinchStateRef = useRef<{ initialDistance: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setTransformOrigin(`${x}% ${y}%`);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getTouchDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) {
        pinchStateRef.current = null;
        return;
      }
      pinchStateRef.current = { initialDistance: getTouchDistance(e.touches) };
      setIsHovering(false);
      setTransformOrigin('50% 50%');
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinchStateRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      const ratio = getTouchDistance(e.touches) / pinchStateRef.current.initialDistance;
      setScale(Math.max(1, Math.min(4, ratio)));
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length >= 2) return;
      pinchStateRef.current = null;
      setScale(1);
      setTransformOrigin('50% 50%');
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  // scale > 1 means a pinch is live; suppress hover-zoom to avoid conflict
  const isPinching = scale > 1.01;
  const displayScale = isPinching ? scale : (isHovering ? 2 : 1);
  const displayOrigin = isPinching ? '50% 50%' : transformOrigin;
  const transition = isPinching || isHovering ? 'none' : 'transform 0.3s ease';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-crosshair group select-none"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 700px"
        quality={85}
        priority={priority}
        loading={loading}
        className="object-contain"
        style={{
          transformOrigin: displayOrigin,
          transform: `scale(${displayScale})`,
          transition,
        }}
        draggable={false}
      />
    </div>
  );
}

export default function ProductDetailsClient({ initialProduct, slug }: { initialProduct: Product; slug: string }) {
  const { addItem, setOrderModalOpen } = useCartStore();
  // Synchronously check for SPA navigation handoff data (from hover prefetch or click)
  const hydratedProduct = (() => {
    if (typeof window === "undefined") return null;
    const handoff = consumeProductHandoff(slug);
    if (handoff) return handoff;
    return peekProduct(slug);
  })();
  const [product, setProduct] = useState<Product | null>(hydratedProduct ?? initialProduct);
  const settings = useSettings();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState<string>("description");
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

  // Variation state
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    name: "",
    phone: "",
    rating: 5,
    review: "",
    order_id: ""
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState({ type: "", text: "" });

  const primeVariationFromProduct = (prod: Product) => {
    if (prod.variations && prod.variations.length > 0) {
      const randomIdx = Math.floor(Math.random() * prod.variations.length);
      const randomVar = prod.variations[randomIdx];
      setSelectedVariation(randomVar);
      if (prod.attributes) {
        const opts: Record<string, number> = {};
        for (const attr of prod.attributes) {
          const matched = attr.options.find((o) => randomVar.optionIds.includes(o.id));
          if (matched) opts[String(attr.id)] = matched.id;
        }
        setSelectedOptions(opts);
      }
    }
  };

  const primeImageCache = (prod: Product) => {
    const allImages = prod.images && prod.images.length > 0
      ? prod.images
      : [prod.image, ...(prod.thumbnails || [])];
    const mainImage = allImages[0];
    const galleryImages = allImages.slice(1);
    if (mainImage) preloadImage(mainImage, true);
    lazyPreloadImages(galleryImages);
  };

  // Prime variations and image cache from initialProduct on mount
  useEffect(() => {
    const currentProduct = product ?? initialProduct;
    if (currentProduct) {
      primeImageCache(currentProduct);
      primeVariationFromProduct(currentProduct);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // On every slug change, attempt to re-hydrate from handoff / in-memory cache
    let fresh: Product | null = null;
    if (typeof window !== "undefined") {
      fresh = consumeProductHandoff(slug) ?? peekProduct(slug);
    }

    if (fresh) {
      setProduct(fresh);
      setLoading(false);
      primeImageCache(fresh);
      primeVariationFromProduct(fresh);
      return;
    }

    // Fetch product data for SPA navigation (initial load uses server-provided data)
    if (slug !== initialProduct.slug) {
      setLoading(true);
      async function fetchCritical() {
        try {
          const prod = await getProduct(slug);
          setProduct(prod);
          primeImageCache(prod);
          primeVariationFromProduct(prod);
        } catch (error) {
          console.error("Failed to fetch product:", error);
        } finally {
          setLoading(false);
        }
      }
      fetchCritical();
    }
    // We intentionally depend only on `slug`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Fetch reviews in the background
  useEffect(() => {
    if (!product) return;

    const timer = setTimeout(() => {
      getProductReviews(slug, 1)
        .then((res) => {
          setReviews(res.data || []);
          setHasMoreReviews(res.pagination?.current_page < res.pagination?.last_page);
        })
        .catch((err) => console.error("Failed to fetch reviews:", err));
    }, 100);

    return () => clearTimeout(timer);
  }, [slug, product?.id]);

  const loadMoreReviews = async () => {
    if (loadingMoreReviews || !hasMoreReviews) return;
    setLoadingMoreReviews(true);
    try {
      const nextPage = reviewsPage + 1;
      const res = await getProductReviews(slug, nextPage);
      setReviews([...reviews, ...(res.data || [])]);
      setReviewsPage(nextPage);
      setHasMoreReviews(res.pagination?.current_page < res.pagination?.last_page);
    } catch (error) {
      console.error("Failed to load more reviews:", error);
    } finally {
      setLoadingMoreReviews(false);
    }
  };

  if (loading || !product) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 lg:px-8 py-8 flex flex-col gap-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="w-full lg:w-[480px] xl:w-[540px] shrink-0">
            <div className="aspect-[4/5] bg-gray-200 animate-pulse rounded-lg" />
          </div>
          <div className="flex-1 space-y-4 pt-6">
            <div className="h-8 bg-gray-200 animate-pulse rounded w-3/4" />
            <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2" />
            <div className="h-10 bg-gray-200 animate-pulse rounded w-1/3 mt-4" />
            <div className="h-20 bg-gray-200 animate-pulse rounded w-full mt-4" />
            <div className="h-12 bg-gray-200 animate-pulse rounded w-full mt-8" />
          </div>
        </div>
      </div>
    );
  }

  // Resolve display price/stock: prefer variation when one is selected
  const displayRegularPrice = selectedVariation?.regularPrice ?? product.regularPrice;
  const displaySalePrice = selectedVariation?.salePrice ?? product.salePrice ?? product.regularPrice;
  const displayInStock = selectedVariation ? selectedVariation.inStock : product.inStock;
  const displayStockCount = selectedVariation ? selectedVariation.stockCount : product.stockCount;

  const allImages = product.images && product.images.length > 0
    ? product.images
    : [product.image, ...(product.thumbnails || [])];

  const handleOptionChange = (attributeId: number, optionId: number) => {
    const newOptions = { ...selectedOptions, [String(attributeId)]: optionId };
    setSelectedOptions(newOptions);

    if (product?.variations && product.attributes) {
      const matched = product.variations.find((v) =>
        product.attributes!.every((attr) => {
          const selectedOpt = newOptions[String(attr.id)];
          return selectedOpt == null || v.optionIds.includes(selectedOpt);
        })
      );
      if (matched) setSelectedVariation(matched);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity, selectedVariation ?? null);
  };

  const handleOrderNow = () => {
    if (!product) return;
    addItem(product, quantity, selectedVariation ?? null);
    setOrderModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewMessage({ type: "", text: "" });

    try {
      const res = await submitProductReview(slug, reviewForm);
      setReviewMessage({ type: "success", text: res.message });
      setReviewForm({ name: "", phone: "", rating: 5, review: "", order_id: "" });
    } catch (error: any) {
      setReviewMessage({ type: "error", text: error.message || "Failed to submit review." });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto px-4 lg:px-8 py-8 flex flex-col gap-12">

      {/* Product Top Section */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left - Images */}
        <div className="w-full lg:w-[500px] shrink-0 space-y-4">
          <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden border border-border-color shadow-sm group">
            <Swiper
              style={{
                "--swiper-navigation-color": "#000",
                "--swiper-pagination-color": "#000",
              } as React.CSSProperties}
              spaceBetween={10}
              navigation={true}
              thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
              modules={[FreeMode, Navigation, Thumbs, Mousewheel, Keyboard]}
              mousewheel={{ forceToAxis: true }}
              keyboard={true}
              className="w-full h-full"
            >
              {allImages.map((img, idx) => (
                <SwiperSlide key={idx} className="relative w-full h-full">
                  <ZoomableImage src={img} alt={`${product.name || "Product Image"} ${idx}`} priority={idx === 0} loading={idx === 0 ? "eager" : "lazy"} />
                </SwiperSlide>
              ))}
            </Swiper>
            {product.discountPercentage && product.discountPercentage > 0 && (
              <div className="absolute top-3 right-3 bg-sale-red text-white text-xs font-bold px-2 py-1 rounded shadow-sm z-10">
                {product.discountPercentage}% Off
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="h-24 relative group/thumbs">
              <Swiper
                onSwiper={setThumbsSwiper}
                spaceBetween={12}
                slidesPerView={4}
                navigation={{
                  prevEl: ".thumbs-prev",
                  nextEl: ".thumbs-next",
                }}
                freeMode={true}
                watchSlidesProgress={true}
                modules={[FreeMode, Navigation, Thumbs, Mousewheel, Keyboard]}
                mousewheel={{ forceToAxis: true }}
                keyboard={true}
                className="h-full thumbs-slider px-1"
                breakpoints={{
                  480: { slidesPerView: 5 },
                  640: { slidesPerView: 6 },
                  1024: { slidesPerView: 4 },
                  1280: { slidesPerView: 5 },
                }}
              >
                {allImages.map((img, idx) => (
                  <SwiperSlide key={idx} className="cursor-pointer overflow-hidden rounded border border-transparent opacity-60 hover:opacity-100 transition-opacity [&.swiper-slide-thumb-active]:border-black [&.swiper-slide-thumb-active]:opacity-100 relative bg-gray-100">
                    <Image src={img} alt={`${product.name || "Product"} thumb ${idx}`} fill sizes="80px" className="object-cover" priority={idx === 0} loading={idx === 0 ? "eager" : "lazy"} />
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Custom Navigation for Thumbs */}
              <button className="thumbs-prev absolute left-[-15px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center opacity-0 group-hover/thumbs:opacity-100 transition-opacity disabled:!hidden border border-border-color">
                <ChevronLeft className="w-5 h-5 text-black" />
              </button>
              <button className="thumbs-next absolute right-[-15px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center opacity-0 group-hover/thumbs:opacity-100 transition-opacity disabled:!hidden border border-border-color">
                <ChevronRight className="w-5 h-5 text-black" />
              </button>
            </div>
          )}
        </div>

        {/* Right - Product Info */}
        <div className="flex-1 flex flex-col pt-2 lg:pt-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-black mb-2 leading-tight">
            {product.name}
            {selectedVariation && (
              <span className="text-black text-shadow-[1px 1px] font-normal text-xl lg:text-2xl">
                {" "}[{selectedVariation.name}]
              </span>
            )}
          </h1>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(product.averageRating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                />
              ))}
              <span className="text-sm font-bold text-black ml-1">{(product.averageRating || 0).toFixed(1)}</span>
            </div>
            <span className="text-sm text-muted-text">({product.reviewsCount || 0} Reviews)</span>
          </div>

          {/* Pricing */}
          <div className="flex items-center gap-4 mb-4">
            {displaySalePrice < displayRegularPrice ? (
              <>
                <span className="text-sale-red line-through text-lg md:text-md font-medium">{displayRegularPrice} Tk</span>
                <span className="text-black font-bold text-2xl md:text-xl">{displaySalePrice} Tk</span>
              </>
            ) : (
              <span className="text-black font-bold text-2xl md:text-xl">{displayRegularPrice} Tk</span>
            )}
            {displaySalePrice < displayRegularPrice && (
              <span className="bg-black text-white px-3 py-1 rounded-full text-[11px] font-bold ml-2 shadow-md">
                Save {displayRegularPrice - displaySalePrice} Tk
              </span>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-black mb-4 leading-relaxed text-[15px]">
              {product.shortDescription}
            </p>
          )}

          {/* Attribute / Variation Picker */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="mb-4 space-y-3">
              {product.attributes.map((attr) => {
                const isColor = attr.name.toLowerCase() === "color" || attr.name.toLowerCase() === "colour";
                return (
                  <div key={attr.id} className="flex items-center flex-wrap gap-2">
                    <span className="text-sm font-bold text-black min-w-[52px] shrink-0">{attr.name}:</span>
                    <div className="flex flex-wrap gap-2">
                      {attr.options.map((option) => {
                        const isSelected = selectedOptions[String(attr.id)] === option.id;
                        if (isColor) {
                          return (
                            <button
                              key={option.id}
                              title={option.name}
                              onClick={() => handleOptionChange(attr.id, option.id)}
                              className={`w-7 h-7 rounded-full border-2 transition-all ${isSelected ? "border-black scale-110 shadow-md" : "border-gray-300 hover:border-gray-600"}`}
                              style={{ backgroundColor: option.value || "#cccccc" }}
                            />
                          );
                        }
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleOptionChange(attr.id, option.id)}
                            className={`px-3 py-1.5 text-sm font-medium border rounded transition-all ${isSelected ? "bg-black text-white border-black shadow-sm" : "bg-white text-black border-gray-300 hover:border-black"}`}
                          >
                            {option.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mb-4 inline-flex gap-x-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border ${displayInStock ? 'bg-[#e8f5e9] text-discount-green border-[#c8e6c9]' : 'bg-red-50 text-sale-red border-red-200'}`}>
              <span>{displayInStock ? displayStockCount === -1 ? 'In Stock' : displayStockCount + ' ' + 'In Stock' : 'Out of Stock'}</span>
            </span>
            <div className="flex items-center border border-border-color rounded w-auto h-[48px]">
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
          </div>

          {/* Actions */}
          <div className="flex gap-4 w-full mb-6">
            <div className="flex flex-col md:flex-row items-center gap-4 w-full sm:w-auto flex-1">
              <button
                onClick={handleAddToCart}
                className="w-full relative flex-1 bg-white border-[2px] border-black text-black hover:bg-black hover:text-white font-bold py-3 px-6 rounded-md transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] text-center h-[48px] flex items-center justify-center gap-2 group overflow-hidden"
              >
                <div className="absolute bottom-0 left-0 w-6 h-6 bg-black group-hover:bg-white transition-colors" style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}></div>
                <ShoppingCart className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" />
                <span className="relative z-10">Add To Cart</span>
              </button>
              <button
                onClick={handleOrderNow}
                className="w-full flex-1 bg-black border-[2px] border-black text-white hover:bg-gray-800 font-bold py-3 px-6 rounded-md transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] text-center h-[48px] flex items-center justify-center"
              >
                অর্ডার করুন
              </button>
            </div>
          </div>

          {/* Call for order box */}
          <div className="border-[2px] border-dashed border-border-color rounded-md p-3 text-center mb-3">
            <p className="text-black font-bold text-sm mb-2">এই পণ্য সম্পর্কে প্রশ্ন আছে? অনুগ্রহপূর্বক কল করুন:</p>
            <div className="flex flex-col gap-1">
              {settings?.call_for_order?.split(' ').map((phone: string, idx: number) => {
                const trimmedPhone = phone.trim();
                if (!trimmedPhone) return null;
                return (
                  <a
                    key={idx}
                    href={`tel:${trimmedPhone}`}
                    className="flex items-center justify-center gap-2 text-lg font-bold hover:opacity-80 transition-opacity"
                  >
                    <Phone className="w-5 h-5" />
                    <span>{trimmedPhone}</span>
                  </a>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-3">
            {/* WhatsApp Button */}
            {settings?.company?.whatsapp && (
              <div className="flex justify-center">
                <a
                  href={`https://wa.me/${settings.company.whatsapp.replace(/\+/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-2 px-8 rounded-md flex items-center gap-2.5 transition-all hover:shadow-lg active:scale-95"
                >
                  <WhatsAppIcon className="w-5 h-5 fill-white" />
                  <span>WhatsApp</span>
                </a>
              </div>
            )}
            {/* Messenger Button */}
            {settings?.company?.messenger && (
              <div className="flex justify-center">
                <a
                  href={settings.company.messenger}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#0084FF] hover:bg-[#0073E6] text-white font-bold py-2 px-8 rounded-md flex items-center gap-2.5 transition-all hover:shadow-lg active:scale-95"
                >
                  <MessengerIcon className="w-5 h-5 fill-white" />
                  <span>Messenger</span>
                </a>
              </div>
            )}
          </div>

          {/* Categories Section */}
          <div className="flex items-center gap-4 text-sm text-muted-text mb-6 border border-border-color p-4 rounded-md">
            <span className="font-bold text-black">Categories: </span>
            <div className="flex flex-wrap gap-2">
              {product.categories?.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                  className="bg-primary text-white px-2.5 py-1 rounded text-xs font-bold hover:bg-primary-dark transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
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
              <div className="text-sm text-dark" dangerouslySetInnerHTML={{ __html: product.description || "This exclusive dress is designed to give you a premium and elegant look. Made from high-quality materials to ensure maximum comfort and durability." }} />
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
              <div
                className="text-sm text-muted-text"
                dangerouslySetInnerHTML={{ __html: product.deliveryText || "We offer a 3-day return policy for unused and unwashed products with all original tags intact. Please contact our support team for any return queries." }}
              />
            </AccordionItem>

            <AccordionItem
              title={`Customer Reviews (${product.reviewsCount})`}
              icon={<MessageSquare className="w-4 h-4" />}
              isOpen={activeAccordion === "reviews"}
              onClick={() => setActiveAccordion(activeAccordion === "reviews" ? "" : "reviews")}
            >
              <div className="space-y-6">
                {/* Review List */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-sm text-black">{review.user_name}</span>
                          <span className="text-[10px] text-muted-text">{review.created_at}</span>
                        </div>
                        <div className="flex gap-0.5 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                          ))}
                        </div>
                        <p className="text-sm text-muted-text leading-relaxed">&quot;{review.review}&quot;</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-text text-center py-4">No reviews yet. Be the first to review!</p>
                  )}

                  {hasMoreReviews && (
                    <div className="pt-2 text-center">
                      <button
                        onClick={loadMoreReviews}
                        disabled={loadingMoreReviews}
                        className="text-xs font-bold text-primary hover:underline transition-all disabled:text-muted-text"
                      >
                        {loadingMoreReviews ? "Loading..." : "Load More Reviews"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Review Form */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="font-bold text-sm text-black mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    Write a Review
                  </h4>

                  {reviewMessage.text && (
                    <div className={`p-3 rounded-md text-xs mb-4 flex items-center gap-2 ${reviewMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {reviewMessage.type === "success" ? <CheckCircle className="w-4 h-4" /> : null}
                      {reviewMessage.text}
                    </div>
                  )}

                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    <div className="grid md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Order ID"
                        required
                        className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                        value={reviewForm.order_id}
                        onChange={(e) => setReviewForm({ ...reviewForm, order_id: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Your Name"
                        required
                        className="bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                        value={reviewForm.name}
                        onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        required
                        className="bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                        value={reviewForm.phone}
                        onChange={(e) => setReviewForm({ ...reviewForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-4 py-1">
                      <span className="text-sm font-medium text-black">Rating:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            className="focus:outline-none transition-transform active:scale-125"
                          >
                            <Star className={`w-5 h-5 ${star <= reviewForm.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      placeholder="Share your experience..."
                      required
                      rows={3}
                      className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                      value={reviewForm.review}
                      onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                    />
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full bg-black text-white font-bold py-2.5 rounded hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                    >
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                </div>
              </div>
            </AccordionItem>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-[72px] left-0 right-0 bg-white border-t border-border-color p-2 px-3 z-40 flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">

        {/* Left Side: Thumbnail, Price, Qty */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-12 bg-gray-100 rounded relative overflow-hidden border border-border-color shrink-0">
            <Image src={product.image} alt={product.name || "Product"} fill sizes="40px" className="object-cover" priority={true} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[13px] text-primary leading-tight">{displaySalePrice} Tk</span>
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

      {/* Related Products — lazy loaded via intersection observer */}
      <LazyRelatedProducts slug={slug} />
    </div>
  );
}

// Lazily fetches and renders related products only when the placeholder scrolls
// into view. This keeps the initial product render fast (1 API call) and avoids
// loading the related-products API + their images until the user actually
// scrolls toward them.
function LazyRelatedProducts({ slug }: { slug: string }) {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasFetched) {
          setLoadingRelated(true);
          getRelatedProducts(slug)
            .then((data) => setRelatedProducts(data || []))
            .catch((err) => console.error("Failed to fetch related products:", err))
            .finally(() => {
              setLoadingRelated(false);
              setHasFetched(true);
            });
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [slug, hasFetched]);

  return (
    <div ref={sentinelRef} className="mt-8 min-h-[200px]">
      {relatedProducts.length > 0 ? (
        <>
          <div className="mb-8 relative">
            <h2 className="text-xl lg:text-2xl font-bold text-black border-l-4 border-primary pl-3">
              <span className="text-primary text-xs tracking-wider block mb-1 uppercase">PRODUCTS</span>
              Related Product
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
            {relatedProducts.slice(0, 5).map((related, idx) => (
              <ProductCard key={related.id} product={related} priority={idx < 4} />
            ))}
          </div>
        </>
      ) : loadingRelated ? (
        <div>
          <div className="mb-8 h-7 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg aspect-[4/5] animate-pulse" />
            ))}
          </div>
        </div>
      ) : null}
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
