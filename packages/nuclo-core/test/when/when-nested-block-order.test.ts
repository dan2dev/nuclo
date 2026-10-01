/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { hydrate, render } from "../../src/render";
import { update } from "../../src/update/update";
import { renderToString } from "../../src/ssr/render-to-string";
import { when } from "../../src/when";
import { list } from "../../src/list";
import "../../src";

/**
 * Branch content renders in source order, like the children of any other
 * container — including nested when()/list() blocks, which insert their own
 * markers instead of returning a node.
 */
describe("when() — nested blocks keep source order among branch siblings", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  const anchors = (root: ParentNode): string =>
    Array.from(root.querySelectorAll('a'), (el) => el.textContent).join(',');

  it("render(): elements, nested when() and list() land in written order", () => {
    const items = ['x', 'y'];

    const el = render(
      div(when(() => true, a('1'), when(() => true, a('2'), list(() => items, (i) => a(i))), a('3')), a('4')),
      container,
    );

    expect(anchors(el)).toBe('1,2,x,y,3,4');
  });

  it("render(): text and dynamic text keep their place around a nested block", () => {
    const el = render(div(when(() => true, 'a', when(() => true, 'b'), () => 'c', list(() => ['d'], (i) => span(i)), 'e')), container);

    expect(el.textContent).toBe('abcde');
  });

  it("update(): order holds when the outer and inner branches toggle", () => {
    const items = ['x', 'y'];
    let outer = true;
    let inner = true;

    const el = render(
      div(
        when(() => outer, a('1'), when(() => inner, a('2'), list(() => items, (i) => a(i))).else(a('e'), a('f')), a('3'))
          .else(a('o'), when(() => inner, a('p')), a('q')),
        a('4'),
      ),
      container,
    );
    expect(anchors(el)).toBe('1,2,x,y,3,4');

    inner = false;
    update();
    expect(anchors(el)).toBe('1,e,f,3,4');

    outer = false;
    update();
    expect(anchors(el)).toBe('o,q,4');

    inner = true;
    update();
    expect(anchors(el)).toBe('o,p,q,4');

    outer = true;
    items.push('z');
    update();
    expect(anchors(el)).toBe('1,2,x,y,z,3,4');
  });

  it("renderToString(): emits the same order and hydrate() claims it in place", () => {
    const items = ['x', 'y'];
    const tree = () =>
      div(when(() => true, a('1'), when(() => true, a('2'), list(() => items, (i) => a(i))), a('3')), a('4'));

    const html = renderToString(tree());
    expect(Array.from(html.matchAll(/<a>(?:<!--.*?-->)?(.*?)<\/a>/g), (m) => m[1]).join(',')).toBe('1,2,x,y,3,4');

    container.innerHTML = html;
    const ssrAnchors = Array.from(container.querySelectorAll('a'));

    const el = hydrate(tree(), container);

    expect(anchors(el)).toBe('1,2,x,y,3,4');
    expect(Array.from(el.querySelectorAll('a'))).toEqual(ssrAnchors);
  });

  it("hydrate(): a mismatched branch is rebuilt in written order", () => {
    container.innerHTML = renderToString(div(when(() => false, a('never')).else(a('server')), a('4')));
    const items = ['x', 'y'];

    const el = hydrate(
      div(when(() => true, a('1'), when(() => true, a('2'), list(() => items, (i) => a(i))), a('3')).else(a('server')), a('4')),
      container,
    );

    expect(anchors(el)).toBe('1,2,x,y,3,4');
  });
});
