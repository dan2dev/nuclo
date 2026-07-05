/// <reference path="../types/index.d.ts" />
/**
 * Type-level edge-case tests — compiled by `npm run typecheck`
 * (tsconfig.typecheck.json). No runtime assertions: a wrong inference either
 * fails to compile directly or trips an `Expect<Equal<...>>` /
 * `@ts-expect-error` probe.
 *
 * Complements type-inference-core/public/module/subpaths with the edge cases
 * of when(), list(), render/hydrate, the SSR subpath and the style system.
 */
import "../src";
import { when } from "../src/when";
import { list } from "../src/list";
import { render, hydrate } from "../src/render";
import { renderToStringWithContainer } from "../src/ssr/render-to-string";
import {
  createCss,
  css,
  cx,
  keyframes,
  globalStyle,
  variants,
  getCssText,
  setSSRCollector,
  resetStyles,
  type StyleResult,
} from "../src/style";
import { update } from "../src/update/update";

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

// ─── when(): condition typing ────────────────────────────────────────────────

when(true, span("x"));
when(() => false, span("x"));

// @ts-expect-error condition must be a boolean or a boolean factory
when("truthy", span("x"));

// @ts-expect-error condition factory must return a boolean
when(() => "yes", span("x"));

const chained = when(true, "a").when(false, "b").else("c");
type _Chained = Expect<Equal<typeof chained, WhenBuilder>>;
div(chained);

// Content accepts primitives, factories and nested builders.
div(when(true, "text", 42, span("el"), when(false, "nested")));

// ─── list(): renderer result typing ─────────────────────────────────────────

// Renderers may skip items with null/undefined and may return raw Nodes.
div(list(() => [1, 2, 3], (n) => (n % 2 === 0 ? li(String(n)) : null)));
div(list(() => ["a"], () => undefined));
div(list(() => ["a"], () => document.createElement("li")));

div(
  // @ts-expect-error a plain string is not a renderable list item result
  list(() => ["a"], (item) => item),
);

// itemsProvider accepts any Iterable — a Map yields entry tuples.
const byId = new Map<number, string>([[1, "one"]]);
div(
  list(
    () => byId,
    (entry) => {
      type _Entry = Expect<Equal<typeof entry, [number, string]>>;
      return li(entry[1]);
    },
  ),
);

// Generator functions are item providers too.
function* naturals(): Generator<number> {
  yield 1;
}
div(list(naturals, (n) => span(n.toFixed(0))));

// ─── render()/hydrate() signatures ───────────────────────────────────────────

render(div("x"), document.body, 2);
hydrate(section("x")); // parent optional

// @ts-expect-error index must be a number
render(div("x"), document.body, "0");

// ─── SSR subpath surface ─────────────────────────────────────────────────────

const wrapped: string = renderToStringWithContainer(div("x"), "main", { id: "app" });
void wrapped;
renderToStringWithContainer(div("x")); // container args optional

// @ts-expect-error container attributes must be a string record
renderToStringWithContainer(div("x"), "div", 42);

setSSRCollector((rule) => {
  type _Rule = Expect<Equal<typeof rule, string>>;
  void rule;
});
setSSRCollector(null);
const sheet: string = getCssText();
void sheet;
resetStyles();

// ─── style: keyframes / globalStyle / variants edges ─────────────────────────

const spin: string = keyframes({
  from: { raw: { "--x": 0 } },
  "50%": { opacity: 0.5 },
  to: { opacity: 1 },
});
css({ animation: `${spin} 1s linear infinite` });

globalStyle("body", { m: 0, bg: "#fff" });

globalStyle("body", {
  // @ts-expect-error nested pseudo variants are not allowed in FlatStyle
  hover: { bg: "#000" },
});

// Boolean variant groups ("true"/"false" values) are selected with booleans.
const toggle = variants({
  variants: { on: { true: { opacity: 1 }, false: { opacity: 0.5 } } },
});
toggle({ on: true });
toggle({ on: false });
toggle();
type _Toggle = Expect<Equal<ReturnType<typeof toggle>, StyleResult>>;

// @ts-expect-error unknown variant group is rejected
toggle({ off: true });

// The theme is exposed with its literal types.
const themed = createCss({ colors: { brand: "#123" }, radii: { pill: "999px" } });
themed.css({ color: "brand", rounded: "pill" });
themed.css({ color: "#abc" }); // raw values remain valid alongside tokens
type _Brand = Expect<Equal<typeof themed.theme.colors.brand, "#123">>;

// cx() input surface: results, raw strings, falsy values, nested arrays.
cx(css({ p: 1 }), "raw", false, null, undefined, [css({ m: 1 }), "deep"]);

// @ts-expect-error numbers are not class inputs
cx(42);

// StyleResult doubles as an attributes object and coerces to its className.
const styled = css({ p: 4 });
div(styled, "content");
const asString: string = `${css({ m: 1 })}`;
void asString;

// ─── update() variadic scope ids ─────────────────────────────────────────────

update();
update("a", "b", "c");

export {};
