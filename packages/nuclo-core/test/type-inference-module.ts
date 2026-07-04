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
  // bootstrap / registry
  initializeRuntime,
  registerGlobalTagBuilders,
  HTML_TAGS,
  SVG_TAGS,
  SELF_CLOSING_TAGS,
  createHtmlTagBuilder,
  createSvgTagBuilder,
  // modifier application
  applyNodeModifier,
  applyAttributes,
  createHtmlElementWithModifiers,
  createSvgElementWithModifiers,
  // core primitives
  list,
  when,
  update,
  scope,
  render,
  hydrate,
  on,
  // DOM helpers
  appendChildren,
  createComment,
  createConditionalComment,
  replaceNodeSafely,
  // guards / environment
  isBoolean,
  isFunction,
  isNode,
  isObject,
  isPrimitive,
  isTagLike,
  isZeroArityFunction,
  isBrowser,
  // styling
  createCss,
  css,
  cx,
  variants,
  keyframes,
  globalStyle,
  getCssText,
  resetStyles,
  setSSRCollector,
} from "../types/index";
import type { Style, StyleResult, ThemeConfig, CssInstance } from "../types/index";

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

// Tag builders created through the module factory keep their tag
const divBuilder = createHtmlTagBuilder("div");
type _DivBuilder = Expect<Equal<typeof divBuilder, ExpandedElementBuilder<"div">>>;
const _rectBuilder = createSvgTagBuilder("rect");
type _RectBuilder = Expect<Equal<typeof _rectBuilder, ExpandedSVGElementBuilder<"rect">>>;

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
update("area");

// element creation helpers
const _built = createHtmlElementWithModifiers("section", ["text", { id: "x" }]);
type _Built = Expect<Equal<typeof _built, ExpandedElement<"section">>>;
const _builtSvg = createSvgElementWithModifiers("circle", [{ r: 4 }]);
type _BuiltSvg = Expect<Equal<typeof _builtSvg, SVGCircleElement>>;

// misc signatures
initializeRuntime();
registerGlobalTagBuilders();
applyAttributes(el, { id: "y", tabIndex: () => 2 });
const produced: Node | null = applyNodeModifier(el, "text", 0);
void produced;
appendChildren(document.body, document.createElement("i"), "txt", null);
const c: Comment | null = createComment("x");
const cc: Comment | null = createConditionalComment("div");
void c; void cc;
const replaced: boolean = replaceNodeSafely(document.body, document.createElement("p"));
void replaced;

// guards narrow
declare const unknownValue: unknown;
if (isPrimitive(unknownValue)) { const _p: Primitive = unknownValue; void _p; }
if (isFunction(unknownValue)) unknownValue(1, 2);
if (isNode(unknownValue)) { const _n: Node = unknownValue; void _n; }
void isBoolean; void isObject; void isTagLike; void isZeroArityFunction;
const b: boolean = isBrowser;
void b;

// tag constants are typed tag-name arrays
type _HtmlTags = Expect<Equal<(typeof HTML_TAGS)[number] extends ElementTagName ? true : false, true>>;
type _SvgTags = Expect<Equal<(typeof SVG_TAGS)[number] extends SVGTagName ? true : false, true>>;
type _SelfClosing = Expect<Equal<(typeof SELF_CLOSING_TAGS)[number] extends ElementTagName ? true : false, true>>;

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
setSSRCollector((rule) => { const _r: string = rule; void _r; });
setSSRCollector(null);

export {};
