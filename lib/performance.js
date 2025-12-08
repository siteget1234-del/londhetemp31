/**
 * Performance optimization utilities
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Debounce hook for search and input optimization
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

/**
 * Throttle hook for scroll and resize events
 * @param {Function} callback - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export function useThrottle(callback, delay) {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args) => {
      const now = Date.now();

      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    },
    [callback, delay]
  );
}

/**
 * Intersection Observer hook for lazy loading
 * @param {Object} options - IntersectionObserver options
 * @returns {Array} [ref, isIntersecting]
 */
export function useIntersectionObserver(options = {}) {
  const ref = useRef(null);
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref, isIntersecting];
}

/**
 * Lazy load images with blur placeholder
 * @param {string} src - Image source
 * @returns {Object} Image state
 */
export function useLazyImage(src) {
  const [imageSrc, setImageSrc] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsLoading(false);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { imageSrc, isLoading };
}

/**
 * Preload critical images
 * @param {Array<string>} images - Array of image URLs
 */
export function preloadImages(images) {
  if (typeof window === 'undefined') return;

  images.forEach((src) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
}

/**
 * Measure component render time (development only)
 * @param {string} componentName - Name of component
 */
export function useRenderTimer(componentName) {
  if (process.env.NODE_ENV !== 'development') return;

  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    console.log(
      `[Performance] ${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`
    );

    startTime.current = performance.now();
  });
}

/**
 * Cache expensive calculations
 * @param {Function} fn - Function to memoize
 * @param {Array} deps - Dependencies
 * @returns {any} Memoized result
 */
export function useMemoizedValue(fn, deps) {
  return React.useMemo(fn, deps);
}
