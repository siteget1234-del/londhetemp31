'use client';

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/webVitals';

export default function LayoutClient({ children }) {
  useEffect(() => {
    // Report Web Vitals
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
        onCLS(reportWebVitals);
        onFID(reportWebVitals);
        onFCP(reportWebVitals);
        onLCP(reportWebVitals);
        onTTFB(reportWebVitals);
      });
    }

    // Preload critical resources
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Preconnect to external domains
        const preconnectDomains = [
          'https://customer-assets.emergentagent.com',
          'https://res.cloudinary.com',
        ];

        preconnectDomains.forEach(domain => {
          const link = document.createElement('link');
          link.rel = 'preconnect';
          link.href = domain;
          document.head.appendChild(link);
        });
      });
    }
  }, []);

  return <>{children}</>;
}
