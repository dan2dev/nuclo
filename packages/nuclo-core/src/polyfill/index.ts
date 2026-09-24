/**
 * Polyfills for Node.js environments
 *
 * This module provides minimal browser API polyfills to allow Nuclo to run in Node.js
 * for server-side rendering (SSR).
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
export { NucloNode } from './Node';

import { NucloElement } from './Element';
import { NucloNode } from './Node';
import { document } from './Document';

// Event and CustomEvent are built into every supported runtime (Node >= 19,
// Bun, Deno); re-exported for the documented named imports.
export const Event = globalThis.Event;
export const CustomEvent = globalThis.CustomEvent;
export const Node = NucloNode;
export const Element = NucloElement;
export const HTMLElement = NucloElement;

// Auto-apply polyfills to globalThis if in Node environment (synchronous — no top-level await)
if (typeof window === 'undefined') {
  const g = globalThis as unknown as {
    document?: typeof document;
    Node?: typeof NucloNode;
    Element?: typeof NucloElement;
    HTMLElement?: typeof NucloElement;
  };
  g.document ??= document;
  g.Node ??= NucloNode;
  g.Element ??= NucloElement;
  g.HTMLElement ??= NucloElement;
}
