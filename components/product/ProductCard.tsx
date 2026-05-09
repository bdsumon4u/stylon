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

  const handleOrderNow = () => {
    addItem(product, 1);
    setOrderModalOpen(true);
  };

  return (
    <div className="bg-white rounded-[10px] border border-border-color shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col group h-full">
      {/* Image Container */}
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/5] bg-[#f8f8f8] overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
        />
        {/* Discount Badge */}
        {product.discountPercentage && (
          <div className="absolute top-2 right-2 bg-sale-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
            {product.discountPercentage}% Off
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <Link href={`/products/${product.slug}`} className="block mb-1">
          <h3 className="text-black font-semibold text-[13px] leading-[1.3] line-clamp-2 text-center group-hover:text-primary transition-colors h-[34px]">
            {product.name}
          </h3>
        </Link>
        
        <div className="mt-auto flex flex-col items-center gap-1.5 pt-2">
          {/* Pricing */}
          <div className="flex items-center justify-center gap-2 text-sm w-full">
            {product.salePrice ? (
              <>
                <span className="text-sale-red line-through font-medium text-[13px]">{product.regularPrice} Tk</span>
                <span className="text-black font-bold text-[14px]">{product.salePrice} Tk</span>
              </>
            ) : (
              <span className="text-black font-bold text-[14px]">{product.regularPrice} Tk</span>
            )}
          </div>

          {/* Action Button */}
          <button 
            onClick={handleOrderNow}
            className="w-full bg-black text-white text-[13px] font-medium py-1.5 rounded flex items-center justify-center hover:bg-primary transition-colors"
          >
            অর্ডার করুন
          </button>
        </div>
      </div>
    </div>
  );
}
