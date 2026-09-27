// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { serve } from "../../src/adapters/bun";

// Only meaningful when the tests themselves run on Bun.
const bun = (globalThis as { Bun?: unknown }).Bun !== undefined;

describe.skipIf(!bun)("bun serve", () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "nuclo-bun-"));
    writeFileSync(join(dir, "hello.txt"), "static hello");
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("serves built files first, then the handler with the Bun server as platform", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const handler = vi.fn(async (request: Request, platform?: object) => Response.json({ path: new URL(request.url).pathname, platform: Object.keys(platform ?? {}) }));
    const server = serve(handler, { port: 0, host: "127.0.0.1", clientDir: dir }) as { port: number; stop(force?: boolean): void };
    try {
      const origin = `http://127.0.0.1:${server.port}`;
      const file = await fetch(`${origin}/hello.txt`);
      expect(await file.text()).toBe("static hello");
      expect(file.headers.get("content-type")).toBe("text/plain; charset=utf-8");
      expect(await (await fetch(`${origin}/hello.txt`, { method: "HEAD" })).text()).toBe("");
      expect(await (await fetch(`${origin}/x`)).json()).toEqual({ path: "/x", platform: ["server"] });
      expect(handler).toHaveBeenCalledTimes(1);
    } finally {
      server.stop(true);
    }
  });
});
