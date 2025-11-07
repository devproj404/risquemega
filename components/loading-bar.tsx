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

  // Fallback: Complete progress after route change (pages can override by calling NProgress.start() again)
  useEffect(() => {
    // Small delay to allow pages to take over control if they want
    const timer = setTimeout(() => {
      NProgress.done();
    }, 100);

    return () => clearTimeout(timer);
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
