"use client";

import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-light-bg pt-16 pb-20 lg:pb-0">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Column 1 */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="text-primary font-bold text-3xl flex items-center gap-1 tracking-tight">
                <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center text-white">
                  <span className="text-2xl">S</span>
                </div>
                STYLON
              </div>
            </Link>
            <p className="text-muted-text text-sm leading-relaxed">
              Stylon is an Online Shop in BD. We provide high quality dress & Jewellery always. leather wallet, shoes, belts, parces, topi, rumal, perfumes etc.
            </p>
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white mt-4">
              <Mail className="w-5 h-5" />
            </div>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-black">Contact Us</h3>
            <ul className="space-y-4 text-sm text-black">
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4" />
                +88 01741-476000
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4" />
                stylonbd@gmail.com
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4" />
                +88 01741-476000
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1" />
                Mirpur, Dhaka, Bangladesh
              </li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-black">Quick Links</h3>
            <ul className="space-y-3 text-sm text-black">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors">Shop</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Privacy & Policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-black">Let's Connect</h3>
            <button className="bg-primary hover:bg-primary-dark transition-colors text-white font-medium py-2.5 px-6 rounded text-sm w-fit">
              Join Our Facebook Group
            </button>
          </div>

        </div>
      </div>
      
      {/* Bottom Purple Strip */}
      <div className="bg-primary text-white text-center py-4 text-xs">
        <p>© 2026 Stylon | Developed By Service Key.</p>
      </div>
    </footer>
  );
}
