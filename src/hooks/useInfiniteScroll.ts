import { useEffect, useRef, useCallback, type RefObject } from 'react';

interface InfiniteScrollOptions {
  delay?: number;
  threshold?: number;
  /** Scroll container element (e.g. the div with overflow-y: auto). If null, viewport is used. */
  root?: RefObject<HTMLElement | null>;
}

function tryTrigger(
  isIntersecting: boolean,
  delay: number,
  lastFetchTimeRef: React.MutableRefObject<number>,
  scheduledTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  callback: () => void,
) {
  if (!isIntersecting) return;
  const now = Date.now();
  const timeSinceLastFetch = now - lastFetchTimeRef.current;
  if (timeSinceLastFetch >= delay) {
    if (scheduledTimeoutRef.current) {
      clearTimeout(scheduledTimeoutRef.current);
      scheduledTimeoutRef.current = null;
    }
    lastFetchTimeRef.current = now;
    callback();
  } else if (!scheduledTimeoutRef.current) {
    scheduledTimeoutRef.current = setTimeout(() => {
      lastFetchTimeRef.current = Date.now();
      callback();
      scheduledTimeoutRef.current = null;
    }, delay - timeSinceLastFetch);
  }
}

export function useInfiniteScroll(
  callback: () => void,
  enabled: boolean,
  options: InfiniteScrollOptions = {},
) {
  const { delay = 2000, threshold = 0.1, root: rootRef } = options;
  const lastFetchTimeRef = useRef(0);
  const scheduledTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isIntersectingRef = useRef(false);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const invokeCallback = useCallback(() => {
    callbackRef.current();
  }, []);

  /** Re-check using last known intersection (e.g. after a batch loaded and sentinel is still in view). */
  const checkNow = useCallback(() => {
    if (!enabled) return;
    tryTrigger(
      isIntersectingRef.current,
      delay,
      lastFetchTimeRef,
      scheduledTimeoutRef,
      invokeCallback,
    );
  }, [delay, enabled, invokeCallback]);

  useEffect(() => {
    if (!enabled) return;

    const root = rootRef?.current ?? null;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.length) return;
        const entry = entries[0];
        isIntersectingRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          tryTrigger(
            true,
            delay,
            lastFetchTimeRef,
            scheduledTimeoutRef,
            invokeCallback,
          );
        } else if (scheduledTimeoutRef.current) {
          clearTimeout(scheduledTimeoutRef.current);
          scheduledTimeoutRef.current = null;
        }
      },
      { root, rootMargin: '0px', threshold },
    );

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
      if (scheduledTimeoutRef.current) {
        clearTimeout(scheduledTimeoutRef.current);
      }
    };
  }, [delay, enabled, threshold, rootRef, invokeCallback]);

  return { sentinelRef, checkNow };
}
