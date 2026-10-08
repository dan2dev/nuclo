/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
/**
 * Regions on a server.
 *
 * `view()` finds its region by id through a registry, and a server renders
 * every request from one process — so a module-scope registry would be shared
 * by every request and every user at once. The failure mode is not a crash: a
 * `view("main", …)` in one request would find another request's region and
 * render one user's content into another user's page, or hold a finished
 * request's DOM alive for the life of the process.
 *
 * A server tree therefore uses a registry that lives and dies with its own
 * renderToString() call, which is also the only window in which its regions
 * can be looked up.
 */
import "../../src/polyfill";
import "../../src";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderToString } from "../../src/ssr/render-to-string";
import { getRegion } from "../../src/region/runtime";
import { serializingScratch } from "../../src/shared/serializing";

interface User { id: number; name: string; secret: string }

const users: User[] = [
  { id: 1, name: "Ada", secret: "ada-token" },
  { id: 2, name: "Grace", secret: "grace-token" },
  { id: 3, name: "Linus", secret: "linus-token" },
];

/** One shared component definition, rendered with request-scoped data. */
const Page = (user: User) => () =>
  div(
    { id: "app" },
    main(region({ id: "main" })),
    aside(region({ id: "side" })),
    view({
      main: div({ id: `user-${user.id}` }, user.name),
      side: span({ "data-secret": user.secret }, "session"),
    }),
  );

describe("region() — SSR request isolation", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it("gives each request only its own content", () => {
    const pages = users.map((user) => renderToString(Page(user)));

    for (const [i, html] of pages.entries()) {
      const mine = users[i];
      expect(html).toContain(`>${mine.name}<`);
      expect(html).toContain(mine.secret);
      for (const other of users) {
        if (other.id === mine.id) continue;
        expect(html).not.toContain(`>${other.name}<`);
        expect(html).not.toContain(other.secret);
      }
    }
  });

  it("registers nothing that outlives the request", () => {
    renderToString(Page(users[0]));

    // Nothing left in the scratch space the request used…
    expect(serializingScratch().size).toBe(0);
    // …and the page-lifetime registry never heard about the server's regions,
    // so a later lookup cannot reach that request's DOM.
    expect(getRegion("main")).toBeUndefined();
    expect(getRegion("side")).toBeUndefined();
  });

  it("cannot see a region from an earlier request", () => {
    // A tree whose region is declared in a *previous* render only.
    renderToString(Page(users[0]));
    const orphan = renderToString(() => div({ id: "app" }, view("main", div("leaked"))));

    // The view waits for a region that never comes: only its anchor is emitted.
    expect(orphan).not.toContain("leaked");
    expect(orphan).toMatch(/^<div id="app"><!--view-\d+--><\/div>$/);
  });

  it("never hands a view waiting in one request to a region in another", () => {
    // Request A has the view but no region; request B has the region.
    renderToString(() => div({ id: "app" }, view("main", div({ id: "leaked" }, "leaked"))));
    const other = renderToString(() => div({ id: "app" }, main(region({ id: "main", empty: p("nothing") }))));

    expect(other).not.toContain("leaked");
    expect(other).toContain("nothing");
    expect(serializingScratch().size).toBe(0);
  });

  it("renders a view written before its region", () => {
    const html = renderToString(() =>
      div({ id: "app" }, view("main", div({ id: "page" }, "page")), main(region({ id: "main" }))),
    );

    expect(html).toMatch(
      /^<div id="app"><!--view-\d+--><main><!--region-start-\d+-v1--><div id="page">(<!-- text-\d+ -->)?page<\/div><!--region-end--><\/main><\/div>$/,
    );
  });

  // The server's DOM is nuclo's own polyfill, which has to support the sibling
  // walk a region uses to replace what it holds — a plain client DOM does.
  describe("on the polyfill DOM", () => {
    it("drops the `empty` content once a view arrives", () => {
      const html = renderToString(() =>
        div(main(region({ id: "main", empty: p({ id: "none" }, "nothing") })), view("main", div({ id: "page" }, "page"))),
      );

      expect(html).not.toContain("nothing");
      expect(html).toMatch(/region-start-0-v1--><div id="page">/);
    });

    it("keeps only the newest view in a simple region", () => {
      const html = renderToString(() =>
        div(main(region({ id: "main" })), view("main", div({ id: "first" })), view("main", div({ id: "second" }))),
      );

      expect(html).not.toContain("first");
      expect(html).toMatch(/region-start-0-v1--><div id="second"><\/div><!--region-end-->/);
    });

    it("keeps every view of a stack, in arrival order", () => {
      const html = renderToString(() =>
        div(
          main(region({ id: "main", type: "stack" })),
          view("main", div({ id: "first" })),
          view("main", div({ id: "second" })),
        ),
      );

      expect(html).toMatch(/region-start-0-v2--><div id="first"><\/div><div id="second"><\/div><!--region-end-->/);
    });

    it("nests a region inside a view's content", () => {
      const html = renderToString(() =>
        div(
          main(region({ id: "main" })),
          view("main", div({ id: "inner-host" }, region({ id: "inner" }))),
          view("inner", span({ id: "deep" }, "deep")),
        ),
      );

      expect(html).toMatch(
        /<main><!--region-start-0-v1--><div id="inner-host"><!--region-start-\d+-v1--><span id="deep">(<!-- text-\d+ -->)?deep<\/span><!--region-end--><\/div><!--region-end--><\/main>/,
      );
    });

    it("places a view from inside another view's content after it", () => {
      const html = renderToString(() =>
        div(
          main(region({ id: "main", type: "stack" })),
          view("main", div({ id: "outer" }, view("main", div({ id: "inner" })))),
        ),
      );

      expect(html).toMatch(/region-start-0-v2--><div id="outer"><!--view-\d+--><\/div><div id="inner"><\/div><!--region-end-->/);
    });

    it("emits the anchor where the view was written", () => {
      const html = renderToString(() =>
        div(main(region({ id: "main" })), aside({ id: "from" }, view("main", span("page")))),
      );

      expect(html).toMatch(/<aside id="from"><!--view-\d+--><\/aside>/);
    });
  });

  it("keeps a nested renderToString() inside the same request", () => {
    // An inner render finishing must not clear the outer request's regions:
    // the outer tree is still being built around it.
    const html = renderToString(() =>
      div(
        { id: "app" },
        main(region({ id: "main" })),
        p(renderToString(() => span("inner")) ? "inner rendered" : ""),
        view("main", div({ id: "outer" }, "outer")),
      ),
    );

    // Between the outer region's markers, not dropped by the inner render.
    expect(html).toMatch(/region-start-0-v1--><div id="outer">(<!-- text-\d+ -->)?outer<\/div><!--region-end/);
    expect(warn).not.toHaveBeenCalled();
  });
});
