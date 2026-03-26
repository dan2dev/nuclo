import "nuclo";
import { injectGlobalStyles } from "./styles.ts";
import { initTheme } from "./theme.ts";
import { initRouter } from "./router.ts";
import { Header } from "./components/Header.ts";
import { Footer } from "./components/Footer.ts";
import { setPageContainer } from "./routes.ts";

// Initialize theme first (before styles) so CSS vars are set
initTheme();

// Initialize styles (idempotent — skips if server already injected #nuclo-global)
injectGlobalStyles();

// Replace server-rendered HTML with a live Nuclo component tree
const app = document.getElementById("app")!;
app.innerHTML = "";

const appEl = div(
  Header(),
  main({
    id: "page-container",
    style: {
      minHeight: "calc(100vh - 160px)",
      paddingTop: "64px",
    },
  }),
  Footer()
);

render(appEl, app);

// page-container is in the DOM synchronously after render()
const container = document.getElementById("page-container") as HTMLElement;
setPageContainer(container);
initRouter();
