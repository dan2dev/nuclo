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
if (typeof window === 'undefined' && typeof globalThis !== 'undefined') {
  const { document } = await import('./Document');
  const { Event, CustomEvent } = await import('./Event');
  
  interface GlobalWithPolyfills {
    document?: typeof document;
    Event?: typeof Event;
    CustomEvent?: typeof CustomEvent;
    Node?: typeof NucloNode;
    Element?: typeof NucloElement;
    HTMLElement?: typeof NucloElement;
  }
  
  const g = globalThis as unknown as GlobalWithPolyfills;
  
  if (!g.document) {
    g.document = document;
  }
  if (!g.Event) {
    g.Event = Event;
  }
  if (!g.CustomEvent) {
    g.CustomEvent = CustomEvent;
  }
  if (!g.Node) {
    g.Node = NucloNode;
  }
  if (!g.Element) {
    g.Element = NucloElement;
  }
  if (!g.HTMLElement) {
    g.HTMLElement = NucloElement;
  }
}
