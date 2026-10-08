/**
 * The route table and the app shell — the one module both sides import.
 *
 * Nothing here is server-only or client-only, which is what makes SSR and
 * hydration line up: `renderToString(route.app(App))` on the server and
 * `hydrate(route.app(App), …)` in the browser build the same tree, so hydration
 * claims the server's nodes instead of replacing them.
 */
import { createRouter, type Route } from "nuclo-router";
import { BASE } from "./base.ts";
import { s } from "./ui.ts";

/**
 * Every page is a dynamic import(), so Vite emits one chunk per page and the
 * browser downloads only the route it needs. The server imports them all up
 * front (see server.ts) so the stylesheet is complete before the first
 * response.
 *
 * Every loader here is a default-export import(); the other loader shapes
 * (named export, eager) are shown in ../router.
 */
export const routeTable = {
  "/": () => import("./pages/Home.ts"),
  "/blog/:slug": () => import("./pages/Post.ts"),
  "/files/*rest": () => import("./pages/Files.ts"),
  "*": () => import("./pages/NotFound.ts"),
};

/**
 * One router for the whole process. The route table, the compiled matcher and
 * the page-module cache live here and are shared across every request — the
 * per-request state is the Route that `start()` returns, so concurrent
 * requests cannot see each other's route.
 *
 * `onNavigate` is never called during SSR, so it is safe to touch `document`
 * in it even though this module is imported on the server.
 */
export const router = createRouter(routeTable, {
  base: BASE,
  preload: true,
  onNavigate: (ctx) => {
    document.title = `${ctx.path === "/" ? "Home" : ctx.path} — nuclo-router SSR`;
  },
});

const NAV = [
  ["/", "Home"],
  ["/blog/hello-ssr", "A post"],
  ["/files/a/b/readme.md", "Nested file"],
  ["/nope", "Unknown (404)"],
] as const;

/**
 * The app shell. Takes the Route explicitly rather than reading a singleton —
 * that is what keeps concurrent SSR requests independent.
 */
export const App = (route: Route) => () =>
  div(
    s.shell,
    nav(
      s.nav,
      ...NAV.map(([path, label]) =>
        // A plain <a href>. The router's one delegated click listener handles
        // it in the browser; with JavaScript disabled the server handles it.
        a(
          { href: route.href(path) },
          s.link,
          // Re-evaluated on every update(), so the active pill follows navigation.
          () => (route.path === path ? s.linkActive : ""),
          label,
        ),
      ),
    ),
    main(
      { id: "outlet" },
      // Every page returns view("main", …), so this is where it lands; the
      // router is mounted beside the app by route.app(App) in server.ts and
      // entry-client.ts, never in this tree. The region serializes its
      // content like any other markup, and on the client the page's view()
      // claims the server's nodes rather than rebuilding them — which is what
      // entry-client.ts checks before it reports success.
      region({ id: "main" }),
      // The outgoing page stays visible while the next chunk loads, so there
      // is no blank frame and no layout shift.
      when(() => route.pending, div(s.pill, "loading chunk…")),
      when(() => route.error !== null, div(s.pill, () => `error: ${route.error?.message ?? ""}`)),
    ),
    footer(s.foot, "Rendered on the server, hydrated in place."),
  );
