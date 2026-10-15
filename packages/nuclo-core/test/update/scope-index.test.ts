/// <reference path="../types/index.d.ts" />
/** @vitest-environment jsdom */
/**
 * update("id") iterates the members indexed under the scope's roots instead
 * of every reactive node on the page. These cover the index's edges: nested
 * roots, members that appear after the first scoped pass, roots applied to
 * elements already in the document, and reclaim/re-registration.
 */
import { describe, it, expect, beforeEach } from "vitest";
import "../../src";

const text = (sel: string) => (document.querySelector(sel) as HTMLElement).textContent;

describe("update(id) membership index", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("an outer scope reaches members of a nested scope; the inner one does not reach outer-only members", () => {
    let n = 0;
    render(
      div(
        scope("outer"),
        span({ id: "o" }, () => `o:${n}`),
        div(scope("inner"), span({ id: "i" }, () => `i:${n}`)),
      ),
    );
    n = 1;
    update("inner");
    expect(text("#i")).toBe("i:1");
    expect(text("#o")).toBe("o:0");
    n = 2;
    update("outer");
    expect(text("#i")).toBe("i:2");
    expect(text("#o")).toBe("o:2");
  });

  it("list rows and when() branches built during a scoped update are members of the next one", () => {
    let items = [1];
    let flag = false;
    let n = 0;
    render(
      div(
        scope("s"),
        list(() => items, (item) => p({ className: "row" }, () => `${item}:${n}`)),
        when(() => flag, b({ id: "w" }, () => `w:${n}`)),
      ),
    );
    items = [1, 2];
    flag = true;
    update("s");
    expect(document.querySelectorAll(".row").length).toBe(2);
    expect(text("#w")).toBe("w:0");
    n = 1;
    update("s");
    expect(Array.from(document.querySelectorAll(".row")).map((el) => el.textContent)).toEqual(["1:1", "2:1"]);
    expect(text("#w")).toBe("w:1");
  });

  it("scope() applied by hand to an element already in the document adopts the members below it", () => {
    let n = 0;
    const host = render(div(span({ id: "h" }, () => `h:${n}`))) as unknown as HTMLElement;
    update(); // members indexed before the root exists
    scope("late")(host as never, 0);
    n = 1;
    update("late");
    expect(text("#h")).toBe("h:1");
  });

  it("members survive a forceUpdate() reclaim of their root", () => {
    let n = 0;
    const App = () => div(scope("f"), span({ id: "f", className: () => `c${n}` }, () => `f:${n}`));
    render(App);
    update("f");
    forceUpdate(); // reactive elements are unregistered and registered again
    n = 1;
    update("f");
    expect(text("#f")).toBe("f:1");
    expect((document.querySelector("#f") as HTMLElement).className).toBe("c1");
  });

  it("visits a member once when its root and an enclosing root share the update", () => {
    let evaluations = 0;
    render(div(scope("a"), div(scope("b"), span(() => (evaluations++, "x")))));
    evaluations = 0;
    update("a", "b");
    expect(evaluations).toBe(1);
  });

  it("many roots under one id: only the targeted one is refreshed, each in O(its members)", () => {
    const rows = Array.from({ length: 200 }, (_, i) => ({ i, v: 0 }));
    let seen = 0;
    render(div(list(() => rows, (row) => p(scope(`row-${row.i}`, "rows"), () => (seen++, `${row.i}:${row.v}`)))));
    seen = 0;
    rows[7].v = 1;
    update("row-7");
    expect(seen).toBe(1);
    expect(document.querySelectorAll("p")[7].textContent).toBe("7:1");
    for (const row of rows) row.v = 2;
    seen = 0;
    update("rows");
    expect(seen).toBe(200);
    expect(document.querySelectorAll("p")[199].textContent).toBe("199:2");
  });
});
