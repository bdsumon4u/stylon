import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { useCartStore } from "@/store/cart";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addItem, setOrderModalOpen } = useCartStore();

  const handleOrderNow = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the product page when clicking the button
    addItem(product, 1);
    setOrderModalOpen(true);
  };

  // Use real rating and review count from the product object
  const rating = product.averageRating > 0 ? product.averageRating.toFixed(1) : "5.0";
  const reviewsCount = product.reviewsCount || 0;
  
  // Deterministic fake sold count as requested
  const numericId = parseInt(product.id) || 1234;
  const soldCount = (numericId % 500) + 100;

  return (
    <div className="bg-[#f4f7fb] rounded-lg overflow-hidden flex flex-col group h-full transition-all hover:shadow-md">
      {/* Image Container */}
      <Link href={`/products/${product.slug}`} prefetch={true} className="relative block aspect-square bg-white overflow-hidden">
        <Image
          src={product.image}
          alt={product.name || "Product Image"}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
        />
        
        {/* Discount Badge */}
        {product.discountPercentage && product.discountPercentage > 0 ? (
          <div className="absolute top-2 right-2 bg-white text-[#ff4b4b] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
            {product.discountPercentage}% Off
          </div>
        ) : null}

        {/* Bottom Overlay Bar (Rating & Sold) */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#fef8e6]/90 px-2 py-1 flex justify-between items-center z-10 backdrop-blur-sm">
          <div className="flex items-center gap-1 text-[#6b7280] text-[11px] font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-[#9ca3af]">
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.006z" clipRule="evenodd" />
            </svg>
            {rating} ({reviewsCount})
          </div>
          <div className="text-[#15803d] text-[11px] font-bold">
            {soldCount} Sold
          </div>
        </div>
      </Link>

      {/* Content */}
      <Link href={`/products/${product.slug}`} prefetch={true} className="p-3 pb-4 flex flex-col flex-1">
        <h3 className="text-gray-900 font-medium text-[13px] md:text-[14.5px] leading-snug line-clamp-2 h-[40px] group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        {/* SKU (Optional) */}
        {product.id && (
          <div className="text-[#6b7280] text-[11px] mt-1 font-medium hidden md:block">
            Sku: {product.id}
          </div>
        )}
        
        <div className="mt-auto pt-2 flex flex-col gap-2.5">
          {/* Pricing */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.salePrice && product.salePrice < product.regularPrice ? (
              <>
                <span className="text-[#ff4b4b] line-through font-medium text-[13px]">{product.regularPrice} Tk</span>
                <span className="text-black font-bold text-[16px]">{product.salePrice} Tk</span>
                <span className="bg-black text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded-full ml-auto hidden md:inline-block">
                  Save {product.regularPrice - product.salePrice}
                </span>
              </>
            ) : (
              <span className="text-black font-bold text-[16px]">{product.regularPrice} Tk</span>
            )}
          </div>

          {/* Action Button */}
          <button 
            onClick={handleOrderNow}
            className="w-full bg-[#111111] text-white text-[14px] font-bold py-2 rounded flex items-center justify-center hover:bg-gray-800 transition-colors"
          >
            অর্ডার করুন
          </button>
        </div>
      </Link>
    </div>
  );
}
