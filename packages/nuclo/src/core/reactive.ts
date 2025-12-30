// Re-export from the modularized files
export { createReactiveTextNode, notifyReactiveTextNodes } from "./reactiveText";
export { registerAttributeResolver, notifyReactiveElements } from "./reactiveAttributes";
export { cleanupReactiveTextNode, cleanupReactiveElement } from "./reactiveCleanup";
