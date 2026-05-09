"use client";

import { useCartStore } from "@/store/cart";
import { OrderModal } from "./OrderModal";

export function OrderModalGlobal() {
  const { isOrderModalOpen, setOrderModalOpen } = useCartStore();

  return (
    <OrderModal 
      isOpen={isOrderModalOpen} 
      onClose={() => setOrderModalOpen(false)} 
    />
  );
}
