"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";

function LoadingBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // When the route actually changes, the page has loaded — hide the bar.
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  // Listen for clicks on any <a> tags (Next.js <Link> renders as <a>).
  // When a navigation link is clicked, show the progress bar. It stays
  // visible until the useEffect above fires with the new route.
  const handleClick = useCallback((e: MouseEvent) => {
    const anchor = (e.target as HTMLElement)?.closest?.("a");
    if (!anchor) return;

    // Ignore new-tab clicks, external links, hash-only, and download links
    const href = anchor.getAttribute("href");
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      anchor.target === "_blank" ||
      anchor.hasAttribute("download")
    ) {
      return;
    }

    // Only show for actual navigations (not same-page hash changes)
    const current = pathname + (searchParams.toString() ? `?${searchParams}` : "");
    const dest = href.split("?")[0];
    if (dest === pathname && !href.includes("?")) return;

    setIsLoading(true);
  }, [pathname, searchParams]);

  useEffect(() => {
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [handleClick]);

  // Failsafe: if the bar is visible for more than 10s, something went wrong.
  useEffect(() => {
    if (!isLoading) return;
    const timeout = setTimeout(() => setIsLoading(false), 10000);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-primary transition-all ease-out"
        style={{
          width: isLoading ? "100%" : "0%",
          transitionDuration: isLoading ? "8000ms" : "300ms",
          opacity: isLoading ? 1 : 0,
        }}
      />
    </div>
  );
}

export function LoadingBar() {
  return (
    <Suspense fallback={null}>
      <LoadingBarInner />
    </Suspense>
  );
}
