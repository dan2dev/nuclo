/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createListRuntime, sync } from "../../src/list/runtime";
import {
  ATTR_EVENT,
  LEAF_STRIDE,
  SLOT_ATTRS,
  SLOT_EVENT,
  analyzeFactory,
} from "../../src/list/template";
import { on } from "../../src/element/events";
import { update } from "../../src/update/update";
import { reactiveElementsByNode, reactiveTextNodesByNode } from "../../src/update/registry";
import "../../src/index";

/**
 * Row-template cloning: lists whose render function produces a supported
 * factory shape build row 1 normally and every other row as a skeleton clone
 * plus leaf patch. These tests pin:
 *  - activation (createElement is only called for the first row),
 *  - per-clone independence (events, reactive text/className),
 *  - skeleton scrubbing (row-1 state must not leak into later rows),
 *  - per-row static attribute divergence (compare-and-set corrects clones),
 *  - fallback for unsupported shapes and heterogeneous rows.
 */

declare const tr: ExpandedElementBuilder<"tr">;
declare const td: ExpandedElementBuilder<"td">;
declare const a: ExpandedElementBuilder<"a">;
declare const div: ExpandedElementBuilder<"div">;
declare const span: ExpandedElementBuilder<"span">;
declare const circleSvg: ExpandedSVGElementBuilder<"circle">;

interface Row {
  id: number;
  label: string;
}

describe("list row-template cloning", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("tbody") as unknown as HTMLElement;
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentNode) document.body.removeChild(container);
  });

  function benchRow(selected: () => number | null, clicks: number[]) {
    return (row: Row) =>
      tr(
        { className: () => (selected() === row.id ? "danger" : "") },
        td({ className: "col-md-1" }, String(row.id)),
        td({ className: "col-md-4" }, a({ onClick: () => { clicks.push(row.id); } }, () => row.label)),
        td({ className: "col-md-6" }),
      );
  }

  it("stores the normalized event property in the template program", () => {
    const template = analyzeFactory("button", [{ onClick: () => undefined }]);
    const slot = template?.slots[0];

    expect(slot?.kind).toBe(SLOT_ATTRS);
    if (slot?.kind !== SLOT_ATTRS) throw new Error("Expected an attribute slot");
    expect(slot.keys[0]).toMatchObject({
      key: "onClick",
      kind: ATTR_EVENT,
      value: "onclick",
    });
  });

  it("builds only the first row with createElement; the rest are clones", () => {
    const rows: Row[] = Array.from({ length: 10 }, (_, i) => ({ id: i, label: `L${i}` }));
    const clicks: number[] = [];
    const original = document.createElement.bind(document);
    let created = 0;
    document.createElement = ((tag: string) => { created++; return original(tag); }) as typeof document.createElement;
    try {
      createListRuntime(() => rows, benchRow(() => null, clicks), container as never, 0);
    } finally {
      document.createElement = original;
    }
    // Row 1 creates tr + 3 td + a = 5 elements; rows 2-10 create none.
    expect(created).toBe(5);
    expect(container.querySelectorAll("tr").length).toBe(10);
    expect(container.querySelectorAll("tr")[7].children[0].textContent).toBe("7");
    expect(container.querySelectorAll("tr")[7].children[1].textContent).toBe("L7");
  });

  it("gives every clone its own event handlers and reactive leaves", () => {
    let rows: Row[] = Array.from({ length: 5 }, (_, i) => ({ id: i, label: `L${i}` }));
    let selectedId: number | null = null;
    const clicks: number[] = [];
    createListRuntime(() => rows, benchRow(() => selectedId, clicks), container as never, 0);

    const trs = () => container.querySelectorAll("tr");
    trs()[3].querySelector("a")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    trs()[1].querySelector("a")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(clicks).toEqual([3, 1]);

    selectedId = 2;
    update();
    expect(trs()[2].className).toBe("danger");
    expect(trs()[0].className).toBe("");

    rows = rows.map((r) => (r.id === 4 ? { ...r, label: "CHANGED" } : r));
    update();
    expect(trs()[4].children[1].textContent).toBe("CHANGED");
    expect(trs()[3].children[1].textContent).toBe("L3");
  });

  it("moves the first template row's reactive leaves out of global registries", () => {
    const rows: Row[] = [
      { id: 0, label: "a" },
      { id: 1, label: "b" },
    ];
    let selectedId: number | null = 0;
    const runtime = createListRuntime(() => rows, benchRow(() => selectedId, []), container as never, 0);
    const firstRow = container.querySelector("tr") as HTMLElement;
    const firstLabel = firstRow.children[1].firstChild!.firstChild as Text;

    expect(runtime.records[0].dyn?.length).toBe(2 * LEAF_STRIDE);
    expect(reactiveElementsByNode.has(firstRow)).toBe(false);
    expect(reactiveTextNodesByNode.has(firstLabel)).toBe(false);

    selectedId = null;
    rows[0]!.label = "changed";
    update();

    expect(firstRow.className).toBe("");
    expect(firstRow.children[1].textContent).toBe("changed");
  });

  it("does not re-run freshly initialized template leaves in the same update pass", () => {
    let rows: Row[] = [];
    let classCalls = 0;
    let labelCalls = 0;
    createListRuntime(
      () => rows,
      (row: Row) =>
        tr(
          { className: () => { classCalls++; return row.id === -1 ? "danger" : ""; } },
          td({ className: "col-md-1" }, String(row.id)),
          td({ className: "col-md-4" }, a({ onClick: () => undefined }, () => { labelCalls++; return row.label; })),
        ),
      container as never,
      0,
    );

    rows = Array.from({ length: 4 }, (_, i) => ({ id: i, label: `L${i}` }));
    update();

    expect(container.querySelectorAll("tr").length).toBe(4);
    expect(classCalls).toBe(4);
    // One call per row, plus the first row's template-analysis probe.
    expect(labelCalls).toBe(5);

    // Each later update() evaluates every leaf exactly once.
    update();
    expect(classCalls).toBe(8);
    expect(labelCalls).toBe(9);
  });

  it("scrubs row-1 reactive state out of the skeleton", () => {
    // The first row rendered is selected — its "danger" class must not be
    // baked into the skeleton the other rows are cloned from.
    const rows: Row[] = [
      { id: 0, label: "a" },
      { id: 1, label: "b" },
      { id: 2, label: "c" },
    ];
    createListRuntime(() => rows, benchRow(() => 0, []), container as never, 0);
    const trs = container.querySelectorAll("tr");
    expect(trs[0].className).toBe("danger");
    expect(trs[1].className).toBe("");
    expect(trs[2].className).toBe("");
  });

  it("corrects per-row static attribute values on clones", () => {
    const rows: Row[] = Array.from({ length: 4 }, (_, i) => ({ id: i, label: `L${i}` }));
    createListRuntime(
      () => rows,
      (row: Row) => div({ className: `row-${row.id}`, "data-parity": row.id % 2 === 0 ? "even" : "odd" }, String(row.id)),
      container as never,
      0,
    );
    const divs = container.querySelectorAll("div");
    expect(divs.length).toBe(4);
    for (let i = 0; i < 4; i++) {
      expect(divs[i].className).toBe(`row-${i}`);
      expect(divs[i].getAttribute("data-parity")).toBe(i % 2 === 0 ? "even" : "odd");
      expect(divs[i].textContent).toBe(String(i));
    }
  });

  it("falls back to normal builds for unsupported shapes (style objects)", () => {
    const rows: Row[] = [
      { id: 0, label: "a" },
      { id: 1, label: "b" },
    ];
    const runtime = createListRuntime(
      () => rows,
      (row: Row) => div({ style: { color: "red" } }, row.label),
      container as never,
      0,
    );
    expect(runtime.template).toBeNull();
    const divs = container.querySelectorAll("div");
    expect(divs.length).toBe(2);
    expect(divs[0].style.color).toBe("red");
    expect(divs[1].style.color).toBe("red");
    expect(divs[1].textContent).toBe("b");
  });

  it("deactivates on heterogeneous rows and rebuilds them normally", () => {
    const rows: Row[] = Array.from({ length: 4 }, (_, i) => ({ id: i, label: `L${i}` }));
    const runtime = createListRuntime(
      () => rows,
      // Rows alternate shape: even rows have a span child, odd rows do not.
      (row: Row) => (row.id % 2 === 0
        ? div({ className: "even" }, span(row.label))
        : div({ className: "odd" }, row.label)),
      container as never,
      0,
    );
    expect(runtime.template).toBeNull();
    const divs = container.querySelectorAll("div");
    expect(divs.length).toBe(4);
    expect(divs[0].querySelector("span")!.textContent).toBe("L0");
    expect(divs[1].textContent).toBe("L1");
    expect(divs[1].querySelector("span")).toBeNull();
    expect(divs[3].textContent).toBe("L3");
  });

  it("rebuilds rows whose attribute keys change order or count", () => {
    const rows: Row[] = Array.from({ length: 4 }, (_, i) => ({ id: i, label: `L${i}` }));
    const runtime = createListRuntime(
      () => rows,
      (row: Row) => (row.id === 2
        ? div({ title: `t${row.id}`, className: `c${row.id}` }, row.label)
        : row.id === 3
          ? div({ className: `c${row.id}` }, row.label)
          : div({ className: `c${row.id}`, title: `t${row.id}` }, row.label)),
      container as never,
      0,
    );
    expect(runtime.template).toBeNull();
    const divs = container.querySelectorAll("div");
    expect(Array.from(divs, (d) => [d.className, d.getAttribute("title"), d.textContent])).toEqual([
      ["c0", "t0", "L0"],
      ["c1", "t1", "L1"],
      ["c2", "t2", "L2"],
      ["c3", null, "L3"],
    ]);
  });

  it("rebuilds rows when only the root tag changes", () => {
    createListRuntime(
      () => [false, true],
      (alternate) => alternate ? span("value") : div("value"),
      container as never,
      0,
    );
    expect(Array.from(container.children, (row) => row.tagName)).toEqual(["DIV", "SPAN"]);
  });

  it("keeps cloned rows fully diffable (swap, remove, clear)", () => {
    let rows: Row[] = Array.from({ length: 6 }, (_, i) => ({ id: i, label: `L${i}` }));
    const runtime = createListRuntime(() => rows, benchRow(() => null, []), container as never, 0);
    const texts = () => Array.from(container.querySelectorAll("tr")).map((r) => r.children[0].textContent);

    const swapped = rows.slice();
    const tmp = swapped[1];
    swapped[1] = swapped[4];
    swapped[4] = tmp;
    rows = swapped;
    sync(runtime);
    expect(texts()).toEqual(["0", "4", "2", "3", "1", "5"]);

    rows = rows.filter((r) => r.id !== 2);
    sync(runtime);
    expect(texts()).toEqual(["0", "4", "3", "1", "5"]);

    rows = [];
    sync(runtime);
    expect(container.querySelectorAll("tr").length).toBe(0);
    expect(container.contains(runtime.startMarker)).toBe(true);
    expect(container.contains(runtime.endMarker)).toBe(true);
  });

});

/**
 * on() event modifiers inside a row (the js-framework-benchmark Nuclo entry's
 * exact shape). They only attach a listener, so the template replays them on
 * each clone; behavior must match the normal per-row build exactly.
 */
describe("list row-template cloning with on() event modifiers", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("tbody") as unknown as HTMLElement;
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentNode) document.body.removeChild(container);
  });

  function jfbRow(selected: () => number | null, log: string[]) {
    return (row: Row) =>
      tr(
        { className: () => (selected() === row.id ? "danger" : "") },
        td({ className: "col-md-1" }, String(row.id)),
        td({ className: "col-md-4" }, a(on("click", () => { log.push(`select:${row.id}`); }), () => row.label)),
        td(
          { className: "col-md-1" },
          a(
            { className: "remove" },
            on("click", () => { log.push(`remove:${row.id}`); }),
            span({ className: "glyphicon glyphicon-remove", "aria-hidden": "true" }),
          ),
        ),
        td({ className: "col-md-6" }),
      );
  }

  const makeRows = (n: number): Row[] => Array.from({ length: n }, (_, i) => ({ id: i, label: `L${i}` }));
  const click = (el: Element) => el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  const selectAnchor = (row: Element) => row.children[1].firstElementChild!;
  const removeAnchor = (row: Element) => row.children[2].firstElementChild!;

  it("classifies native-event on() modifiers as event slots, and nothing else", () => {
    const eventTemplate = analyzeFactory("a", [on("click", () => undefined)]);
    expect(eventTemplate).not.toBeNull();
    expect(eventTemplate?.slots).toHaveLength(1);
    expect(eventTemplate?.slots[0]?.kind).toBe(SLOT_EVENT);
    expect(analyzeFactory("a", [on("click", () => undefined, { capture: true })])?.slots[0]?.kind).toBe(SLOT_EVENT);

    // Lifecycle pseudo-events and arbitrary NodeModFns still bail.
    expect(analyzeFactory("a", [on("mount", () => undefined)])).toBeNull();
    expect(analyzeFactory("a", [on("destroy", () => undefined)])).toBeNull();
    expect(analyzeFactory("a", [(_parent: unknown) => undefined])).toBeNull();
  });

  it("activates the template: only the first row calls createElement", () => {
    const rows = makeRows(10);
    const original = document.createElement.bind(document);
    let created = 0;
    document.createElement = ((tag: string) => { created++; return original(tag); }) as typeof document.createElement;
    let runtime: ReturnType<typeof createListRuntime> | undefined;
    try {
      runtime = createListRuntime(() => rows, jfbRow(() => null, []), container as never, 0);
    } finally {
      document.createElement = original;
    }
    // Row 1 creates tr + 4 td + 2 a + span = 8 elements; rows 2-10 create none.
    expect(created).toBe(8);
    expect(runtime?.template).toBeTruthy();
    const trs = container.querySelectorAll("tr");
    expect(trs.length).toBe(10);
    expect(trs[7].children[0].textContent).toBe("7");
    expect(trs[7].children[1].textContent).toBe("L7");
    expect(removeAnchor(trs[7]).className).toBe("remove");
    expect(removeAnchor(trs[7]).firstElementChild!.getAttribute("aria-hidden")).toBe("true");
  });

  it("keeps template rows out of the global reactive registries", () => {
    const rows = makeRows(5);
    const runtime = createListRuntime(() => rows, jfbRow(() => null, []), container as never, 0);
    for (const tr of Array.from(container.querySelectorAll("tr"))) {
      expect(reactiveElementsByNode.has(tr)).toBe(false);
      expect(reactiveTextNodesByNode.has(selectAnchor(tr).firstChild as Text)).toBe(false);
    }
    for (const record of runtime.records) expect(record.dyn?.length).toBe(2 * LEAF_STRIDE);
  });

  it("gives every clone its own listeners, with currentTarget set to the clone", () => {
    const rows = makeRows(5);
    const log: string[] = [];
    const targets: EventTarget[] = [];
    const thisValues: unknown[] = [];
    createListRuntime(
      () => rows,
      (row: Row) =>
        tr(
          td(a(on("click", function (this: unknown, e) {
            log.push(`select:${row.id}`);
            targets.push(e.currentTarget!);
            thisValues.push(this);
          }), () => row.label)),
        ),
      container as never,
      0,
    );
    const trs = container.querySelectorAll("tr");
    const anchor3 = trs[3].querySelector("a")!;
    const anchor0 = trs[0].querySelector("a")!;
    click(anchor3);
    click(anchor0);
    expect(log).toEqual(["select:3", "select:0"]);
    expect(targets).toEqual([anchor3, anchor0]);
    expect(thisValues).toEqual([anchor3, anchor0]);
  });

  it("attaches a shared (hoisted) on() modifier to every clone", () => {
    const rows = makeRows(4);
    const seen: Element[] = [];
    const shared = on("click", (e) => { seen.push(e.currentTarget as Element); });
    createListRuntime(() => rows, (row: Row) => div(shared, row.label), container as never, 0);
    const divs = Array.from(container.querySelectorAll("div"));
    divs.forEach(click);
    expect(seen).toEqual(divs);
  });

  it("honors listener options (capture, once) on clones like on the first row", () => {
    const rows = makeRows(3);
    const log: string[] = [];
    createListRuntime(
      () => rows,
      (row: Row) =>
        tr(
          on("click", () => { log.push(`capture:${row.id}`); }, { capture: true }),
          td(a(on("click", () => { log.push(`once:${row.id}`); }, { once: true }), row.label)),
        ),
      container as never,
      0,
    );
    const trs = container.querySelectorAll("tr");
    for (const index of [0, 2]) {
      const anchor = trs[index].querySelector("a")!;
      click(anchor);
      click(anchor);
    }
    expect(log).toEqual([
      "capture:0", "once:0", "capture:0",
      "capture:2", "once:2", "capture:2",
    ]);
  });

  it("keeps onClick attributes and on() listeners in the same order as the normal build", () => {
    const rows = makeRows(3);
    const log: string[] = [];
    createListRuntime(
      () => rows,
      (row: Row) =>
        tr(
          td(a({ onClick: () => { log.push(`attr-first:${row.id}`); } }, on("click", () => { log.push(`on-second:${row.id}`); }), "x")),
          td(a(on("click", () => { log.push(`on-first:${row.id}`); }), { onClick: () => { log.push(`attr-second:${row.id}`); } }, "y")),
        ),
      container as never,
      0,
    );
    const trs = container.querySelectorAll("tr");
    const clicksFor = (index: number): string[] => {
      log.length = 0;
      const anchors = trs[index].querySelectorAll("a");
      click(anchors[0]);
      click(anchors[1]);
      return log.map((entry) => entry.split(":")[0]);
    };
    // Row 0 is built normally; rows 1-2 are clones and must behave identically.
    const normal = clicksFor(0);
    expect(normal).toHaveLength(4);
    expect(clicksFor(1)).toEqual(normal);
    expect(clicksFor(2)).toEqual(normal);
  });

  it("detaches a removed row's listeners and keeps the others bound after swap/remove/clear", () => {
    let rows = makeRows(6);
    const log: string[] = [];
    const runtime = createListRuntime(() => rows, jfbRow(() => null, log), container as never, 0);
    const ids = () => Array.from(container.querySelectorAll("tr")).map((r) => r.children[0].textContent);

    const swapped = rows.slice();
    const tmp = swapped[1];
    swapped[1] = swapped[4];
    swapped[4] = tmp;
    rows = swapped;
    sync(runtime);
    expect(ids()).toEqual(["0", "4", "2", "3", "1", "5"]);
    click(selectAnchor(container.querySelectorAll("tr")[1]));
    click(removeAnchor(container.querySelectorAll("tr")[4]));
    expect(log).toEqual(["select:4", "remove:1"]);

    const removedRow = container.querySelectorAll("tr")[2];
    const removedAnchor = selectAnchor(removedRow);
    const removeSpy = vi.spyOn(removedAnchor, "removeEventListener");
    rows = rows.filter((r) => r.id !== 2);
    sync(runtime);
    expect(ids()).toEqual(["0", "4", "3", "1", "5"]);
    expect(removeSpy).toHaveBeenCalledWith("click", expect.any(Function), false);
    log.length = 0;
    click(removedAnchor);
    expect(log).toEqual([]);

    click(selectAnchor(container.querySelectorAll("tr")[2]));
    expect(log).toEqual(["select:3"]);

    rows = [];
    sync(runtime);
    expect(container.querySelectorAll("tr").length).toBe(0);
    expect(container.contains(runtime.startMarker)).toBe(true);
    expect(container.contains(runtime.endMarker)).toBe(true);
  });

  it("updates reactive leaves of on() rows through update()", () => {
    let rows = makeRows(4);
    let selectedId: number | null = null;
    createListRuntime(() => rows, jfbRow(() => selectedId, []), container as never, 0);
    const trs = () => container.querySelectorAll("tr");

    selectedId = 2;
    update();
    expect(trs()[2].className).toBe("danger");
    expect(trs()[1].className).toBe("");

    rows = rows.map((r) => (r.id === 3 ? { ...r, label: "CHANGED" } : r));
    update();
    expect(trs()[3].children[1].textContent).toBe("CHANGED");
    expect(trs()[0].children[1].textContent).toBe("L0");
  });

  it("falls back to normal builds when on() appears in only some rows", () => {
    for (const firstHasListener of [false, true]) {
      const host = document.createElement("div");
      document.body.appendChild(host);
      const log: number[] = [];
      const rows = makeRows(4);
      const runtime = createListRuntime(
        () => rows,
        (row: Row) => span((row.id % 2 === 0) === firstHasListener ? on("click", () => { log.push(row.id); }) : null, row.label),
        host as never,
        0,
      );
      expect(runtime.template).toBeNull();
      const spans = host.querySelectorAll("span");
      expect(Array.from(spans, (s) => s.textContent)).toEqual(["L0", "L1", "L2", "L3"]);
      spans.forEach(click);
      expect(log).toEqual(firstHasListener ? [0, 2] : [1, 3]);
      host.remove();
    }
  });

  it("does not template rows that use on(\"mount\")", () => {
    const rows = makeRows(3);
    const mounted: number[] = [];
    const runtime = createListRuntime(
      () => rows,
      (row: Row) => div(on("mount", () => { mounted.push(row.id); }), row.label),
      container as never,
      0,
    );
    expect(runtime.template).toBeNull();
    expect(container.querySelectorAll("div").length).toBe(3);
  });
});

describe("list row-template fallbacks", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("drops the template when a resolver's result kind changes between analysis and build", () => {
    // The first row's resolver runs twice: once to analyze the template (a
    // primitive → text slot) and once to build the row (a className object).
    // The built row no longer matches the analyzed shape, so the list stays on
    // the normal build path — and every row still renders correctly.
    let calls = 0;
    const flaky = () => (++calls === 1 ? "text" : { className: "cls" });
    let items = [1, 2, 3];
    const runtime = createListRuntime(() => items, () => span(flaky), container as never, 0);

    expect(runtime.template).toBeNull();
    const spans = Array.from(container.querySelectorAll("span"));
    expect(spans.map((s) => s.className)).toEqual(["cls", "cls", "cls"]);
    expect(spans.map((s) => s.textContent)).toEqual(["", "", ""]);

    items = [1, 2, 3, 4];
    sync(runtime);
    expect(container.querySelectorAll("span").length).toBe(4);
  });

  it("keeps SVG rows on the normal build path (SVG factories carry no template metadata)", () => {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(SVG_NS, "svg");
    container.appendChild(svg);
    const runtime = createListRuntime(() => [1, 2, 3], (n: number) => circleSvg({ r: n }), svg as never, 0);
    expect(runtime.template).toBeNull();
    const circles = Array.from(svg.querySelectorAll("circle"));
    expect(circles.map((c) => c.getAttribute("r"))).toEqual(["1", "2", "3"]);
    expect(circles.every((c) => c.namespaceURI === SVG_NS)).toBe(true);
  });

  it("drops an active template and builds a plain-element row normally", () => {
    let items: Array<number | string> = [1, 2];
    const runtime = createListRuntime(
      () => items,
      (item) => {
        if (typeof item === "string") {
          const el = document.createElement("span");
          el.textContent = item;
          return el as unknown as ExpandedElement<"span">;
        }
        return span(String(item));
      },
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();

    items = [1, 2, "plain"];
    sync(runtime);

    expect(runtime.template).toBeNull();
    expect(Array.from(container.querySelectorAll("span")).map((s) => s.textContent)).toEqual(["1", "2", "plain"]);
  });
});
