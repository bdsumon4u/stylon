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
  const logoPath = settings?.logo?.desktop || settings?.logo?.mobile;
  const initialLogoSrc = logoPath ? getMediaUrl(logoPath) : null;
  const [logoSrc, setLogoSrc] = useState<string | null>(initialLogoSrc);

  useEffect(() => {
    const currentLogoPath = settings?.logo?.desktop || settings?.logo?.mobile;
    if (currentLogoPath) {
      const newLogoSrc = getMediaUrl(currentLogoPath);
      if (newLogoSrc !== logoSrc) {
        setLogoSrc(newLogoSrc);
      }
    } else {
      setLogoSrc(null);
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
