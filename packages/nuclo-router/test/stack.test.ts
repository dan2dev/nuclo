/**
 * The layer stack: push() / layer.close().
 *
 * The property that matters most is the one asserted by node identity below —
 * opening a layer must not rebuild the page underneath. view() is one list()
 * over the stack array, so a push is a pure insertion and the rows below keep
 * their DOM, their focus and their form state.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import "nuclo";
import { createRouter, type Layer, type PageComponent, type Route } from "../src/index";
import { deferred, flush, mount, useRouterEnv, waitFor } from "./helpers";

/** nuclo's <option> builder, aliased so it does not read like a variable. */
const optionEl = option;

const routes = useRouterEnv();

beforeEach(() => {
  layers = [];
});

async function start(router: { start(url?: string): Promise<Route> }, url?: string): Promise<Route> {
  const route = await router.start(url);
  routes.push(route);
  return route;
}

const Base: PageComponent = () => div({ id: "base" }, input({ id: "field" }));

/** Layers by depth, so a test can drive any one of them. */
let layers: Array<Layer | undefined> = [];

/** The pushed page: records its own Layer handle as it renders. */
const Modal: PageComponent = (_ctx, layer) => {
  layers[layer.depth] = layer;
  return div({ id: `modal-${layer.depth}` }, button({ id: `save-${layer.depth}` }, "save"));
};

function table() {
  return {
    "/": () => Base,
    "/other": () => (() => div({ id: "other" })) as PageComponent,
    "/modal": () => Modal,
    "/modal2": () => Modal,
  };
}

describe("push()", () => {
  it("opens a layer without rebuilding the page underneath", async () => {
    const route = await start(createRouter(table(), { preload: false }), "/");
    const container = mount();
    render(route.pages(), container);

    const baseNode = container.children[0];
    const field = baseNode.children[0] as HTMLInputElement;
    field.value = "typed by the user";
    field.focus();

    const pending = route.push("/modal");
    await flush();

    // The same node object, same value, still focused: nothing was rebuilt.
    expect(container.children[0]).toBe(baseNode);
    expect((baseNode.children[0] as HTMLInputElement).value).toBe("typed by the user");
    expect(document.activeElement).toBe(field);
    // And the layer is now above it.
    expect(container.children.length).toBe(2);
    expect(container.children[1].id).toBe("modal-1");
    expect(route.depth).toBe(2);

    route.stop();
    await pending;
  });

  it("resolves with whatever the layer closes with", async () => {
    const route = await start(createRouter(table(), { preload: false }), "/");
    render(route.pages(), mount());

    const pending = route.push<{ id: number }>("/modal");
    await flush();
    layers[1]!.close({ id: 7 });
    await flush();

    await expect(pending).resolves.toEqual({ id: 7 });
    expect(route.depth).toBe(1);
  });

  it("resolves with undefined when the layer is dismissed", async () => {
    const route = await start(createRouter(table(), { preload: false }), "/");
    render(route.pages(), mount());

    const pending = route.push("/modal");
    await flush();
    layers[1]!.close();
    await flush();

    await expect(pending).resolves.toBeUndefined();
    expect(route.depth).toBe(1);
  });

  it("puts the layer's URL in the address bar and reports it on the Route", async () => {
    const route = await start(createRouter(table(), { preload: false }), "/");
    render(route.pages(), mount());
    const pending = route.push("/modal?q=1");
    await flush();

    expect(window.location.pathname).toBe("/modal");
    expect(route.path).toBe("/modal");
    expect(route.pattern).toBe("/modal");
    expect(route.search.get("q")).toBe("1");

    layers[1]!.close();
    await pending;
    // Back to the page underneath.
    expect(route.path).toBe("/");
  });

  it("stacks several layers, each with its own depth", async () => {
    const route = await start(createRouter(table(), { preload: false }), "/");
    const container = mount();
    render(route.pages(), container);

    const first = route.push("/modal");
    await flush();
    const second = route.push("/modal2");
    await flush();

    expect(route.depth).toBe(3);
    expect([...container.children].map((c) => c.id)).toEqual(["base", "modal-1", "modal-2"]);

    // Closing the top leaves the one below open.
    layers[2]!.close("inner");
    await flush();
    await expect(second).resolves.toBe("inner");
    expect(route.depth).toBe(2);
    expect([...container.children].map((c) => c.id)).toEqual(["base", "modal-1"]);

    route.stop();
    await first;
  });

  it("closing a middle layer closes everything above it", async () => {
    const route = await start(createRouter(table(), { preload: false }), "/");
    render(route.pages(), mount());

    const first = route.push("/modal");
    await flush();
    const firstLayer = layers[1]!;
    const second = route.push("/modal2");
    await flush();

    firstLayer.close("from the middle");
    await flush();

    await expect(first).resolves.toBe("from the middle");
    // The layer above it was dismissed, not left orphaned.
    await expect(second).resolves.toBeUndefined();
    expect(route.depth).toBe(1);
  });

  it("shows route.pending while a layer's chunk loads, and opens nothing until it arrives", async () => {
    const gate = deferred<{ default: PageComponent }>();
    const router = createRouter({ "/": () => Base, "/modal": () => gate.promise }, { preload: false });
    const route = await start(router, "/");
    const container = mount();
    render(route.pages(), container);

    const pending = route.push("/modal");
    await flush();
    expect(route.pending).toBe(true);
    expect(route.depth).toBe(1);
    expect(container.children.length).toBe(1);
    // The URL is untouched until the module is in hand.
    expect(window.location.pathname).toBe("/");

    gate.resolve({ default: Modal });
    await flush();
    expect(route.pending).toBe(false);
    expect(route.depth).toBe(2);

    route.stop();
    await pending;
  });
});

describe("history", () => {
  it("Back closes the top layer and resolves it as dismissed", async () => {
    const route = await start(createRouter(table(), { preload: false }), "/");
    const container = mount();
    render(route.pages(), container);

    const pending = route.push("/modal");
    await flush();
    expect(route.depth).toBe(2);

    window.history.back();
    await waitFor(() => route.depth === 1);

    await expect(pending).resolves.toBeUndefined();
    expect(route.depth).toBe(1);
    expect(container.children.length).toBe(1);
  });

  it("an ordinary navigation replaces the stack and dismisses open layers", async () => {
    const route = await start(createRouter(table(), { preload: false }), "/");
    const container = mount();
    render(route.pages(), container);

    const pending = route.push("/modal");
    await flush();
    expect(route.depth).toBe(2);

    await route.go("/other");
    await flush();

    await expect(pending).resolves.toBeUndefined();
    expect(route.depth).toBe(1);
    expect(container.children.length).toBe(1);
    expect(container.children[0].id).toBe("other");
  });

  it("a popstate that lands on the row already showing keeps it, and does not scroll", async () => {
    const route = await start(createRouter(table(), { preload: false }), "/");
    const container = mount();
    render(route.pages(), container);
    const baseNode = container.children[0];
    (window.scrollTo as unknown as ReturnType<typeof vi.fn>).mockClear();

    // The URL has not changed — e.g. a popstate after a hash-only edit.
    window.dispatchEvent(new PopStateEvent("popstate"));
    await flush();

    expect(container.children[0]).toBe(baseNode);
    expect(route.path).toBe("/");
    // popstate never scrolls: the browser restores the position itself.
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("a layer opened cold starts at depth 1 — the stack below it is not reconstructible", async () => {
    // What a reload of a layer's URL looks like: history.state carries a depth
    // but the layers underneath are gone, so it renders standalone.
    window.history.replaceState({ nucloRouterDepth: 3 }, "", "/modal");
    const route = await start(createRouter(table(), { preload: false }));

    expect(route.path).toBe("/modal");
    expect(route.depth).toBe(1);
  });
});

describe("failures", () => {
  it("rejects when the href matches no route, and opens nothing", async () => {
    const route = await start(createRouter(table(), { preload: false }), "/");
    await expect(route.push("/nope")).rejects.toThrow(/no route matches/);
    expect(route.depth).toBe(1);
    expect(window.location.pathname).toBe("/");
  });

  it("rejects when the layer's module fails, leaving the URL and the stack alone", async () => {
    const router = createRouter(
      { "/": () => Base, "/modal": () => Promise.reject(new Error("chunk gone")) },
      { preload: false },
    );
    const route = await start(router, "/");

    await expect(route.push("/modal")).rejects.toThrow("chunk gone");
    expect(route.depth).toBe(1);
    expect(window.location.pathname).toBe("/");
    // A rejected push() is the caller's problem, not route.error's.
    expect(route.error).toBeNull();
    expect(route.pending).toBe(false);
  });

  it("close() on the base page is a no-op", async () => {
    let baseLayer: Layer | undefined;
    const router = createRouter(
      {
        "/": () => ((_ctx, layer) => {
          baseLayer = layer;
          return div({ id: "base" });
        }) as PageComponent,
      },
      { preload: false },
    );
    const route = await start(router, "/");
    render(route.pages(), mount());

    expect(baseLayer!.depth).toBe(0);
    expect(() => baseLayer!.close("ignored")).not.toThrow();
    expect(route.depth).toBe(1);
    expect(route.path).toBe("/");
  });

  it("stop() dismisses every open layer so no caller is left awaiting", async () => {
    const route = await start(createRouter(table(), { preload: false }), "/");
    render(route.pages(), mount());

    const first = route.push("/modal");
    await flush();
    const second = route.push("/modal2");
    await flush();
    expect(route.depth).toBe(3);

    route.stop();

    await expect(first).resolves.toBeUndefined();
    await expect(second).resolves.toBeUndefined();
    expect(route.depth).toBe(1);
  });

  it("a push overtaken by a navigation opens nothing", async () => {
    const gate = deferred<{ default: PageComponent }>();
    const router = createRouter(
      { "/": () => Base, "/other": () => (() => div({ id: "other" })) as PageComponent, "/modal": () => gate.promise },
      { preload: false },
    );
    const route = await start(router, "/");
    const container = mount();
    render(route.pages(), container);

    const pushed = route.push("/modal");
    await flush();
    expect(route.pending).toBe(true);

    // A real navigation lands while the layer's chunk is still in flight.
    await route.go("/other");
    gate.resolve({ default: Modal });

    // The layer is abandoned rather than opened on top of the new page.
    await expect(pushed).resolves.toBeUndefined();
    expect(route.depth).toBe(1);
    expect(route.path).toBe("/other");
    expect([...container.children].map((c) => c.id)).toEqual(["other"]);
  });

  it("a push whose module fails after stop() stays silent", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const gate = deferred<{ default: PageComponent }>();
    const router = createRouter({ "/": () => Base, "/modal": () => gate.promise }, { preload: false });
    const route = await start(router, "/");
    render(route.pages(), mount());

    const pushed = route.push("/modal");
    await flush();
    route.stop();
    gate.reject(new Error("too late"));

    // Still rejects for the caller that asked, but nothing is logged or
    // rendered by a Route that has been retired.
    await expect(pushed).rejects.toThrow("too late");
    expect(route.depth).toBe(1);
    expect(logged).not.toHaveBeenCalled();
  });

  it("a stale Layer handle used after stop() is inert", async () => {
    const route = await start(createRouter(table(), { preload: false }), "/");
    render(route.pages(), mount());

    const pushed = route.push("/modal");
    await flush();
    const layer = layers[1]!;

    route.stop();
    await pushed;

    // The page kept a reference to its layer; using it now must do nothing.
    expect(() => layer.close("late")).not.toThrow();
    expect(route.depth).toBe(1);
  });

  it("push() after stop() is inert", async () => {
    const route = await start(createRouter(table(), { preload: false }), "/");
    route.stop();
    await expect(route.push("/modal")).resolves.toBeUndefined();
    expect(route.depth).toBe(1);
  });
});

describe("Layer.push()", () => {
  it("lets a layer open a layer of its own, with no Route in sight", async () => {
    const results: unknown[] = [];

    // Depth 2: opened by the page at depth 1, which only ever had its Layer.
    const Inner: PageComponent = (_ctx, layer) => {
      layers[layer.depth] = layer;
      return div({ id: "inner" });
    };
    const Outer: PageComponent = (_ctx, layer) => {
      layers[layer.depth] = layer;
      return div(
        { id: "outer" },
        button({
          id: "open-inner",
          onClick: () => void layer.push<string>("/inner").then((r) => results.push(r)),
        }),
      );
    };

    const router = createRouter(
      { "/": () => Base, "/outer": () => Outer, "/inner": () => Inner },
      { preload: false },
    );
    const route = await start(router, "/");
    const container = mount();
    render(route.pages(), container);

    const outer = route.push("/outer");
    await flush();
    (container.querySelector("#open-inner") as HTMLButtonElement).click();
    await flush();

    expect(route.depth).toBe(3);
    expect([...container.children].map((c) => c.id)).toEqual(["base", "outer", "inner"]);

    layers[2]!.close("from the inner layer");
    // close() unwinds through history, which lands asynchronously.
    await waitFor(() => results.length > 0);
    expect(results).toEqual(["from the inner layer"]);
    // The layer that opened it is still open.
    expect(route.depth).toBe(2);

    route.stop();
    await outer;
  });
});

describe("the dropdown scenario", () => {
  it("a pushed form updates the page underneath without it ever closing", async () => {
    // The whole point of the feature, end to end: a select is missing an
    // option, a layer creates one, and the select is updated and left with the
    // new option selected — while never being rebuilt.
    const options: Array<{ id: string; label: string }> = [{ id: "a", label: "Alpha" }];
    let selected = "a";
    let createdCount = 0;

    const NewOption: PageComponent = (_ctx, layer) =>
      div(
        { id: "new-option" },
        button({
          id: "create",
          onClick: () => {
            createdCount++;
            layer.close({ id: `new-${createdCount}`, label: `Created ${createdCount}` });
          },
        }, "create"),
      );

    const Form: PageComponent = () =>
      div(
        { id: "form" },
        input({ id: "notes" }),
        select(
          { id: "picker", value: () => selected },
          list(
            () => options,
            (option) => optionEl({ value: option.id }, option.label),
          ),
        ),
      );

    const router = createRouter({ "/form": () => Form, "/options/new": () => NewOption }, { preload: false });
    const route = await start(router, "/form");
    const container = mount();
    render(route.pages(), container);

    const formNode = container.children[0];
    const notes = formNode.querySelector("#notes") as HTMLInputElement;
    notes.value = "half-written";
    const picker = formNode.querySelector("#picker") as HTMLSelectElement;
    expect(picker.options.length).toBe(1);

    // The page underneath does what an app would do.
    const created = await (async () => {
      const promise = route.push<{ id: string; label: string }>("/options/new");
      await flush();
      (container.querySelector("#create") as HTMLButtonElement).click();
      return promise;
    })();

    expect(created).toEqual({ id: "new-1", label: "Created 1" });

    options.push(created!);
    selected = created!.id;
    update();

    // Updated, selected — and the form was never rebuilt or cleared.
    expect(container.children.length).toBe(1);
    expect(container.children[0]).toBe(formNode);
    expect((formNode.querySelector("#notes") as HTMLInputElement).value).toBe("half-written");
    expect(picker.options.length).toBe(2);
    expect(picker.value).toBe("new-1");
    expect(route.depth).toBe(1);
    expect(route.path).toBe("/form");
  });
});
