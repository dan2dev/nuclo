import "nuclo";
import { injectGlobalStyles } from "./styles.ts";
import { initRouter } from "./router.ts";
import { Header } from "./components/Header.ts";
import { Footer } from "./components/Footer.ts";
import { setPageContainer } from "./routes.ts";

// Initialize styles
injectGlobalStyles();

// Create the main app structure
const app = div(
  Header(),
  main({
    id: "page-container",
    style: {
      minHeight: "calc(100vh - 160px)",
      paddingTop: "40px",
    },
  }),
  Footer()
);

// Render the app
render(app, document.getElementById("app")!);

// Initialize routing after render - using setTimeout to ensure DOM is ready
setTimeout(() => {
  const el = document.getElementById("page-container") as HTMLElement;
  if (el) {
    setPageContainer(el);
    initRouter();
  } else {
    console.error("Page container element not found in DOM");
  }
}, 10);
