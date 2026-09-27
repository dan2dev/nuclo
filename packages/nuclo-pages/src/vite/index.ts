import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isRunnableDevEnvironment, normalizePath, type Manifest, type Plugin, type ResolvedConfig, type ViteDevServer } from "vite";
import { sendResponse, toRequest } from "../adapters/node";
import type { Handler } from "../server/index";
import {
  DEFAULT_TEMPLATE,
  assetsFromManifest,
  clientEntry,
  devAssets,
  devTemplate,
  handlerModule,
  importPath,
  routesDts,
  serverEntry,
} from "./codegen";
import { prerender } from "./prerender";
import { scanPages, type PagesScan } from "./scan";
import { serverFnIds, transformServerFns } from "./server-fns";

export interface NucloPagesOptions {
  /** Where the built server runs. `cloudflare` also needs `cloudflare({ viteEnvironment: { name: "ssr" } })`. */
  adapter?: "node" | "bun" | "cloudflare";
}

const CLIENT_ENTRY = "virtual:nuclo-pages/client-entry";
const HANDLER = "virtual:nuclo-pages/handler";
const SERVER_ENTRY = "virtual:nuclo-pages/server-entry";
const VIRTUAL = [CLIENT_ENTRY, HANDLER, SERVER_ENTRY];
const SOURCE = /\.[cm]?[jt]sx?$/;
const SERVER_ONLY = /^(?:node|bun|cloudflare):|^nuclo-pages\/(?:server|node|bun|vite)$/;

export function nucloPages(options: NucloPagesOptions = {}): Plugin[] {
  const adapter = options.adapter ?? "node";
  let config: ResolvedConfig;
  let root = "";
  let src = "";
  let pages = "";
  let scan: PagesScan | undefined;
  /** Source file → ids of its server functions (files without any are absent). */
  let serverFnFiles: Map<string, string[]> | undefined;

  const rel = (file: string) => normalizePath(relative(root, file));
  const getScan = () => (scan ??= scanPages(pages));

  const readServerFns = (file: string, files: Map<string, string[]>) => {
    const ids = existsSync(file) ? serverFnIds(readFileSync(file, "utf8"), file, rel(file)) : [];
    if (ids.length) files.set(file, ids);
    else files.delete(file);
  };
  const getServerFns = (): Record<string, string> => {
    if (!serverFnFiles) {
      serverFnFiles = new Map();
      const files = existsSync(src) ? (readdirSync(src, { recursive: true }) as string[]) : [];
      for (const file of files) {
        if (SOURCE.test(file) && !/(^|[\\/])(node_modules|\.)/.test(file)) readServerFns(normalizePath(join(src, file)), serverFnFiles);
      }
    }
    const map: Record<string, string> = {};
    for (const [file, ids] of serverFnFiles) for (const id of ids) map[id] = importPath(root, file);
    return map;
  };

  const template = () => {
    const file = join(src, "app.html");
    return existsSync(file) ? readFileSync(file, "utf8") : DEFAULT_TEMPLATE;
  };
  const middleware = () => {
    const file = ["ts", "js", "mts", "mjs"].map((ext) => join(src, `middleware.${ext}`)).find((f) => existsSync(f));
    return file ? importPath(root, file) : null;
  };
  const clientOut = () => resolve(root, config.environments.client.build.outDir);
  const serverOut = () => resolve(root, config.environments.ssr.build.outDir);

  const dev = () => config.command === "serve";
  const generate = (id: string): string | undefined => {
    if (id === CLIENT_ENTRY) return clientEntry(getScan(), root, { base: config.base, dev: dev() });
    if (id === SERVER_ENTRY) return serverEntry(adapter === "bun" ? "bun" : "node");
    if (id === HANDLER) {
      const assets = dev()
        ? devAssets(config.base)
        : assetsFromManifest(JSON.parse(readFileSync(join(clientOut(), ".vite/manifest.json"), "utf8")) as Manifest, getScan(), root, config.base);
      return handlerModule(getScan(), {
        root,
        serverFns: getServerFns(),
        template: dev() ? devTemplate(template(), config.base) : template(),
        assets,
        middleware: middleware(),
        base: config.base,
        dev: dev(),
      });
    }
  };

  /** Keeps src/routes.gen.d.ts in sync; only writes when it changes (no watcher loops). */
  const writeRouteTypes = () => {
    const file = join(src, "routes.gen.d.ts");
    const content = routesDts(getScan());
    if (existsSync(pages) && (!existsSync(file) || readFileSync(file, "utf8") !== content)) writeFileSync(file, content);
  };

  const devMiddleware = (server: ViteDevServer) => {
    const ssr = server.environments.ssr;
    // With a non-runnable SSR environment (Cloudflare's workerd), the environment's plugin serves requests.
    if (!isRunnableDevEnvironment(ssr)) return;
    server.middlewares.use(async (req, res, next) => {
      try {
        const { default: handler } = (await ssr.runner.import(HANDLER)) as { default: Handler };
        await sendResponse(res, await handler(toRequest(req), { req, res }));
      } catch (e) {
        next(e);
      }
    });
  };

  const watch = (server: ViteDevServer) => {
    const snapshot = () => {
      try {
        return VIRTUAL.map(generate).join("\n");
      } catch (e) {
        return String(e);
      }
    };
    let last = snapshot();
    const onFile = (file: string, removed = false) => {
      file = normalizePath(file);
      if (!file.startsWith(src + "/") || file.endsWith("/routes.gen.d.ts")) return;
      if (file.startsWith(pages + "/")) scan = undefined;
      if (SOURCE.test(file) && serverFnFiles) {
        if (removed) serverFnFiles.delete(file);
        else readServerFns(file, serverFnFiles);
      }
      const next = snapshot();
      if (next === last) return;
      last = next;
      try {
        writeRouteTypes();
      } catch (e) {
        server.config.logger.error(String(e));
      }
      for (const environment of Object.values(server.environments)) {
        for (const id of VIRTUAL) {
          const mod = environment.moduleGraph.getModuleById("\0" + id);
          if (mod) environment.moduleGraph.invalidateModule(mod);
        }
      }
      const ssr = server.environments.ssr;
      if (isRunnableDevEnvironment(ssr)) {
        const node = ssr.runner.evaluatedModules.getModuleById("\0" + HANDLER);
        if (node) ssr.runner.evaluatedModules.invalidateModule(node);
      }
      server.environments.client.hot.send({ type: "full-reload" });
    };
    server.watcher.on("add", (file) => onFile(file));
    server.watcher.on("change", (file) => onFile(file));
    server.watcher.on("unlink", (file) => onFile(file, true));
  };

  return [
    {
      name: "nuclo-pages",
      config() {
        return {
          appType: "custom",
          resolve: { dedupe: ["nuclo"] },
          builder: {
            // Client first: the server build reads its manifest (this also overrides
            // @cloudflare/vite-plugin's worker-first order). Prerendering needs both.
            async buildApp(builder) {
              await builder.build(builder.environments.client);
              await builder.build(builder.environments.ssr);
              const written = await prerender(config, getScan().routes, clientOut());
              if (written.length) config.logger.info(`[nuclo-pages] prerendered ${written.length} page(s)`);
            },
          },
          environments: {
            client: {
              build: { outDir: "dist/client", manifest: true, rolldownOptions: { input: CLIENT_ENTRY } },
            },
            // With Cloudflare, @cloudflare/vite-plugin owns the ssr (worker) environment's build.
            ...(adapter === "cloudflare"
              ? {}
              : {
                  ssr: {
                    build: {
                      outDir: "dist/server",
                      copyPublicDir: false,
                      rolldownOptions: {
                        input: { index: SERVER_ENTRY, handler: HANDLER },
                        output: { entryFileNames: "[name].mjs", chunkFileNames: "chunks/[name]-[hash].mjs" },
                      },
                    },
                  },
                }),
          },
        };
      },
      configResolved(resolved) {
        config = resolved;
        root = normalizePath(resolved.root);
        src = `${root}/src`;
        pages = `${src}/pages`;
        if (adapter === "cloudflare" && !resolved.plugins.some((plugin) => plugin.name.startsWith("vite-plugin-cloudflare"))) {
          throw new Error(
            '[nuclo-pages] adapter "cloudflare" needs @cloudflare/vite-plugin: plugins: [nucloPages({ adapter: "cloudflare" }), cloudflare({ viteEnvironment: { name: "ssr" } })]',
          );
        }
      },
      buildStart() {
        scan = undefined;
        serverFnFiles = undefined;
        writeRouteTypes();
      },
      resolveId(id) {
        if (VIRTUAL.includes(id)) return "\0" + id;
      },
      load(id) {
        if (id.startsWith("\0virtual:nuclo-pages/")) return generate(id.slice(1));
      },
      configureServer(server) {
        writeRouteTypes();
        watch(server);
        return () => devMiddleware(server);
      },
      configurePreviewServer(server) {
        if (adapter === "cloudflare") return;
        return () => {
          let handler: Promise<Handler> | undefined;
          server.middlewares.use(async (req, res, next) => {
            try {
              handler ??= import(pathToFileURL(join(serverOut(), "handler.mjs")).href).then((mod: { default: Handler }) => mod.default);
              await sendResponse(res, await (await handler)(toRequest(req), { req, res }));
            } catch (e) {
              next(e);
            }
          });
        };
      },
    },
    {
      name: "nuclo-pages:server-functions",
      resolveId: {
        order: "pre",
        handler(source, importer) {
          if (!importer || this.environment.config.consumer !== "client" || !SERVER_ONLY.test(source)) return;
          const file = normalizePath(importer.split("?")[0]);
          if (!file.startsWith(src + "/")) return;
          this.error(
            `${rel(file)} imports "${source}", which only exists on the server. Use it inside a $server() function, or in a module only server code imports.`,
          );
        },
      },
      transform: {
        filter: { id: { exclude: /[\\/]node_modules[\\/]/ }, code: /\$server\b/ },
        handler(code, id) {
          const file = normalizePath(id.split("?")[0]);
          if (id.startsWith("\0") || !SOURCE.test(file)) return;
          const target = this.environment.config.consumer === "client" ? "client" : "server";
          const result = transformServerFns(code, file, rel(file), target, dev());
          if (!result) return;
          if ("error" in result) this.error(`[nuclo-pages] ${result.error}`);
          return { code: result.code, map: null };
        },
      },
    },
  ];
}
