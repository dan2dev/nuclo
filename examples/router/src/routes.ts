/**
 * The route table, the router, and the app shell.
 *
 * The table below is also the showcase's index: every pattern form the router
 * supports appears in it at least once, in an order chosen to make the
 * precedence rules visible.
 */
import { createRouter } from "nuclo-router";
import { docsSection } from "./docs/routes.ts";
import { recordSection } from "./preview/routes.ts";
/**
 * Loaders. A route's value is always a *function returning* the page
 * component, which is what makes the component lazy:
 *
 *   () => import("…")                     default export, code-split
 *   () => import("…").then(m => m.Page)   named export, code-split
 *   () => Page                            eager, deliberately not split
 *
 * Declaration order only breaks ties between dynamic patterns — static
 * routes always win, and catch-alls are always tried last, so `"*"` can sit
 * anywhere.
 */
export const routeTable = {
  // Static — matched by a single Map lookup.
  "/": () => import("./pages/Overview.ts"),
  "/patterns": () => import("./pages/Patterns.ts"),
  "/patterns/nested/deep": () => import("./pages/Deep.ts"),

  // Static beats the `:slug` pattern below for exactly this path.
  "/blog/new": () => import("./pages/BlogNew.ts"),
  // One param, then two: segment count disambiguates them.
  "/blog/:slug": () => import("./pages/Post.ts"),
  "/blog/:slug/:comment": () => import("./pages/Comment.ts"),

  // Named catch-all: captures the rest of the path, slashes included.
  "/files/*rest": () => import("./pages/Files.ts"),

  // A NESTED SECTION. "/docs" is the layout and the rest of ./docs/routes.ts
  // are its children, so the router keeps the layout mounted while they
  // change — type into its filter box and click around to see it.
  "/docs": docsSection,

  // The layer stack: /stack is the page underneath, and the two below it are
  // opened with push() as modals rather than navigated to.
  "/stack": () => import("./pages/Stack.ts"),
  "/stack/new-option": () => import("./stack/NewOption.ts"),
  "/stack/new-category": () => import("./stack/NewCategory.ts"),

  // RELATIVE ROUTES. One section — a record page plus its preview pages —
  // written once with "./" keys in ./preview/routes.ts, then declared under
  // two parents. Nesting composes the paths, so "./preview" is a different
  // URL under each while the code is shared.
  "/invoices/:id": recordSection,
  "/customers/:id": recordSection,

  // ROUTE LOADERS: the page module exports `load`, which runs before the page
  // is built and hands it the data. See ./pages/Data.ts.
  "/data": () => import("./pages/Data.ts"),

  // Feature tours.
  "/links": () => import("./pages/Links.ts").then((m) => m.LinksPage),
  "/api": () => import("./pages/Api.ts"),
  "/settings": () => import("./pages/Settings.ts"),

  // An artificially slow chunk, so `router.pending` is observable.
  "/slow": () => import("./pages/Slow.ts").then(async (m) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return m.SlowPage;
  }),

  // A loader that fails the first time, so `router.error` and retry are
  // observable. See pages/Broken.ts for the counter it reads.
  "/broken": () => import("./pages/Broken.ts").then((m) => m.load()),

  // The fallback. Tried last however it is declared — this one sits in the
  // middle of the table on purpose, to prove it.
  "*": () => import("./pages/NotFound.ts"),

  "/eager": () => EagerPage,
} satisfies Record<string, unknown>;

/**
 * An eager page: no import(), so it ships in the entry bundle.
 *
 * Defined here rather than in pages/ precisely to make the point — there is no
 * module to split off. h2, not h1: the shell renders the document's only h1.
 */
function EagerPage() {
  return view({
    "main": div(
      h2("Eager route"),
      p(
        "This page is not code-split. Its loader is just `() => EagerPage`, so it " +
        "lives in the entry bundle and navigating here is always synchronous — " +
        "router.pending is never true for it, and the router's idle preloader has " +
        "nothing to fetch.",
      ),
    ),
    "sidebar": div(
      input(),
      span(
        "I'm the sidebar content from EagerPage."
      )
    ),
  });
}

/**
 * `preload` is OFF here on purpose. With idle preloading on (the default),
 * every chunk is already in the cache by the time you click, so the /slow and
 * /broken demos would never show their pending or error state. Preloading is
 * demonstrated — with network evidence — in ../router-ssr.
 *
 * `base` is likewise left at its default "/" here; ../router-ssr mounts its
 * app under /app to exercise it.
 */
export const router = createRouter(routeTable, {
  preload: false,
  onNavigate: (ctx) => {
    document.title = `${ctx.pattern} — nuclo-router`;
    history_.push({ pattern: ctx.pattern, path: ctx.path });
    if (history_.length > 8) history_.shift();
    // onNavigate runs after the router's own update(), so whatever the hook
    // changes needs one of its own.
    update();
  },
});

/** A visible log of onNavigate firing, rendered in the shell. */
export const history_: Array<{ pattern: string; path: string }> = [];

export const NAV: ReadonlyArray<readonly [string, string]> = [
  ["/", "Overview"],
  ["/patterns", "Patterns"],
  ["/links", "Links"],
  ["/docs", "Nested layout"],
  ["/stack", "Layer stack"],
  ["/invoices/42", "Relative routes"],
  ["/data", "Loaders"],
  ["/api", "Route API"],
  ["/settings", "Settings"],
  ["/slow", "Slow chunk"],
  ["/broken", "Failing chunk"],
  ["/eager", "Eager"],
];
