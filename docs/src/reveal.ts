/**
 * reveal.ts - client-only scroll-reveal.
 *
 * Elements marked with `.rv` start hidden (only when `html[data-anim]` was set
 * by the blocking head script, i.e. JS + IntersectionObserver available and no
 * reduced-motion preference) and receive `.rv-in` when they enter the viewport.
 *
 * Nuclo only re-applies attributes registered as dynamic resolvers, so classes
 * added here survive update() calls.
 */
let observer: IntersectionObserver | null = null;

function ensureObserver(): IntersectionObserver | null {
  if (observer) return observer;
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return null;
  if (!document.documentElement.hasAttribute('data-anim')) return null;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('rv-in');
          observer!.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );
  return observer;
}

/** Observe all not-yet-revealed `.rv` elements. Safe to call repeatedly. */
export function scanReveals(): void {
  const io = ensureObserver();
  if (!io) return;
  for (const el of document.querySelectorAll<HTMLElement>('.rv:not(.rv-in)')) {
    io.observe(el);
  }
}
