'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSettings } from '@/providers/SettingsProvider';
import { getMediaUrl } from '@/lib/api';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function Logo({ className, width = 150, height = 50, priority = true }: LogoProps) {
  const settings = useSettings();
  const [logoSrc, setLogoSrc] = useState<string | null>(() => {
    // Try to get logo from cache immediately (synchronous)
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('stylon_settings_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          const logoPath = parsed.data?.logo?.desktop || parsed.data?.logo?.mobile;
          if (logoPath) {
            return getMediaUrl(logoPath);
          }
        }
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    const logoPath = settings?.logo?.desktop || settings?.logo?.mobile;
    if (logoPath) {
      const newLogoSrc = getMediaUrl(logoPath);
      if (newLogoSrc !== logoSrc) {
        setLogoSrc(newLogoSrc);
      }
    }
  }, [settings?.logo, logoSrc]);

  // If no logo at all (first visit, no cache), show site name or minimal fallback
  if (!logoSrc) {
    return (
      <div className={className}>
        <span className="text-xl font-bold">{settings?.company?.name || settings?.site_name || 'Loading...'}</span>
      </div>
    );
  }

  return (
    <Image
      src={logoSrc}
      alt={settings?.company?.name || settings?.site_name || 'Logo'}
      width={width}
      height={height}
      className={className}
      priority={priority}
      unoptimized // Use this if logo is from external URL
    />
  );
}
