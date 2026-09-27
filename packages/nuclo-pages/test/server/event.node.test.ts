// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createEventState, getRequestEvent, runWithEvent } from "../../src/server/event";
import { route } from "../../src/shared/route-state";

const stateFor = (url = "http://localhost/", headers: Record<string, string> = {}, platform = {}) =>
  createEventState(new Request(url, { headers }), platform);

describe("createEventState", () => {
  it("exposes the request, url, platform and empty params/locals", () => {
    const platform = { env: { KEY: "v" } };
    const { event } = stateFor("http://localhost/a?b=1", {}, platform);
    expect(event.url.pathname).toBe("/a");
    expect(event.url.searchParams.get("b")).toBe("1");
    expect(event.request.url).toBe("http://localhost/a?b=1");
    expect(event.params).toEqual({});
    expect(event.locals).toEqual({});
    expect(event.platform).toBe(platform);
  });

  it("collects setHeaders, last value wins", () => {
    const state = stateFor();
    state.event.setHeaders({ "cache-control": "no-store", "x-a": "1" });
    state.event.setHeaders({ "x-a": "2" });
    expect(Object.fromEntries(state.headers)).toEqual({ "cache-control": "no-store", "x-a": "2" });
  });
});

describe("cookies", () => {
  it("parses the Cookie header", () => {
    const { event } = stateFor("http://localhost/", { cookie: 'a=1; b = two ;c="quoted"; d=hello%20world; e=%E0%A4%A; =skip; noequals; a=dup' });
    expect(event.cookies.get("a")).toBe("1"); // first occurrence wins
    expect(event.cookies.get("b")).toBe("two");
    expect(event.cookies.get("c")).toBe("quoted");
    expect(event.cookies.get("d")).toBe("hello world");
    expect(event.cookies.get("e")).toBe("%E0%A4%A"); // malformed encoding is kept raw
    expect(event.cookies.get("noequals")).toBeUndefined();
    expect(event.cookies.get("missing")).toBeUndefined();
  });

  it("works without a Cookie header", () => {
    expect(stateFor().event.cookies.get("a")).toBeUndefined();
  });

  it("serializes with safe defaults: Path=/, HttpOnly, SameSite=Lax, Secure only on https", () => {
    const http = stateFor("http://localhost/");
    http.event.cookies.set("session", "a b;c");
    expect(http.cookies).toEqual(["session=a%20b%3Bc; Path=/; HttpOnly; SameSite=Lax"]);

    const https = stateFor("https://localhost/");
    https.event.cookies.set("session", "x");
    expect(https.cookies).toEqual(["session=x; Path=/; HttpOnly; Secure; SameSite=Lax"]);
  });

  it("applies options", () => {
    const state = stateFor("https://localhost/");
    const expires = new Date(Date.UTC(2030, 0, 1));
    state.event.cookies.set("a", "1", { path: "/app", domain: "example.com", maxAge: 60.9, expires, httpOnly: false, secure: false, sameSite: "strict" });
    state.event.cookies.set("b", "2", { sameSite: "none" });
    expect(state.cookies).toEqual([
      "a=1; Path=/app; Domain=example.com; Max-Age=60; Expires=Tue, 01 Jan 2030 00:00:00 GMT; SameSite=Strict",
      "b=2; Path=/; HttpOnly; Secure; SameSite=None",
    ]);
  });

  it("reads back what was set or deleted in the same request", () => {
    const state = stateFor("http://localhost/", { cookie: "theme=dark" });
    state.event.cookies.set("theme", "light");
    expect(state.event.cookies.get("theme")).toBe("light");
    state.event.cookies.delete("theme");
    expect(state.event.cookies.get("theme")).toBeUndefined();
    expect(state.cookies[1]).toBe("theme=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
  });
});

describe("getRequestEvent", () => {
  it("throws outside of a request", () => {
    expect(() => getRequestEvent()).toThrow("outside of a request");
  });

  it("returns the current event across awaits", async () => {
    const state = stateFor("http://localhost/x");
    const seen = await runWithEvent(state, async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return getRequestEvent();
    });
    expect(seen).toBe(state.event);
  });

  it("keeps concurrent requests apart, including the route snapshot", async () => {
    const run = (id: string, delay: number) => {
      const state = stateFor(`http://localhost/${id}`);
      state.route = { id: "/[id]", url: state.event.url, params: { id }, pending: false };
      return runWithEvent(state, async () => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return [getRequestEvent().url.pathname, route.params.id];
      });
    };
    expect(await Promise.all([run("slow", 20), run("fast", 1)])).toEqual([
      ["/slow", "slow"],
      ["/fast", "fast"],
    ]);
    // Outside a request, route falls back to the (client) module state.
    expect(route.params).toEqual({});
  });
});
