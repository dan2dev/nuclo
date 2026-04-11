export function logError(message: string, error?: Error | unknown): void {
  if (typeof console !== 'undefined') {
    console.error(`nuclo: ${message}`, error);
  }
}