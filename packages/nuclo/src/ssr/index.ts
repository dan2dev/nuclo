/**
 * Server-Side Rendering (SSR) entry point for Nuclo
 *
 * This module provides utilities for rendering Nuclo components to HTML strings
 * in Node.js environments for server-side rendering.
 *
 * @example
 * ```ts
 * import { renderToString } from 'nuclo/ssr';
 * import '../polyfill'; // Load polyfills for Node.js
 * import { div } from 'nuclo';
 *
 * const html = renderToString(div("Hello, World!"));
 * console.log(html); // '<div>Hello, World!</div>'
 * ```
 */

export {
  renderToString,
  renderManyToString,
  renderToStringWithContainer
} from './renderToString';
