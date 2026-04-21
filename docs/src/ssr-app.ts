/**
 * ssr-app.ts — server-only.
 *
 * Thin wrapper: loads the page function for a route and delegates to the
 * isomorphic createApp().  The same tree structure is then rendered on the
 * server (renderToString) and claimed by the browser during hydration.
 */
import { loadPageFunction } from './route-definitions.ts';
import { createApp } from './app.ts';

export async function ssrMatchRoute(route: string): Promise<ReturnType<typeof div>> {
  const fn = await loadPageFunction(route);
  const { element } = createApp(fn, route);
  return element;
}
