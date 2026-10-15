/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { membersOf, TEXT_KIND, ELEMENT_KIND, LIST_KIND, WHEN_KIND } from "../../src/update/scope";
import "../../src";

/**
 * The member sets update(id) iterates hold the registries' own WeakRefs, so
 * a root that stays on the page must not pin the rows, branches and leaves
 * that left it. See gc-collectability.test.ts for why nodes are taken from
 * childNodes and never from querySelector().
 */
const hasGc = typeof globalThis.gc === "function";
const itGc = hasGc ? it : it.skip;

async function collectGarbage(): Promise<void> {
  for (let i = 0; i < 6; i++) {
    globalThis.gc!();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

describe("scope member sets — real GC", () => {
  itGc("rows, branches and leaves removed from a live root are collected and swept", async () => {
    let items = Array.from({ length: 200 }, (_, i) => ({ i, on: true }));
    const root = render(
      div(scope("live"), ul(list(() => items, (it) => li({ title: () => `${it.i}` }, when(() => it.on, b(() => `${it.i}`))))))
    ) as unknown as Element;
    update("live");
    const ul0 = root.firstChild as HTMLElement;
    let weak: WeakRef<Node>[] | null = Array.from(ul0.childNodes)
      .filter((n) => n.nodeType === 1)
      .map((li) => new WeakRef(li));
    expect(weak.length).toBe(200);
    expect(membersOf(root, ELEMENT_KIND).size).toBe(200);
    expect(membersOf(root, WHEN_KIND).size).toBe(200);
    expect(membersOf(root, TEXT_KIND).size).toBe(200);
    expect(membersOf(root, LIST_KIND).size).toBe(1);

    items = [];
    update("live"); // rows leave through nuclo
    await collectGarbage();
    const alive = weak.filter((w) => w.deref() !== undefined).length;
    weak = null;
    expect(alive).toBe(0);

    // The sets drop the dead members on the next scoped pass.
    update("live");
    expect(membersOf(root, ELEMENT_KIND).size).toBe(0);
    expect(membersOf(root, WHEN_KIND).size).toBe(0);
    expect(membersOf(root, TEXT_KIND).size).toBe(0);
    root.remove();
  }, 30_000);

  itGc("a root removed behind nuclo's back is collected with its member sets", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let n = 0;
    let weak: WeakRef<Element> | null = new WeakRef(
      render(div(scope("gone"), span(() => `${n}`), list(() => [1, 2], (i) => p(() => `${i}`))), host) as unknown as Element,
    );
    update("gone");
    host.innerHTML = ""; // raw wipe: no cleanup pass runs
    n = 1;
    update("gone"); // the pruned root answers nothing, and throws nothing
    await collectGarbage();
    expect(weak.deref()).toBeUndefined();
    weak = null;
    host.remove();
  }, 30_000);
});
