/**
 * @vitest-environment jsdom
 */

/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "../../src/render";
import "../../src";

/**
 * region() marks a place; into() fills it from anywhere else in the tree.
 *
 * The invariant worth protecting is the one that makes regions worth having:
 * a view that arrives second must not rebuild the one that arrived first. A
 * stacked region is how the router opens a layer over a page, and the page
 * underneath has to keep its DOM, its focus and its form state.
 */
describe("region() / into()", () => {
  let container: HTMLDivElement;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    container.remove();
  });

  /** The region's content, markers excluded. */
  function contentOf(id = "main"): string {
    const host = container.querySelector(`#${id}-host`)!;
    return [...host.childNodes]
      .filter((n) => n.nodeType !== 8)
      .map((n) => (n as Element).outerHTML ?? n.textContent)
      .join("");
  }

  it("renders a view into the region, not where the into() sits", () => {
    render(
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        div({ id: "elsewhere" }, into("main", span({ id: "page" }, "hello"))),
      ),
      container,
    );

    expect(contentOf()).toBe('<span id="page">hello</span>');
    // The into() contributed nothing where it was written.
    expect(container.querySelector("#elsewhere")!.children.length).toBe(0);
  });

  it('shows `empty` until a view arrives, and drops it when one does', () => {
    let show = false;
    render(
      div(
        div({ id: "main-host" }, region({ id: "main", empty: p({ id: "none" }, "nothing open") })),
        when(() => show, into("main", span({ id: "page" }, "hi"))),
      ),
      container,
    );

    expect(contentOf()).toBe('<p id="none">nothing open</p>');

    show = true;
    update();
    expect(contentOf()).toBe('<span id="page">hi</span>');
  });

  it('"latest" keeps only the newest view', () => {
    render(
      div(
        div({ id: "main-host" }, region({ id: "main", type: "latest" })),
        into("main", span({ id: "first" }, "one")),
        into("main", span({ id: "second" }, "two")),
      ),
      container,
    );

    expect(contentOf()).toBe('<span id="second">two</span>');
  });

  it('"stack" renders every view in arrival order', () => {
    render(
      div(
        div({ id: "main-host" }, region({ id: "main", type: "stack" })),
        into("main", span({ id: "first" }, "one")),
        into("main", span({ id: "second" }, "two")),
      ),
      container,
    );

    expect(contentOf()).toBe('<span id="first">one</span><span id="second">two</span>');
  });

  it("does not rebuild the view underneath when another stacks on top", () => {
    let open = false;
    render(
      div(
        div({ id: "main-host" }, region({ id: "main", type: "stack" })),
        into("main", div({ id: "page" }, input({ id: "field" }))),
        when(() => open, into("main", div({ id: "layer" }, "on top"))),
      ),
      container,
    );

    const field = container.querySelector<HTMLInputElement>("#field")!;
    field.value = "typed";
    field.focus();

    open = true;
    update();

    // Same node, same value, same focus — not a re-render that happens to look alike.
    expect(container.querySelector("#field")).toBe(field);
    expect(field.value).toBe("typed");
    expect(document.activeElement).toBe(field);
    expect(container.querySelector("#layer")!.textContent).toBe("on top");
  });

  it("defaults to latest when no type is given", () => {
    render(
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        into("main", span("one")),
        into("main", span("two")),
      ),
      container,
    );

    expect(contentOf()).toBe("<span>two</span>");
  });

  // A zero-arity modifier is a reactive leaf to nuclo, re-invoked on every
  // pass. into() declaring one would quietly add its content to the region
  // again on every update() — the page renders fine the first time and the
  // region fills up with copies as the app is used.
  it("adds its content once, however many update() passes run", () => {
    render(
      div(
        div({ id: "main-host" }, region({ id: "main", type: "stack" })),
        into("main", span({ id: "page" }, "once")),
      ),
      container,
    );
    const page = container.querySelector("#page");

    update();
    update();

    expect(container.querySelectorAll("#page").length).toBe(1);
    expect(container.querySelector("#page")).toBe(page);
  });

  it("leaves a latest region's view in place across update()", () => {
    render(
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        into("main", input({ id: "field" })),
      ),
      container,
    );
    const field = container.querySelector<HTMLInputElement>("#field")!;
    field.value = "typed";

    update();

    expect(container.querySelector("#field")).toBe(field);
    expect(field.value).toBe("typed");
  });

  it("fills several regions from one into({ … })", () => {
    render(
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        div({ id: "aside-host" }, region({ id: "aside" })),
        into({
          main: div({ id: "page" }, "the page"),
          aside: div({ id: "links" }, "related"),
        }),
      ),
      container,
    );

    expect(contentOf()).toBe('<div id="page">the page</div>');
    expect(contentOf("aside")).toBe('<div id="links">related</div>');
  });

  it("takes several nodes per region in the object form", () => {
    render(
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        into({ main: [h1({ id: "title" }, "T"), p({ id: "body" }, "B")] }),
      ),
      container,
    );

    expect(contentOf()).toBe('<h1 id="title">T</h1><p id="body">B</p>');
  });

  it("routes an into() nested inside another view's content to its own region", () => {
    render(
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        div({ id: "aside-host" }, region({ id: "aside" })),
        into(
          "main",
          div({ id: "page" }, "the page", into("aside", span({ id: "links" }, "related"))),
        ),
      ),
      container,
    );

    // The nested view left only its anchor in the content it was written in.
    expect(contentOf()).toMatch(/^<div id="page">the page<!--view-\d+--><\/div>$/);
    expect(contentOf("aside")).toBe('<span id="links">related</span>');
  });

  // The shape a router page uses: the component returns its own placement
  // instead of being rendered where the router happens to sit.
  it("lets a component return an into() as its whole output", () => {
    const Page = () => into("main", div({ id: "page" }, "from the page"));
    let show = true;
    render(
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        when(() => show, Page()),
      ),
      container,
    );

    expect(contentOf()).toBe('<div id="page">from the page</div>');
  });

  it("replaces the page in a latest region when the next one arrives", () => {
    const Page = (name: string) => into("main", div({ id: name }, name));
    let current = "first";
    render(
      div(
        div({ id: "main-host" }, region({ id: "main", empty: span("none") })),
        list(() => [current], (name) => Page(name) as unknown as ListRenderResult),
      ),
      container,
    );
    expect(contentOf()).toBe('<div id="first">first</div>');

    current = "second";
    update();

    expect(contentOf()).toBe('<div id="second">second</div>');
  });

  it("renders nothing, silently, while no region owns the id", () => {
    render(div(div({ id: "main-host" }), into("nope", span("lost"))), container);

    expect(contentOf()).toBe("");
    expect(container.querySelector("span")).toBeNull();
    // Not a mistake to warn about: the region may simply not be built yet
    // (see region-order.test.ts).
    expect(warn).not.toHaveBeenCalled();
  });

  it("leaves only an anchor comment where the into() was written", () => {
    render(
      div(
        div({ id: "main-host" }, region({ id: "main" })),
        div({ id: "elsewhere" }, into("main", span({ id: "page" }, "hello"))),
      ),
      container,
    );

    const elsewhere = container.querySelector("#elsewhere")!;
    expect(elsewhere.childNodes.length).toBe(1);
    expect(elsewhere.firstChild!.nodeType).toBe(8);
    expect(elsewhere.firstChild!.textContent).toMatch(/^view-\d+$/);
  });

  it("warns when a region joins the document under an id already live there", () => {
    render(div(div({ id: "main-host" }, region({ id: "main" }))), container);
    const second = document.createElement("div");
    document.body.appendChild(second);
    render(div(div({ id: "other-host" }, region({ id: "main" }))), second);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('two regions share the id "main"'));
    second.remove();
  });

  it("is not fooled by a region that was replaced by a later render", () => {
    render(div(div({ id: "main-host" }, region({ id: "main" }))), container);
    container.innerHTML = "";
    render(div(div({ id: "main-host" }, region({ id: "main" })), into("main", span("second tree"))), container);

    expect(warn).not.toHaveBeenCalled();
    expect(contentOf()).toBe("<span>second tree</span>");
  });

  it("reaches a region nested deeper than the view that fills it", () => {
    render(
      div(
        section(article(div({ id: "main-host" }, region({ id: "main" })))),
        into("main", span({ id: "page" }, "deep")),
      ),
      container,
    );

    expect(contentOf()).toBe('<span id="page">deep</span>');
  });

  it("keeps the host's own later children out of the region", () => {
    render(
      div(
        div({ id: "main-host" }, region({ id: "main" }), span({ id: "after" }, "sibling")),
        into("main", span({ id: "page" }, "in")),
      ),
      container,
    );

    const host = container.querySelector("#main-host")!;
    const ids = [...host.children].map((c) => c.id);
    expect(ids).toEqual(["page", "after"]);
  });

  it("accepts an into() with no content", () => {
    render(
      div(div({ id: "main-host" }, region({ id: "main", empty: p({ id: "none" }, "nothing") })), into("main")),
      container,
    );

    expect(contentOf()).toBe("");
    expect(container.querySelector("#main-host")!.firstChild!.textContent).toBe("region-start-0-v1");
  });
});
