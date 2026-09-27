// @vitest-environment node
import * as devalue from "devalue";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createBuilder, createServer, type Plugin, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { nucloPages } from "../../src/vite/index";
import { serverFnId } from "../../src/vite/server-fns";

/** The fixture app, run through Vite's real dev server and a real build. */
const root = fileURLToPath(new URL("../fixtures/app", import.meta.url));
const rpc = (origin: string, name: string, args: unknown[]) =>
  fetch(`${origin}/_server/${serverFnId("src/server/counter.ts", name)}`, {
    method: "POST",
    headers: { "x-nuclo-rpc": "1" },
    body: devalue.stringify(args),
  });

describe("dev server", () => {
  let server: ViteDevServer;
  let origin: string;

  beforeAll(async () => {
    server = await createServer({ root, logLevel: "silent", server: { port: 0, host: "127.0.0.1" } });
    await server.listen();
    origin = server.resolvedUrls!.local[0].replace(/\/$/, "");
  }, 30_000);
  afterAll(() => server?.close());

  it("server-renders pages with the template, head, middleware and the dev client", async () => {
    const response = await fetch(`${origin}/`);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-fixture")).toBe("1");
    const html = await response.text();
    expect(html).toContain("<title>Fixture home</title>");
    expect(html).not.toContain("<title>Fixture</title>");
    expect(html).toContain('<script type="module" src="/@vite/client"></script>');
    expect(html).toContain('<script type="module" src="/@id/__x00__virtual:nuclo-pages/client-entry"></script>');
    expect(html.replace(/<!--[\s\S]*?-->/g, "")).toContain("<main><h1>Home</h1></main>");
  });

  it("renders dynamic routes, 404s and API routes", async () => {
    expect(await (await fetch(`${origin}/posts/hello`)).text()).toContain("HELLO");
    const missing = await fetch(`${origin}/posts/missing`);
    expect(missing.status).toBe(404);
    expect(await missing.text()).toContain("404 No such post");
    expect((await fetch(`${origin}/nope`)).status).toBe(404);
    expect(await (await fetch(`${origin}/api/health`)).json()).toEqual({ ok: true });
  });

  it("serves the client entry and strips server code from browser modules", async () => {
    const entry = await (await fetch(`${origin}/@id/__x00__virtual:nuclo-pages/client-entry`)).text();
    expect(entry).toContain("start(");
    const counter = await (await fetch(`${origin}/src/server/counter.ts`)).text();
    expect(counter).toContain("__rpc(");
    expect(counter).toContain("src/server/counter.ts#increment"); // readable name in dev
    for (const leak of ["SERVER_ONLY_SECRET", "node:crypto", "createHash", "count +="]) expect(counter).not.toContain(leak);
  });

  it("refuses to send server-only imports to the browser", async () => {
    const response = await fetch(`${origin}/src/lib/leak.ts`);
    expect(response.status).toBe(500);
    // Vite's error page embeds the message JSON-encoded.
    expect(await response.text()).toMatch(/src\/lib\/leak\.ts imports \\?"node:os\\?", which only exists on the server/);
  });

  it("calls server functions in-process during SSR, sharing state with RPC", async () => {
    const count = async () => /id="count">(?:<!--[^>]*-->)?(\d+) /.exec(await (await fetch(`${origin}/counter`)).text())?.[1];
    const before = Number(await count());
    const response = await rpc(origin, "increment", [5]);
    expect(response.status).toBe(200);
    expect(devalue.parse(await response.text())).toBe(before + 5);
    expect(Number(await count())).toBe(before + 5);
  });

  it("keeps route types up to date", () => {
    const types = readFileSync(join(root, "src/routes.gen.d.ts"), "utf8");
    expect(types).toContain('"/posts/[slug]": { slug: string };');
    expect(types).toContain('"/api/health": {};');
  });

  it("picks up added and removed pages", async () => {
    const file = join(root, "src/pages/added.ts");
    writeFileSync(file, 'export default () => h1("Added");\n');
    try {
      await vi.waitFor(async () => expect(await (await fetch(`${origin}/added`)).text()).toContain("Added"), { timeout: 10_000, interval: 100 });
      expect(readFileSync(join(root, "src/routes.gen.d.ts"), "utf8")).toContain('"/added": {};');
    } finally {
      rmSync(file);
    }
    await vi.waitFor(async () => expect((await fetch(`${origin}/added`)).status).toBe(404), { timeout: 10_000, interval: 100 });
    expect(readFileSync(join(root, "src/routes.gen.d.ts"), "utf8")).not.toContain("/added");
  });
});

describe("build", () => {
  const dist = join(root, "dist");
  const clientJs = () =>
    (readdirSync(join(dist, "client/assets")) as string[])
      .filter((file) => file.endsWith(".js"))
      .map((file) => readFileSync(join(dist, "client/assets", file), "utf8"))
      .join("\n");

  beforeAll(async () => {
    rmSync(dist, { recursive: true, force: true });
    const builder = await createBuilder({ root, logLevel: "silent" });
    await builder.buildApp();
  }, 120_000);

  it("writes the client, the server entry and the handler", () => {
    for (const file of ["client/.vite/manifest.json", "server/index.mjs", "server/handler.mjs"]) expect(existsSync(join(dist, file)), file).toBe(true);
    expect(existsSync(join(dist, "server/assets"))).toBe(false); // no public/asset copies on the server
  });

  it("keeps server code out of the browser bundle", () => {
    const js = clientJs();
    // The stub is minified, but it calls the function by id.
    expect(js).toContain(serverFnId("src/server/counter.ts", "increment"));
    for (const leak of ["SERVER_ONLY_SECRET", "node:crypto", "createHash", "node:os", "src/server/counter.ts#"]) expect(js).not.toContain(leak);
  });

  it("prerenders static pages and the dynamic pages they link to", () => {
    const page = (file: string) => readFileSync(join(dist, "client", file), "utf8");
    expect(page("index.html")).toContain("<title>Fixture home</title>");
    expect(page("posts.html")).toContain('href="/posts/hello"');
    expect(page("posts/hello.html")).toContain("HELLO");
    expect(page("posts/world.html")).toContain("WORLD");
    expect(existsSync(join(dist, "client/counter.html"))).toBe(false); // not prerendered
    expect(existsSync(join(dist, "client/posts/missing.html"))).toBe(false);
  });

  it("serves pages, assets, API routes and server functions from the built handler", async () => {
    const { default: handler } = (await import(pathToFileURL(join(dist, "server/handler.mjs")).href)) as { default: (request: Request) => Promise<Response> };
    const origin = "http://localhost";
    const html = await (await handler(new Request(`${origin}/counter`))).text();
    const manifest = JSON.parse(readFileSync(join(dist, "client/.vite/manifest.json"), "utf8")) as Record<string, { file: string; isEntry?: boolean }>;
    const entry = Object.values(manifest).find((chunk) => chunk.isEntry)!;
    expect(html).toContain(`<script type="module" src="/${entry.file}"></script>`);
    expect(html).toContain(`<link rel="modulepreload" href="/${manifest["src/pages/counter.ts"].file}">`);
    expect(html).not.toContain("@vite/client");
    expect(await (await handler(new Request(`${origin}/api/health`))).json()).toEqual({ ok: true });
    const call = await handler(
      new Request(`${origin}/_server/${serverFnId("src/server/counter.ts", "increment")}`, {
        method: "POST",
        headers: { "x-nuclo-rpc": "1" },
        body: devalue.stringify([2]),
      }),
    );
    expect(devalue.parse(await call.text())).toBe(2);
  });
});

describe("configuration", () => {
  const plugin = (options?: Parameters<typeof nucloPages>[0]) => nucloPages(options)[0] as Plugin & { config: () => Record<string, any> };

  it("builds the client, then the server, with the app builder", () => {
    const config = plugin().config();
    expect(config.appType).toBe("custom");
    expect(typeof config.builder.buildApp).toBe("function");
    expect(config.environments.client.build).toMatchObject({ outDir: "dist/client", manifest: true, rolldownOptions: { input: "virtual:nuclo-pages/client-entry" } });
    expect(config.environments.ssr.build).toMatchObject({ outDir: "dist/server", copyPublicDir: false });
  });

  it("leaves the server environment to @cloudflare/vite-plugin", async () => {
    expect(plugin({ adapter: "cloudflare" }).config().environments.ssr).toBeUndefined();
    await expect(createServer({ root, logLevel: "silent", configFile: false, plugins: [nucloPages({ adapter: "cloudflare" })] })).rejects.toThrow(
      'adapter "cloudflare" needs @cloudflare/vite-plugin',
    );
  });
});
