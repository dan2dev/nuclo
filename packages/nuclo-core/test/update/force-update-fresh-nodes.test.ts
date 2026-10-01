/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * forceUpdate() when the new tree has nodes the live DOM lacks: fresh nodes
 * land at their position, are never claimed by a later sibling, and every
 * node that can be reused keeps its identity.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, hydrate, forceUpdate } from "../../src/render";
import { update } from "../../src/update/update";
import { when } from "../../src/when";
import { list } from "../../src/list";
import { reactiveTextNodes, reactiveElements } from "../../src/update/registry";
import "../../src";

describe("forceUpdate() — fresh nodes", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  type Tree = () => NodeModFn<ElementTagName>;

  /** Elements + text only: comment markers are ignored. */
  function shape(node: Node): string {
    if (node.nodeType === 3) return node.textContent ?? '';
    if (node.nodeType !== 1) return '';
    const tag = (node as Element).tagName.toLowerCase();
    return `<${tag}>${Array.from(node.childNodes, shape).join('')}</${tag}>`;
  }

  function rendered(tree: Tree): string {
    const host = document.createElement('div');
    return shape(render(tree(), host) as unknown as Node);
  }

  // =========================================================================
  // Same-tag siblings
  // =========================================================================
  describe("same-tag siblings", () => {
    it("appended siblings are built separately; existing ones are reused", () => {
      let labels = ["a"];
      const App = () => ul(...labels.map((label) => li(label)));
      const root = render(App(), container);
      const first = root.children[0];

      labels = ["a", "b", "c", "d"];
      const forced = forceUpdate(App(), container);

      expect(forced).toBe(root);
      expect(shape(root as unknown as Node)).toBe('<ul><li>a</li><li>b</li><li>c</li><li>d</li></ul>');
      expect(root.children[0]).toBe(first);
    });

    it("an empty parent gains several same-tag children", () => {
      let labels: string[] = [];
      const App = () => div(...labels.map((label) => a(label)));
      const root = render(App(), container);

      labels = ["one", "two", "three"];
      forceUpdate(App(), container);

      expect(shape(root as unknown as Node)).toBe('<div><a>one</a><a>two</a><a>three</a></div>');
    });

    it("a fresh node between reused ones lands in order", () => {
      let middle = false;
      const App = () => div(p("a"), middle ? section("b") : null, p("c"), middle ? section("d") : null);
      const root = render(App(), container);
      const [first, last] = Array.from(root.children);

      middle = true;
      forceUpdate(App(), container);

      expect(shape(root as unknown as Node)).toBe(rendered(App));
      expect(root.children[0]).toBe(first);
      expect(root.children[2]).toBe(last);
    });

    it("trailing nodes the new tree no longer has are removed", () => {
      let labels = ["a", "b", "c"];
      const App = () => ul(...labels.map((label) => li(label)));
      const root = render(App(), container);
      const first = root.children[0];

      labels = ["a"];
      forceUpdate(App(), container);

      expect(shape(root as unknown as Node)).toBe('<ul><li>a</li></ul>');
      expect(root.children[0]).toBe(first);
    });

    it("a replaced root (tag mismatch) builds every same-tag child", () => {
      render(section("old"), container);

      const root = forceUpdate(div(a("one"), a("two"), div(p("x"), p("y"))), container);

      expect(container.children.length).toBe(1);
      expect(shape(root as unknown as Node)).toBe('<div><a>one</a><a>two</a><div><p>x</p><p>y</p></div></div>');
    });

    it("repeated calls converge: same nodes, no duplicates, flat registries", () => {
      let labels = ["a"];
      const App = () => div(...labels.map((label) => p({ title: () => label }, () => label)));
      const root = render(App(), container);

      labels = ["a", "b", "c"];
      forceUpdate(App(), container);
      const elements = Array.from(root.children);
      const texts = reactiveTextNodes.size;
      const reactive = reactiveElements.size;

      for (let i = 0; i < 3; i++) forceUpdate(App(), container);

      expect(Array.from(root.children)).toEqual(elements);
      expect(shape(root as unknown as Node)).toBe('<div><p>a</p><p>b</p><p>c</p></div>');
      expect(reactiveTextNodes.size).toBe(texts);
      expect(reactiveElements.size).toBe(reactive);
    });
  });

  // =========================================================================
  // Fresh nodes are fully wired
  // =========================================================================
  describe("fresh siblings stay independent", () => {
    it("reactive text keeps updating each sibling on its own", () => {
      const state = { values: ["a"] };
      const App = () => div(...state.values.map((_, i) => p(() => state.values[i])));
      const root = render(App(), container);

      state.values = ["a", "b", "c"];
      forceUpdate(App(), container);
      state.values = ["A", "B", "C"];
      update();

      expect(Array.from(root.children, (child) => child.textContent)).toEqual(["A", "B", "C"]);
    });

    it("each fresh sibling gets its own listener and reused ones do not stack", () => {
      const clicks: string[] = [];
      let labels = ["one"];
      const App = () => div(...labels.map((label) => button(on('click', () => { clicks.push(label); }), label)));
      const root = render(App(), container);

      labels = ["one", "two", "three"];
      forceUpdate(App(), container);
      forceUpdate(App(), container);
      for (const child of Array.from(root.children)) (child as HTMLElement).click();

      expect(clicks).toEqual(["one", "two", "three"]);
    });

    it("onMount fires once for fresh siblings only; onDestroy for removed ones", () => {
      const mounted: string[] = [];
      const destroyed: string[] = [];
      let labels = ["a"];
      const App = () => div(...labels.map((label) => p(
        on('mount', () => { mounted.push(label); }),
        on('destroy', () => { destroyed.push(label); }),
        label,
      )));
      render(App(), container);
      expect(mounted).toEqual(["a"]);

      labels = ["a", "b", "c"];
      forceUpdate(App(), container);
      forceUpdate(App(), container);
      expect(mounted).toEqual(["a", "b", "c"]);
      expect(destroyed).toEqual([]);

      labels = ["a"];
      forceUpdate(App(), container);
      expect(destroyed.length).toBe(2);
    });
  });

  // =========================================================================
  // when() / list() blocks the live DOM does not have yet
  // =========================================================================
  describe("fresh when()/list() blocks", () => {
    it("a replaced root starting with when() keeps the block and its sibling apart", () => {
      render(section("old"), container);
      const App = () => div(when(() => true, a("1")), a("2"));

      const root = forceUpdate(App(), container);

      expect(shape(root as unknown as Node)).toBe('<div><a>1</a><a>2</a></div>');
    });

    it("a replaced root starting with list() keeps the rows and its sibling apart", () => {
      render(section("old"), container);
      const items = ["x", "y"];
      const App = () => div(list(() => items, (item) => a(item)), a("z"));

      const root = forceUpdate(App(), container);

      expect(shape(root as unknown as Node)).toBe('<div><a>x</a><a>y</a><a>z</a></div>');
    });

    it("a tree that gains a when() ahead of existing children keeps them", () => {
      let withBlock = false;
      const App = () => div(withBlock ? when(() => true, a("1")) : null, span("x"), withBlock ? a("2") : null);
      const root = render(App(), container);
      const existing = root.children[0];

      withBlock = true;
      forceUpdate(App(), container);

      expect(shape(root as unknown as Node)).toBe('<div><a>1</a><span>x</span><a>2</a></div>');
      expect(root.children[1]).toBe(existing);
    });

    it("a tree that gains a list() ahead of same-tag children keeps them apart", () => {
      let withBlock = false;
      const items = ["x", "y"];
      const App = () => div(withBlock ? list(() => items, (item) => a(item)) : null, a("k"), withBlock ? a("z") : null);
      const root = render(App(), container);
      const existing = root.children[0];

      withBlock = true;
      forceUpdate(App(), container);

      expect(shape(root as unknown as Node)).toBe('<div><a>x</a><a>y</a><a>k</a><a>z</a></div>');
      expect(root.children[2]).toBe(existing);
    });

    it("gained blocks are live: when() toggles and list() syncs on update()", () => {
      let withBlocks = false;
      let show = true;
      const items = ["x"];
      const App = () => div(
        a("head"),
        withBlocks ? when(() => show, a("w")) : null,
        withBlocks ? list(() => items, (item) => a(item)) : null,
        a("tail"),
      );
      const root = render(App(), container);

      withBlocks = true;
      forceUpdate(App(), container);
      expect(root.textContent).toBe('headwxtail');

      show = false;
      items.push("y");
      update();
      expect(root.textContent).toBe('headxytail');

      // A later pass claims the blocks it built — nothing is duplicated.
      forceUpdate(App(), container);
      expect(root.textContent).toBe('headxytail');
      show = true;
      update();
      expect(root.textContent).toBe('headwxytail');
    });

    it("a tree that drops its when()/list() blocks removes them and their content", () => {
      let withBlocks = true;
      const items = ["x", "y"];
      const App = () => div(
        withBlocks ? when(() => true, a("w")) : null,
        span("keep"),
        withBlocks ? list(() => items, (item) => a(item)) : null,
      );
      const root = render(App(), container);

      withBlocks = false;
      forceUpdate(App(), container);

      expect(shape(root as unknown as Node)).toBe('<div><span>keep</span></div>');
      expect(root.childNodes.length).toBe(1);
    });

    it("leaves no appendChild override on the host", () => {
      let withBlock = false;
      const App = () => div(withBlock ? when(() => true, a("1")) : null, span("x"));
      const root = render(App(), container);

      withBlock = true;
      forceUpdate(App(), container);

      expect(Object.prototype.hasOwnProperty.call(root, 'appendChild')).toBe(false);
    });
  });

  // =========================================================================
  // Other entry points
  // =========================================================================
  describe("entry points", () => {
    it("bare forceUpdate() on a component root gains same-tag siblings", () => {
      let labels = ["a"];
      const App = () => div(...labels.map((label) => a(label)));
      const root = render(App, container);

      labels = ["a", "b", "c"];
      forceUpdate();

      expect(shape(root as unknown as Node)).toBe('<div><a>a</a><a>b</a><a>c</a></div>');
    });

    it("works on a tree hydrate() built fresh into an empty container", () => {
      let labels = ["a", "b"];
      const App = () => div(...labels.map((label) => a(label)), p(() => labels.join("")));
      const root = hydrate(App(), container);
      const elements = Array.from(root.children);

      labels = ["A", "B"];
      forceUpdate(App(), container);

      expect(Array.from(root.children)).toEqual(elements);
      expect(shape(root as unknown as Node)).toBe('<div><a>A</a><a>B</a><p>AB</p></div>');
    });
  });
});
