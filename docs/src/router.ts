/**
 * router.ts - isomorphic.
 * The site's router: the server renders each request inside its Route's run(),
 * the browser starts it before hydrating. Links are plain <a href>s.
 */
import { createRouter, type RouteTable } from 'nuclo-router';
import { routeDefinitions, routeName } from './route-definitions.ts';
import { updatePageMeta } from './seo.ts';
import { scanReveals } from './reveal.ts';
import { i18n } from './i18n/index.ts';

export { routeName };

const pages: RouteTable = Object.fromEntries(
  routeDefinitions.map((def) => [
    def.path === 'home' ? '/' : `/${def.path}`,
    'children' in def
      ? { '/': def.loader, ...Object.fromEntries(Object.entries(def.children).map(([k, page]) => [k, page.loader])) }
      : def.loader,
  ]),
);

let shownSection = '';

export const router = createRouter(
  // Unknown paths render Home; the server answers them with a 404.
  { ...pages, '*': routeDefinitions[0].loader },
  {
    base: import.meta.env?.BASE_URL,
    // Browser only, after the DOM caught up.
    onNavigate: (ctx, kind) => {
      // New pages land at the top, except within a section (opening an example keeps the grid's scroll).
      const section = routeName(ctx.pattern);
      if (kind === 'push' && !ctx.hash && section !== shownSection) window.scrollTo(0, 0);
      shownSection = section;
      // A load() that returned null is a 404: keep the server's noindex meta instead of the section's.
      if (router.data !== null) updatePageMeta(ctx, router.data);
      scanReveals();
    },
  },
);

export const currentRoute = () => routeName(router.pattern);

// A locale switch rebuilt every page in place: the title and meta follow, and the
// reveal classes the rebuild dropped are observed again.
i18n.onChange = () => {
  if (router.data !== null) updatePageMeta(router, router.data);
  scanReveals();
};
