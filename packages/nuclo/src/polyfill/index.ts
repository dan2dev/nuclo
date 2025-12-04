/**
 * Polyfills for Node.js environments
 * 
 * This module provides minimal browser API polyfills to allow Nuclo to run in Node.js
 * for server-side rendering (SSR) scenarios.
 * 
 * To use in Node.js:
 * ```typescript
 * import 'nuclo/polyfill';
 * // or
 * import { document, Event, CustomEvent } from 'nuclo/polyfill';
 * ```
 */

export { NucloDocument, document } from './Document';
export { NucloElement } from './Element';
export { NucloText } from './Text';
export { NucloEvent, NucloCustomEvent, Event, CustomEvent } from './Event';
export { NucloNode } from './Node';

// Import for local use
import { NucloElement } from './Element';
import { NucloNode } from './Node';

export const Node = NucloNode;
export const Element = NucloElement;
export const HTMLElement = NucloElement;

// Auto-apply polyfills to globalThis if in Node environment
if (typeof window === 'undefined' && typeof global !== 'undefined') {
  const { document } = await import('./Document');
  const { Event, CustomEvent } = await import('./Event');
  
  if (!globalThis.document) {
    (globalThis as any).document = document;
  }
  if (!globalThis.Event) {
    (globalThis as any).Event = Event;
  }
  if (!globalThis.CustomEvent) {
    (globalThis as any).CustomEvent = CustomEvent;
  }
  if (!globalThis.Node) {
    (globalThis as any).Node = NucloNode;
  }
  if (!globalThis.Element) {
    (globalThis as any).Element = NucloElement;
  }
  if (!globalThis.HTMLElement) {
    (globalThis as any).HTMLElement = NucloElement;
  }
}
