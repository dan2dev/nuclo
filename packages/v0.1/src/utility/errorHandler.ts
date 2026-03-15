/**
 * Simplified error handling for nuclo - reduced complexity for smaller bundle size
 */

// Basic error logging - no complex context tracking
export function logError(message: string, error?: Error | unknown): void {
  if (typeof console !== 'undefined') {
    console.error(`nuclo: ${message}`, error);
  }
}

// Simplified safe execution - no complex context
export function safeExecute<T>(fn: () => T, fallback?: T): T | undefined {
  try {
    return fn();
  } catch (error) {
    logError("Operation failed", error);
    return fallback;
  }
}

// Basic DOM error handler
export function handleDOMError(error: Error | unknown, operation: string): void {
  logError(`DOM ${operation} failed`, error);
}