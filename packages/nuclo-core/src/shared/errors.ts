export function logError(message: string, error?: Error | unknown): void {
  if (typeof console !== 'undefined') {
    // eslint-disable-next-line no-console
    console.error(`nuclo: ${message}`, error);
  }
}