import { useEffect, useRef, useState } from 'react';

export interface PullToRefreshConfig {
  onRefresh: () => Promise<void> | void;
  threshold?: number; // Distance in pixels to trigger refresh
  disabled?: boolean;
}

/**
 * Hook for implementing pull-to-refresh functionality
 *
 * Usage:
 * ```tsx
 * const { isPulling, pullDistance } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await fetchData();
 *   },
 *   threshold: 80,
 * });
 *
 * return (
 *   <div style={{ transform: `translateY(${pullDistance}px)` }}>
 *     {isPulling && <div>Release to refresh...</div>}
 *     Content
 *   </div>
 * );
 * ```
 */
export function usePullToRefresh(config: PullToRefreshConfig) {
  const { onRefresh, threshold = 80, disabled = false } = config;

  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const touchStart = useRef<number | null>(null);
  const scrollTop = useRef<number>(0);

  useEffect(() => {
    if (disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      scrollTop.current = document.documentElement.scrollTop || document.body.scrollTop;

      // Only trigger if at top of page
      if (scrollTop.current === 0) {
        touchStart.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStart.current === null) return;
      if (isRefreshing) return;

      const currentTouch = e.touches[0].clientY;
      const distance = currentTouch - touchStart.current;

      // Only pull down (positive distance)
      if (distance > 0) {
        // Apply diminishing returns for a natural feel
        const adjustedDistance = Math.min(distance * 0.5, threshold * 1.5);
        setPullDistance(adjustedDistance);

        if (adjustedDistance >= threshold) {
          setIsPulling(true);
        } else {
          setIsPulling(false);
        }

        // Prevent default scrolling when pulling
        e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling && !isRefreshing) {
        setIsRefreshing(true);

        try {
          await onRefresh();
        } catch (error) {
          console.error('Pull to refresh error:', error);
        } finally {
          setIsRefreshing(false);
        }
      }

      // Reset
      setIsPulling(false);
      setPullDistance(0);
      touchStart.current = null;
    };

    const element = document.documentElement;
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isPulling, isRefreshing, onRefresh, threshold]);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
  };
}
