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

  // Auto-complete fallback on route change
  useEffect(() => {
    // Check if current page is a post page (manual control)
    const isPostPage = pathname.startsWith('/post/');

    if (isPostPage) {
      // Post pages control their own progress (0% → 50% → 100%)
      // Don't auto-complete
      return;
    }

    // For other pages: auto-complete after 1 second
    const timer = setTimeout(() => {
      NProgress.done();
    }, 1000);

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
