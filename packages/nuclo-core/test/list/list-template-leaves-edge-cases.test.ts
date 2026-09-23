/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Edge cases for template rows' flat leaf storage (RowLeaves / LEAF_STRIDE),
 * the shared leafScratch collection buffer, and the skeleton's reactive-class
 * scrub (the class attribute is removed instead of set to "").
 *
 * A row's dynamic leaves live in one flat array [kind, node, fn, last, ...]
 * owned by its list record. These tests pin the layout, flush semantics
 * (sanitising, error tolerance, write-on-change only), that records keep
 * flushing after the template is deactivated, that the scratch buffer is
 * re-entrant and never leaks entries between rows, and that cloned rows carry
 * exactly the class attributes a normally built row would.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createListRuntime, sync } from "../../src/list/runtime";
import { LEAF_CLASSNAME, LEAF_STRIDE, LEAF_TEXT } from "../../src/list/template";
import { update } from "../../src/update/update";
import "../../src/index";

declare const tr: ExpandedElementBuilder<"tr">;
declare const td: ExpandedElementBuilder<"td">;
declare const div: ExpandedElementBuilder<"div">;
declare const span: ExpandedElementBuilder<"span">;
declare const p: ExpandedElementBuilder<"p">;

interface Row {
  id: number;
  label: string;
}

const makeRows = (n: number, from = 0): Row[] => Array.from({ length: n }, (_, i) => ({ id: from + i, label: `L${from + i}` }));

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  container.remove();
});

describe("RowLeaves layout", () => {
  it("stores null (no array at all) for template rows without dynamic leaves", () => {
    const rows = makeRows(3);
    const runtime = createListRuntime(() => rows, (row: Row) => div({ className: "static" }, span(row.label)), container as never, 0);
    expect(runtime.template).toBeTruthy();
    for (const record of runtime.records) expect(record.dyn).toBeNull();
  });

  it("lays leaves out as [kind, node, fn, last] in slot order, identically for the first row and clones", () => {
    const rows = makeRows(3);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) =>
        tr(
          { className: () => (row.id === 0 ? "first" : "") },
          td(() => `a${row.id}`),
          td(span(() => `b${row.id}`)),
          td({ className: () => `cell-${row.id}` }, `c${row.id}`),
        ),
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();

    runtime.records.forEach((record, index) => {
      const dyn = record.dyn!;
      const row = record.element as unknown as HTMLTableRowElement;
      expect(dyn.length).toBe(4 * LEAF_STRIDE);
      expect([dyn[0], dyn[4], dyn[8], dyn[12]]).toEqual([LEAF_CLASSNAME, LEAF_TEXT, LEAF_TEXT, LEAF_CLASSNAME]);
      expect(dyn[1]).toBe(row);
      expect(dyn[5]).toBe(row.children[0]!.firstChild);
      expect(dyn[9]).toBe(row.children[1]!.firstElementChild!.firstChild);
      expect(dyn[13]).toBe(row.children[2]);
      expect(typeof dyn[2]).toBe("function");
      expect(dyn[3]).toBe(index === 0 ? "first" : "");
      expect(dyn[7]).toBe(`a${index}`);
      expect(dyn[11]).toBe(`b${index}`);
      expect(dyn[15]).toBe(`cell-${index}`);
    });
  });

  it("keeps an exact-size leaf array per row across many rows", () => {
    const rows = makeRows(50);
    const runtime = createListRuntime(() => rows, (row: Row) => div(span(() => row.label), p(() => row.id)), container as never, 0);
    expect(runtime.template).toBeTruthy();
    expect(runtime.records.every((record) => record.dyn!.length === 2 * LEAF_STRIDE)).toBe(true);
  });
});

describe("flushRowLeaves semantics", () => {
  it("updates each leaf independently", () => {
    const rows = makeRows(4).map((r) => ({ ...r, a: "a", b: "b" }));
    const runtime = createListRuntime(() => rows, (row) => div(span(() => row.a), span(() => row.b)), container as never, 0);
    expect(runtime.template).toBeTruthy();
    rows[2]!.b = "B!";
    update();
    const texts = Array.from(container.children, (el) => el.textContent);
    expect(texts).toEqual(["ab", "ab", "aB!", "ab"]);
  });

  it("keeps a throwing leaf's previous value while later leaves of the same row still flush", () => {
    let fail = false;
    const rows = makeRows(3).map((r) => ({ ...r, other: "o" }));
    const runtime = createListRuntime(
      () => rows,
      (row) => div(span(() => { if (fail && row.id === 1) throw new Error("resolver failed"); return row.label; }), span(() => row.other)),
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();
    for (const row of rows) { row.label += "*"; row.other = "O"; }
    fail = true;
    update();
    expect(Array.from(container.children, (el) => el.textContent)).toEqual(["L0*O", "L1O", "L2*O"]);

    fail = false;
    update();
    expect(container.children[1]!.textContent).toBe("L1*O");
  });

  it("renders nullish and non-primitive text results as empty strings, other primitives via String()", () => {
    let value: unknown = "start";
    const rows = makeRows(2);
    // Typed as string for the builder; the flush sees whatever `value` holds.
    const runtime = createListRuntime(() => rows, () => div(span(() => value as string)), container as never, 0);
    expect(runtime.template).toBeTruthy();
    const cases: Array<[unknown, string]> = [
      [null, ""], [undefined, ""], [{ a: 1 }, ""], [[1, 2], ""], [() => "fn", ""],
      [0, "0"], [false, "false"], [NaN, "NaN"], [12.5, "12.5"], ["", ""], ["back", "back"],
    ];
    for (const [next, expected] of cases) {
      value = next;
      update();
      expect(Array.from(container.children, (el) => el.textContent)).toEqual([expected, expected]);
    }
  });

  it("renders falsy className results as no class and stringifies truthy ones", () => {
    let value: unknown = "start";
    const rows = makeRows(2);
    const runtime = createListRuntime(() => rows, () => div({ className: () => value as string }, "x"), container as never, 0);
    expect(runtime.template).toBeTruthy();
    const cases: Array<[unknown, string]> = [
      [0, ""], [null, ""], [undefined, ""], [false, ""], [NaN, ""], ["", ""],
      [5, "5"], [true, "true"], ["a b", "a b"],
    ];
    for (const [next, expected] of cases) {
      value = next;
      update();
      expect(Array.from(container.children, (el) => el.className)).toEqual([expected, expected]);
    }
  });

  it("does not touch the DOM when a resolver's value is unchanged", () => {
    let selected: number | null = null;
    const rows = makeRows(20);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) => tr({ className: () => (selected === row.id ? "danger" : "") }, td(() => row.label)),
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();
    const observer = new MutationObserver(() => {});
    observer.observe(container, { subtree: true, childList: true, characterData: true, attributes: true });

    update();
    update();
    expect(observer.takeRecords()).toHaveLength(0);

    rows[7]!.label = "changed";
    update();
    const textRecords = observer.takeRecords();
    expect(textRecords).toHaveLength(1);
    expect(textRecords[0]!.type).toBe("characterData");

    selected = 3;
    update();
    selected = 4;
    update();
    const classRecords = observer.takeRecords();
    // 3: "" -> danger; then 3: danger -> "" and 4: "" -> danger.
    expect(classRecords.map((r) => r.type)).toEqual(["attributes", "attributes", "attributes"]);
    observer.disconnect();
  });

  it("keeps flushing template-built rows after the template is deactivated", () => {
    let selected: number | null = null;
    let rows = makeRows(3);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) => (row.id >= 100
        ? p({ className: () => (selected === row.id ? "on" : "") }, () => row.label)
        : div({ className: () => (selected === row.id ? "on" : "") }, () => row.label)),
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();
    rows = [...rows, ...makeRows(1, 100)];
    sync(runtime);
    expect(runtime.template).toBeNull();

    selected = 1;
    rows[0]!.label = "zero!";
    rows[3]!.label = "hundred!";
    update();
    expect(Array.from(container.children, (el) => [el.className, el.textContent])).toEqual([
      ["", "zero!"],
      ["on", "L1"],
      ["", "L2"],
      ["", "hundred!"],
    ]);
  });
});

describe("leafScratch — re-entrancy and failure paths", () => {
  it("collects correct leaves when a resolver renders another list mid-row", () => {
    const rendered = new Set<number>();
    const innerHosts: HTMLElement[] = [];
    const innerRuntimes: Array<{ records: ReadonlyArray<{ dyn?: readonly unknown[] | null }> }> = [];
    const inner = [{ label: "i0" }, { label: "i1" }, { label: "i2" }];
    const rows = makeRows(4);

    const runtime = createListRuntime(
      () => rows,
      (row: Row) =>
        div(
          { className: () => `outer-${row.id}` },
          span(() => {
            // Rendering a nested list here pushes the inner rows' leaves into
            // the same scratch buffer while this row's className leaf is
            // already collected in it.
            if (!rendered.has(row.id)) {
              rendered.add(row.id);
              const host = document.createElement("div");
              document.body.appendChild(host);
              innerHosts.push(host);
              innerRuntimes.push(createListRuntime(() => inner, (item) => span(() => item.label), host as never, 0));
            }
            return row.label;
          }),
        ),
      container as never,
      0,
    );

    try {
      expect(runtime.template).toBeTruthy();
      runtime.records.forEach((record, index) => {
        const dyn = record.dyn!;
        expect(dyn.length).toBe(2 * LEAF_STRIDE);
        expect([dyn[0], dyn[4]]).toEqual([LEAF_CLASSNAME, LEAF_TEXT]);
        expect(dyn[3]).toBe(`outer-${index}`);
        expect(dyn[7]).toBe(`L${index}`);
      });
      for (const innerRuntime of innerRuntimes) {
        expect(innerRuntime.records.map((r) => r.dyn?.length)).toEqual([LEAF_STRIDE, LEAF_STRIDE, LEAF_STRIDE]);
      }

      rows[2]!.label = "outer changed";
      inner[1]!.label = "inner changed";
      update();
      expect(container.children[2]!.textContent).toBe("outer changed");
      expect(container.children[2]!.className).toBe("outer-2");
      for (const host of innerHosts) {
        expect(Array.from(host.children, (el) => el.textContent)).toEqual(["i0", "inner changed", "i2"]);
      }
    } finally {
      for (const host of innerHosts) host.remove();
    }
  });

  it("leaves no stray scratch entries behind when a clone fails mid-row", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let selected: number | null = null;
    const rows = makeRows(4);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) =>
        div(
          { className: () => (selected === row.id ? "on" : "") },
          span(() => { if (row.id === 2) throw new Error("bad row"); return row.label; }),
        ),
      container as never,
      0,
    );

    // Row 2's clone failed after its className leaf was collected: the
    // template deactivates and rows 2+ are built normally.
    expect(runtime.template).toBeNull();
    expect(runtime.records.map((r) => r.dyn?.length ?? null)).toEqual([2 * LEAF_STRIDE, 2 * LEAF_STRIDE, null, null]);
    expect(Array.from(container.children, (el) => el.textContent)).toEqual(["L0", "L1", "", "L3"]);
    expect(errors).toHaveBeenCalled();

    selected = 3;
    rows[0]!.label = "zero";
    rows[3]!.label = "three";
    update();
    expect(Array.from(container.children, (el) => [el.className, el.textContent])).toEqual([
      ["", "zero"],
      ["", "L1"],
      ["", ""],
      ["on", "three"],
    ]);

    // A later list reusing the (module-level) scratch buffer starts clean.
    const other = document.createElement("div");
    document.body.appendChild(other);
    const next = createListRuntime(() => makeRows(3), (row: Row) => span(() => row.label), other as never, 0);
    expect(next.records.map((r) => r.dyn!.length)).toEqual([LEAF_STRIDE, LEAF_STRIDE, LEAF_STRIDE]);
    expect(next.records.map((r) => r.dyn![3])).toEqual(["L0", "L1", "L2"]);
    other.remove();
  });
});

describe("reactive-class scrub in the skeleton", () => {
  it("gives the skeleton and every unselected row no class attribute at all", () => {
    const rows = makeRows(5);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) => tr({ className: () => (row.id === -1 ? "danger" : "") }, td(row.label)),
      container as never,
      0,
    );
    expect(runtime.template!.skeleton.hasAttribute("class")).toBe(false);
    expect(Array.from(container.querySelectorAll("tr"), (el) => el.hasAttribute("class"))).toEqual([false, false, false, false, false]);
  });

  it("does not leak a selected first row's class into the skeleton or the clones", () => {
    const rows = makeRows(4);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) => tr({ className: () => (row.id === 0 ? "danger selected" : "") }, td(row.label)),
      container as never,
      0,
    );
    expect(runtime.template!.skeleton.hasAttribute("class")).toBe(false);
    const trs = Array.from(container.querySelectorAll("tr"));
    expect(trs[0]!.className).toBe("danger selected");
    expect(trs.slice(1).map((el) => el.hasAttribute("class"))).toEqual([false, false, false]);
  });

  it("scrubs a reactive className on a nested child, not just on the row root", () => {
    let selected: number | null = 0;
    const rows = makeRows(3);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) => tr(td({ className: "static-cell" }, row.label), td({ className: () => (selected === row.id ? "hot" : "") }, "x")),
      container as never,
      0,
    );
    const skeletonCells = runtime.template!.skeleton.children;
    expect(skeletonCells[0]!.getAttribute("class")).toBe("static-cell");
    expect(skeletonCells[1]!.hasAttribute("class")).toBe(false);

    const hotCells = () => Array.from(container.querySelectorAll("tr"), (row) => row.children[1]!.getAttribute("class"));
    expect(hotCells()).toEqual(["hot", null, null]);
    selected = 2;
    update();
    expect(hotCells()).toEqual(["", null, "hot"]);
  });

  it("keeps the element's other attributes when the class attribute is removed", () => {
    const rows = makeRows(3);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) => div({ className: () => "", title: "t", id: `row-${row.id}`, "data-kind": "row" }, row.label),
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();
    const divs = Array.from(container.children);
    expect(divs.map((el) => [el.hasAttribute("class"), el.getAttribute("title"), el.id, el.getAttribute("data-kind")])).toEqual([
      [false, "t", "row-0", "row"],
      [false, "t", "row-1", "row"],
      [false, "t", "row-2", "row"],
    ]);
  });

  it("leaves the first row and clones in the same class state after toggling on and off", () => {
    let selected: number | null = null;
    const rows = makeRows(3);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) => div({ className: () => (selected === row.id ? "on" : "") }, row.label),
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();
    const classAttrs = () => Array.from(container.children, (el) => el.getAttribute("class"));
    expect(classAttrs()).toEqual([null, null, null]);
    selected = 0;
    update();
    selected = 1;
    update();
    selected = null;
    update();
    // Rows that were selected once now carry class="" — the same state a
    // normally built row reaches — while untouched row 2 still has none.
    expect(classAttrs()).toEqual(["", "", null]);
  });

  it("does not template rows mixing a static and a reactive className on one element", () => {
    for (const order of ["static-first", "reactive-first"] as const) {
      const host = document.createElement("div");
      document.body.appendChild(host);
      const rows = makeRows(2);
      const runtime = createListRuntime(
        () => rows,
        (row: Row) => (order === "static-first"
          ? div({ className: "base" }, { className: () => `dyn-${row.id}` }, row.label)
          : div({ className: () => `dyn-${row.id}` }, { className: "base" }, row.label)),
        host as never,
        0,
      );
      expect(runtime.template).toBeNull();
      expect(Array.from(host.children, (el) => el.className.split(" ").sort().join(" "))).toEqual(["base dyn-0", "base dyn-1"]);
      host.remove();
    }
  });
});
