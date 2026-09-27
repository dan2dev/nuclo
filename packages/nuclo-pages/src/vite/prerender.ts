import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { preview, type ResolvedConfig } from "vite";
import { matchRoute } from "../shared/routes";
import type { ScannedRoute } from "./scan";

/**
 * Renders `prerender` pages through the built app (`vite preview`, so every
 * adapter — including Cloudflare's workerd — prerenders the way it serves) and
 * writes them to the client output as `<path>.html` (`index.html` for `/`).
 * Dynamic routes are discovered by following links in the rendered pages.
 */
export async function prerender(config: ResolvedConfig, routes: readonly ScannedRoute[], outDir: string): Promise<string[]> {
  const pages = routes.filter((route) => !route.api);
  if (!pages.some((route) => route.prerender)) return [];

  const server = await preview({
    root: config.root,
    configFile: config.configFile ?? false,
    mode: config.mode,
    logLevel: "warn",
    preview: { port: 0, open: false },
  });
  const written: string[] = [];
  try {
    const origin = new URL(server.resolvedUrls!.local[0]).origin;
    const queue = pages.filter((route) => route.prerender && !route.path.some((s) => s.startsWith("["))).map((route) => "/" + route.path.join("/"));
    const seen = new Set(queue);
    const root = resolve(outDir);
    for (let pathname = queue.shift(); pathname !== undefined; pathname = queue.shift()) {
      const response = await fetch(origin + pathname, { redirect: "manual" });
      if (response.status >= 300 && response.status < 400) {
        config.logger.warn(`[nuclo-pages] prerender: ${pathname} redirects; skipped`);
        continue;
      }
      if (!response.ok) throw new Error(`[nuclo-pages] prerender: ${pathname} responded with ${response.status}`);
      const html = await response.text();

      const file = resolve(root, pathname === "/" ? "index.html" : `${decodeURIComponent(pathname).replace(/^\/|\/$/g, "")}.html`);
      if (!file.startsWith(root + sep)) throw new Error(`[nuclo-pages] prerender: ${pathname} escapes the output directory`);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, html);
      written.push(file);

      for (const [, href] of html.matchAll(/<a\b[^>]*?\shref="([^"]*)"/g)) {
        const url = new URL(href.replace(/&amp;/g, "&"), origin + pathname);
        if (url.origin !== origin || seen.has(url.pathname)) continue;
        const match = matchRoute(pages, url.pathname);
        if (!(match?.route as ScannedRoute | undefined)?.prerender) continue;
        seen.add(url.pathname);
        queue.push(url.pathname);
      }
    }
  } finally {
    // Pages are written by now; a failing shutdown (seen with miniflare under Bun) mustn't fail the build.
    await server.close().catch((e: unknown) => config.logger.warn(`[nuclo-pages] prerender: closing the preview server failed: ${String(e)}`));
  }
  return written.map((file) => join(file));
}
