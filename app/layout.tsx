import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { FloatingWidgets } from "@/components/layout/FloatingWidgets";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { OrderModalGlobal } from "@/components/checkout/OrderModalGlobal";
import { getSettings } from "@/lib/api";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const defaultTitle = "Stylonbd - Fashion Brand";
  const defaultDesc = "Specially designed ethnic wear like panjabi, pajama, kabli set, koty, sherowani etc.";
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/storefront', '') || "http://127.0.0.1:8000";

  try {
    const settings = await getSettings();
    const faviconPath = settings?.logo?.favicon || settings?.logo?.desktop;
    const faviconUrl = faviconPath 
      ? (faviconPath.startsWith('http') ? faviconPath : `${baseUrl}${faviconPath}`)
      : "/favicon.ico";
    
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch settings on the server to prevent initial logo flash on client
  let settings = null;
  try {
    settings = await getSettings();
    console.log(settings);
  } catch (error) {
    console.error("Failed to fetch settings on server:", error);
  }

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans bg-light-bg text-black pb-16 lg:pb-0" suppressHydrationWarning>
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
