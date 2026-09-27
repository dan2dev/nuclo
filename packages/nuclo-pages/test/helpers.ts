import * as devalue from "devalue";
import { createHandler, type HandlerOptions } from "../src/server/index";
import type { RouteModule } from "../src/shared/types";
import { scanPages } from "../src/vite/scan";

export const TEMPLATE = "<!doctype html><html><head><title>Default</title><!--nuclo:head--></head><body><!--nuclo:body--></body></html>";
export const ASSETS = { entry: { js: "/entry.js", css: [], preload: [] }, modules: [] };

const PAGES = "/app/src/pages";

/** Stub source for a route module, so the real scanner can classify it. */
function sourceOf(mod: RouteModule): string {
  return Object.keys(mod)
    .map((key) =>
      key === "default"
        ? "export default function View() {}"
        : key === "prerender"
          ? `export const prerender = ${String(mod.prerender)};`
          : `export const ${key} = () => {};`,
    )
    .join("\n");
}

/**
 * An app from `src/pages` files mapped to module objects: scanned by the real
 * scanner and served by a real handler.
 */
export function createApp(files: Record<string, RouteModule>, options: Partial<HandlerOptions> = {}) {
  const moduleOf = (file: string) => files[file.slice(PAGES.length + 1)];
  const scan = scanPages(PAGES, (file) => sourceOf(moduleOf(file)), Object.keys(files));
  const modules = scan.modules.map((m) => () => Promise.resolve(moduleOf(m.file)));
  const handler = createHandler({
    modules,
    routes: scan.routes,
    root: scan.root,
    serverFns: {},
    template: TEMPLATE,
    assets: ASSETS,
    ...options,
  });
  const request = (path: string, init?: RequestInit) => handler(new Request(new URL(path, "http://localhost"), init));
  return { scan, modules, handler, request };
}

/** The parts of a server-rendered page. */
export async function readPage(response: Response) {
  const html = await response.text();
  const data = /<script type="application\/json" id="nuclo-data">([\s\S]*?)<\/script>/.exec(html)?.[1];
  const app = /<div id="app">([\s\S]*)<\/div><script type="application\/json"/.exec(html)?.[1];
  return { html, app: app ?? "", text: stripMarkers(app ?? ""), payload: data === undefined ? undefined : (devalue.parse(data) as Record<string, unknown>) };
}

/** HTML without nuclo's hydration comments. */
export const stripMarkers = (html: string) => html.replace(/<!--[\s\S]*?-->/g, "");

/** A promise with its resolve/reject exposed. */
export function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
