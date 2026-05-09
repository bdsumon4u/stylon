import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { FloatingWidgets } from "@/components/layout/FloatingWidgets";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { OrderModalGlobal } from "@/components/checkout/OrderModalGlobal";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stylonbd - Fashion Brand",
  description: "Specially designed ethnic wear like panjabi, pajama, kabli set, koty, sherowani etc.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans bg-light-bg text-black pb-16 lg:pb-0" suppressHydrationWarning>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <FloatingWidgets />
        <MobileBottomNav />
        <CartDrawer />
        <OrderModalGlobal />
      </body>
    </html>
  );
}
