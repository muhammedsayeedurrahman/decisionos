'use client';

/**
 * Skip links for keyboard navigation accessibility (WCAG 2.1 AA)
 *
 * Allows keyboard users to bypass repetitive navigation and jump directly
 * to main content.
 */
export function SkipLinks() {
  return (
    <nav
      aria-label="Skip links"
      className="sr-only focus-within:not-sr-only"
    >
      <a
        href="#main-content"
        className="
          fixed top-4 left-4 z-[9999]
          px-4 py-2
          bg-brand-red text-white
          rounded-lg
          font-bold text-sm
          focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-red
          transition-all
        "
      >
        Skip to main content
      </a>
      <a
        href="#nav-menu"
        className="
          fixed top-4 left-4 z-[9999] mt-12
          px-4 py-2
          bg-brand-red text-white
          rounded-lg
          font-bold text-sm
          focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-red
          transition-all
        "
      >
        Skip to navigation
      </a>
    </nav>
  );
}
