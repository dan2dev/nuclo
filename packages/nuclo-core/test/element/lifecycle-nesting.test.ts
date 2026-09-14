/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom

/**
 * Depth-independence and ordering guarantees for onMount/onDestroy.
 *
 * The registry in src/element/lifecycle.ts keys everything off the element
 * itself (a flat WeakMap) — nothing tracks "how deep" an element is, so
 * correctness can never depend on nesting depth by construction. These tests
 * verify that structurally, across list()-in-list()-in-list(), components
 * (plain functions returning factories) nested arbitrarily, and mixed
 * list()/when()/component trees — and pin the one thing depth *does* affect:
 * relative firing order between a parent and its children (see the "Ordering"
 * section of element/lifecycle.ts's own doc comment).
 */

import { describe, it, expect, beforeEach } from "vitest";
import "../../src/index";
import { render } from "../../src/render";
import { update } from "../../src/update/update";
import { list } from "../../src/list";
import { when } from "../../src/when";

describe("lifecycle: nesting depth independence", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  // ── Ordering ──────────────────────────────────────────────────────────────

  it("fires onMount parent-before-child and onDestroy child-before-parent for plain nesting", () => {
    const mountOrder: string[] = [];
    const destroyOrder: string[] = [];
    let show = true;

    render(
      div(when(() => show,
        div(
          { onMount: () => mountOrder.push("outer"), onDestroy: () => destroyOrder.push("outer") },
          div(
            { onMount: () => mountOrder.push("middle"), onDestroy: () => destroyOrder.push("middle") },
            span(
              { onMount: () => mountOrder.push("inner"), onDestroy: () => destroyOrder.push("inner") },
              "leaf",
            ),
          ),
        ),
      )),
      container,
    );
    expect(mountOrder).toEqual(["outer", "middle", "inner"]);
    expect(destroyOrder).toEqual([]);

    show = false;
    update();
    expect(destroyOrder).toEqual(["inner", "middle", "outer"]);
  });

  it("keeps the same parent-first mount / child-first destroy order through list()", () => {
    const mountOrder: string[] = [];
    const destroyOrder: string[] = [];
    let items = ["only"];

    render(
      div(list(() => items, (item) =>
        div(
          { onMount: () => mountOrder.push(`row:${item}`), onDestroy: () => destroyOrder.push(`row:${item}`) },
          span(
            { onMount: () => mountOrder.push(`cell:${item}`), onDestroy: () => destroyOrder.push(`cell:${item}`) },
            item,
          ),
        )
      )),
      container,
    );
    expect(mountOrder).toEqual(["row:only", "cell:only"]);

    items = [];
    update();
    expect(destroyOrder).toEqual(["cell:only", "row:only"]);
  });

  // ── list() of list()s ────────────────────────────────────────────────────

  it("fires onMount/onDestroy at both levels of a two-level nested list()", () => {
    const mounted: string[] = [];
    const destroyed: string[] = [];
    // list() diffs by object identity — g1/g2 must stay the same references
    // across update()s for the outer list to recognize "still the same
    // group" rather than rebuilding it from scratch. Only `.items` (an array
    // of primitive strings, compared by value) is mutated in place.
    const g1 = { id: "g1", items: ["a", "b"] };
    const g2 = { id: "g2", items: ["c"] };
    let groups = [g1, g2];

    const el = render(
      div(list(() => groups, (group) =>
        div(
          { onMount: () => mounted.push(`group:${group.id}`), onDestroy: () => destroyed.push(`group:${group.id}`) },
          list(() => group.items, (item) =>
            span(
              {
                onMount: () => mounted.push(`item:${group.id}.${item}`),
                onDestroy: () => destroyed.push(`item:${group.id}.${item}`),
              },
              item,
            )
          ),
        )
      )),
      container,
    ) as unknown as HTMLElement;

    expect([...mounted].sort()).toEqual([
      "group:g1", "group:g2",
      "item:g1.a", "item:g1.b", "item:g2.c",
    ]);
    expect(el.textContent).toBe("abc");

    // Removing one item from a group leaves the group and its siblings alone
    // — the outer `groups` array doesn't even need to change; the inner
    // list() for g1 is registered and scanned independently on update().
    g1.items = ["a"];
    update();
    expect(destroyed).toEqual(["item:g1.b"]);
    expect(el.textContent).toBe("ac");

    // Removing a whole group destroys its nested items too — child (item)
    // before parent (group), even though "child" here means "a row inside a
    // list nested two levels deep inside another list's row".
    destroyed.length = 0;
    groups = [g2];
    update();
    expect(destroyed).toEqual(["item:g1.a", "group:g1"]);
    expect(el.textContent).toBe("c");
  });

  it("destroys every level of a two-level nested list() when the outer list bulk-clears", () => {
    const destroyed: string[] = [];
    let groups = [
      { id: "g1", items: ["a", "b"] },
      { id: "g2", items: ["c", "d"] },
    ];

    // The outer list is the *only* content of its host, and shrinks to zero
    // — this is exactly the shape bulkClearRecords() fast-paths with a
    // single `textContent = ""`, which does not walk each row's subtree on
    // its own (see disposeLifecyclesInSubtree() in shared/dom.ts).
    render(
      div(list(() => groups, (group) =>
        div(
          { onDestroy: () => destroyed.push(`group:${group.id}`) },
          list(() => group.items, (item) =>
            span({ onDestroy: () => destroyed.push(`item:${group.id}.${item}`) }, item)
          ),
        )
      )),
      container,
    );

    groups = [];
    update();
    // A *copy* is sorted for the unordered membership check — sorting
    // `destroyed` itself would destroy (no pun intended) the firing order
    // the assertions right after this one depend on.
    expect([...destroyed].sort()).toEqual([
      "group:g1", "group:g2",
      "item:g1.a", "item:g1.b", "item:g2.c", "item:g2.d",
    ]);
    // Within each group, its items destroyed before the group itself.
    expect(destroyed.indexOf("item:g1.a")).toBeLessThan(destroyed.indexOf("group:g1"));
    expect(destroyed.indexOf("item:g2.c")).toBeLessThan(destroyed.indexOf("group:g2"));
  });

  it("fires onMount/onDestroy correctly through three levels of nested list()", () => {
    const mounted: string[] = [];
    const destroyed: string[] = [];
    let sections = [
      { id: "s1", groups: [{ id: "g1", items: ["a"] }] },
    ];

    render(
      div(list(() => sections, (section) =>
        div(
          { onMount: () => mounted.push(`section:${section.id}`), onDestroy: () => destroyed.push(`section:${section.id}`) },
          list(() => section.groups, (group) =>
            div(
              { onMount: () => mounted.push(`group:${group.id}`), onDestroy: () => destroyed.push(`group:${group.id}`) },
              list(() => group.items, (item) =>
                span(
                  { onMount: () => mounted.push(`item:${item}`), onDestroy: () => destroyed.push(`item:${item}`) },
                  item,
                )
              ),
            )
          ),
        )
      )),
      container,
    );
    expect(mounted).toEqual(["section:s1", "group:g1", "item:a"]);

    sections = [];
    update();
    // Deepest level destroyed first, all the way up — regardless of it being
    // three list() boundaries deep.
    expect(destroyed).toEqual(["item:a", "group:g1", "section:s1"]);
  });

  // ── Components (plain functions returning factories), nested arbitrarily ──

  it("works identically through N levels of plain component-function nesting", () => {
    const mounted: string[] = [];
    const destroyed: string[] = [];

    function Leaf(id: string) {
      return span({ onMount: () => mounted.push(id), onDestroy: () => destroyed.push(id) }, id);
    }
    function Wrapper(id: string, child: ReturnType<typeof Leaf>) {
      return div({ onMount: () => mounted.push(id), onDestroy: () => destroyed.push(id) }, child);
    }
    // Five levels of component composition, each wrapping the last.
    const tree = Wrapper("L1", Wrapper("L2", Wrapper("L3", Wrapper("L4", Leaf("L5")))));

    let show = true;
    render(div(when(() => show, tree)), container);
    expect(mounted).toEqual(["L1", "L2", "L3", "L4", "L5"]);

    show = false;
    update();
    expect(destroyed).toEqual(["L5", "L4", "L3", "L2", "L1"]);
  });

  it("works through a mixed list() / when() / component tree", () => {
    const mounted: string[] = [];
    const destroyed: string[] = [];

    function Badge(label: string) {
      return span(
        { onMount: () => mounted.push(`badge:${label}`), onDestroy: () => destroyed.push(`badge:${label}`) },
        label,
      );
    }
    function Card(id: string, active: () => boolean) {
      return div(
        { onMount: () => mounted.push(`card:${id}`), onDestroy: () => destroyed.push(`card:${id}`) },
        when(active, Badge(id)).else(span(`${id}-inactive`)),
      );
    }

    let cards = [{ id: "c1", active: true }, { id: "c2", active: false }];
    render(
      div(list(() => cards, (c) => Card(c.id, () => c.active))),
      container,
    );
    expect(mounted.sort()).toEqual(["badge:c1", "card:c1", "card:c2"]);

    cards = [];
    update();
    // c1's badge destroyed before c1's own card wrapper; c2 (never had an
    // active badge) just destroys its card.
    expect(destroyed.indexOf("badge:c1")).toBeLessThan(destroyed.indexOf("card:c1"));
    expect(destroyed).toContain("card:c2");
    expect(destroyed).not.toContain("badge:c2");
  });

  // ── Robustness at width and depth ────────────────────────────────────────

  it("handles a wide list (300 rows) each with a small nested list, without dropping any callback", () => {
    const ROWS = 300;
    let mountCount = 0;
    let destroyCount = 0;
    let rows = Array.from({ length: ROWS }, (_, i) => ({
      id: i,
      children: [0, 1, 2].map((j) => `${i}-${j}`),
    }));

    const el = render(
      div(list(() => rows, (row) =>
        div(
          { onMount: () => { mountCount++; }, onDestroy: () => { destroyCount++; } },
          list(() => row.children, (c) =>
            span({ onMount: () => { mountCount++; }, onDestroy: () => { destroyCount++; } }, c)
          ),
        )
      )),
      container,
    ) as unknown as HTMLElement;

    expect(mountCount).toBe(ROWS * 4); // 1 row wrapper + 3 children, each mounted
    expect(el.querySelectorAll("span").length).toBe(ROWS * 3);

    rows = [];
    update();
    expect(destroyCount).toBe(ROWS * 4);
  });

  it("handles a moderately deep chain of nested components (50 levels) without stack issues", () => {
    const DEPTH = 50;
    const mounted: number[] = [];
    const destroyed: number[] = [];

    function build(level: number): ReturnType<typeof div> {
      const inner = level >= DEPTH ? span("leaf") : build(level + 1);
      return div({ onMount: () => mounted.push(level), onDestroy: () => destroyed.push(level) }, inner);
    }

    let show = true;
    expect(() => render(div(when(() => show, build(0))), container)).not.toThrow();
    expect(mounted.length).toBe(DEPTH + 1);
    expect(mounted[0]).toBe(0);
    expect(mounted[DEPTH]).toBe(DEPTH);

    show = false;
    expect(() => update()).not.toThrow();
    expect(destroyed.length).toBe(DEPTH + 1);
    // Innermost (deepest level number) destroyed first.
    expect(destroyed[0]).toBe(DEPTH);
    expect(destroyed[DEPTH]).toBe(0);
  });
});
