import * as devalue from "devalue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __rpc, setBase } from "../../src/client/rpc";
import { error, redirect } from "../../src/index";
import { __serverFn } from "../../src/server/index";
import { isHttpError, isRedirect } from "../../src/shared/errors";
import { createApp } from "../helpers";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  setBase("/");
});
afterEach(() => vi.unstubAllGlobals());

describe("__rpc", () => {
  it("POSTs devalue-encoded arguments and decodes the result", async () => {
    fetchMock.mockResolvedValue(new Response(devalue.stringify({ at: new Date(1) })));
    const args = [1, new Date(0), new Map([["a", new Set([1])]]), undefined, 2n];
    await expect(__rpc("abc123")(...args)).resolves.toEqual({ at: new Date(1) });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/_server/abc123");
    expect(init).toMatchObject({ method: "POST", headers: { "content-type": "application/json", "x-nuclo-rpc": "1" } });
    expect(devalue.parse(init!.body as string)).toEqual(args);
  });

  it("adds the readable name (dev) and the base path", async () => {
    fetchMock.mockImplementation(async () => new Response(devalue.stringify(null)));
    await __rpc("id1", "src/server/posts.ts#getPost")();
    setBase("/app/");
    await __rpc("id2")();
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["/_server/id1?fn=src%2Fserver%2Fposts.ts%23getPost", "/app/_server/id2"]);
  });

  it("resolves undefined for an empty body", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    await expect(__rpc("x")()).resolves.toBeUndefined();
  });

  it("rejects with an HttpError carrying the server's message", async () => {
    fetchMock.mockResolvedValue(Response.json({ message: "Taken" }, { status: 409 }));
    const failure = await __rpc("x")().catch((e) => e);
    expect(isHttpError(failure)).toBe(true);
    expect(failure).toMatchObject({ status: 409, message: "Taken" });
  });

  it("falls back to the status text for non-JSON errors", async () => {
    fetchMock.mockResolvedValue(new Response("<html>proxy error</html>", { status: 502, statusText: "Bad Gateway" }));
    await expect(__rpc("x")()).rejects.toMatchObject({ status: 502, message: "Bad Gateway" });
  });

  it("rejects with a Redirect when the server redirects", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204, headers: { "x-nuclo-redirect": "/login" } }));
    const failure = await __rpc("x")().catch((e) => e);
    expect(isRedirect(failure)).toBe(true);
    expect(failure).toMatchObject({ location: "/login" });
  });

  it("propagates network failures", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(__rpc("x")()).rejects.toThrow("Failed to fetch");
  });

  it("round-trips through a real handler", async () => {
    const { handler } = createApp({ "index.ts": { default: () => p("x") } });
    fetchMock.mockImplementation((input, init) => handler(new Request(new URL(String(input), "http://localhost"), init)));
    __serverFn("rt-sum", (numbers: Set<number>) => ({ total: [...numbers].reduce((a, b) => a + b, 0), at: new Date(3) }));
    __serverFn("rt-fail", () => error(400, "Bad input"));
    __serverFn("rt-go", () => redirect("/next"));
    await expect(__rpc("rt-sum")(new Set([1, 2, 3]))).resolves.toEqual({ total: 6, at: new Date(3) });
    await expect(__rpc("rt-fail")()).rejects.toMatchObject({ status: 400, message: "Bad input" });
    await expect(__rpc("rt-go")()).rejects.toMatchObject({ location: "/next" });
  });
});
