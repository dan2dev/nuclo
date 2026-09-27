// @vitest-environment node
import "nuclo/polyfill";
import "nuclo";
import * as devalue from "devalue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { error, isHttpError, redirect } from "../../src/index";
import { __serverFn, getRequestEvent } from "../../src/server/index";
import type { HandlerOptions } from "../../src/server/index";
import { createApp } from "../helpers";

afterEach(() => vi.restoreAllMocks());

const app = (options: Partial<HandlerOptions> = {}) => createApp({ "index.ts": { default: () => p("home") } }, options);

const NO_ARGS = devalue.stringify([]);

const call = (request: ReturnType<typeof app>["request"], id: string, body: string | null, headers: Record<string, string> = { "x-nuclo-rpc": "1" }) =>
  request(`/_server/${id}`, { method: "POST", headers, body });

describe("__serverFn", () => {
  it("returns an async in-process wrapper", async () => {
    const add = __serverFn("t-add", (a: number, b: number) => a + b);
    const result = add(1, 2);
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBe(3);
  });

  it("turns synchronous throws into rejections", async () => {
    const fail = __serverFn("t-fail", () => error(400, "bad"));
    const result = fail();
    await expect(result).rejects.toSatisfy(isHttpError);
  });
});

describe("POST /_server/<id>", () => {
  it("calls the function and round-trips rich values", async () => {
    __serverFn("t-echo", (value: unknown) => ({ value, at: new Date(0) }));
    const input = { map: new Map([[1, { deep: true }]]), set: new Set(["a"]), big: 12n, none: undefined, date: new Date(5) };
    const response = await call(app().request, "t-echo", devalue.stringify([input]));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(devalue.parse(await response.text())).toEqual({ value: input, at: new Date(0) });
  });

  it("calls with no arguments when the body is empty", async () => {
    const fn = vi.fn(() => "ok");
    __serverFn("t-empty", fn);
    const response = await call(app().request, "t-empty", null);
    expect(devalue.parse(await response.text())).toBe("ok");
    expect(fn).toHaveBeenCalledWith();
  });

  it("returns undefined as an empty value", async () => {
    __serverFn("t-void", () => undefined);
    const response = await call(app().request, "t-void", devalue.stringify([]));
    expect(response.status).toBe(200);
    expect(devalue.parse(await response.text())).toBeUndefined();
  });

  it("imports the module of a function nothing imported yet", async () => {
    const serverFns = { "t-lazy": vi.fn(async () => (__serverFn("t-lazy", () => "lazy"), {})) };
    const response = await call(app({ serverFns }).request, "t-lazy", devalue.stringify([]));
    expect(devalue.parse(await response.text())).toBe("lazy");
    expect(serverFns["t-lazy"]).toHaveBeenCalledTimes(1);
  });

  it("uses the latest registration (a module re-evaluated after an edit)", async () => {
    __serverFn("t-edit", () => "old");
    __serverFn("t-edit", () => "new");
    expect(devalue.parse(await (await call(app().request, "t-edit", NO_ARGS)).text())).toBe("new");
  });

  it("requires the x-nuclo-rpc header (CSRF guard)", async () => {
    const fn = vi.fn();
    __serverFn("t-csrf", fn);
    const response = await call(app().request, "t-csrf", NO_ARGS, { "content-type": "text/plain" });
    expect(response.status).toBe(403);
    expect(fn).not.toHaveBeenCalled();
  });

  it("only accepts POST", async () => {
    __serverFn("t-get", () => 1);
    const response = await app().request("/_server/t-get", { headers: { "x-nuclo-rpc": "1" } });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
  });

  it("answers 404 for unknown ids", async () => {
    const response = await call(app().request, "does-not-exist", NO_ARGS);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "Server function not found" });
  });

  it("rejects bodies that aren't a devalue-encoded array", async () => {
    const fn = vi.fn();
    __serverFn("t-body", fn);
    const { request } = app();
    expect((await call(request, "t-body", "not json")).status).toBe(400);
    expect((await call(request, "t-body", devalue.stringify({ a: 1 }))).status).toBe(400);
    expect((await call(request, "t-body", JSON.stringify("[1]"))).status).toBe(400);
    expect(fn).not.toHaveBeenCalled();
  });

  it("maps errors: HttpError status and message, unexpected errors hidden in production", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    __serverFn("t-http", () => error(409, "Taken"));
    __serverFn("t-crash", () => {
      throw new Error("db down");
    });
    const prod = app();
    const http = await call(prod.request, "t-http", NO_ARGS);
    expect(http.status).toBe(409);
    expect(await http.json()).toEqual({ message: "Taken" });
    const crash = await call(prod.request, "t-crash", NO_ARGS);
    expect(crash.status).toBe(500);
    expect(await crash.json()).toEqual({ message: "Internal Error" });
    expect(log).toHaveBeenCalledTimes(1);
    expect(await (await call(app({ dev: true }).request, "t-crash", NO_ARGS)).json()).toEqual({ message: "db down" });
  });

  it("signals redirects to the client", async () => {
    __serverFn("t-redirect", () => redirect("/login"));
    const response = await call(app().request, "t-redirect", NO_ARGS);
    expect(response.status).toBe(204);
    expect(response.headers.get("x-nuclo-redirect")).toBe("/login");
  });

  it("answers 500 when the result can't be serialized", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    __serverFn("t-fn", () => () => 1);
    expect((await call(app().request, "t-fn", NO_ARGS)).status).toBe(500);
  });

  it("gives the function the request event and merges its cookies and headers", async () => {
    __serverFn("t-login", (name: string) => {
      const event = getRequestEvent();
      event.cookies.set("session", `${name}:${event.request.headers.get("user-agent")}`);
      event.setHeaders({ "x-login": name });
      return event.cookies.get("session");
    });
    const response = await call(app().request, "t-login", devalue.stringify(["ana"]), { "x-nuclo-rpc": "1", "user-agent": "test" });
    expect(devalue.parse(await response.text())).toBe("ana:test");
    expect(response.headers.getSetCookie()).toEqual(["session=ana%3Atest; Path=/; HttpOnly; SameSite=Lax"]);
    expect(response.headers.get("x-login")).toBe("ana");
  });

  it("lives under the configured base path", async () => {
    __serverFn("t-base", () => "based");
    const { request } = app({ base: "/app/" });
    const response = await request("/app/_server/t-base", { method: "POST", headers: { "x-nuclo-rpc": "1" }, body: NO_ARGS });
    expect(devalue.parse(await response.text())).toBe("based");
    expect((await call(request, "t-base", NO_ARGS)).status).toBe(404);
  });
});
