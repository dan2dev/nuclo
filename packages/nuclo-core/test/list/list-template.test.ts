/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createListRuntime, sync } from "../../src/list/runtime";
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
        td({ className: "col-md-4" }, a({ onclick: () => { clicks.push(row.id); } }, () => row.label)),
        td({ className: "col-md-6" }),
      );
  }

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

    expect(runtime.records[0].dyn?.length).toBe(2);
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
          td({ className: "col-md-4" }, a({ onclick: () => undefined }, () => { labelCalls++; return row.label; })),
        ),
      container as never,
      0,
    );

    rows = Array.from({ length: 4 }, (_, i) => ({ id: i, label: `L${i}` }));
    update();

    expect(container.querySelectorAll("tr").length).toBe(4);
    expect(classCalls).toBe(4);
    expect(labelCalls).toBe(4);
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

  it("supports direct rendered rows with record-owned refresh hooks", () => {
    let rows: Row[] = [
      { id: 1, label: "one" },
      { id: 2, label: "two" },
    ];
    let selectedId: number | null = null;
    createListRuntime(
      () => rows,
      (row: Row) => {
        const el = document.createElement("tr") as ExpandedElement<"tr">;
        const id = document.createElement("td");
        const label = document.createElement("td");
        el.append(id, label);
        const refresh = () => {
          el.className = selectedId === row.id ? "danger" : "";
          id.textContent = String(row.id);
          label.textContent = row.label;
        };
        refresh();
        return { element: el, update: refresh };
      },
      container as never,
      0,
    );

    rows[1]!.label = "changed";
    selectedId = 2;
    update();

    const trs = container.querySelectorAll("tr");
    expect(trs[0].className).toBe("");
    expect(trs[1].className).toBe("danger");
    expect(trs[1].children[1].textContent).toBe("changed");
  });
});
