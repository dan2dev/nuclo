import "nuclo";
import { injectGlobalStyles } from "./styles.ts";
import { initTheme } from "./theme.ts";
import { initRouter } from "./router.ts";
import { Header } from "./components/Header.ts";
import { Footer } from "./components/Footer.ts";
import { createPageArea } from "./routes.ts";

// Initialize theme first (before styles) so CSS vars are set
initTheme();

// Initialize styles (idempotent — skips if server already injected #nuclo-global)
injectGlobalStyles();

// Hydrate server-rendered HTML — reuses existing DOM nodes from SSR
const app = document.getElementById("app")!;


hydrate(div(Header(), createPageArea(), Footer()), app);

initRouter();

