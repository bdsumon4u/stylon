import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { FloatingWidgets } from "@/components/layout/FloatingWidgets";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { OrderModalGlobal } from "@/components/checkout/OrderModalGlobal";
import { getSettings, getMediaUrl } from "@/lib/api";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const defaultTitle = "Online Fashion Shop";
  const defaultDesc = "Quality fashion and apparel.";
  try {
    const settings = await getSettings();
    const faviconPath = settings?.logo?.favicon || settings?.logo?.desktop;
    const faviconUrl = faviconPath ? getMediaUrl(faviconPath) : "/favicon.ico";
    
    return {
      title: settings?.company?.name || defaultTitle,
      description: settings?.scroll_text || defaultDesc,
      icons: {
        icon: [
          { url: faviconUrl },
        ],
        shortcut: [faviconUrl],
        apple: [faviconUrl],
      },
    };
  } catch (error) {
    return {
      title: defaultTitle,
      description: defaultDesc,
      icons: {
        icon: "/favicon.ico",
      }
    };
  }
}

import { Toaster } from "sonner";

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

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans bg-light-bg text-black pb-16 lg:pb-0" suppressHydrationWarning>
        <Toaster position="top-right" richColors closeButton />
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
