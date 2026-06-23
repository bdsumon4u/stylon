/**
 * Checkout progress tracker — saves partial form data via Beacon so that if
 * a user navigates away or closes the tab mid-checkout, the data is preserved
 * server-side for later recovery or analytics.
 *
 * Mirrors the Livewire pattern: sends name, phone, address on every change
 * and also on beforeunload / place-order click.
 */

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
  };

  const body = JSON.stringify(payload);
  const blob = new Blob([body], { type: "application/json" });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/save-checkout-progress", blob);
  } else {
    fetch("/save-checkout-progress", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  }
}

function registerCheckoutInteractions() {
  if (handlerAttached) return;
  handlerAttached = true;

  // Save on beforeunload (only safe on checkout pages)
  const beforeUnloadHandler = () => sendCheckoutProgress();
  window.addEventListener("beforeunload", beforeUnloadHandler, { passive: false });

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
