// Re-export all style utilities
export * from "../style";
export { setSSRCollector } from "../style/cssGenerator";

// Auto-register style utilities on globalThis when imported
import * as styleExports from "../style";

function registerStyleGlobals(): void {
  const registry = globalThis as Record<string, unknown>;
  for (const [key, value] of Object.entries(styleExports)) {
    try {
      registry[key] = value;
    } catch {
      // Skip readonly properties (e.g., window.top)
    }
  }
}

registerStyleGlobals();
