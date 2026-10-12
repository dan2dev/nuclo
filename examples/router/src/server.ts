/**
 * Optional SSR for this showcase: Bun.serve + nuclo's DOM polyfill, reusing the
 * `vite build` output (dist/index.html) as the HTML template. The client entry
 * (main.ts) hydrates what this renders. The smaller, annotated version of the
 * same idea is ../router-ssr.
 *
 * Run: bun run build && bun run start
 */
import "nuclo/polyfill"; // a DOM for Node/Bun/Deno — must be imported first
import "nuclo";
import { renderToString, getCssText } from "nuclo/ssr";
import { App } from "./app.ts";
import { router, routeTable } from "./routes.ts";

const port = Number(process.env.PORT ?? 5175);
const DIST = new URL("../dist/", import.meta.url).pathname;
const template = await Bun.file(DIST + "index.html").text();

/**
 * Import every page before serving, so each module-level css() is in the
 * stylesheet before the first response. Sections (docs, records) are nested
 * tables; deliberately failing routes (/broken) are expected to throw.
 */
async function warm(table: object): Promise<void> {
  for (const value of Object.values(table)) {
    if (typeof value === "function") await Promise.resolve(value()).catch(() => {});
    else await warm(value);
  }
}
await warm(routeTable);

Bun.serve({
  port,
  async fetch(request) {
    const { pathname } = new URL(request.url);

    // Static client assets from the Vite build.
    if (pathname.startsWith("/assets/")) {
      const file = Bun.file(DIST + pathname.slice(1));
      if (await file.exists()) return new Response(file, { headers: { "Cache-Control": "public,max-age=31536000,immutable" } });
    }

    // One Route per request; only the page-module cache is shared.
    let route;
    try {
      route = await router.start(request.url);
    } catch {
      return new Response("Not found", { status: 404 });
    }

    const body = route.run(() => renderToString(App));
    const html = template
      .replace('<div id="app"></div>', () => `<div id="app">${body}</div>`)
      .replace("</head>", () => `<style id="nuclo-styles">${getCssText()}</style></head>`);

    return new Response(html, {
      // The "*" route matched → a real 404, not a 200 with a 404 page.
      status: route.pattern === "*" ? 404 : 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
});

console.log(`SSR server on http://localhost:${port}/`);
