import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook to manage accessible focus for keyboard navigation
 *
 * @param enabled - Whether focus management is enabled
 * @param autoFocus - Whether to auto-focus the first element on mount
 */
export function useAccessibleFocus(enabled = true, autoFocus = false) {
  const containerRef = useRef<HTMLElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    // Find all focusable elements
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors);

    if (focusableElements.length > 0) {
      firstFocusableRef.current = focusableElements[0];

      if (autoFocus) {
        focusableElements[0].focus();
      }
    }

    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // If Shift+Tab on first element, cycle to last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // If Tab on last element, cycle to first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, autoFocus]);

  return { containerRef, firstFocusableRef };
}

/**
 * Hook for managing roving tabindex (arrow key navigation in lists/grids)
 *
 * @example
 * const { activeIndex, setActiveIndex } = useRovingTabindex(items.length);
 *
 * // In your component:
 * items.map((item, index) => (
 *   <button
 *     tabIndex={activeIndex === index ? 0 : -1}
 *     onKeyDown={(e) => handleArrowKeys(e, index)}
 *   >
 *     {item}
 *   </button>
 * ))
 */
export function useRovingTabindex(itemCount: number, orientation: 'horizontal' | 'vertical' = 'vertical') {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowDown':
          if (orientation === 'vertical') {
            e.preventDefault();
            newIndex = (currentIndex + 1) % itemCount;
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical') {
            e.preventDefault();
            newIndex = (currentIndex - 1 + itemCount) % itemCount;
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal') {
            e.preventDefault();
            newIndex = (currentIndex + 1) % itemCount;
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal') {
            e.preventDefault();
            newIndex = (currentIndex - 1 + itemCount) % itemCount;
          }
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = itemCount - 1;
          break;
      }

      if (newIndex !== currentIndex) {
        setActiveIndex(newIndex);
      }
    },
    [itemCount, orientation]
  );

  return { activeIndex, setActiveIndex, handleKeyDown };
}
