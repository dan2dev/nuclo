export function logError(message: string, error?: Error | unknown) {
  if (typeof console !== 'undefined') {
    console.error(`nuclo: ${message}`, error);
  }
}