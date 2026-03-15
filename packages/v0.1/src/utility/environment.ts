/**
 * Simplified environment detection - minimal overhead for smaller bundle size
 */

// Basic environment detection - no complex caching or edge cases
export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
