/**
 * Session storage helpers for persisting order data between the checkout flow
 * and the standalone /thank-you page. We use sessionStorage so the data is
 * scoped to the current browser tab and cleared when the tab closes — this
 * avoids stale "last order" data leaking across visits.
 */

const ORDER_KEY = "thank-you-order";

export interface ThankYouOrderItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
  price: number; // unit price (sale or regular)
  subtotal: number; // price * quantity
}

export interface ThankYouOrder {
  orderId: number | string;
  total: number;
  subtotal: number;
  shipping: number;
  shippingArea: "Inside Dhaka" | "Outside Dhaka";
  paymentMethod: string; // e.g. "Cash on delivery"
  customer: {
    name: string;
    phone: string;
    address: string;
    note?: string;
  };
  items: ThankYouOrderItem[];
  placedAt: string; // ISO timestamp
  /** Server response for future use. */
  raw?: unknown;
}

export function saveThankYouOrder(order: ThankYouOrder): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch (err) {
    console.error("Failed to persist order to sessionStorage:", err);
  }
}

export function getThankYouOrder(): ThankYouOrder | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(ORDER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ThankYouOrder;
  } catch (err) {
    console.error("Failed to read order from sessionStorage:", err);
    return null;
  }
}

export function clearThankYouOrder(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ORDER_KEY);
  } catch (err) {
    console.error("Failed to clear order from sessionStorage:", err);
  }
}

/**
 * Build a ThankYouOrder shape from the data available at checkout time. This
 * keeps the checkout code free of imports from /thank-you-specific code.
 */
export function buildThankYouOrder(args: {
  orderId: number | string;
  total: number;
  items: ThankYouOrderItem[];
  customer: ThankYouOrder["customer"];
  shipping: number;
  shippingArea: ThankYouOrder["shippingArea"];
  paymentMethod?: string;
  raw?: unknown;
}): ThankYouOrder {
  const subtotal = args.items.reduce((sum, item) => sum + item.subtotal, 0);
  return {
    orderId: args.orderId,
    total: args.total,
    subtotal,
    shipping: args.shipping,
    shippingArea: args.shippingArea,
    paymentMethod: args.paymentMethod ?? "Cash on delivery",
    customer: args.customer,
    items: args.items,
    placedAt: new Date().toISOString(),
    raw: args.raw,
  };
}
