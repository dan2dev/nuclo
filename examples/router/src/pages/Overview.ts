// The landing page: what the router is, the whole integration in one block,
// and a map of the rest of the showcase.
import type { RouteContext } from "nuclo-router";
import { code, feature, pill, s } from "../ui.ts";

const INTEGRATION = `// routes.ts — the table and the router, created once
export const router = createRouter(routeTable, { preload: false });

// app.ts — nothing of the router's in here: a region is where pages land
export const App = (route: Route) => () =>
  div(nav(/* links */), main(region({ id: "main" })));

// pages/Post.ts — a page says where it goes
export default (ctx) => view("main", article(h1(ctx.params.slug)));

// main.ts — the whole browser integration
const route = await router.start();
render(route.app(App), document.querySelector("#app")!);`;

const SSR = `// server.ts — one Route per request; the only thing the router
// shares between them is the page-module cache
const route = await router.start(request.url);
const body = renderToString(route.app(App));

// entry-client.ts — same two lines, hydrate instead of render
const route = await router.start();
hydrate(route.app(App), document.getElementById("app")!);`;

/** A row in the "what to try" map: a path pill and what that page is about. */
function tryRow(path: string, what: string) {
  return li(pill("info", path), " ", what);
}

export default function OverviewPage(_ctx: RouteContext) {
  // Placed by the page itself: into the layout's region({ id: "main" }).
  return view("main", div(
    s.page,

    feature(
      "A router made of list()",
      "nuclo-router owns no DOM of its own and decides only what to load: the layer stack is a " +
        "one-item list() mounted beside the app, each page says where it goes with a view() " +
        "into one of the layout's regions, and navigating swaps that row. Because the server and " +
        "the client build the same tree, SSR and hydration line up without the router doing " +
        "anything special for either.",
      p(
        s.panelDesc,
        "The panel below the nav is a direct readout of the Route object: every state member " +
          "of the interface — path, pattern, params, search, hash, url, pending, error — " +
          "re-read on each update(), plus a log of onNavigate firing. Nothing on this page " +
          "writes to it; it only ever reflects what the router did.",
      ),
    ),

    feature(
      "The whole integration",
      "Two lines in the browser, one of them awaited. start() resolves the active route's " +
        "module before it returns, which is why the first tree is already complete: there is " +
        "no empty frame to patch up afterwards, and hydrate() can claim the server's nodes " +
        "instead of replacing them.",
      code(INTEGRATION),
      p(
        s.note,
        "start() defaults to location.href in the browser and takes the request URL on the " +
          "server. It rejects when nothing matches and the table has no \"*\" route — which is " +
          "the signal to send a real 404 rather than render one.",
      ),
      code(SSR),
    ),

    feature(
      "What to try",
      "Each nav item above is one slice of the router. Watch the live panel while you click.",
      ul(
        s.note,
        tryRow("/patterns", "static, :param and *catch-all, and the precedence between them."),
        tryRow("/links", "which clicks the delegated listener takes over, and which it leaves to the browser."),
        tryRow("/api", "every Route member: the eight state getters plus go(), href() and stop()."),
        tryRow("/settings", "the three RouterOptions: base, preload and onNavigate."),
        tryRow("/slow", "route.pending while a chunk is still in flight — the old page stays on screen."),
        tryRow("/broken", "route.error, and why retrying works: a rejected load is evicted from the cache."),
        tryRow("/eager", "a loader that returns the component directly, so navigation is synchronous."),
      ),
      p(
        s.note,
        "This example sets preload: false on purpose. With idle preloading on (the default) " +
          "the router walks the table on idle and fills the same cache, so the chunks are " +
          "already there when you click and the /slow and /broken demos have nothing left to " +
          "show. Preloading and a non-root base are demonstrated in ../router-ssr instead, " +
          "where the whole app is mounted under /app.",
      ),
    ),
  ));
}
