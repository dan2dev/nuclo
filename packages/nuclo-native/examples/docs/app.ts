// The nuclo docs site (nuclo/docs) as a native app: the same home page, documentation and examples, with the site's design.
// Its text is the docs' own English text, extracted into content.json by extract.ts.
import "nuclo-native";
import { createRouter } from "nuclo-native/router";
import { DocsIndex, Section, sectionTitle } from "./docs";
import { ExampleDetail, ExamplesIndex, exampleTitle } from "./examples";
import { Home } from "./home";
import { c } from "./ui";

const go = (path: string) => router.go(path);

export const router = createRouter(
  {
    "/": { view: Home(go), title: "Nuclo" },
    "/docs": { view: DocsIndex(go), title: "Docs" },
    "/docs/:id": { view: Section(go), title: ({ id }) => sectionTitle(id) },
    "/examples": { view: ExamplesIndex(go), title: "Examples" },
    "/examples/:id": { view: ExampleDetail(go), title: ({ id }) => exampleTitle(id) },
  },
  {
    tabs: [
      { path: "/", title: "Home", icon: "home" },
      { path: "/docs", title: "Docs", icon: "search" },
      { path: "/examples", title: "Examples", icon: "chart" },
    ],
  },
);

// The web shell keeps apps to a phone-width column; this one is a site, so it takes the window and lays
// itself out by its breakpoints. (A combinator rule: only the web applies it.)
globalStyle("body > div", { maxWidth: "none" });
document.body.style.backgroundColor = c.bg;
render(router.outlet, document.body);
