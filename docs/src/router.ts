/**
 * router.ts - isomorphic.
 * The site's router: the server renders each request inside its Route's run(),
 * the browser starts it before hydrating. Links are plain <a href>s.
 */
import { createRouter, type RouteTable } from 'nuclo-router';
import { routeDefinitions, routeName, routePattern } from './route-definitions.ts';
import { updatePageMeta } from './seo.ts';
import { scanReveals } from './reveal.ts';
import { LOCALES, applyLocale, i18n, localeOf, localePath, swapLocale, type Locale } from './i18n/index.ts';

export { routeName };

const pages: RouteTable = Object.fromEntries(
  routeDefinitions.map((def) => [
    routePattern(def),
    'children' in def
      ? { '/': def.loader, ...Object.fromEntries(Object.entries(def.children).map(([k, page]) => [k, page.loader])) }
      : def.loader,
  ]),
);

let shownSection = '';
let shownLocale: Locale | null = null;

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
      // The URL's locale, which the page's load() fetched. On "start" this runs before App is built,
      // so the meta below reads the right text; the chrome then builds with it too.
      const locale = applyLocale(localeOf(ctx.params));
      // The page was built in its locale. The chrome around the outlet (header, footer) was not:
      // a bare forceUpdate() builds every root again and patches its static labels in place.
      if (shownLocale !== null && shownLocale !== locale) forceUpdate();
      shownLocale = locale;
      i18n.loading = false;
      if (ctx.params.locale) document.documentElement.lang = LOCALES[locale].lang;
      // A load() that returned null is a 404: keep the server's noindex meta instead of the section's.
      if (router.data !== null) updatePageMeta(ctx, router.data);
      scanReveals();
    },
  },
);

export const currentRoute = () => routeName(router.pattern);

/** An app href for a section path in the current locale: href("/docs") is "/en/docs". */
export const href = (path: string): string => router.href(localePath(path));

/** Goes to the current page under another locale. The page loader fetches that locale's text; the app shows its loader meanwhile. */
export function switchLocale(locale: Locale): void {
  if (locale === i18n.locale) return;
  i18n.loading = true;
  update();
  try { document.cookie = `nuclo-locale=${locale}; path=/; max-age=31536000; samesite=lax`; } catch {}
  void router.go(swapLocale(router.url, locale)).finally(() => { i18n.loading = false; update(); });
}
