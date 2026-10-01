/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "../../src/render";
import { update } from "../../src/update/update";
import "../../src";

/**
 * A row render function that throws during update() aborts the diff half way:
 * rows may already be removed, moved, or recorded without being inserted. The
 * error still propagates out of update(), but the list must not be left in a
 * state the next update() diffs against as if it were real.
 */
describe("list() — recovery after a row render throws during update()", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  interface Row { id: number }
  const texts = (): string[] => Array.from(container.querySelectorAll("p")).map((p) => p.textContent ?? "");

  function setup(initial: Row[]) {
    const ctl = { items: initial, failOn: -1 };
    render(
      div(
        span("before"),
        list(() => ctl.items, (it) => {
          if (it.id === ctl.failOn) throw new Error(`boom ${it.id}`);
          return p(String(it.id));
        }),
        span("after"),
      ),
      container,
    );
    return ctl;
  }

  it("append: rows built before the throw are not lost on the next update()", () => {
    const ctl = setup([{ id: 1 }]);
    ctl.items = [...ctl.items, { id: 2 }, { id: 3 }, { id: 4 }];
    ctl.failOn = 3;
    expect(() => update()).toThrow("boom 3");

    ctl.failOn = -1;
    update();
    expect(texts()).toEqual(["1", "2", "3", "4"]);
  });

  it("append: retrying with the failing item removed renders the rest", () => {
    const ctl = setup([{ id: 1 }]);
    const [two, three, four] = [{ id: 2 }, { id: 3 }, { id: 4 }];
    ctl.items = [ctl.items[0]!, two, three, four];
    ctl.failOn = 3;
    expect(() => update()).toThrow();

    ctl.items = [ctl.items[0]!, two, four];
    update();
    expect(texts()).toEqual(["1", "2", "4"]);
  });

  it("reorder + insert: reverting to the previous items restores every row", () => {
    const [a, b, c, d] = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const ctl = setup([a, b, c]);
    ctl.items = [c, d, a]; // b removed, d inserted (throws), a and c reordered
    ctl.failOn = 4;
    expect(() => update()).toThrow();

    ctl.items = [a, b, c];
    ctl.failOn = -1;
    update();
    expect(texts()).toEqual(["1", "2", "3"]);
  });

  it("reorder + insert: retrying the same items lands in the right order", () => {
    const [a, b, c, d, e] = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
    const ctl = setup([a, b, c, d]);
    ctl.items = [d, e, b, a]; // c removed, e inserted (throws), the rest shuffled
    ctl.failOn = 5;
    expect(() => update()).toThrow();

    ctl.failOn = -1;
    update();
    expect(texts()).toEqual(["4", "5", "2", "1"]);
  });

  it("middle insert and full replace recover too", () => {
    const [a, b, c, d] = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const ctl = setup([a, c]);
    ctl.items = [a, b, c];
    ctl.failOn = 2;
    expect(() => update()).toThrow();
    ctl.failOn = -1;
    update();
    expect(texts()).toEqual(["1", "2", "3"]);

    ctl.items = [d, { id: 5 }];
    ctl.failOn = 5;
    expect(() => update()).toThrow();
    ctl.failOn = -1;
    update();
    expect(texts()).toEqual(["4", "5"]);
  });

  it("never leaves duplicate or detached rows behind, and siblings are untouched", () => {
    const ctl = setup([{ id: 1 }, { id: 2 }]);
    for (let round = 0; round < 5; round++) {
      ctl.items = [...ctl.items, { id: 100 + round }, { id: 200 + round }];
      ctl.failOn = 200 + round;
      expect(() => update()).toThrow();
      ctl.failOn = -1;
      update();
      expect(texts()).toEqual(ctl.items.map((it) => String(it.id)));
    }
    const host = container.firstElementChild!;
    expect(host.firstElementChild!.textContent).toBe("before");
    expect(host.lastElementChild!.textContent).toBe("after");
    expect(host.querySelectorAll("span").length).toBe(2);
  });

  it("mounted rows dropped by the failed diff get onDestroy exactly once", () => {
    const log: string[] = [];
    const state = { items: [{ id: 1 }, { id: 2 }] as Row[], failOn: -1 };
    render(
      div(list(() => state.items, (it) => {
        if (it.id === state.failOn) throw new Error("boom");
        return p(String(it.id), on("mount", () => { log.push(`mount ${it.id}`); }), on("destroy", () => { log.push(`destroy ${it.id}`); }));
      })),
      container,
    );
    expect(log).toEqual(["mount 1", "mount 2"]);

    state.items = [...state.items, { id: 3 }];
    state.failOn = 3;
    expect(() => update()).toThrow();
    state.failOn = -1;
    update();
    update();

    expect(texts()).toEqual(["1", "2", "3"]);
    const count = (entry: string): number => log.filter((l) => l === entry).length;
    // Every destroy is matched by an earlier mount; nothing is destroyed twice.
    for (const id of [1, 2, 3]) {
      expect(count(`destroy ${id}`)).toBeLessThanOrEqual(count(`mount ${id}`));
    }
    // The three live rows are mounted and not destroyed.
    for (const id of [1, 2, 3]) expect(count(`mount ${id}`) - count(`destroy ${id}`)).toBe(1);
  });

  it("a throwing items provider leaves the rendered rows untouched", () => {
    const state = { items: [{ id: 1 }, { id: 2 }] as Row[], fail: false };
    render(
      div(list(() => {
        if (state.fail) throw new Error("provider");
        return state.items;
      }, (it) => p(String(it.id)))),
      container,
    );
    const before = Array.from(container.querySelectorAll("p"));

    state.fail = true;
    expect(() => update()).toThrow("provider");
    expect(Array.from(container.querySelectorAll("p"))).toEqual(before);

    state.fail = false;
    state.items = [...state.items, { id: 3 }];
    update();
    const after = Array.from(container.querySelectorAll("p"));
    expect(after.slice(0, 2)).toEqual(before);
    expect(texts()).toEqual(["1", "2", "3"]);
  });
});
