import "nuclo";
import { injectGlobalStyles } from "./styles.ts";
import { initTheme } from "./theme.ts";
import { initRouter } from "./router.ts";
import { Header } from "./components/Header.ts";
import { Footer } from "./components/Footer.ts";
import { createPageArea, setInitialPage } from "./routes.ts";
import { loadPageFunction, routeMap } from "./route-definitions.ts";

// Initialize theme first (before styles) so CSS vars are set
initTheme();

// Initialize styles (idempotent — skips if server already injected #nuclo-global)
injectGlobalStyles();

// Determine initial route synchronously from the URL.
const base = import.meta.env.BASE_URL || "/";
const rawPath = window.location.pathname
  .replace(base.replace(/\/$/, ""), "")
  .replace(/^\/+|\/+$/g, "");
const initialRoute = routeMap.has(rawPath) ? rawPath : "home";

// Eagerly load the initial page function before hydration so the list()
// runtime starts populated. hydrateListRuntime then claims the existing SSR
// DOM nodes (no remove+add) eliminating the footer CLS entirely.
const initialFn = await loadPageFunction(initialRoute);
setInitialPage(initialFn);

// Hydrate server-rendered HTML — reuses existing DOM nodes from SSR
const app = document.getElementById("app")!;
hydrate(div(Header(), createPageArea(), Footer()), app);

initRouter();
