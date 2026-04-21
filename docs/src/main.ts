import 'nuclo';
import { injectGlobalStyles } from './styles.ts';
import { initTheme } from './theme.ts';
import { initRouter } from './router.ts';
import { createApp } from './app.ts';
import { loadPageFunction, routeMap } from './route-definitions.ts';

// Theme before styles so CSS vars are set on first paint.
initTheme();

// Idempotent — skips if the server already injected #nuclo-global.
injectGlobalStyles();

// Spin keyframes for the loading spinner (client-only side effect).
if (!document.getElementById('nuclo-spin-keyframes')) {
  const style = document.createElement('style');
  style.id = 'nuclo-spin-keyframes';
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}

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

initRouter(loadPage);
