import { useEffect, useRef, useState } from 'react';

interface UseLazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
}

/**
 * Custom hook for lazy loading images with Intersection Observer
 * Provides more control than native loading="lazy"
 *
 * @param options - Intersection Observer options
 * @returns [ref, isIntersecting] - Ref to attach to element and visibility state
 */
export function useLazyLoad<T extends HTMLElement = HTMLDivElement>(
  options: UseLazyLoadOptions = {}
): [React.RefObject<T>, boolean] {
  const {
    rootMargin = '50px', // Start loading 50px before element enters viewport
    threshold = 0.01,
  } = options;

  const ref = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // If Intersection Observer not supported, load immediately
    if (!('IntersectionObserver' in window)) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          // Once loaded, stop observing
          observer.unobserve(element);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  return [ref, isIntersecting];
}

/**
 * Hook specifically for lazy loading images
 * Returns the src to use (empty string until visible)
 *
 * @param src - The actual image source
 * @param options - Intersection Observer options
 * @returns [ref, imageSrc] - Ref and src to use
 */
export function useLazyImage<T extends HTMLElement = HTMLImageElement>(
  src: string,
  options: UseLazyLoadOptions = {}
): [React.RefObject<T>, string] {
  const [ref, isIntersecting] = useLazyLoad<T>(options);
  const [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    if (isIntersecting && src) {
      setImageSrc(src);
    }
  }, [isIntersecting, src]);

  return [ref, imageSrc];
}
