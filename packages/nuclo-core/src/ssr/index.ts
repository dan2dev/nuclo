/**
 * Server-Side Rendering (SSR) entry point for Nuclo
 *
 * This module provides utilities for rendering Nuclo components to HTML strings
 * in Node.js environments for server-side rendering.
 *
 * @example
 * ```ts
 * import 'nuclo/polyfill'; // DOM for Node, Bun and Deno — load first
 * import 'nuclo';          // registers the global tag builders (div, p, …)
 * import { renderToString } from 'nuclo/ssr';
 *
 * const html = renderToString(div("Hello, World!"));
 * console.log(html); // '<div><!-- text-0 -->Hello, World!</div>'
 * ```
 */

export {
  renderToString,
  renderManyToString,
  renderToStringWithContainer
} from './render-to-string';

export { getCssText } from '../style/engine';
