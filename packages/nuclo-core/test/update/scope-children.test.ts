/// <reference path="../../types/index.d.ts" />
/** @vitest-environment jsdom */
/**
 * update(id) must reach every kind of child a scope root can hold — reactive
 * text, attributes, className and style, when() branches, list() rows built
 * through both the template and the normal path, lifecycle hooks, regions,
 * SVG, hydrated trees and forceUpdate() reclaims — and must leave the same
 * kinds outside the root alone.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { renderToString } from "../../src/ssr/render-to-string";
import { withServerGlobals } from "../integration/fuzz-harness";
import "../../src";

const q = (sel: string) => document.querySelector(sel) as HTMLElement;
const text = (sel: string) => q(sel).textContent;
const all = (sel: string) => Array.from(document.querySelectorAll(sel)) as HTMLElement[];

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("reactive leaves under a scope root", () => {
  it("text, attribute, class attribute, css() className and style object", () => {
    let n = 0;
    const a = css({ color: "red" });
    const b = css({ color: "blue" });
    const leaf = (p: string) =>
      div(
        span({ id: `${p}-t` }, () => `${n}`),
        span({ id: `${p}-a`, title: () => `${n}` }),
        span({ id: `${p}-c`, class: () => `k${n}` }),
        span({ id: `${p}-css` }, () => (n ? b : a)),
        span({ id: `${p}-s`, style: () => ({ width: `${n}px` }) }),
      );
    render(div(div(scope("in"), leaf("in")), leaf("out")));
    n = 1;
    update("in");
    expect(text("#in-t")).toBe("1");
    expect(q("#in-a").getAttribute("title")).toBe("1");
    expect(q("#in-c").className).toBe("k1");
    expect(q("#in-css").className).toBe(b.className);
    expect(q("#in-s").style.width).toBe("1px");
    expect(text("#out-t")).toBe("0");
    expect(q("#out-a").getAttribute("title")).toBe("0");
    expect(q("#out-c").className).toBe("k0");
    expect(q("#out-css").className).toBe(a.className);
    expect(q("#out-s").style.width).toBe("0px");
    update();
    expect(text("#out-t")).toBe("1");
    expect(q("#out-css").className).toBe(b.className);
  });

  it("SVG attributes, the shape of the Goo benchmark", () => {
    let x = 1;
    render(
      div(
        div(scope("g1"), svgSvg(circleSvg({ id: "c1", cx: () => x }))),
        div(scope("g2"), svgSvg(circleSvg({ id: "c2", cx: () => x }))),
      ),
    );
    x = 2;
    update("g1");
    expect(q("#c1").getAttribute("cx")).toBe("2");
    expect(q("#c2").getAttribute("cx")).toBe("1");
  });

  it("the root's own reactive attributes are members", () => {
    let n = 0;
    render(div(div({ id: "r", title: () => `${n}` }, scope("self"))));
    n = 1;
    update("self");
    expect(q("#r").getAttribute("title")).toBe("1");
  });
});

describe("when() under a scope root", () => {
  it("toggles its branch, including else and nested when()", () => {
    let flag = false;
    let inner = false;
    render(
      div(
        div(
          scope("w"),
          when(() => flag, span({ id: "on" }, when(() => inner, b({ id: "deep" }, "deep")).else(i({ id: "shallow" }, "shallow")))).else(
            span({ id: "off" }),
          ),
        ),
        div(when(() => flag, span({ id: "out-on" })).else(span({ id: "out-off" }))),
      ),
    );
    flag = true;
    update("w");
    expect(q("#on")).not.toBeNull();
    expect(q("#off")).toBeNull();
    expect(q("#shallow")).not.toBeNull();
    expect(q("#out-off")).not.toBeNull(); // outside: untouched
    inner = true;
    update("w");
    expect(q("#deep")).not.toBeNull();
    expect(q("#shallow")).toBeNull();
    flag = false;
    update("w");
    expect(q("#off")).not.toBeNull();
    expect(q("#on")).toBeNull();
  });

  it("content a branch builds during one scoped update is refreshed by the next", () => {
    let flag = false;
    let n = 0;
    render(div(scope("w"), when(() => flag, span({ id: "s", title: () => `${n}` }, () => `${n}`))));
    flag = true;
    update("w");
    expect(text("#s")).toBe("0");
    n = 1;
    update("w");
    expect(text("#s")).toBe("1");
    expect(q("#s").getAttribute("title")).toBe("1");
  });
});

describe("list() under a scope root", () => {
  it("template rows (record-owned leaves) and normal-path rows both refresh", () => {
    let items = [1, 2];
    let n = 0;
    render(
      div(
        div(
          scope("l"),
          ul({ id: "tpl" }, list(() => items, (it) => li(() => `${it}:${n}`))),
          ul({ id: "normal" }, list(() => items, (it) => li(scope(`row-${it}`), () => `${it}:${n}`))),
        ),
        ul({ id: "out" }, list(() => items, (it) => li(() => `${it}:${n}`))),
      ),
    );
    n = 1;
    items = [2, 1, 3];
    update("l");
    const texts = (id: string) => all(`#${id} li`).map((el) => el.textContent);
    expect(texts("tpl")).toEqual(["2:1", "1:1", "3:1"]);
    expect(texts("normal")).toEqual(["2:1", "1:1", "3:1"]);
    expect(texts("out")).toEqual(["1:0", "2:0"]);
    n = 2;
    update("row-3"); // a row that was built inside a scoped update is itself a root
    expect(texts("normal")).toEqual(["2:1", "1:1", "3:2"]);
  });

  it("nested lists and rows that contain when()", () => {
    let outer = [[1, 2], [3]];
    let flag = false;
    render(
      div(
        scope("n"),
        ul(list(() => outer, (row) => li(ul(list(() => row, (c) => li({ className: "c" }, () => `${c}`))), when(() => flag, b({ className: "f" }))))),
      ),
    );
    outer = [[1, 2, 9], [3], [4]];
    flag = true;
    update("n");
    expect(all(".c").map((el) => el.textContent)).toEqual(["1", "2", "9", "3", "4"]);
    expect(all(".f")).toHaveLength(3);
  });

  it("rows reordered or removed by a scoped update keep working", () => {
    let items = [{ id: 1, v: "a" }, { id: 2, v: "b" }, { id: 3, v: "c" }];
    render(div(scope("r"), ul(list(() => items, (it) => li({ "data-id": it.id }, () => it.v)))));
    const first = all("li")[0];
    items = [items[2], items[0]];
    update("r");
    expect(all("li").map((el) => el.textContent)).toEqual(["c", "a"]);
    expect(all("li")[1]).toBe(first);
    items[1].v = "A";
    update("r");
    expect(all("li").map((el) => el.textContent)).toEqual(["c", "A"]);
  });
});

describe("lifecycle under a scope root", () => {
  it("onMount and onDestroy fire for content a scoped update opens and closes", () => {
    let flag = false;
    const log: string[] = [];
    render(
      div(
        scope("lc"),
        when(() => flag, span({ onMount: () => (log.push("mount"), () => log.push("cleanup")), onDestroy: () => log.push("destroy") })),
      ),
    );
    flag = true;
    update("lc");
    expect(log).toEqual(["mount"]);
    flag = false;
    update("lc");
    expect(log).toEqual(["mount", "destroy", "cleanup"]);
  });

  it("an onMount that calls update(id) re-entrantly, on its own scope and another", () => {
    let flag = false;
    let n = 0;
    render(
      div(
        div(scope("a"), span({ id: "a" }, () => `${n}`)),
        div(
          scope("b"),
          span({ id: "b" }, () => `${n}`),
          when(() => flag, span({ onMount: () => { n = 5; update("a"); update("b"); } })),
        ),
      ),
    );
    flag = true;
    update("b");
    expect(text("#a")).toBe("5");
    expect(text("#b")).toBe("5");
  });

  it("a mount hook on the root itself fires once and is not re-fired by scoped updates", () => {
    let mounts = 0;
    render(div(scope("m"), { onMount: () => { mounts++; } }));
    update("m");
    update("m");
    expect(mounts).toBe(1);
  });
});

describe("region() and into() with scopes", () => {
  it("a scope around the region reaches content placed into it from elsewhere", () => {
    let n = 0;
    render(
      div(
        div(scope("host"), region({ id: "main" })),
        div(into("main", span({ id: "v" }, () => `${n}`))),
      ),
    );
    n = 1;
    update("host");
    expect(text("#v")).toBe("1");
  });

  it("a view placed after the first scoped update becomes a member", () => {
    let show = false;
    let n = 0;
    render(
      div(
        div(scope("host"), region({ id: "late" })),
        div(scope("src"), when(() => show, into("late", span({ id: "v" }, () => `${n}`)))),
      ),
    );
    update("host");
    show = true;
    update("src");
    expect(text("#v")).toBe("0");
    n = 1;
    update("host");
    expect(text("#v")).toBe("1");
  });
});

describe("hydrate() and forceUpdate() with scopes", () => {
  it("hydrated trees: update(id) refreshes only the hydrated scope", () => {
    let n = 0;
    const App = () => div(div(scope("h1"), span({ id: "a" }, () => `${n}`)), div(scope("h2"), span({ id: "b" }, () => `${n}`)));
    const root = document.createElement("div");
    document.body.appendChild(root);
    root.innerHTML = withServerGlobals(() => renderToString(App));
    const a = root.querySelector("#a");
    hydrate(App, root);
    expect(root.querySelector("#a")).toBe(a); // reused, not rebuilt
    n = 1;
    update("h1");
    expect(text("#a")).toBe("1");
    expect(text("#b")).toBe("0");
    update("h2");
    expect(text("#b")).toBe("1");
  });

  it("forceUpdate() that replaces the root element (tag mismatch) re-registers the scope on the new root", () => {
    let big = false;
    let n = 0;
    const App = () => (big ? section(scope("t"), span({ id: "x" }, () => `${n}`)) : div(scope("t"), span({ id: "x" }, () => `${n}`)));
    render(App);
    big = true;
    forceUpdate();
    expect(q("section")).not.toBeNull();
    n = 1;
    update("t");
    expect(text("#x")).toBe("1");
  });

  it("repeated forceUpdate() reclaims do not grow a root's member set", async () => {
    const { membersOf, ELEMENT_KIND } = await import("../../src/update/scope");
    let n = 0;
    const App = () => div(scope("rc"), span({ id: "y", title: () => `${n}` }));
    const root = render(App) as unknown as Element;
    update("rc");
    const size = membersOf(root, ELEMENT_KIND).size;
    for (let k = 0; k < 10; k++) {
      forceUpdate();
      update("rc");
    }
    expect(membersOf(root, ELEMENT_KIND).size).toBe(size);
    n = 1;
    update("rc");
    expect(q("#y").getAttribute("title")).toBe("1");
  });
});

describe("depth: when() and list() nested to any level", () => {
  // Each level is a list() of rows; each row holds a when() whose branch
  // holds the next level. Every level has its own scope root, and every
  // level's branch condition and text read the same shared state.
  // 2048 leaves: enough levels to prove depth is irrelevant, small enough for
  // jsdom's querySelectorAll in the assertions (the library side is linear).
  const DEPTH = 10;
  function build(level: number, n: () => number, open: () => boolean): NodeModFn<"ul"> {
    return ul(
      scope(`lvl-${level}`),
      list(
        () => [0, 1],
        (k) =>
          li(
            span({ className: `t${level}` }, () => `${level}.${k}:${n()}`),
            when(() => open(), level < DEPTH ? build(level + 1, n, open) : b({ className: "leaf" }, () => `${n()}`)),
          ),
      ),
    );
  }

  it("a scoped update at any level refreshes everything below it and nothing above or beside it", () => {
    let n = 0;
    let open = true;
    render(div(build(0, () => n, () => open)));
    expect(all(".leaf")).toHaveLength(2 ** (DEPTH + 1));
    update("lvl-0");

    n = 1;
    update(`lvl-${DEPTH}`); // only the deepest level's texts and leaves
    expect(all(`.t${DEPTH}`).every((el) => el.textContent!.endsWith(":1"))).toBe(true);
    expect(all(".leaf").every((el) => el.textContent === "1")).toBe(true);
    expect(all(`.t${DEPTH - 1}`).every((el) => el.textContent!.endsWith(":0"))).toBe(true);
    expect(all(".t0").every((el) => el.textContent!.endsWith(":0"))).toBe(true);

    n = 2;
    update("lvl-6"); // middle: levels 6..DEPTH follow, 0..5 do not
    for (let l = 0; l <= DEPTH; l++) {
      const want = l >= 6 ? ":2" : l === DEPTH ? ":1" : ":0";
      expect(all(`.t${l}`).every((el) => el.textContent!.endsWith(want)), `level ${l}`).toBe(true);
    }

    open = false;
    n = 3;
    update("lvl-0"); // top: every branch below closes in one pass
    expect(all(".leaf")).toHaveLength(0);
    expect(all("li")).toHaveLength(2); // only level 0's rows remain
    expect(all(".t0").every((el) => el.textContent!.endsWith(":3"))).toBe(true);

    open = true;
    update("lvl-0"); // reopens all levels: fresh roots, fresh members
    expect(all(".leaf")).toHaveLength(2 ** (DEPTH + 1));
    n = 4;
    update(`lvl-${DEPTH}`); // the rebuilt deepest level answers on its own again
    expect(all(".leaf").every((el) => el.textContent === "4")).toBe(true);
    expect(all(".t0").every((el) => el.textContent!.endsWith(":3"))).toBe(true);
  }, 20_000);
});

describe("structure that only scoped updates ever build", () => {
  // No update() without an id anywhere in these: every node that appears is
  // created by update(id) and must keep following update(id) afterwards.

  it("branch opens → list inside grows → nested branch opens → texts refresh, all via one id", () => {
    let open = false;
    let items: number[] = [];
    let inner = false;
    let n = 0;
    render(
      div(
        scope("s"),
        when(
          () => open,
          ul(list(() => items, (it) => li({ className: "row", title: () => `${it}:${n}` }, when(() => inner, b({ className: "in" }, () => `${it}:${n}`))))),
        ),
      ),
    );
    open = true;
    update("s");
    expect(q("ul")).not.toBeNull();
    items = [1, 2, 3];
    update("s");
    expect(all(".row").map((el) => el.getAttribute("title"))).toEqual(["1:0", "2:0", "3:0"]);
    inner = true;
    update("s");
    expect(all(".in").map((el) => el.textContent)).toEqual(["1:0", "2:0", "3:0"]);
    n = 1;
    items = [3, 1, 4];
    update("s");
    expect(all(".row").map((el) => el.getAttribute("title"))).toEqual(["3:1", "1:1", "4:1"]);
    expect(all(".in").map((el) => el.textContent)).toEqual(["3:1", "1:1", "4:1"]);
    inner = false;
    update("s");
    expect(all(".in")).toHaveLength(0);
    inner = true;
    n = 2;
    update("s");
    expect(all(".in").map((el) => el.textContent)).toEqual(["3:2", "1:2", "4:2"]);
  });

  it("a scope root that a scoped update creates answers its own id from then on", () => {
    let open = false;
    let items: number[] = [];
    let n = 0;
    render(
      div(
        scope("outer"),
        when(() => open, ul(list(() => items, (it) => li(scope(`row-${it}`), span({ className: "v" }, () => `${it}:${n}`))))),
      ),
    );
    open = true;
    items = [1, 2];
    update("outer"); // opens the branch; rows arrive on the next pass
    update("outer");
    expect(all(".v").map((el) => el.textContent)).toEqual(["1:0", "2:0"]);
    n = 1;
    update("row-2"); // the new root, never seen by a full update
    expect(all(".v").map((el) => el.textContent)).toEqual(["1:0", "2:1"]);
    items = [2, 1, 3];
    update("outer");
    n = 2;
    update("row-3");
    expect(all(".v").map((el) => el.textContent)).toEqual(["2:1", "1:1", "3:2"]);
    update("outer");
    expect(all(".v").map((el) => el.textContent)).toEqual(["2:2", "1:2", "3:2"]);
  });

  it("new rows carrying when() and attributes, created by update(id), then changed by every data operation", () => {
    let items = [{ id: 1, on: false, v: "a" }];
    let n = 0;
    render(
      div(
        scope("ops"),
        ul(list(() => items, (it) => li({ "data-id": it.id, className: () => (it.on ? "on" : "off") }, () => `${it.v}${n}`, when(() => it.on, b({ className: "w" }, () => it.v))))),
      ),
    );
    const rows = () => all("li").map((el) => `${el.getAttribute("data-id")}:${el.className}:${el.textContent}`);
    items = [...items, { id: 2, on: true, v: "b" }]; // append
    update("ops");
    expect(rows()).toEqual(["1:off:a0", "2:on:b0b"]);
    items = [{ id: 0, on: true, v: "z" }, ...items]; // prepend
    update("ops");
    expect(rows()).toEqual(["0:on:z0z", "1:off:a0", "2:on:b0b"]);
    items[1].on = true; // toggle a branch in an existing row
    items[2].v = "B"; // change a text in an existing row
    n = 1;
    update("ops");
    expect(rows()).toEqual(["0:on:z1z", "1:on:a1a", "2:on:B1B"]);
    items = [items[2], items[0]]; // remove and reorder
    update("ops");
    expect(rows()).toEqual(["2:on:B1B", "0:on:z1z"]);
    items = []; // clear
    update("ops");
    expect(rows()).toEqual([]);
    items = [{ id: 7, on: false, v: "q" }]; // refill
    update("ops");
    expect(rows()).toEqual(["7:off:q1"]);
    items[0].on = true;
    n = 2;
    update("ops");
    expect(rows()).toEqual(["7:on:q2q"]);
  });

  it("alternating two scopes: each only sees the data at its own last update", () => {
    let a = 0;
    let b = 0;
    let openA = false;
    let openB = false;
    render(
      div(
        div(scope("a"), when(() => openA, span({ id: "a" }, () => `${a}/${b}`))),
        div(scope("b"), when(() => openB, span({ id: "b" }, () => `${a}/${b}`))),
      ),
    );
    openA = true;
    a = 1;
    update("a");
    expect(text("#a")).toBe("1/0");
    expect(q("#b")).toBeNull();
    openB = true;
    b = 1;
    update("b");
    expect(text("#b")).toBe("1/1");
    expect(text("#a")).toBe("1/0");
    a = 2;
    update("a");
    expect(text("#a")).toBe("2/1");
    expect(text("#b")).toBe("1/1");
  });
});
