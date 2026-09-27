import * as devalue from "devalue";
import { createHandler, type HandlerOptions } from "../src/server/index";
import type { Definition, RouteModule } from "../src/shared/types";
import { scanPages } from "../src/vite/scan";

export const TEMPLATE = "<!doctype html><html><head><title>Default</title><!--nuclo:head--></head><body><!--nuclo:body--></body></html>";
export const ASSETS = { entry: { js: "/entry.js", css: [], preload: [] }, modules: [] };

const PAGES = "/app/src/pages";

/** A route file: a Page/Layout/ErrorPage definition, or an API route's HTTP method handlers. */
export type TestFile = Definition | Record<string, unknown>;

const isDefinition = (file: TestFile): file is Definition => typeof (file as Definition).render === "function";

/** Stub source for a route file, so the real scanner classifies it like the real thing. */
function sourceOf(path: string, file: TestFile): string {
  if (!isDefinition(file)) return Object.keys(file).map((key) => `export const ${key} = () => {};`).join("\n");
  const helper = path.endsWith("_layout.ts") ? "Layout" : path.endsWith("_error.ts") ? "ErrorPage" : "Page";
  const prerender = file.prerender === undefined ? "" : `prerender: ${String(file.prerender)}, `;
  return `import { ${helper} } from "nuclo-pages";\nexport default ${helper}({ ${prerender}render: () => null });`;
}

/**
 * An app from `src/pages` files: scanned by the real scanner and served by a
 * real handler. Definitions stand in for what the build would import.
 */
export function createApp(files: Record<string, TestFile>, options: Partial<HandlerOptions> = {}) {
  const fileOf = (path: string) => files[path.slice(PAGES.length + 1)];
  const scan = scanPages(PAGES, (path) => sourceOf(path, fileOf(path)), Object.keys(files));
  const moduleOf = (path: string): RouteModule => {
    const file = fileOf(path);
    return isDefinition(file) ? { default: file } : file;
  };
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
