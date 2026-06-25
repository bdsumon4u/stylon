"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { FacebookIcon, TwitterIcon, InstagramIcon, YoutubeIcon } from "@/components/icons/BrandIcons";
import { getMediaUrl, getMenus } from "@/lib/api";
import { useSettings } from "@/hooks/useSettings";
import { Menu as MenuType } from "@/types";

export function Footer({ initialSettings }: { initialSettings?: any }) {
  const settings = useSettings(initialSettings);
  const [menus, setMenus] = useState<MenuType[]>([]);

  useEffect(() => {
    getMenus().then(setMenus).catch(console.error);
  }, []);

  const quickLinks = menus.find(m => m.slug === "quick-links");

  return (
    <footer className="bg-light-bg pt-16 pb-20 lg:pb-0">
      <div className="max-w-[1320px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Column 1 */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 mb-4">
              {settings?.logo ? (
                <div className="relative w-40 h-12">
                  <Image
                    src={getMediaUrl(settings.logo.desktop || settings.logo.mobile)}
                    alt={settings?.company?.name || "Stylon"}
                    fill
                    sizes="160px"
                    quality={90}
                    className="object-contain object-left"
                  />
                </div>
              ) : (
                <div className="text-primary font-bold text-3xl flex items-center gap-1 tracking-tight">
                  <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center text-white">
                    <span className="text-2xl">{(settings?.company?.name?.[0] || "B").toUpperCase()}</span>
                  </div>
                  {settings?.company?.name || "BRAND"}
                </div>
              )}
            </Link>
            <p className="text-muted-text text-sm leading-relaxed">
              {settings?.company?.description || ""}
            </p>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-black">Contact Us</h3>
            <ul className="space-y-4 text-sm text-black">
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4" />
                {settings?.company?.phone || "+88 01741-476000"}
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4" />
                {settings?.company?.email || ""}
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1" />
                {settings?.company?.address || "Mirpur, Dhaka, Bangladesh"}
              </li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-black">Quick Links</h3>
            <ul className="space-y-3 text-sm text-black">
              {quickLinks ? (
                quickLinks.items.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="hover:text-primary transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
                  <li><Link href="/shop" className="hover:text-primary transition-colors">Shop</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Contact Us</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Privacy & Policy</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-6 text-black">Let's Connect</h3>
            <div className="flex flex-col gap-6">
              {settings?.social?.facebook_group?.link && (
                <a 
                  href={settings.social.facebook_group.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary hover:bg-primary-dark transition-colors text-white font-medium py-2.5 px-6 rounded text-sm w-fit text-center"
                >
                  Join Our Facebook Group
                </a>
              )}
              
              <div>
                <p className="text-sm font-bold text-black mb-3">Follow us on social networks</p>
                <div className="flex items-center flex-wrap gap-2.5">
                  {settings?.company?.phone && (
                    <a href={`tel:${settings.company.phone}`} className="w-9 h-9 rounded-full bg-[#007bff] flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-sm" title="Call Us">
                      <Phone className="w-4.5 h-4.5" />
                    </a>
                  )}
                  {settings?.company?.email && (
                    <a href={`mailto:${settings.company.email}`} className="w-9 h-9 rounded-full bg-[#6c757d] flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-sm" title="Email Us">
                      <Mail className="w-4.5 h-4.5" />
                    </a>
                  )}
                  {settings?.social?.facebook?.link && (
                    <a href={settings.social.facebook.link} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#3b5998] flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-sm" title="Facebook">
                      <FacebookIcon className="w-4.5 h-4.5" />
                    </a>
                  )}
                  {settings?.social?.twitter?.link && (
                    <a href={settings.social.twitter.link} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#1da1f2] flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-sm" title="Twitter">
                      <TwitterIcon className="w-4.5 h-4.5" />
                    </a>
                  )}
                  {settings?.social?.instagram?.link && (
                    <a href={settings.social.instagram.link} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#e1306c] flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-sm" title="Instagram">
                      <InstagramIcon className="w-4.5 h-4.5" />
                    </a>
                  )}
                  {settings?.social?.youtube?.link && (
                    <a href={settings.social.youtube.link} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#ff0000] flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-sm" title="YouTube">
                      <YoutubeIcon className="w-4.5 h-4.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Bottom Purple Strip */}
      <div className="bg-primary text-white text-center py-4 text-xs">
        <p>© 2026 {settings?.company?.name || ""} | Developed By Service Key.</p>
      </div>
    </footer>
  );
}
