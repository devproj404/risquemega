'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

NProgress.configure({
  showSpinner: false,
  trickle: true,
  trickleSpeed: 300,
  minimum: 0.08,
  easing: 'ease',
  speed: 400,
});

export function LoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Auto-complete on route change
  useEffect(() => {
    // For regular pages: complete quickly (300ms)
    // For post pages: they will take control with NProgress.set(0.5) before this fires
    const timer = setTimeout(() => {
      NProgress.done();
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Intercept all link clicks to start progress
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href && !anchor.target) {
        try {
          const url = new URL(anchor.href);
          const currentUrl = new URL(window.location.href);

          // Only show progress for internal navigation
          if (url.host === currentUrl.host && url.pathname !== currentUrl.pathname) {
            NProgress.start();
          }
        } catch (e) {
          // Invalid URL, ignore
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}
