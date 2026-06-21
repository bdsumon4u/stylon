/**
 * Client-side analytics helpers for Facebook Pixel + Google Tag Manager.
 *
 * - SSR-safe: every call is guarded so it's a no-op on the server or before
 *   the pixel/GTM snippet has loaded.
 * - Mirrors what the Laravel backend fires server-side, so events show up
 *   identically in both Meta Events Manager and GTM Preview / GA4.
 * - The pixel base code is loaded by `components/analytics/TrackingScripts.tsx`
 *   via `next/script` with `strategy="afterInteractive"`, so by the time any
 *   of these helpers run in a React event handler, `window.fbq` and
 *   `window.dataLayer` are guaranteed to exist.
 */

// ─── Type declarations for globals injected by TrackingScripts ───────────────
type Fbq = (action: "track" | "init" | "trackCustom", eventName: string, params?: Record<string, unknown>) => void;
declare global {
  interface Window {
    fbq?: Fbq;
    dataLayer?: unknown[];
  }
}

// ─── Low-level helpers ──────────────────────────────────────────────────────

function firePixel(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  window.fbq("track", eventName, params);
}

function fireDataLayer(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!Array.isArray(window.dataLayer)) return;
  window.dataLayer.push(payload);
}

// ─── Pricing helper ─────────────────────────────────────────────────────────

import type { Product, ProductVariation } from "@/types";

interface ResolvedLine {
  id: string;
  name: string;
  price: number;
}

function resolveLinePrice(product: Product, variation?: ProductVariation | null): number {
  if (variation) return variation.salePrice ?? variation.regularPrice;
  return product.salePrice ?? product.regularPrice;
}

function buildItemName(product: Product, variation?: ProductVariation | null): string {
  if (variation?.name) return `${product.name} [${variation.name}]`;
  return product.name;
}

function resolveLine(product: Product, variation?: ProductVariation | null): ResolvedLine {
  return {
    id: variation?.id ?? product.id,
    name: buildItemName(product, variation),
    price: resolveLinePrice(product, variation),
  };
}

// ─── Standard events ─────────────────────────────────────────────────────────

/**
 * `AddToCart` — fired every time a product (or variation) is added to the cart,
 * even when the same line already exists. Matches Facebook's standard event:
 *   https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 *
 * Also pushes the same shape to GTM `dataLayer` so GTM/GA4 can pick it up
 * via the standard `add_to_cart` ecommerce event.
 */
export function trackAddToCart(
  product: Product,
  quantity: number,
  variation?: ProductVariation | null,
): void {
  const line = resolveLine(product, variation);
  const value = line.price * quantity;
  const slug = product.slug;
  const eventId = `add_to_cart_${line.id}_${Date.now()}`;

  firePixel("AddToCart", {
    content_ids: [line.id],
    content_name: line.name,
    content_type: "product",
    content_category: product.category,
    value,
    currency: "BDT",
    contents: [{ id: line.id, quantity }],
    num_items: quantity,
  });

  fireDataLayer({
    event: "add_to_cart",
    event_id: eventId,
    ecommerce: {
      currency: "BDT",
      value,
      items: [
        {
          item_id: line.id,
          item_name: line.name,
          item_category: product.category,
          item_variant: variation?.name ?? undefined,
          price: line.price,
          quantity,
          slug,
        },
      ],
    },
  });
}

/**
 * `InitiateCheckout` — fired when the user opens the order modal (or
 * lands on /checkout) with items in the cart.
 */
export function trackInitiateCheckout(
  items: Array<{ product: Product; variation?: ProductVariation | null; quantity: number }>,
  shippingValue: number,
  shippingArea: string,
): void {
  const value = items.reduce(
    (sum, item) => sum + resolveLinePrice(item.product, item.variation) * item.quantity,
    0,
  );
  const numItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const contentIds = items.map((item) => resolveLine(item.product, item.variation).id);

  firePixel("InitiateCheckout", {
    content_ids: contentIds,
    contents: items.map((item) => ({
      id: resolveLine(item.product, item.variation).id,
      quantity: item.quantity,
    })),
    num_items: numItems,
    value: value + shippingValue,
    currency: "BDT",
  });

  fireDataLayer({
    event: "begin_checkout",
    ecommerce: {
      currency: "BDT",
      value: value + shippingValue,
      shipping_value: shippingValue,
      shipping_area: shippingArea,
      items: items.map((item) => {
        const line = resolveLine(item.product, item.variation);
        return {
          item_id: line.id,
          item_name: line.name,
          item_category: item.product.category,
          item_variant: item.variation?.name ?? undefined,
          price: line.price,
          quantity: item.quantity,
          slug: item.product.slug,
        };
      }),
    },
  });
}

export interface PurchasePayload {
  orderId: string | number;
  total: number;
  shipping: number;
  shippingArea: "Inside Dhaka" | "Outside Dhaka";
  customer: {
    name: string;
    phone: string;
    address?: string;
    email?: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    category?: string;
  }>;
}

/**
 * `Purchase` — fired after `placeOrder()` resolves successfully.
 *
 * Customer data is split: name parts go into Facebook's advanced-matching
 * fields (fn, ln), phone is hashed client-side and passed as `ph`. Email is
 * optional (the form doesn't collect one).
 */
export function trackPurchase(payload: PurchasePayload): void {
  const { orderId, total, shipping, shippingArea, customer, items } = payload;

  // Split name into first/last for FB advanced matching (matches the Laravel
  // FacebookPixelService::createServerUserData logic).
  const nameParts = customer.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

  // Normalise phone to E.164-ish (Bangladesh numbers → +8801XXXXXXXXX).
  let phone = customer.phone.replace(/[^\d]/g, "");
  if (phone.startsWith("01")) phone = "+88" + phone;
  else if (phone.startsWith("8801")) phone = "+" + phone;
  else if (!phone.startsWith("+")) phone = "+" + phone;

  const userData: Record<string, unknown> = {
    fn: firstName.toLowerCase(),
    ...(lastName ? { ln: lastName.toLowerCase() } : {}),
    ...(customer.email ? { em: customer.email.toLowerCase() } : {}),
    ph: phone,
    external_id: orderId,
    client_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  };

  const customData: Record<string, unknown> = {
    content_ids: items.map((i) => i.id),
    contents: items.map((i) => ({ id: i.id, quantity: i.quantity })),
    content_type: "product",
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    currency: "BDT",
    value: total,
    shipping,
    shipping_area: shippingArea,
  };

  // FB Pixel — match Laravel: fire with userData + customData.
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    // The standard Pixel `track` only accepts customData; advanced matching is
    // usually done at init time. We push userData into dataLayer so GTM can
    // hash + forward it server-side if a Conversions API tag is configured.
    window.fbq("track", "Purchase", { ...customData, ...userData });
  }

  // GTM / GA4 — push to dataLayer with full customer data so the
  // GA4 / Google Ads conversion tags can pick it up.
  fireDataLayer({
    event: "purchase",
    ecommerce: {
      transaction_id: orderId,
      currency: "BDT",
      value: total,
      shipping,
      shipping_area: shippingArea,
      items: items.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        item_category: i.category ?? undefined,
        price: i.price,
        quantity: i.quantity,
      })),
    },
    customer: {
      name: customer.name,
      phone,
      email: customer.email,
      address: customer.address,
    },
  });
}
