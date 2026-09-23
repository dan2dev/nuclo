/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Edge cases for on() event modifiers inside list() row templates (SLOT_EVENT).
 *
 * Cloned rows replay each marked on() modifier on the clone instead of
 * building the row from scratch. Every case below asserts the clone behaves
 * exactly like a normally built row: same listeners, same order, same
 * options, same error handling, same removal — and that the template never
 * double-attaches, leaks listeners onto the skeleton, or keeps a listener on
 * a clone it abandoned.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createListRuntime, sync } from "../../src/list/runtime";
import { on, removeAllListeners } from "../../src/element/events";
import { render } from "../../src/render";
import { update } from "../../src/update/update";
import { list } from "../../src/list";
import "../../src/index";

declare const tr: ExpandedElementBuilder<"tr">;
declare const td: ExpandedElementBuilder<"td">;
declare const a: ExpandedElementBuilder<"a">;
declare const b: ExpandedElementBuilder<"b">;
declare const p: ExpandedElementBuilder<"p">;
declare const div: ExpandedElementBuilder<"div">;
declare const span: ExpandedElementBuilder<"span">;
declare const ul: ExpandedElementBuilder<"ul">;
declare const li: ExpandedElementBuilder<"li">;

interface Row {
  id: number;
  label: string;
}

const makeRows = (n: number, from = 0): Row[] => Array.from({ length: n }, (_, i) => ({ id: from + i, label: `L${from + i}` }));
const click = (el: Element, init: MouseEventInit = {}) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, ...init }));

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  container.remove();
});

describe("SLOT_EVENT — listener shapes on clones", () => {
  it("replays several on() modifiers of different types on the same element", () => {
    const log: string[] = [];
    const rows = makeRows(4);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) =>
        span(
          on("click", () => { log.push(`click:${row.id}`); }),
          on("mouseover", () => { log.push(`over:${row.id}`); }),
          on<"row:ping", CustomEvent<string>>("row:ping", (e) => { log.push(`ping:${row.id}:${e.detail}`); }),
          row.label,
        ),
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();

    const spans = container.querySelectorAll("span");
    click(spans[3]!);
    spans[2]!.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    spans[1]!.dispatchEvent(new CustomEvent("row:ping", { detail: "hi" }));
    expect(log).toEqual(["click:3", "over:2", "ping:1:hi"]);
  });

  it("keeps registration order for several on() listeners of the same type", () => {
    const log: string[] = [];
    const rows = makeRows(3);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) =>
        span(
          on("click", () => { log.push(`first:${row.id}`); }),
          on("click", () => { log.push(`second:${row.id}`); }),
          on("click", () => { log.push(`third:${row.id}`); }),
        ),
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();
    for (const el of Array.from(container.querySelectorAll("span"))) click(el);
    expect(log).toEqual([
      "first:0", "second:0", "third:0",
      "first:1", "second:1", "third:1",
      "first:2", "second:2", "third:2",
    ]);
  });

  it("replays listeners on deeply nested descendants of the clone", () => {
    const log: number[] = [];
    const rows = makeRows(5);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) => div(p(span(b(on("click", () => { log.push(row.id); }), row.label)))),
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();
    const bold = container.querySelectorAll("b");
    click(bold[4]!);
    click(bold[0]!);
    click(bold[2]!);
    expect(log).toEqual([4, 0, 2]);
  });

  it("bubbles from a child listener to the row root listener, like the normal build", () => {
    const log: string[] = [];
    const rows = makeRows(3);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) =>
        tr(
          on("click", () => { log.push(`row:${row.id}`); }),
          td(a(on("click", () => { log.push(`link:${row.id}`); }), row.label)),
        ),
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();
    const anchors = container.querySelectorAll("a");
    click(anchors[0]!); // first row: built normally
    click(anchors[2]!); // clone
    expect(log).toEqual(["link:0", "row:0", "link:2", "row:2"]);
  });

  it("lets a child stopPropagation() shield the row root on clones exactly as on the first row", () => {
    const log: string[] = [];
    const rows = makeRows(3);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) =>
        tr(
          on("click", () => { log.push(`row:${row.id}`); }),
          td(a(on("click", (e) => { e.stopPropagation(); log.push(`link:${row.id}`); }), row.label)),
        ),
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();
    const anchors = container.querySelectorAll("a");
    click(anchors[0]!);
    click(anchors[1]!);
    expect(log).toEqual(["link:0", "link:1"]);
  });

  it("honors passive listeners on clones (preventDefault is ignored) like on the first row", () => {
    const rows = makeRows(3);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) =>
        div(
          span(on("click", (e) => { e.preventDefault(); }, { passive: true }), `passive-${row.id}`),
          b(on("click", (e) => { e.preventDefault(); }), `active-${row.id}`),
        ),
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();
    const passive = Array.from(container.querySelectorAll("span"));
    const active = Array.from(container.querySelectorAll("b"));
    const prevented = (el: Element) => {
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      el.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(passive.map(prevented)).toEqual([false, false, false]);
    expect(active.map(prevented)).toEqual([true, true, true]);
  });

  it("passes capture=true given as a boolean option to clones", () => {
    const log: string[] = [];
    const rows = makeRows(2);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) =>
        div(
          on("click", () => { log.push(`capture:${row.id}`); }, true),
          span(on("click", () => { log.push(`target:${row.id}`); }), row.label),
        ),
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();
    click(container.querySelectorAll("span")[1]!);
    expect(log).toEqual(["capture:1", "target:1"]);
  });
});

describe("SLOT_EVENT — no double attachment, no stray listeners", () => {
  it("fires each row's handler exactly once per click — first row included", () => {
    const handler = vi.fn();
    const rows = makeRows(6);
    const runtime = createListRuntime(() => rows, (row: Row) => span(on("click", () => handler(row.id)), row.label), container as never, 0);
    expect(runtime.template).toBeTruthy();
    for (const el of Array.from(container.querySelectorAll("span"))) click(el);
    expect(handler.mock.calls.map((c) => c[0])).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("keeps the skeleton listener-free", () => {
    const handler = vi.fn();
    const rows = makeRows(3);
    const runtime = createListRuntime(() => rows, (row: Row) => span(on("click", handler), row.label), container as never, 0);
    const skeleton = runtime.template!.skeleton;
    click(skeleton);
    expect(handler).not.toHaveBeenCalled();
    // Clones built later from that same skeleton get exactly one listener each.
    click(container.querySelectorAll("span")[2]!);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not leave a listener on a clone abandoned after its event slot was replayed", () => {
    const handler = vi.fn();
    const rows = makeRows(4);
    const runtime = createListRuntime(
      () => rows,
      // Row 2's child tag differs: the clone gets its listener replayed, then
      // the child slot mismatches and the row is rebuilt normally.
      (row: Row) => div(on("click", () => handler(row.id)), row.id === 2 ? p(row.label) : span(row.label)),
      container as never,
      0,
    );
    expect(runtime.template).toBeNull();
    const divs = Array.from(container.children);
    expect(divs.map((d) => d.firstElementChild!.tagName)).toEqual(["SPAN", "SPAN", "P", "SPAN"]);
    for (const el of divs) click(el);
    expect(handler.mock.calls.map((c) => c[0])).toEqual([0, 1, 2, 3]);
  });

  it("keeps listeners on rows cloned before the template was deactivated", () => {
    const log: number[] = [];
    let rows = makeRows(3);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) => (row.id >= 100 ? p(on("click", () => { log.push(row.id); }), row.label) : span(on("click", () => { log.push(row.id); }), row.label)),
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();

    rows = [...rows, ...makeRows(2, 100)];
    sync(runtime);
    expect(runtime.template).toBeNull();

    for (const el of Array.from(container.children)) click(el);
    expect(log).toEqual([0, 1, 2, 100, 101]);
  });

  it("gives rows re-created after a clear fresh listeners from the retained template", () => {
    const log: string[] = [];
    let rows = makeRows(3);
    let generation = "a";
    const runtime = createListRuntime(
      () => rows,
      (row: Row) => span(on("click", () => { log.push(`${generation}:${row.id}`); }), row.label),
      container as never,
      0,
    );
    const template = runtime.template;
    expect(template).toBeTruthy();

    rows = [];
    sync(runtime);
    generation = "b";
    rows = makeRows(3, 10);
    sync(runtime);

    expect(runtime.template).toBe(template);
    for (const el of Array.from(container.querySelectorAll("span"))) click(el);
    expect(log).toEqual(["b:10", "b:11", "b:12"]);
  });

  it("removeAllListeners(type) on one clone leaves its other types and the other rows intact", () => {
    const log: string[] = [];
    const rows = makeRows(3);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) =>
        span(
          on("click", () => { log.push(`click:${row.id}`); }),
          on("keydown", () => { log.push(`key:${row.id}`); }),
          row.label,
        ),
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();
    const spans = Array.from(container.querySelectorAll("span"));
    removeAllListeners(spans[1] as HTMLElement, "click");

    for (const el of spans) click(el);
    spans[1]!.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }));
    expect(log).toEqual(["click:0", "click:2", "key:1"]);
  });
});

describe("SLOT_EVENT — errors and heterogeneous slot values", () => {
  it("logs a throwing clone handler without affecting other listeners or rows", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const log: string[] = [];
    const rows = makeRows(3);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) =>
        span(
          on("click", () => { if (row.id === 1) throw new Error(`boom ${row.id}`); log.push(`a:${row.id}`); }),
          on("click", () => { log.push(`b:${row.id}`); }),
        ),
      container as never,
      0,
    );
    expect(runtime.template).toBeTruthy();
    for (const el of Array.from(container.querySelectorAll("span"))) click(el);
    expect(log).toEqual(["a:0", "b:0", "b:1", "a:2", "b:2"]);
    expect(errors).toHaveBeenCalled();
    expect(String(errors.mock.calls[0]?.[0])).toContain("click");
  });

  it("falls back when a later row puts a plain NodeModFn in an event slot — and still applies it", () => {
    const rows = makeRows(3);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) =>
        span(
          row.id === 2
            ? (parent: ExpandedElement<"span">) => { (parent as unknown as HTMLElement).setAttribute("data-plain", "yes"); }
            : on("click", () => undefined),
          row.label,
        ),
      container as never,
      0,
    );
    expect(runtime.template).toBeNull();
    const spans = container.querySelectorAll("span");
    expect(spans[2]!.getAttribute("data-plain")).toBe("yes");
    expect(spans[1]!.hasAttribute("data-plain")).toBe(false);
  });

  it("falls back when a later row puts on(\"mount\") in an event slot — and the mount still fires", () => {
    const mounted: number[] = [];
    const clicks: number[] = [];
    const rows = makeRows(3);
    render(
      ul(list(() => rows, (row: Row) =>
        li(
          row.id === 1 ? on("mount", () => { mounted.push(row.id); }) : on("click", () => { clicks.push(row.id); }),
          row.label,
        ))),
      container,
    );
    expect(mounted).toEqual([1]);
    for (const el of Array.from(container.querySelectorAll("li"))) click(el);
    expect(clicks).toEqual([0, 2]);
  });

  it("falls back when a later row replaces the event slot with static text", () => {
    const clicks: number[] = [];
    const rows = makeRows(3);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) => span(row.id === 1 ? "text-instead" : on("click", () => { clicks.push(row.id); }), row.label),
      container as never,
      0,
    );
    expect(runtime.template).toBeNull();
    const spans = Array.from(container.querySelectorAll("span"));
    expect(spans.map((s) => s.textContent)).toEqual(["L0", "text-insteadL1", "L2"]);
    for (const el of spans) click(el);
    expect(clicks).toEqual([0, 2]);
  });

  it("falls back when on(\"mount\") sits in a nested child of an otherwise supported row", () => {
    const rows = makeRows(2);
    const runtime = createListRuntime(
      () => rows,
      (row: Row) => div(on("click", () => undefined), span(on("mount", () => undefined), row.label)),
      container as never,
      0,
    );
    expect(runtime.template).toBeNull();
    expect(Array.from(container.querySelectorAll("span"), (s) => s.textContent)).toEqual(["L0", "L1"]);
  });
});

describe("SLOT_EVENT — through render()/update()", () => {
  it("binds listeners on rows appended by update() and after reorders", () => {
    const log: number[] = [];
    let rows = makeRows(2);
    render(ul(list(() => rows, (row: Row) => li(on("click", () => { log.push(row.id); }), row.label))), container);

    rows = [...rows, ...makeRows(3, 10)];
    update();
    rows = [...rows].reverse();
    update();

    const items = Array.from(container.querySelectorAll("li"));
    expect(items.map((el) => el.textContent)).toEqual(["L12", "L11", "L10", "L1", "L0"]);
    for (const el of items) click(el);
    expect(log).toEqual([12, 11, 10, 1, 0]);
  });
});
