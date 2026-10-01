/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import '../../src/polyfill';
import { it, expect } from "vitest";
import { renderToString } from "../../src/ssr/render-to-string";
import { when } from "../../src/when";
import { list } from "../../src/list";
import "../../src";

// Server path of when-nested-block-order.test.ts: the polyfill document has
// its own insertBefore, so the emitted order is checked there too.
it("renderToString() on the server emits nested when()/list() blocks in written order", () => {
  const items = ['x', 'y'];

  const html = renderToString(
    div(when(() => true, a('1'), when(() => true, a('2'), list(() => items, (i) => a(i))), a('3')), a('4')),
  );

  expect(html.replace(/<!--.*?-->/g, '')).toBe('<div><a>1</a><a>2</a><a>x</a><a>y</a><a>3</a><a>4</a></div>');
});
