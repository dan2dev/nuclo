/**
 * router.ts - isomorphic.
 * The site's router: the server renders each request inside its Route's run(),
 * the browser starts it before hydrating. Links are plain <a href>s.
 */
import { createRouter } from 'nuclo-router';
import { routeDefinitions, type RoutePath } from './route-definitions.ts';
import { updatePageMeta } from './seo.ts';
import { scanReveals } from './reveal.ts';

const pages = Object.fromEntries(
  routeDefinitions.map((def) => [def.path === 'home' ? '/' : `/${def.path}`, def.loader]),
);

export const router = createRouter(
  // Unknown paths render Home; the server answers them with a 404.
  { ...pages, '*': routeDefinitions[0].loader },
  {
    base: import.meta.env?.BASE_URL,
    // Browser only, after the DOM caught up.
    onNavigate: (ctx, kind) => {
      if (kind === 'push' && !ctx.hash) window.scrollTo(0, 0);
      updatePageMeta(routeName(ctx.pattern));
      scanReveals();
    },
  },
);

/** The routeDefinitions path a matched pattern renders. */
export function routeName(pattern: string): RoutePath {
  return (pattern === '/' || pattern === '*' ? 'home' : pattern.slice(1)) as RoutePath;
}

export const currentRoute = (): RoutePath => routeName(router.pattern);
