/**
 * Error Handler for nuclo
 * 
 * This module provides simplified error handling for nuclo. It's designed to be
 * lightweight and not add significant overhead to the bundle size.
 */

/**
 * Logs an error message with optional error details.
 * 
 * @param message - The error message to log
 * @param error - Optional error object or details
 */
export function logError(message: string, error?: Error | unknown): void {
  if (typeof console !== 'undefined') {
    console.error(`nuclo: ${message}`, error);
  }
}

/**
 * Safely executes a function and returns its result or a fallback value.
 * 
 * This function wraps function execution in a try-catch block to prevent
 * errors from breaking the reactive system.
 * 
 * @param fn - The function to execute
 * @param fallback - Optional fallback value if the function throws
 * @returns The function result or fallback value
 * 
 * @example
 * ```ts
 * const result = safeExecute(() => riskyOperation(), 'default');
 * ```
 */
export function safeExecute<T>(fn: () => T, fallback?: T): T | undefined {
  try {
    return fn();
  } catch (error) {
    logError("Operation failed", error);
    return fallback;
  }
}

/**
 * Handles DOM-related errors with a specific operation context.
 * 
 * @param error - The error that occurred
 * @param operation - Description of the DOM operation that failed
 */
export function handleDOMError(error: Error | unknown, operation: string): void {
  logError(`DOM ${operation} failed`, error);
}