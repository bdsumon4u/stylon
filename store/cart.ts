import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, ProductVariation } from "@/types";
import { toast } from "sonner";
import { trackAddToCart } from "@/lib/analytics";

export interface CartItem {
  product: Product;
  variation?: ProductVariation | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  isOrderModalOpen: boolean;
  isMobileMenuOpen: boolean;
  mobileActiveTab: "categories" | "menu";
  addItem: (product: Product, quantity?: number, variation?: ProductVariation | null) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  toggleDrawer: () => void;
  setDrawerOpen: (isOpen: boolean) => void;
  setOrderModalOpen: (isOpen: boolean) => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
  setMobileActiveTab: (tab: "categories" | "menu") => void;
  getTotalItems: () => void;
  getTotalPrice: () => number;
}

// Cart line identity: same product + same variation = same line
export function getCartLineId(productId: string, variationId?: string | null): string {
  return `${productId}__${variationId ?? "parent"}`;
}

// Display name for a cart line / product detail heading:
// "Product Name [Brown-C Cup]" when a variation is selected, otherwise
// just "Product Name". Mirrors Laravel's Product::varName accessor.
export function getDisplayName(productName: string, variationName?: string | null): string {
  if (!variationName) return productName;
  return `${productName} [${variationName}]`;
}

function linePrice(item: CartItem): number {
  const v = item.variation;
  if (v) {
    return v.salePrice ?? v.regularPrice;
  }
  return item.product.salePrice ?? item.product.regularPrice;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      isOrderModalOpen: false,
      isMobileMenuOpen: false,
      mobileActiveTab: "categories",
      addItem: (product, quantity = 1, variation = null) => {
        set((state) => {
          const lineId = getCartLineId(product.id, variation?.id);
          const existingItem = state.items.find(
            (item) => getCartLineId(item.product.id, item.variation?.id) === lineId
          );

          const displayName = getDisplayName(product.name, variation?.name);

          toast.success(`${displayName} added to cart`, {
            description: quantity > 1 ? `${quantity} items added` : undefined,
          });

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                getCartLineId(item.product.id, item.variation?.id) === lineId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
              isDrawerOpen: false,
            };
          }
          return {
            items: [...state.items, { product, variation, quantity }],
            isDrawerOpen: false,
          };
        });

        // Fire AddToCart event AFTER state is committed so window.fbq / dataLayer
        // see the latest value. SSR-safe: no-ops when pixel isn't loaded yet.
        trackAddToCart(product, quantity, variation);
      },
      removeItem: (lineId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => getCartLineId(item.product.id, item.variation?.id) !== lineId
          ),
        }));
      },
      updateQuantity: (lineId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            getCartLineId(item.product.id, item.variation?.id) === lineId
              ? { ...item, quantity }
              : item
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
      setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
      setOrderModalOpen: (isOpen) => set({ isOrderModalOpen: isOpen }),
      setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
      setMobileActiveTab: (tab) => set({ mobileActiveTab: tab }),
      getTotalItems: () => {
        // Just calculating on the fly is usually fine, but if we need a getter
        return; // Actually, state.items.length or reduce
      },
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + linePrice(item) * item.quantity,
          0
        );
      },
    }),
    {
      name: "shop-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
