/**
 * Type-level tests for the *declared* module surface (types/index.d.ts) —
 * what `import { ... } from "nuclo"` resolves to for published consumers.
 *
 * This file is compiled by `npm run typecheck` and never executed: the import
 * below resolves to types/index.d.ts only. If a runtime export of
 * src/index.ts is missing from the declarations (or declared with the wrong
 * shape), this file fails to compile.
 */
import {
  // core primitives
  list,
  when,
  update,
  scope,
  render,
  hydrate,
  on,
  // styling
  createCss,
  css,
  cx,
  variants,
  keyframes,
  globalStyle,
  getCssText,
  resetStyles,
} from "../types/index";
import type { Style, StyleResult, ThemeConfig, CssInstance } from "../types/index";
import type * as declaredModule from "../types/index";
import type * as runtimeModule from "../src/index";

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

// Drift alarm: the hand-written module declarations and the runtime entry
// export exactly the same values, in both directions.
type _SameModuleSurface = Expect<Equal<keyof typeof declaredModule, keyof typeof runtimeModule>>;

// Global tag builders keep their tag
const divBuilder = div;
type _DivBuilder = Expect<Equal<typeof divBuilder, ExpandedElementBuilder<"div">>>;
li(input({
  onInput(event) {
    const _value: string = event.currentTarget.value;
    void _value;
  },
}));
type _RectBuilder = Expect<Equal<typeof rectSvg, ExpandedSVGElementBuilder<"rect">>>;

// render/hydrate flow the tag through
const el = render(divBuilder("x"));
type _El = Expect<Equal<typeof el, ExpandedElement<"div">>>;
const _hyd = hydrate(divBuilder("x"), document.body);
type _Hyd = Expect<Equal<typeof _hyd, ExpandedElement<"div">>>;

// list/when/on/scope match the global signatures
divBuilder(
  list(() => [1, 2], (n) => divBuilder(String(n))),
  when(true, "yes").else("no"),
  on("click", (e) => { void e.clientX; }),
  scope("area"),
);

const _mediaEventModifier = on("encrypted", (e) => { void e.initData; });
type _MediaEventModifier = Expect<Equal<
  typeof _mediaEventModifier,
  NodeModFn<"audio" | "video">
>>;
update("area");

// styling — themed instance types flow through the module import
const theme = { colors: { brand: "#123" }, screens: { md: "(min-width: 768px)" } } satisfies ThemeConfig;
const instance: CssInstance<typeof theme> = createCss(theme);
instance.css({ bg: "brand", md: { px: 8 } });
instance.css({
  // @ts-expect-error unknown screen keys are rejected on themed instances
  lg: { px: 8 },
});
const composed: StyleResult = cx(css({ p: 4 }), "raw-class", null);
void composed;
const recipe = variants({ variants: { size: { sm: { px: 4 } } } });
recipe({ size: "sm" });
// @ts-expect-error unknown variant value
recipe({ size: "lg" });
const frame: Style<object> = { opacity: 0.5 };
void frame;
keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
globalStyle("body", { m: 0 });
const sheet: string = getCssText();
void sheet;
resetStyles();

export {};
