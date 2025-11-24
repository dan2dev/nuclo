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
import { CounterExamplePage } from "./pages/examples/CounterExample.ts";
import { TodoExamplePage } from "./pages/examples/TodoExample.ts";
import { SubtasksExamplePage } from "./pages/examples/SubtasksExample.ts";
import { SearchExamplePage } from "./pages/examples/SearchExample.ts";
import { AsyncExamplePage } from "./pages/examples/AsyncExample.ts";
import { FormsExamplePage } from "./pages/examples/FormsExample.ts";
import { NestedExamplePage } from "./pages/examples/NestedExample.ts";
import { AnimationsExamplePage } from "./pages/examples/AnimationsExample.ts";
import { RoutingExamplePage } from "./pages/examples/RoutingExample.ts";
import { StyledCardExamplePage } from "./pages/examples/StyledCardExample.ts";

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
      .when(() => getCurrentRoute() === "example-counter", CounterExamplePage())
      .when(() => getCurrentRoute() === "example-todo", TodoExamplePage())
      .when(() => getCurrentRoute() === "example-subtasks", SubtasksExamplePage())
      .when(() => getCurrentRoute() === "example-search", SearchExamplePage())
      .when(() => getCurrentRoute() === "example-async", AsyncExamplePage())
      .when(() => getCurrentRoute() === "example-forms", FormsExamplePage())
      .when(() => getCurrentRoute() === "example-nested", NestedExamplePage())
      .when(() => getCurrentRoute() === "example-animations", AnimationsExamplePage())
      .when(() => getCurrentRoute() === "example-routing", RoutingExamplePage())
      .when(() => getCurrentRoute() === "example-styled-card", StyledCardExamplePage())
  ),
  Footer()
);

render(app, document.getElementById("app")!);
