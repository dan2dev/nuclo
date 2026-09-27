import { hydrate, render, update } from "nuclo";
import { renderToString } from "nuclo/ssr";
import { describe, expect, it, vi } from "vitest";
import {
  compose,
  defaultError,
  defaultLayout,
  errorLevel,
  firstFailure,
  layoutLevel,
  pageLevel,
  pick,
  runLoad,
  type Level,
  type Outlet,
} from "../../src/shared/compose";
import { createHttpError, createRedirect } from "../../src/shared/errors";
import type { RouteModule } from "../../src/shared/types";

const level = (key: string, view: Level["view"], props: Record<string, unknown> = {}): Level => ({ key, view, props });

/** Root layout → section layout → page, each with lifecycle spies. */
function app(page: { title: string; onDestroy?: () => void }, layout: { onDestroy?: () => void } = {}) {
  const data = { title: page.title };
  return {
    data,
    levels: [
      level("root", ({ children }) => div({ id: "root" }, header("Site"), main(children))),
      level("section", ({ children }) => section({ class: "section" }, on("destroy", () => layout.onDestroy?.()), children)),
      level(`page:${page.title}`, () => article(h1(() => data.title), p("static"), on("destroy", () => page.onDestroy?.()))),
    ],
  };
}

function serverRender(levels: Level[]): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = renderToString(compose(levels, []).create());
  document.body.replaceChildren(container);
  return container;
}

describe("compose + hydrate", () => {
  it("hydrates nested outlets onto the server markup without re-creating it", () => {
    const { levels, data } = app({ title: "Hello" });
    const container = serverRender(levels);
    const ssrRoot = container.firstElementChild;
    const ssrSection = container.querySelector("section");
    const ssrArticle = container.querySelector("article");

    const outlets: Outlet[] = [];
    hydrate(compose(levels, outlets).create(), container);

    expect(outlets).toHaveLength(2);
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toBe(ssrRoot);
    expect(container.querySelector("section")).toBe(ssrSection);
    expect(container.querySelector("article")).toBe(ssrArticle);
    expect(container.querySelectorAll("article")).toHaveLength(1);
    expect(container.textContent).toBe("SiteHellostatic");

    // Bindings were registered on the claimed nodes.
    data.title = "Changed";
    update();
    expect(container.querySelector("h1")!.textContent).toBe("Changed");
  });

  it("swapping an inner outlet keeps the outer layouts and destroys only the page", () => {
    const destroyPage = vi.fn();
    const destroyLayout = vi.fn();
    const first = app({ title: "One", onDestroy: destroyPage }, { onDestroy: destroyLayout });
    const container = serverRender(first.levels);
    const outlets: Outlet[] = [];
    hydrate(compose(first.levels, outlets).create(), container);
    const root = container.firstElementChild;
    const section = container.querySelector("section");
    const oldArticle = container.querySelector("article");

    const second = app({ title: "Two" });
    const levels = [...first.levels.slice(0, 2), second.levels[2]];
    outlets[1].items = [compose(levels, outlets, 2)];
    update();

    expect(container.firstElementChild).toBe(root);
    expect(container.querySelector("section")).toBe(section);
    expect(container.querySelector("article")).not.toBe(oldArticle);
    expect(container.querySelector("h1")!.textContent).toBe("Two");
    expect(container.querySelectorAll("article")).toHaveLength(1);
    expect(destroyPage).toHaveBeenCalledTimes(1);
    expect(destroyLayout).not.toHaveBeenCalled();
  });

  it("swapping a layout outlet remounts that layout and its page, innermost first", () => {
    const order: string[] = [];
    const first = app({ title: "One", onDestroy: () => order.push("page") }, { onDestroy: () => order.push("layout") });
    const container = serverRender(first.levels);
    const outlets: Outlet[] = [];
    hydrate(compose(first.levels, outlets).create(), container);
    const root = container.firstElementChild;
    const section = container.querySelector("section");

    const next = app({ title: "Other" });
    outlets[0].items = [compose(next.levels, outlets, 1)];
    update();

    expect(container.firstElementChild).toBe(root);
    expect(container.querySelector("section")).not.toBe(section);
    expect(container.querySelector("h1")!.textContent).toBe("Other");
    expect(order).toEqual(["page", "layout"]);
  });

  it("renders a single level without outlets", () => {
    const outlets: Outlet[] = [];
    const container = document.createElement("div");
    render(compose([level("only", () => div("alone"))], outlets).create(), container);
    expect(outlets).toHaveLength(0);
    expect(container.innerHTML).toBe("<div>alone</div>");
  });

  it("reports views that don't return an element", () => {
    const slot = compose([level("/broken", () => "text" as never)], []);
    expect(() => slot.create()).toThrow(/\/broken: a page or layout view must return an element/);
  });

  it("provides default layout and error views", () => {
    const outlets: Outlet[] = [];
    const container = document.createElement("div");
    render(compose([level("l", defaultLayout), level("e", defaultError, { status: 404, message: "Not Found" })], outlets).create(), container);
    expect(container.innerHTML.replace(/<!--[\s\S]*?-->/g, "")).toBe("<div><div><h1>404</h1><p>Not Found</p></div></div>");
  });
});

describe("levels", () => {
  const view = () => div();

  it("keys layouts by module and the params they consume", () => {
    const a = layoutLevel(3, { default: view }, ["org"], { org: "acme", id: "1" }, "data");
    expect(a.key).toBe(layoutLevel(3, { default: view }, ["org"], { org: "acme", id: "2" }, undefined).key);
    expect(a.key).not.toBe(layoutLevel(3, { default: view }, ["org"], { org: "other", id: "1" }, undefined).key);
    expect(a.key).not.toBe(layoutLevel(4, { default: view }, ["org"], { org: "acme" }, undefined).key);
    expect(a.props).toEqual({ data: "data", params: { org: "acme" } });
  });

  it("uses the default layout for the built-in root layout (-1)", () => {
    expect(layoutLevel(-1, {}, [], {}, undefined).view).toBe(defaultLayout);
  });

  it("keys pages by params, and by search only when they load data", () => {
    const url1 = new URL("http://x/p?tab=1");
    const url2 = new URL("http://x/p?tab=2");
    const withLoad: RouteModule = { default: view, load: () => 1 };
    const withoutLoad: RouteModule = { default: view };
    expect(pageLevel(1, withLoad, {}, url1, undefined).key).not.toBe(pageLevel(1, withLoad, {}, url2, undefined).key);
    expect(pageLevel(1, withoutLoad, {}, url1, undefined).key).toBe(pageLevel(1, withoutLoad, {}, url2, undefined).key);
    expect(pageLevel(1, withoutLoad, { a: "1" }, url1, undefined).key).not.toBe(pageLevel(1, withoutLoad, { a: "2" }, url1, undefined).key);
    expect(pageLevel(1, withLoad, { a: "1" }, url1, "d").props).toEqual({ data: "d", params: { a: "1" }, url: url1 });
  });

  it("requires a page view", () => {
    expect(() => pageLevel(7, {}, {}, new URL("http://x/"), undefined)).toThrow("Route module 7 has no default export");
  });

  it("gives every error level a unique key", () => {
    const a = errorLevel({}, 500, "x");
    const b = errorLevel({}, 500, "x");
    expect(a.key).not.toBe(b.key);
    expect(a.view).toBe(defaultError);
    expect(a.props).toEqual({ status: 500, message: "x" });
  });

  it("pick copies only the named params", () => {
    expect(pick({ a: "1", b: "2" }, ["a"])).toEqual({ a: "1" });
    expect(pick({ a: "1" }, [])).toEqual({});
  });
});

describe("runLoad / firstFailure", () => {
  it("runs load with the event, or resolves undefined without one", async () => {
    const load = vi.fn((event: { params: object }) => ({ got: event.params }));
    await expect(runLoad({ load: load as never }, { params: { a: 1 } })).resolves.toEqual({ got: { a: 1 } });
    await expect(runLoad({}, {})).resolves.toBeUndefined();
  });

  it("turns synchronous throws into rejections", async () => {
    const boom = new Error("boom");
    const promise = runLoad({ load: (() => { throw boom; }) as never }, {});
    await expect(promise).rejects.toBe(boom);
  });

  it("picks the shallowest redirect, else the shallowest error", async () => {
    const ok = { status: "fulfilled", value: 1 } as const;
    const fail = (reason: unknown) => ({ status: "rejected", reason }) as const;
    const e1 = createHttpError(500);
    const e2 = createHttpError(404);
    const r = createRedirect("/login");
    expect(firstFailure([ok, ok])).toBeUndefined();
    expect(firstFailure([ok, fail(e1), fail(e2)])).toEqual({ index: 1, reason: e1 });
    expect(firstFailure([fail(e1), ok, fail(r)])).toEqual({ index: 2, reason: r });
  });
});
