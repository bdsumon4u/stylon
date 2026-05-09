import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  isOrderModalOpen: boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleDrawer: () => void;
  setDrawerOpen: (isOpen: boolean) => void;
  setOrderModalOpen: (isOpen: boolean) => void;
  getTotalItems: () => void;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      isOrderModalOpen: false,
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id
          );
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
              isDrawerOpen: true, // open drawer on add
            };
          }
          return {
            items: [...state.items, { product, quantity }],
            isDrawerOpen: true,
          };
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },
      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
      setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
      setOrderModalOpen: (isOpen) => set({ isOrderModalOpen: isOpen }),
      getTotalItems: () => {
        // Just calculating on the fly is usually fine, but if we need a getter
        return; // Actually, state.items.length or reduce
      },
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) =>
            total + (item.product.salePrice || item.product.regularPrice) * item.quantity,
          0
        );
      },
    }),
    {
      name: "stylon-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
