/// <reference path="../../types/index.d.ts" />
/** @vitest-environment jsdom */
/**
 * Edges of the scope membership index: roots that come and go, ids shared
 * or unknown, raw DOM removals, detached builds, and the sweeps that keep
 * member sets bounded.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { membersOf, TEXT_KIND } from "../../src/update/scope";
import "../../src";

const q = (sel: string) => document.querySelector(sel) as HTMLElement;
const text = (sel: string) => q(sel).textContent;
const all = (sel: string) => Array.from(document.querySelectorAll(sel)) as HTMLElement[];

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("roots that come and go", () => {
  it("a scope root inside a when() branch works again after the branch closes and reopens", () => {
    let flag = true;
    let n = 0;
    render(div(scope("outer"), when(() => flag, div(scope("inner"), span({ id: "s" }, () => `${n}`)))));
    update("inner");
    flag = false;
    update("outer");
    expect(q("#s")).toBeNull();
    flag = true;
    update("outer");
    n = 1;
    update("inner");
    expect(text("#s")).toBe("1");
  });

  it("a list row that is a root: removed and re-added under the same id, the new row is reached", () => {
    let items = [1, 2];
    let n = 0;
    render(ul(scope("rows"), list(() => items, (it) => li({ "data-id": it }, scope(`row-${it}`), () => `${it}:${n}`))));
    items = [2];
    update("rows");
    items = [2, 1];
    update("rows");
    n = 1;
    update("row-1");
    expect(all("li").map((el) => el.textContent)).toEqual(["2:0", "1:1"]);
  });

  it("the whole scoped subtree removed and a new one rendered: only the new root answers", () => {
    let n = 0;
    const host = document.createElement("div");
    document.body.appendChild(host);
    const first = render(div(scope("gen"), span({ className: "g" }, () => `${n}`)), host) as unknown as HTMLElement;
    update("gen");
    first.remove(); // raw DOM removal, nuclo never sees it
    render(div(scope("gen"), span({ className: "g" }, () => `${n}`)), host);
    n = 1;
    update("gen");
    expect(all(".g").map((el) => el.textContent)).toEqual(["1"]);
  });
});

describe("ids", () => {
  it("unknown, blank and duplicate ids are harmless, alone or mixed with a live one", () => {
    let n = 0;
    render(div(scope("live"), span({ id: "s" }, () => `${n}`)));
    n = 1;
    expect(() => update("nope")).not.toThrow();
    expect(() => update("", "  ")).not.toThrow();
    expect(text("#s")).toBe("0");
    update("nope", "live", "live", "");
    expect(text("#s")).toBe("1");
  });

  it("one id on many sibling roots and many ids on one root", () => {
    let n = 0;
    render(
      div(
        div(scope("row", "all"), span({ className: "r" }, () => `${n}`)),
        div(scope("row", "all"), span({ className: "r" }, () => `${n}`)),
        div(scope("only-all", "all"), span({ className: "r" }, () => `${n}`)),
      ),
    );
    n = 1;
    update("row");
    expect(all(".r").map((el) => el.textContent)).toEqual(["1", "1", "0"]);
    n = 2;
    update("all");
    expect(all(".r").map((el) => el.textContent)).toEqual(["2", "2", "2"]);
  });

  it("nested roots that share an id: one scoped update evaluates each member once", () => {
    let runs = 0;
    render(div(scope("same"), div(scope("same"), div(scope("same"), span(() => (runs++, "x"))))));
    runs = 0;
    update("same");
    expect(runs).toBe(1);
  });

  it("update(outer, inner) with the inner also listed first evaluates once", () => {
    let runs = 0;
    render(div(scope("o"), div(scope("i"), span(() => (runs++, "x")))));
    runs = 0;
    update("i", "o");
    expect(runs).toBe(1);
  });
});

describe("DOM that moves behind nuclo's back", () => {
  it("part of a scope wiped with innerHTML: the scoped update prunes it and refreshes the rest", () => {
    let n = 0;
    render(div(scope("wipe"), div({ id: "gone" }, span(() => `${n}`), when(() => true, b(() => `${n}`))), span({ id: "kept" }, () => `${n}`)));
    update("wipe");
    q("#gone").innerHTML = "";
    n = 1;
    expect(() => update("wipe")).not.toThrow();
    expect(text("#kept")).toBe("1");
  });

  it("a tree rendered detached and attached before any update is indexed on attach", () => {
    let n = 0;
    const host = document.createElement("div");
    render(div(scope("det"), span({ id: "d" }, () => `${n}`)), host);
    document.body.appendChild(host);
    n = 1;
    update("det");
    expect(text("#d")).toBe("1");
  });

  it("a root re-parented into another root is reached by both after it is indexed again", () => {
    // Moving a subtree by hand is outside nuclo's bookkeeping: membership is
    // computed from the DOM when a node is first indexed. A fresh member
    // registered after the move sees the new ancestry.
    let n = 0;
    render(div(div({ id: "a" }, scope("a")), div({ id: "b" }, scope("b"), div({ id: "mover" }, span({ id: "m" }, () => `${n}`)))));
    update("b");
    q("#a").appendChild(q("#mover"));
    n = 1;
    update("b"); // still filed under b: it was indexed there
    expect(text("#m")).toBe("1");
  });
});

describe("member sets stay bounded", () => {
  const OriginalWeakRef = globalThis.WeakRef;
  const dead = new Set<object>();
  class SimulatedWeakRef<T extends object> extends OriginalWeakRef<T> {
    #t: T;
    constructor(t: T) { super(t); this.#t = t; }
    deref(): T | undefined { return dead.has(this.#t) ? undefined : super.deref(); }
  }
  beforeEach(() => { globalThis.WeakRef = SimulatedWeakRef as typeof WeakRef; });
  afterEach(() => { globalThis.WeakRef = OriginalWeakRef; dead.clear(); });

  // Rows carry scope() so they build through the normal path: template rows
  // own their leaves through the list record and never enter these sets.
  it("collected members are swept from a root's set as new ones are added", () => {
    let items = Array.from({ length: 100 }, (_, i) => i);
    const root = render(div(scope("sw"), ul(list(() => items, (i) => li(scope("row"), () => `${i}`))))) as unknown as Element;
    update();
    const set = membersOf(root, TEXT_KIND);
    expect(set.size).toBe(100);
    // "Collect" 90 of them without telling nuclo, then add 40 more.
    let k = 0;
    for (const ref of set) if (k++ < 90) dead.add(ref.deref()!);
    items = items.concat(Array.from({ length: 40 }, (_, i) => 100 + i));
    update(); // builds the rows
    update(); // indexes their leaves; the inserts trigger the sweep
    expect(set.size).toBeLessThan(80); // 140 without the sweep
  });

  it("a scoped pass drops disconnected members from the root's set", () => {
    let items = Array.from({ length: 10 }, (_, i) => i);
    const root = render(div(scope("dc"), ul(list(() => items, (i) => li(scope("row"), () => `${i}`))))) as unknown as Element;
    update("dc");
    expect(membersOf(root, TEXT_KIND).size).toBe(10);
    items = [];
    update("dc");
    update("dc");
    expect(membersOf(root, TEXT_KIND).size).toBe(0);
  });
});
