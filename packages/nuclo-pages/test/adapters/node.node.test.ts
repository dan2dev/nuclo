// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { sendResponse, serve, toRequest } from "../../src/adapters/node";

const servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))));
  vi.restoreAllMocks();
});

async function listen(server: Server): Promise<string> {
  servers.push(server);
  if (!server.listening) await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  else if (!(server.address() as AddressInfo | null)?.port) await new Promise((resolve) => server.once("listening", resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

/** A server that turns each request into a Fetch Request and hands it to `inspect`. */
async function capture(inspect: (request: Request, req: IncomingMessage) => Response | Promise<Response>) {
  return listen(createServer(async (req, res) => sendResponse(res, await inspect(toRequest(req), req))));
}

describe("toRequest", () => {
  it("carries method, URL, headers and a streamed body", async () => {
    let seen: { method: string; url: string; cookie: string | null; type: string | null; body: string } | undefined;
    const origin = await capture(async (request) => {
      seen = { method: request.method, url: request.url, cookie: request.headers.get("cookie"), type: request.headers.get("content-type"), body: await request.text() };
      return new Response("ok");
    });
    const body = "x".repeat(100_000);
    await fetch(`${origin}/path/to?q=1&r=%20`, { method: "POST", body, headers: { cookie: "a=1; b=2", "content-type": "text/plain" } });
    expect(seen).toEqual({
      method: "POST",
      url: `${origin}/path/to?q=1&r=%20`,
      cookie: "a=1; b=2",
      type: "text/plain",
      body,
    });
  });

  it("has no body for GET and HEAD", async () => {
    const bodies: (ReadableStream | null)[] = [];
    const origin = await capture((request) => (bodies.push(request.body), new Response("ok")));
    await fetch(origin);
    await fetch(origin, { method: "HEAD" });
    expect(bodies).toEqual([null, null]);
  });

  it("prefers Connect's originalUrl (Vite rewrites req.url)", async () => {
    let url = "";
    const origin = await listen(
      createServer(async (req, res) => {
        (req as IncomingMessage & { originalUrl?: string }).originalUrl = req.url;
        req.url = "/rewritten";
        url = toRequest(req).url;
        await sendResponse(res, new Response("ok"));
      }),
    );
    await fetch(`${origin}/original?x=1`);
    expect(url).toBe(`${origin}/original?x=1`);
  });
});

describe("sendResponse", () => {
  it("writes status, headers and every Set-Cookie", async () => {
    const origin = await capture(() => {
      const headers = new Headers({ "x-a": "1", "content-type": "text/plain" });
      headers.append("set-cookie", "a=1; Path=/");
      headers.append("set-cookie", "b=2; Path=/");
      return new Response("created", { status: 201, statusText: "Made It", headers });
    });
    const response = await fetch(origin);
    expect(response.status).toBe(201);
    expect(response.statusText).toBe("Made It");
    expect(response.headers.get("x-a")).toBe("1");
    expect(response.headers.getSetCookie()).toEqual(["a=1; Path=/", "b=2; Path=/"]);
    expect(await response.text()).toBe("created");
  });

  it("streams bodies chunk by chunk", async () => {
    const origin = await capture(() => {
      const encoder = new TextEncoder();
      let n = 0;
      const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
          await new Promise((resolve) => setTimeout(resolve, 5));
          if (n === 3) return controller.close();
          controller.enqueue(encoder.encode(`chunk${n++};`));
        },
      });
      return new Response(stream);
    });
    expect(await (await fetch(origin)).text()).toBe("chunk0;chunk1;chunk2;");
  });

  it("ends responses without a body", async () => {
    const origin = await capture(() => new Response(null, { status: 204 }));
    const response = await fetch(origin);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });
});

describe("serve", () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "nuclo-serve-"));
    mkdirSync(join(dir, "assets"));
    writeFileSync(join(dir, "assets/app.js"), "js!");
    writeFileSync(join(dir, "about.html"), "<p>prerendered</p>");
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("serves built files first, then the handler", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const handler = vi.fn(async (request: Request, platform?: object) =>
      Response.json({ path: new URL(request.url).pathname, platform: Object.keys(platform ?? {}) }),
    );
    const origin = await listen(serve(handler, { port: 0, host: "127.0.0.1", clientDir: dir }));

    const asset = await fetch(`${origin}/assets/app.js`);
    expect(await asset.text()).toBe("js!");
    expect(asset.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(await (await fetch(`${origin}/about`)).text()).toBe("<p>prerendered</p>");
    const head = await fetch(`${origin}/assets/app.js`, { method: "HEAD" });
    expect(head.headers.get("content-length")).toBe("3");
    expect(await head.text()).toBe("");
    expect(handler).not.toHaveBeenCalled();

    expect(await (await fetch(`${origin}/page`)).json()).toEqual({ path: "/page", platform: ["req", "res"] });
    // Only GET/HEAD are served statically.
    expect(await (await fetch(`${origin}/assets/app.js`, { method: "POST" })).json()).toEqual({ path: "/assets/app.js", platform: ["req", "res"] });
  });

  it("answers 500 when the handler throws", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const origin = await listen(serve(() => Promise.reject(new Error("boom")), { port: 0, host: "127.0.0.1" }));
    const response = await fetch(origin);
    expect(response.status).toBe(500);
    expect(log).toHaveBeenCalledWith(expect.objectContaining({ message: "boom" }));
  });
});
