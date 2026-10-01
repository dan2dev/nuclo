/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "../../src/render";
import { update } from "../../src/update/update";
import { snap } from "../integration/fuzz-harness";
import "../../src";

/**
 * list() builds rows by cloning the first row's skeleton and patching it —
 * as long as every row has the first row's shape. A row whose shape differs
 * in any slot must fall back to the normal build, for that row and for the
 * rows after it.
 *
 * This is the full matrix: for every ordered pair of slot shapes (A, B), a
 * list renders rows shaped A, B, A, B, A — then grows, reorders and changes
 * state. Each row is compared with the same row built outside any list (the
 * normal path, which no template logic touches), and every event handler must
 * fire for its own row exactly once.
 */
interface Item {
  id: number;
  shape: number;
  label: string;
  on: boolean;
  kids: number[];
}

let hits: number[] = [];
const hit = (id: number): void => { hits.push(id); };

type Shape = [name: string, mods: (item: Item) => unknown[]];

const SHAPES: Shape[] = [
  ["nothing", () => []],
  ["static text", (item) => [item.label]],
  ["number text", (item) => [item.id]],
  ["reactive text", (item) => [() => item.label]],
  ["reactive text that may be null", (item) => [() => (item.on ? item.label : null)]],
  ["null modifier", () => [null]],
  ["undefined modifier", () => [undefined]],
  ["two static texts", () => ["a", "b"]],
  ["child <span>", () => [span("c")]],
  ["child <b>", () => [b("c")]],
  ["child <span> with reactive text", (item) => [span(() => item.label)]],
  ["nested children", (item) => [span(i(() => item.label), "x")]],
  ["child with attrs, event and reactive text", (item) => [button({ className: "btn", onClick: () => hit(item.id) }, () => item.label)]],
  ["static attrs", (item) => [{ title: `t${item.id}` }]],
  ["static attrs, other keys", () => [{ lang: "en", dir: "ltr" }]],
  ["null attr value", () => [{ title: null }]],
  ["boolean attr", (item) => [{ hidden: item.on }]],
  ["static className", (item) => [{ className: `k${item.id % 2}` }]],
  ["reactive className", (item) => [{ className: () => (item.on ? "on" : "") }]],
  ["reactive attribute", (item) => [{ title: () => item.label }]],
  ["class object resolver", (item) => [() => ({ className: item.on ? "cx-on" : "cx-off" })]],
  ["style object", () => [{ style: { color: "red" } }]],
  ["onClick attribute", (item) => [{ onClick: () => hit(item.id) }]],
  ["on('click') modifier", (item) => [on("click", () => hit(item.id))]],
  ["when() block", (item) => [when(() => item.on, em("w")).else("-")]],
  ["nested list()", (item) => [list(() => item.kids, (kid) => u(String(kid)))]],
  ["raw node", () => [document.createElement("hr")]],
];

/** Shapes whose row root (or child button) carries a click handler. */
const CLICK_ON_ROOT = new Set(["onClick attribute", "on('click') modifier"]);
const CLICK_ON_BUTTON = new Set(["child with attrs, event and reactive text"]);

type Builder = (...mods: unknown[]) => unknown;

/** `nested` puts the varying slot on a child element instead of the row root. */
let nested = false;
const buildRow = (item: Item): unknown =>
  nested
    ? (section as Builder)(
        { "data-id": String(item.id) },
        "pre|",
        (article as Builder)("in|", ...SHAPES[item.shape]![1](item), "|out"),
        "|post",
      )
    : (section as Builder)({ "data-id": String(item.id) }, "pre|", ...SHAPES[item.shape]![1](item), "|post");

describe("list() row template — every pair of row shapes renders like the normal path", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
    hits = [];
  });

  /** The same rows built one by one outside a list: the reference. */
  function reference(items: Item[]): string {
    const host = document.createElement("div");
    for (const item of items) {
      host.appendChild((buildRow(item) as (parent: Element, index: number) => Element)(host, 0));
    }
    return snap(host);
  }

  function expectHandlers(items: Item[], label: string): void {
    const rows = Array.from(container.firstElementChild!.children);
    for (let k = 0; k < items.length; k++) {
      const item = items[k]!;
      const name = SHAPES[item.shape]![0];
      // The element carrying the varying slot: the row itself, or its <article>.
      const holder = nested ? rows[k]!.getElementsByTagName("article")[0]! : rows[k]!;
      const target = CLICK_ON_ROOT.has(name) ? holder : CLICK_ON_BUTTON.has(name) ? holder.getElementsByTagName("button")[0]! : null;
      hits = [];
      rows[k]!.dispatchEvent(new Event("click"));
      if (nested) holder.dispatchEvent(new Event("click"));
      holder.getElementsByTagName("button")[0]?.dispatchEvent(new Event("click"));
      const expected = target ? [item.id] : [];
      if (hits.join() !== expected.join()) throw new Error(`${label}: row ${k} (${name}) fired [${hits}], expected [${expected}]`);
    }
  }

  let nextId = 0;
  const make = (shape: number): Item => {
    const id = nextId++;
    return { id, shape, label: `L${id}`, on: id % 2 === 0, kids: [id, id + 1] };
  };

  for (const where of ["row root", "nested child"] as const)
  for (let a = 0; a < SHAPES.length; a++) {
    it(`${where}: first row "${SHAPES[a]![0]}" × every other shape`, () => {
      nested = where === "nested child";
      for (let bIndex = 0; bIndex < SHAPES.length; bIndex++) {
        const pair = `"${SHAPES[a]![0]}" then "${SHAPES[bIndex]![0]}"`;
        container.textContent = "";
        let items = [make(a), make(bIndex), make(a), make(bIndex), make(a)];
        render(div(list(() => items, (item) => buildRow(item) as never)), container);
        const root = container.firstElementChild!;

        if (snap(root) !== reference(items)) {
          throw new Error(`${pair}: initial render differs\n  list:      ${snap(root)}\n  reference: ${reference(items)}`);
        }
        expectHandlers(items, `${pair} (initial)`);

        // Grow at both ends and in the middle, then reorder.
        items = [make(bIndex), ...items.slice(0, 2), make(a), make(bIndex), ...items.slice(2), make(a)];
        update();
        if (snap(root) !== reference(items)) {
          throw new Error(`${pair}: after inserting rows\n  list:      ${snap(root)}\n  reference: ${reference(items)}`);
        }
        items = items.slice().reverse();
        update();
        if (snap(root) !== reference(items)) throw new Error(`${pair}: after reversing`);
        expectHandlers(items, `${pair} (after reorder)`);

        // State read by resolvers changes; static values captured at build time do not.
        const staticView = items.map((item) => ({ ...item, kids: item.kids.slice() }));
        for (const item of items) {
          item.label = `${item.label}!`;
          item.on = !item.on;
          item.kids = [...item.kids, item.id * 10];
        }
        update();
        // Rebuild the reference with reactive state updated the same way: build
        // from the old snapshot, then apply the mutation and update().
        const host = document.createElement("div");
        document.body.appendChild(host);
        for (const old of staticView) host.appendChild((buildRow(old) as (parent: Element, index: number) => Element)(host, 0));
        for (const old of staticView) {
          old.label = `${old.label}!`;
          old.on = !old.on;
          old.kids = [...old.kids, old.id * 10];
        }
        update();
        const expected = snap(host);
        host.remove();
        if (snap(root) !== expected) {
          throw new Error(`${pair}: after a state change\n  list:      ${snap(root)}\n  reference: ${expected}`);
        }

        // Shrink to nothing and come back with the other shape first.
        items = [];
        update();
        expect(root.children.length).toBe(0);
        items = [make(bIndex), make(a), make(bIndex)];
        update();
        if (snap(root) !== reference(items)) throw new Error(`${pair}: after clearing and refilling`);
        expectHandlers(items, `${pair} (refilled)`);
      }
    });
  }
});
