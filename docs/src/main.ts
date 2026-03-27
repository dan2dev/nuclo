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

// Replace server-rendered HTML with a live Nuclo component tree
const app = document.getElementById("app")!;
app.innerHTML = "";

render(div(Header(), createPageArea(), Footer()), app);

initRouter();
