/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { hydrate, render } from "../../src/render";
import { update } from "../../src/update/update";
import { renderToString } from "../../src/ssr/render-to-string";
import { when } from "../../src/when";
import { list } from "../../src/list";
import "../../src";

/**
 * Nodes hydrate() has to build fresh (nothing in the SSR DOM to claim) must
 * never be claimable by a later sibling — hydration has to converge on the
 * same DOM render() produces for the same tree.
 */
describe("hydration — fresh nodes are not claimable by later siblings", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  type Tree = () => NodeModFn<ElementTagName>;

  /**
   * Elements (with attributes) + text only: hydration's comment markers and
   * formatter whitespace are ignored.
   */
  function shape(node: Node): string {
    if (node.nodeType === 3) return /\S/.test(node.textContent ?? '') ? node.textContent! : '';
    if (node.nodeType !== 1) return '';
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const attrs = Array.from(el.attributes, (attr) => ` ${attr.name}="${attr.value}"`).sort().join('');
    return `<${tag}${attrs}>${Array.from(node.childNodes, shape).join('')}</${tag}>`;
  }

  function rendered(tree: Tree): string {
    const host = document.createElement('div');
    return shape(render(tree(), host) as unknown as Node);
  }

  function hydrated(tree: Tree): string {
    return shape(hydrate(tree(), container) as unknown as Node);
  }

  // =========================================================================
  // The reported collapses
  // =========================================================================
  describe("reported repros", () => {
    it("empty container: same-tag siblings stay separate", () => {
      const tree = () => div(a("one"), a("two"));

      expect(hydrated(tree)).toBe('<div><a>one</a><a>two</a></div>');
      expect(container.children.length).toBe(1);
    });

    it("claimed list row with missing children builds every child", () => {
      container.innerHTML = '<div><main><!--list-start-0--><div></div><!--list-end--></main></div>';
      const slot = [{}];

      const el = hydrate(
        div(main(list(() => slot, () => (h: ExpandedElement<"main">, i: number) => div(p("a"), p("b"), p("c"))(h, i)))),
        container,
      );

      expect(shape(el as unknown as Node)).toBe('<div><main><div><p>a</p><p>b</p><p>c</p></div></main></div>');
    });

    it("mismatched list row tag builds every child", () => {
      container.innerHTML = '<div><main><!--list-start-0--><div></div><!--list-end--></main></div>';
      const slot = [{}];

      const el = hydrate(
        div(main(list(() => slot, () => (h: ExpandedElement<"main">, i: number) => section(p("a"), p("b"), p("c"))(h, i)))),
        container,
      );

      expect(shape(el as unknown as Node)).toBe('<div><main><section><p>a</p><p>b</p><p>c</p></section></main></div>');
    });

    it("every row of a multi-row list keeps all of its fresh children", () => {
      container.innerHTML =
        '<ul><!--list-start-0--><li></li><li></li><li></li><!--list-end--></ul>';
      const rows = ["x", "y", "z"];
      const ssrRows = Array.from(container.firstElementChild!.children);

      const el = hydrate(ul(list(() => rows, (row) => li(b(row), b("-"), b(row)))), container);

      expect(shape(el as unknown as Node)).toBe(
        '<ul><li><b>x</b><b>-</b><b>x</b></li><li><b>y</b><b>-</b><b>y</b></li><li><b>z</b><b>-</b><b>z</b></li></ul>',
      );
      // The SSR rows themselves were claimed, not rebuilt.
      expect(Array.from(el.children)).toEqual(ssrRows);
    });
  });

  // =========================================================================
  // hydrate() converges on render() whatever the SSR DOM is missing
  // =========================================================================
  describe("render() parity", () => {
    const trees: Record<string, Tree> = {
      "same-tag siblings": () => div(a("one"), a("two"), a("three")),
      "text between same-tag siblings": () => div("x", a("1"), "y", a("2"), "z"),
      "nested same-tag elements": () => div(div(div("a"), div("b")), div("c")),
      "nested lists": () => ul(li("a"), li(span("b"), span("c")), li("d")),
      "mixed tags": () => div(h1("t"), p("a"), p("b"), section(p("c"), p("d"))),
      "reactive text siblings": () => div(p(() => "a"), p(() => "b"), () => "tail"),
      "childless siblings with attributes": () =>
        div(input({ type: "text" }), input({ type: "checkbox" }), br(), br()),
      "classes and ids": () => div({ id: "root" }, p({ className: "a" }, "1"), p({ className: "b" }, "2")),
    };

    /** Each variant leaves the container with a different slice of the SSR DOM. */
    const ssrVariants: Record<string, (html: string) => void> = {
      "empty container": () => { container.innerHTML = ''; },
      "full SSR": (html) => { container.innerHTML = html; },
      "pretty-printed SSR": (html) => { container.innerHTML = html.replace(/></g, '>\n  <'); },
      "childless root": (html) => {
        container.innerHTML = html;
        container.firstElementChild!.textContent = '';
      },
      "root's children emptied": (html) => {
        container.innerHTML = html;
        for (const child of Array.from(container.firstElementChild!.children)) child.textContent = '';
      },
      "last child of every element dropped": (html) => {
        container.innerHTML = html;
        for (const el of Array.from(container.querySelectorAll('*'))) {
          if (el.isConnected && el.lastChild) el.removeChild(el.lastChild);
        }
      },
      "first element child of every element dropped": (html) => {
        container.innerHTML = html;
        for (const el of Array.from(container.querySelectorAll('*'))) {
          if (el.isConnected && el.firstElementChild) el.removeChild(el.firstElementChild);
        }
      },
      "only the root's last child kept": (html) => {
        container.innerHTML = html;
        const root = container.firstElementChild!;
        while (root.firstChild && root.firstChild !== root.lastChild) root.removeChild(root.firstChild);
      },
    };

    for (const [treeName, tree] of Object.entries(trees)) {
      for (const [variantName, prepare] of Object.entries(ssrVariants)) {
        it(`${treeName} — ${variantName}`, () => {
          prepare(renderToString(tree()));

          expect(hydrated(tree)).toBe(rendered(tree));
          expect(container.children.length).toBe(1);
        });
      }
    }
  });

  // =========================================================================
  // Claimed and fresh nodes side by side
  // =========================================================================
  describe("claimed + fresh siblings", () => {
    it("keeps the SSR nodes it can claim and builds only the missing tail", () => {
      const tree = () => ul(li("a"), li("b"), li("c"));
      container.innerHTML = renderToString(ul(li("a")));
      const ssrFirst = container.firstElementChild!.firstElementChild!;

      const el = hydrate(tree(), container);

      expect(shape(el as unknown as Node)).toBe(rendered(tree));
      expect(el.children[0]).toBe(ssrFirst);
    });

    it("a fresh node between two claimed ones lands in order and both are reused", () => {
      const tree = () => div(p("a"), section("b"), p("c"));
      container.innerHTML = renderToString(div(p("a"), p("c")));
      const [ssrA, ssrC] = Array.from(container.firstElementChild!.children);

      const el = hydrate(tree(), container);

      expect(shape(el as unknown as Node)).toBe(rendered(tree));
      expect(el.children[0]).toBe(ssrA);
      expect(el.children[2]).toBe(ssrC);
    });

    it("a fresh node is not reachable once the cursor walks past the SSR children", () => {
      // section is fresh; p("a") claims the SSR <p>, moving the cursor on.
      container.innerHTML = '<div><p><!-- text-0 -->a</p></div>';
      const tree = () => div(section("s"), p("a"), section("b"));

      expect(hydrated(tree)).toBe(rendered(tree));
    });

    it("stale SSR children after the fresh nodes are removed", () => {
      container.innerHTML = '<div><span>stale</span><i>stale</i></div>';
      const tree = () => div(a("1"), a("2"));

      const el = hydrate(tree(), container);

      expect(shape(el as unknown as Node)).toBe(rendered(tree));
      expect(el.querySelector('span')).toBeNull();
      expect(el.querySelector('i')).toBeNull();
    });

    it("whitespace-only SSR parent: fresh siblings stay separate", () => {
      container.innerHTML = '<div>\n  \n</div>';
      const tree = () => div(a("1"), a("2"), a("3"));

      expect(hydrated(tree)).toBe(rendered(tree));
    });

    it("a raw Node child followed by same-tag siblings", () => {
      const raw = document.createElement('a');
      raw.textContent = 'raw';

      const el = hydrate(div(raw, a("1"), a("2")), container);

      expect(el.children.length).toBe(3);
      expect(el.children[0]).toBe(raw);
      expect(el.textContent).toBe('raw12');
    });

    it("many same-tag siblings all survive, in order", () => {
      const labels = Array.from({ length: 200 }, (_, i) => `item-${i}`);

      const el = hydrate(ul(...labels.map((label) => li(label))), container);

      expect(Array.from(el.children, (child) => child.textContent)).toEqual(labels);
    });

    it("SVG siblings are built separately and keep their namespace", () => {
      const tree = () => svgSvg(circleSvg({ r: 1 }), circleSvg({ r: 2 })) as unknown as NodeModFn<ElementTagName>;

      const el = hydrate(tree(), container);

      expect(Array.from(el.children, (child) => child.getAttribute('r'))).toEqual(['1', '2']);
      expect(el.children[1].namespaceURI).toBe('http://www.w3.org/2000/svg');
    });
  });

  // =========================================================================
  // Fresh nodes are fully wired: reactivity, listeners, lifecycle
  // =========================================================================
  describe("fresh siblings stay independent", () => {
    it("reactive text and attributes update each sibling on its own", () => {
      const state = { first: "a", second: "b" };

      const el = hydrate(
        div(
          p({ title: () => state.first }, () => state.first),
          p({ title: () => state.second }, () => state.second),
        ),
        container,
      );
      state.first = "A";
      state.second = "B";
      update();

      expect(Array.from(el.children, (child) => child.textContent)).toEqual(["A", "B"]);
      expect(Array.from(el.children, (child) => child.getAttribute('title'))).toEqual(["A", "B"]);
    });

    it("each sibling keeps its own listener", () => {
      const clicks: string[] = [];

      const el = hydrate(
        div(
          button(on('click', () => { clicks.push("one"); }), "one"),
          button(on('click', () => { clicks.push("two"); }), "two"),
        ),
        container,
      );
      (el.children[1] as HTMLElement).click();
      (el.children[0] as HTMLElement).click();

      expect(clicks).toEqual(["two", "one"]);
    });

    it("onMount fires exactly once per fresh sibling", () => {
      const mounted: string[] = [];

      hydrate(
        div(
          p(on('mount', () => { mounted.push("one"); })),
          p(on('mount', () => { mounted.push("two"); })),
        ),
        container,
      );

      expect(mounted).toEqual(["one", "two"]);
    });

    it("hydrating the freshly built DOM again reuses every element", () => {
      const tree = () => div(a("one"), a("two"), section(p("x"), p("y")));
      const first = hydrate(tree(), container);
      const elements = Array.from(first.querySelectorAll('*'));

      const second = hydrate(tree(), container);

      expect(second).toBe(first);
      expect(Array.from(second.querySelectorAll('*'))).toEqual(elements);
      expect(shape(second as unknown as Node)).toBe(rendered(tree));
    });
  });

  // =========================================================================
  // when() / list() blocks built fresh in the middle of a hydration pass
  // =========================================================================
  describe("fresh when()/list() blocks", () => {
    it("keep their position among fresh siblings", () => {
      const items = ["x", "y"];
      const tree = () => div(
        when(() => true, a("1")),
        a("2"),
        list(() => items, (item) => a(item)),
        a("3"),
      );

      expect(hydrated(tree)).toBe('<div><a>1</a><a>2</a><a>x</a><a>y</a><a>3</a></div>');
    });

    it("without SSR markers do not hide later siblings", () => {
      container.innerHTML = '<div></div>';
      const items = ["x"];
      const tree = () => div(when(() => true, a("1")), a("2"), list(() => items, (item) => a(item)), a("3"));

      expect(hydrated(tree)).toBe(rendered(tree));
    });

    it("without SSR markers build ahead of stale SSR children", () => {
      container.innerHTML = '<div><span>stale</span></div>';
      const items = ["x"];
      const tree = () => div(when(() => true, a("1")), a("2"), list(() => items, (item) => a(item)), a("3"));

      expect(hydrated(tree)).toBe(rendered(tree));
    });

    it("land between the SSR children that are claimed around them", () => {
      container.innerHTML = renderToString(div(h1("head"), p("foot")));
      const [ssrHead, ssrFoot] = Array.from(container.firstElementChild!.children);
      const items = ["x", "y"];
      const tree = () => div(h1("head"), when(() => true, p("w")), list(() => items, (item) => p(item)), p("foot"));

      const el = hydrate(tree(), container);

      expect(shape(el as unknown as Node)).toBe(rendered(tree));
      expect(el.firstElementChild).toBe(ssrHead);
      expect(el.lastElementChild).toBe(ssrFoot);
    });

    it("nested blocks stay inside their parent block", () => {
      for (const ssr of ['', '<div></div>', '<div><span>stale</span></div>']) {
        container.innerHTML = ssr;
        const items = ["x", "y"];
        const tree = () => div(
          when(() => true, a("1"), when(() => true, a("2"), list(() => items, (item) => a(item))), a("3")),
          a("4"),
        );

        const el = hydrate(tree(), container);

        // Same order render() gives the branch content, nothing lost, and the
        // sibling after the outer block stays after it.
        expect(shape(el as unknown as Node)).toBe(rendered(tree));
        expect(el.querySelectorAll('a').length).toBe(6);
        expect(el.lastElementChild!.textContent).toBe('4');
      }
    });

    it("stay reactive: when() toggles and list() syncs in place", () => {
      container.innerHTML = '<div><span>stale</span></div>';
      let show = true;
      const items = ["x"];

      const el = hydrate(
        div(a("head"), when(() => show, a("w")), list(() => items, (item) => a(item)), a("tail")),
        container,
      );
      expect(el.textContent).toBe('headwxtail');

      show = false;
      items.push("y");
      update();
      expect(el.textContent).toBe('headxytail');

      show = true;
      items.length = 0;
      update();
      expect(el.textContent).toBe('headwtail');
    });

    it("a claimed element inside a matching when() branch builds its missing same-tag children", () => {
      container.innerHTML = '<div><!--when-start-0:0--><ul></ul><!--when-end--></div>';
      const ssrList = container.querySelector('ul')!;

      const el = hydrate(div(when(() => true, ul(li("a"), li("b"), li("c")))), container);

      expect(shape(el as unknown as Node)).toBe('<div><ul><li>a</li><li>b</li><li>c</li></ul></div>');
      expect(el.firstElementChild).toBe(ssrList);
    });

    it("leave no appendChild override behind on the host", () => {
      container.innerHTML = '<div><span>stale</span></div>';

      const el = hydrate(div(when(() => true, a("1")), list(() => ["x"], (item) => a(item))), container);

      expect(Object.prototype.hasOwnProperty.call(el, 'appendChild')).toBe(false);
    });

    it("restore hydration and the host when a fresh block throws", () => {
      container.innerHTML = '<div><span>stale</span></div>';
      const boom = () => { throw new Error("boom"); };

      expect(() => hydrate(div(list(() => ["x"], boom)), container)).toThrow("boom");
      expect(Object.prototype.hasOwnProperty.call(container.firstElementChild, 'appendChild')).toBe(false);

      // The next pass is unaffected: it claims and converges as usual.
      const tree = () => div(a("1"), a("2"));
      container.innerHTML = renderToString(tree());
      const ssrRoot = container.firstElementChild;
      expect(hydrate(tree(), container)).toBe(ssrRoot);
      expect(shape(ssrRoot!)).toBe(rendered(tree));
    });
  });

  // =========================================================================
  // DOM-operation counts — fresh placement must stay one O(1) insert per node
  // =========================================================================
  describe("DOM operation counts", () => {
    function spyOnDomWrites() {
      return {
        insertBefore: vi.spyOn(Node.prototype, 'insertBefore'),
        appendChild: vi.spyOn(Node.prototype, 'appendChild'),
        removeChild: vi.spyOn(Node.prototype, 'removeChild'),
      };
    }

    it("a fully matching SSR tree is hydrated without a single DOM write", () => {
      const items = ["x", "y"];
      const tree = () => div(h1("t"), p(() => "a"), p("b"), when(() => true, a("w")), list(() => items, (item) => a(item)));
      container.innerHTML = renderToString(tree());
      const writes = spyOnDomWrites();

      hydrate(tree(), container);

      expect(writes.insertBefore).not.toHaveBeenCalled();
      expect(writes.appendChild).not.toHaveBeenCalled();
      expect(writes.removeChild).not.toHaveBeenCalled();
    });

    it("each fresh sibling is inserted exactly once and never moved or removed", () => {
      const count = 100;
      container.innerHTML = '<ul></ul>';
      const root = container.firstElementChild!;
      const writes = spyOnDomWrites();

      hydrate(ul(...Array.from({ length: count }, () => li())), container);

      const intoRoot = (spy: { mock: { contexts: unknown[] } }) =>
        spy.mock.contexts.filter((context) => context === root).length;
      expect(intoRoot(writes.insertBefore) + intoRoot(writes.appendChild)).toBe(count);
      expect(writes.removeChild).not.toHaveBeenCalled();
      expect(root.children.length).toBe(count);
    });
  });
});
