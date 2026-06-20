import 'nuclo';
import { registerGlobalStyles } from './styles.ts';
import { initTheme } from './theme.ts';
import { initRouter } from './router.ts';
import { createApp } from './app.ts';
import { loadPageFunction, routeMap } from './route-definitions.ts';
import { scanReveals } from './reveal.ts';

// Theme before styles so CSS vars are set on first paint.
initTheme();

// Register Nuclo globalStyle() rules on the client for SPA-only fallback pages.
registerGlobalStyles();

const base = import.meta.env.BASE_URL || '/';
const rawPath = window.location.pathname
  .replace(base.replace(/\/$/, ''), '')
  .replace(/^\/+|\/+$/g, '');
const initialRoute = routeMap.has(rawPath) ? rawPath : 'home';

// Eagerly load the initial page so the list() slot starts populated.
// hydrate() then claims existing SSR nodes — no remove+add, no CLS.
const initialFn = await loadPageFunction(initialRoute);
const { element, loadPage } = createApp(initialFn);

hydrate(element, document.getElementById('app')!);

// Reveal-on-scroll: observe SSR'd nodes now, rescan after every navigation.
scanReveals();
initRouter(async (path) => {
  await loadPage(path);
  scanReveals();
});
