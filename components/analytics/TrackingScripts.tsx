'use client';

import Script from 'next/script';

interface TrackingScriptsProps {
  /** Google Tag Manager container ID, e.g. "GTM-XXXXXXX". Empty/undefined = not rendered. */
  gtmId?: string;
  /**
   * Facebook Pixel ID(s). Laravel admin UI stores this as a space-separated
   * string (see `resources/views/admin/settings/analytics.blade.php`). Each ID
   * is initialised separately so all pixels receive PageView.
   * Empty/undefined = not rendered.
   */
  pixelIds?: string;
}

/**
 * Facebook Pixel + Google Tag Manager tracking scripts.
 * Only renders when IDs are provided from the backend settings.
 * Uses `afterInteractive` strategy (recommended by Next.js for analytics/tag managers).
 */
export function TrackingScripts({ gtmId, pixelIds }: TrackingScriptsProps) {
  console.log('TrackingScripts');
  const cleanGtmId = gtmId?.trim();
  console.log('cleanGtmId', cleanGtmId);

  // Split the Laravel-stored space-separated string into individual pixel IDs,
  // trimming whitespace and dropping empties. e.g. "123 456  789" -> ["123", "456", "789"]
  const cleanPixelIds = (pixelIds ?? '')
    .split(/\s+/)
    .map((id) => id.trim())
    .filter(Boolean);
  console.log('cleanPixelIds', cleanPixelIds);

  const hasGtm = Boolean(cleanGtmId);
  const hasPixel = cleanPixelIds.length > 0;
  console.log('hasGtm', hasGtm);
  console.log('hasPixel', hasPixel);

  if (!hasGtm && !hasPixel) {
    console.log('no tracking scripts');
    return null;
  }

  console.log('loading tracking scripts', hasGtm, cleanGtmId, hasPixel, cleanPixelIds);

  return (
    <>
      {/* Google Tag Manager */}
      {hasGtm && cleanGtmId && (
        <>
          <Script
            id="gtm-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${cleanGtmId}');
              `,
            }}
          />
          {/* NoScript fallback for GTM */}
          <noscript
            dangerouslySetInnerHTML={{
              __html: `<iframe
                src="https://www.googletagmanager.com/ns.html?id=${cleanGtmId}"
                height="0"
                width="0"
                style="display:none;visibility:hidden"
              ></iframe>`,
            }}
          />
        </>
      )}

      {/* Facebook Pixel — one snippet, one <noscript> per pixel ID */}
      {hasPixel && (
        <>
          <Script
            id="fb-pixel-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                ${cleanPixelIds.map((id) => `fbq('init', '${id}');`).join('\n                ')}
                fbq('track', 'PageView');
              `,
            }}
          />
          {/* One <noscript> fallback per pixel — each pixel must register PageView separately */}
          {cleanPixelIds.map((id) => (
            <noscript
              key={id}
              dangerouslySetInnerHTML={{
                __html: `<img
                  height="1"
                  width="1"
                  style="display:none"
                  src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1"
                />`,
              }}
            />
          ))}
        </>
      )}
    </>
  );
}
