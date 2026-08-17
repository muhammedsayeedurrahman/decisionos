import { useEffect, useRef, useState } from 'react';

export interface SwipeGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance in pixels to trigger swipe (default: 50)
  enabled?: boolean;
}

interface SwipeState {
  isSwiping: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

/**
 * Hook for detecting swipe gestures on mobile
 *
 * @example
 * const { isSwiping, direction } = useSwipeGestures({
 *   onSwipeLeft: () => console.log('Swiped left'),
 *   onSwipeRight: () => console.log('Swiped right'),
 *   threshold: 50,
 * });
 *
 * return (
 *   <div>
 *     {isSwiping && <div>Swiping {direction}...</div>}
 *     <TaskCard />
 *   </div>
 * );
 */
export function useSwipeGestures(config: SwipeGestureConfig): SwipeState {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    enabled = true,
  } = config;

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    direction: null,
  });

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchEnd.current = null; // Reset
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart.current) return;

      touchEnd.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };

      // Calculate swipe direction during move
      const deltaX = touchEnd.current.x - touchStart.current.x;
      const deltaY = touchEnd.current.y - touchStart.current.y;

      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        const direction = getSwipeDirection(deltaX, deltaY);
        setSwipeState({ isSwiping: true, direction });
      }
    };

    const handleTouchEnd = () => {
      if (!touchStart.current || !touchEnd.current) {
        setSwipeState({ isSwiping: false, direction: null });
        return;
      }

      const deltaX = touchEnd.current.x - touchStart.current.x;
      const deltaY = touchEnd.current.y - touchStart.current.y;

      // Determine if swipe threshold was met
      if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
        setSwipeState({ isSwiping: false, direction: null });
        return;
      }

      const direction = getSwipeDirection(deltaX, deltaY);

      // Call appropriate callback
      if (direction === 'left' && onSwipeLeft) {
        onSwipeLeft();
      } else if (direction === 'right' && onSwipeRight) {
        onSwipeRight();
      } else if (direction === 'up' && onSwipeUp) {
        onSwipeUp();
      } else if (direction === 'down' && onSwipeDown) {
        onSwipeDown();
      }

      // Reset state
      setTimeout(() => {
        setSwipeState({ isSwiping: false, direction: null });
      }, 200);

      touchStart.current = null;
      touchEnd.current = null;
    };

    const getSwipeDirection = (deltaX: number, deltaY: number): 'left' | 'right' | 'up' | 'down' => {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        return deltaX > 0 ? 'right' : 'left';
      } else {
        // Vertical swipe
        return deltaY > 0 ? 'down' : 'up';
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return swipeState;
}

/**
 * Hook for swipe-to-dismiss functionality (common in task lists)
 *
 * @example
 * const { swipeProgress, handleSwipeDismiss } = useSwipeToDismiss({
 *   onDismiss: () => deleteTask(task.id),
 *   threshold: 80,
 * });
 *
 * return (
 *   <div style={{ transform: `translateX(${swipeProgress}%)` }}>
 *     <TaskCard />
 *   </div>
 * );
 */
export function useSwipeToDismiss(config: {
  onDismiss: () => void;
  threshold?: number;
  enabled?: boolean;
}) {
  const { onDismiss, threshold = 80, enabled = true } = config;
  const [swipeProgress, setSwipeProgress] = useState(0);

  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStart.current === null) return;

      const currentX = e.touches[0].clientX;
      const distance = currentX - touchStart.current;

      // Calculate progress as percentage (-100 to 100)
      const progress = Math.max(-100, Math.min(100, (distance / window.innerWidth) * 200));
      setSwipeProgress(progress);
    };

    const handleTouchEnd = () => {
      if (Math.abs(swipeProgress) >= threshold) {
        onDismiss();
      }

      // Reset
      setSwipeProgress(0);
      touchStart.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, swipeProgress, onDismiss]);

  return { swipeProgress };
}
