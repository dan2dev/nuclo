/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { hydrate, render } from "../../src/render";
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

  /** Element structure + text only: hydration's text markers are ignored. */
  function shape(node: Node): string {
    if (node.nodeType === 3) return node.textContent ?? '';
    if (node.nodeType !== 1) return '';
    const tag = (node as Element).tagName.toLowerCase();
    return `<${tag}>${Array.from(node.childNodes, shape).join('')}</${tag}>`;
  }

  function rendered(tree: () => NodeModFn<ElementTagName>): string {
    const host = document.createElement('div');
    return shape(render(tree(), host) as unknown as Node);
  }

  it("empty container: same-tag siblings stay separate", () => {
    const tree = () => div(a("one"), a("two"));

    const el = hydrate(tree(), container);

    expect(shape(el as unknown as Node)).toBe('<div><a>one</a><a>two</a></div>');
    expect(shape(el as unknown as Node)).toBe(rendered(tree));
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

  it("a fresh node is not reachable once the cursor walks past the SSR children", () => {
    // section is fresh; p("a") claims the SSR <p>, moving the cursor on.
    container.innerHTML = '<div><p><!-- text-0 -->a</p></div>';
    const tree = () => div(section("s"), p("a"), section("b"));

    const el = hydrate(tree(), container);

    expect(shape(el as unknown as Node)).toBe(rendered(tree));
  });

  it("fresh when()/list() blocks keep their position among fresh siblings", () => {
    const items = ["x", "y"];
    const tree = () => div(
      when(() => true, a("1")),
      a("2"),
      list(() => items, (item) => a(item)),
      a("3"),
    );

    const el = hydrate(tree(), container);

    expect(shape(el as unknown as Node)).toBe('<div><a>1</a><a>2</a><a>x</a><a>y</a><a>3</a></div>');
  });

  it("when()/list() without SSR markers do not hide later siblings", () => {
    container.innerHTML = '<div></div>';
    const items = ["x"];
    const tree = () => div(when(() => true, a("1")), a("2"), list(() => items, (item) => a(item)), a("3"));

    const el = hydrate(tree(), container);

    expect(shape(el as unknown as Node)).toBe(rendered(tree));
  });

  it("when()/list() without SSR markers build ahead of stale SSR children", () => {
    container.innerHTML = '<div><span>stale</span></div>';
    const items = ["x"];
    const tree = () => div(when(() => true, a("1")), a("2"), list(() => items, (item) => a(item)), a("3"));

    const el = hydrate(tree(), container);

    expect(shape(el as unknown as Node)).toBe(rendered(tree));
  });
});
