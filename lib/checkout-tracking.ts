/**
 * Checkout progress tracker — saves partial form data via Beacon so that if
 * a user navigates away or closes the tab mid-checkout, the data is preserved
 * server-side for later recovery or analytics.
 *
 * Uses multiple events for maximum coverage across browsers:
 * - `pagehide` fires when the page is discarded (tab switch, close, bfcache)
 * - `beforeunload` fires on navigation/close (some browsers)
 * - `visibilitychange` + `document.willBeDiscarded` (Page Lifecycle API)
 * - `blur` fires when the window loses focus (tab switch, alt+tab)
 * - `data-place-order` button click fires before form submission
 */

import { useCartStore } from "@/store/cart";

let handlerAttached = false;

function getFieldValue(selector: string) {
  return document.querySelector<HTMLInputElement>(selector)?.value ?? "";
}

function sendCheckoutProgress() {
  const payload = {
    name: getFieldValue('[name="checkout-name"]'),
    phone: getFieldValue('[name="checkout-phone"]'),
    address: getFieldValue('[name="checkout-address"]'),
    note: getFieldValue('[name="checkout-note"]'),
    items: useCartStore.getState().items.map((item) => ({
      id: item.product.id,
      quantity: item.quantity,
      variation_id: item.variation?.id || null,
    })),
  };

  const body = JSON.stringify(payload);
  const blob = new Blob([body], { type: "text/plain" });
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/storefront";
  const url = process.env.NEXT_PUBLIC_BEACON_URL || `${apiBase}/save-checkout-progress`;

  console.log('beacon url: ' + url);
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, blob);
  } else {
    fetch(url, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => { });
  }
}

function registerCheckoutInteractions() {
  if (handlerAttached) return;
  handlerAttached = true;

  // pagehide — fires when the page is removed from history (bfcache, tab switch, close)
  // This is the most reliable event for tab-switch tracking in modern browsers.
  window.addEventListener("pagehide", sendCheckoutProgress, { passive: true });

  // beforeunload — fallback for older browsers / some edge cases
  window.addEventListener("beforeunload", sendCheckoutProgress, { passive: true });

  // visibilitychange + willBeDiscarded — Page Lifecycle API
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      // Only send if the page is about to be discarded (not just minimizing)
      if ((document as any).willBeDiscarded) {
        sendCheckoutProgress();
      } else {
        // Fallback: send anyway — the server can deduplicate
        sendCheckoutProgress();
      }
    }
  });

  // blur — fires when the window loses focus (alt+tab, window switch)
  window.addEventListener("blur", sendCheckoutProgress, { passive: true });

  // Save when the user clicks the place-order button
  document.querySelectorAll("[data-place-order]").forEach((button) => {
    const handler = () => {
      const btn = button as HTMLButtonElement;
      if (btn.classList.contains("__checkout-disabled")) return;
      sendCheckoutProgress();
      btn.textContent = "Processing..";
      btn.style.opacity = "1";
      btn.classList.add("__checkout-disabled");
    };
    button.addEventListener("click", handler);
  });
}

export function useCheckoutTracker() {
  return { registerCheckoutInteractions, sendCheckoutProgress };
}

// Auto-register when DOM is ready (fallback for SSR / Next.js hydration)
if (typeof document !== "undefined") {
  const boot = () => queueMicrotask(registerCheckoutInteractions);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
}
