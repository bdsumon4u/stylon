import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { FloatingWidgets } from "@/components/layout/FloatingWidgets";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { OrderModalGlobal } from "@/components/checkout/OrderModalGlobal";
import { TrackingScripts } from "@/components/analytics/TrackingScripts";
import { getSettings, getMediaUrl } from "@/lib/api";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const defaultTitle = "Online Fashion Shop";
  const defaultDesc = "Quality fashion and apparel.";
  let settings: any = null;
  try {
    settings = await getSettings();
  } catch {
    settings = null;
  }

  const faviconPath = settings?.logo?.favicon || settings?.logo?.desktop;
  const faviconUrl = faviconPath ? getMediaUrl(faviconPath) : "/favicon.ico";

  return {
    title: settings?.company?.name || defaultTitle,
    description: settings?.scroll_text || defaultDesc,
    icons: {
      icon: [faviconUrl],
      shortcut: [faviconUrl],
      apple: [faviconUrl],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch settings on the server to prevent initial logo flash on client
  let settings = null;
  try {
    settings = await getSettings();
  } catch (error) {
    console.error("Failed to fetch settings on server:", error);
  }

  // Preload the LCP logo + warm up the media host.
  const desktopLogo = settings?.logo?.desktop ? getMediaUrl(settings.logo.desktop) : null;
  const mobileLogo  = settings?.logo?.mobile  ? getMediaUrl(settings.logo.mobile)  : null;
  const mediaOrigin = (() => {
    try {
      return desktopLogo ? new URL(desktopLogo).origin : null;
    } catch {
      return null;
    }
  })();

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Warm up the connection to the media host (saves DNS + TLS time on first image). */}
        {mediaOrigin && (
          <>
            <link rel="preconnect" href={mediaOrigin} crossOrigin="" />
            <link rel="dns-prefetch" href={mediaOrigin} />
          </>
        )}
        {/* Preload the LCP logo so the browser starts fetching before React mounts. */}
        {desktopLogo && (
          <link
            rel="preload"
            as="image"
            href={desktopLogo}
            fetchPriority="high"
          />
        )}
        {mobileLogo && mobileLogo !== desktopLogo && (
          <link
            rel="preload"
            as="image"
            href={mobileLogo}
            fetchPriority="high"
          />
        )}
      </head>
      <body className="min-h-full flex flex-col font-sans bg-light-bg text-black pb-16 lg:pb-0" suppressHydrationWarning>
        <Toaster position="top-right" richColors closeButton />
        <TrackingScripts gtmId={settings?.gtm_id} pixelIds={settings?.pixel_ids} />
        <Header initialSettings={settings} />
        <main className="flex-1">{children}</main>
        <Footer initialSettings={settings} />
        <FloatingWidgets />
        <MobileBottomNav />
        <CartDrawer />
        <OrderModalGlobal />
      </body>
    </html>
  );
}
