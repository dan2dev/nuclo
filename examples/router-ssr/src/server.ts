/**
 * The server. Bun.serve + nuclo's DOM polyfill — no bundler involved on this
 * side; `vite build` only produces the client bundle in ./dist.
 *
 * Run: bun run build && bun run start   (or `bun run dev` to watch both)
 */
import "nuclo/polyfill"; // a DOM for Node/Bun/Deno — must be imported first
import "nuclo";
import { renderToString, getCssText } from "nuclo/ssr";
import { BASE } from "./base.ts";
import { App, router, routeTable } from "./routes.ts";
import { serializeRouteData } from "./ssr-data.ts";

const port = Number(process.env.PORT ?? 5174);
const DIST = new URL("../dist/", import.meta.url).pathname;

/**
 * Import every page module before serving. Each page's module-level css()
 * calls register into nuclo's single stylesheet, so after this loop
 * getCssText() returns the complete sheet for any route. (The router's own
 * `preload` option is the client-side counterpart of this.)
 */
for (const [pattern, loader] of Object.entries(routeTable)) {
  try {
    await loader();
  } catch (error) {
    console.warn(`warm-up failed for "${pattern}":`, error);
  }
}

const ASSET = /\.(?:js|mjs|css|map|svg|png|ico|webp|woff2?)$/;

function document_(body: string, styles: string, title: string, routeData: unknown): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <!-- The atomic stylesheet nuclo collected while rendering: no flash of
         unstyled content, and no style recalculation on hydration. -->
    <style id="nuclo-styles">${styles}</style>
    <!-- The data this page's loader produced, so the browser does not fetch
         it again while hydrating. See src/ssr-data.ts. -->
    ${serializeRouteData(routeData)}
    <script type="module" src="${BASE}/client.js"></script>
  </head>
  <body>
    <div id="app">${body}</div>
  </body>
</html>`;
}

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    // The app is mounted under BASE; send the bare root there.
    if (BASE && (url.pathname === "/" || url.pathname === "")) {
      return new Response(null, { status: 302, headers: { Location: `${BASE}/` } });
    }

    // Static client assets, served from the Vite build.
    const inside = BASE ? url.pathname.slice(BASE.length) : url.pathname;
    if (url.pathname.startsWith(BASE) && ASSET.test(inside)) {
      const file = Bun.file(DIST + inside.replace(/^\//, ""));
      if (await file.exists()) {
        return new Response(file, {
          headers: { "Cache-Control": inside.includes("-") ? "public,max-age=31536000,immutable" : "no-cache" },
        });
      }
    }

    // ── SSR ──────────────────────────────────────────────────────────────
    // One Route per request. Nothing is stored on the router except the
    // shared page-module cache, so concurrent requests cannot interfere.
    let route;
    try {
      route = await router.start(request.url);
    } catch {
      // start() rejects only when nothing matched AND the table has no "*"
      // route — here that means a URL outside BASE, which this app does not own.
      return new Response("Not found", { status: 404 });
    }

    // The "*" route matched → answer with a real 404, not a 200 with a 404 page.
    const status = route.pattern === "*" ? 404 : 200;
    const title = route.pattern === "*" ? "404 — nuclo-router SSR" : `${route.path} — nuclo-router SSR`;
    // run(): App reads the shared router, and for this render that is this
    // request's Route and no other's.
    const body = route.run(() => renderToString(App));

    return new Response(document_(body, getCssText(), title, route.data), {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
});

console.log(`SSR server on http://localhost:${port}${BASE}/`);
