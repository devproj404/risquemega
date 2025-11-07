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

  // Auto-complete fallback for pages that don't manually control progress
  useEffect(() => {
    // Wait 2 seconds after route change
    // This gives pages time to take manual control (like post page)
    // For simple pages, this ensures the bar completes
    // NProgress.done() is idempotent - safe to call multiple times
    const fallbackTimer = setTimeout(() => {
      NProgress.done();
    }, 2000);

    return () => clearTimeout(fallbackTimer);
  }, [pathname, searchParams]);

  // Intercept all link clicks to start progress
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href && !anchor.target) {
        const url = new URL(anchor.href);
        const currentUrl = new URL(window.location.href);

        // Only show progress for internal navigation
        if (url.host === currentUrl.host && url.pathname !== currentUrl.pathname) {
          NProgress.start();
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}
