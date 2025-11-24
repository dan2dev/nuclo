import "nuclo";
import { injectGlobalStyles } from "./styles.ts";
import { initRouter, getCurrentRoute } from "./router.ts";
import { Header } from "./components/Header.ts";
import { Footer } from "./components/Footer.ts";
import { HomePage } from "./pages/Home.ts";
import { GettingStartedPage } from "./pages/GettingStarted.ts";
import { CoreApiPage } from "./pages/CoreApi.ts";
import { TagBuildersPage } from "./pages/TagBuilders.ts";
import { StylingPage } from "./pages/Styling.ts";
import { PitfallsPage } from "./pages/Pitfalls.ts";
import { ExamplesPage } from "./pages/Examples.ts";

// Initialize styles
injectGlobalStyles();

// Initialize router
initRouter();

// Main app
const app = div(
  Header(),
  main(
    {
      style: {
        minHeight: "calc(100vh - 160px)",
        paddingTop: "40px",
      },
    },
    when(() => getCurrentRoute() === "home", HomePage())
      .when(() => getCurrentRoute() === "getting-started", GettingStartedPage())
      .when(() => getCurrentRoute() === "core-api", CoreApiPage())
      .when(() => getCurrentRoute() === "tag-builders", TagBuildersPage())
      .when(() => getCurrentRoute() === "styling", StylingPage())
      .when(() => getCurrentRoute() === "pitfalls", PitfallsPage())
      .when(() => getCurrentRoute() === "examples", ExamplesPage())
  ),
  Footer()
);

render(app, document.getElementById("app")!);
