// Import all organized type definitions
import "./core/base";
import "./svg/base";
import "./html/tags";
import "./svg/tags";
import "./features/list";
import "./features/when";
import "./features/update";
import "./features/scope";
import "./features/on";
import "./features/render";
import "./features/style";

// ---------------------------------------------------------------------------
// Module export surface — mirrors the runtime exports of src/index.ts so that
// module-style consumers (import { render } from "nuclo") get the same types
// as global-style consumers (import "nuclo"). Keep in sync with src/index.ts.
// ---------------------------------------------------------------------------

// Runtime bootstrap / tag registry
export function initializeRuntime(): void;
export function registerGlobalTagBuilders(target?: Record<string, unknown>): void;
export const HTML_TAGS: ReadonlyArray<ElementTagName>;
export const SVG_TAGS: ReadonlyArray<SVGTagName>;
export const SELF_CLOSING_TAGS: ReadonlyArray<ElementTagName>;
export function createHtmlTagBuilder<TTagName extends ElementTagName>(
  tagName: TTagName,
): ExpandedElementBuilder<TTagName>;
export function createSvgTagBuilder<TTagName extends SVGTagName>(
  tagName: TTagName,
): ExpandedSVGElementBuilder<TTagName>;

// Modifier application
export function applyNodeModifier<TTagName extends ElementTagName>(
  parent: ExpandedElement<TTagName>,
  modifier: NodeModLike<TTagName>,
  index: number,
): Node | null;
export function applyAttributes<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  attributes: ExpandedElementAttributes<TTagName>,
  mergeClassName?: boolean,
): void;
export function createHtmlElementWithModifiers<TTagName extends ElementTagName>(
  tagName: TTagName,
  modifiers: ReadonlyArray<NodeModLike<TTagName>>,
): ExpandedElement<TTagName>;
export function createSvgElementWithModifiers<TTagName extends SVGTagName>(
  tagName: TTagName,
  modifiers: ReadonlyArray<SVGElementModifierLike<TTagName>>,
): SVGElementTagNameMap[TTagName];

// Core primitives (same signatures as the globals)
export function list<T, TTagName extends ElementTagName = ElementTagName>(
  itemsProvider: ListItemsProvider<T>,
  render: ListRenderFunction<T, TTagName>,
): ListModifier<TTagName>;
export function when<TTagName extends ElementTagName = ElementTagName>(
  condition: WhenCondition,
  ...content: WhenContent<TTagName>[]
): WhenBuilder<TTagName>;
export function update(...scopeIds: string[]): void;
export function scope<TTagName extends ElementTagName = ElementTagName>(
  ...ids: string[]
): NodeModFn<TTagName>;
export function render<TTagName extends ElementTagName = ElementTagName>(
  nodeModFn: NodeModFn<TTagName>,
  parent?: Element,
  index?: number,
): ExpandedElement<TTagName>;
export function hydrate<TTagName extends ElementTagName = ElementTagName>(
  nodeModFn: NodeModFn<TTagName>,
  parent?: Element,
): ExpandedElement<TTagName>;

// on() helper (same overloads as the global)
export function on<K extends keyof HTMLElementEventMap, TTagName extends ElementTagName = ElementTagName>(
  type: K,
  listener: TypedEventListener<HTMLElementTagNameMap[TTagName], HTMLElementEventMap[K]>,
  options?: boolean | AddEventListenerOptions
): NodeModFn<TTagName>;
export function on<K extends string, E extends Event = Event, TTagName extends ElementTagName = ElementTagName>(
  type: K,
  listener: TypedEventListener<HTMLElementTagNameMap[TTagName], E>,
  options?: boolean | AddEventListenerOptions
): NodeModFn<TTagName>;

// DOM helpers
export function appendChildren(
  parent: Element | Node,
  ...children: Array<Element | Node | string | null | undefined>
): Element | Node;
export function createComment(text: string): Comment | null;
export function createConditionalComment(tagName: string, suffix?: string): Comment | null;
export function replaceNodeSafely(oldNode: Node, newNode: Node): boolean;

// Type guards / environment
export function isBoolean(value: unknown): value is boolean;
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown;
export function isNode<T>(value: T): value is T & Node;
export function isObject(value: unknown): value is object;
export function isPrimitive(value: unknown): value is Primitive;
export function isTagLike<T>(value: T): value is T & { tagName?: string };
export function isZeroArityFunction(value: unknown): value is () => unknown;
export const isBrowser: boolean;

// Styling (themeless default instance + themed factory)
export function createCss<const T extends ThemeConfig>(theme?: T): CssInstance<T>;
export function css(style: Style<object>): StyleResult;
export function cx(...inputs: ClassInput[]): StyleResult;
export function variants<const V extends VariantDefinitions<object>>(
  config: VariantsConfig<object, V>,
): VariantsFn<V>;
export function keyframes(frames: KeyframeFrames<object>): string;
export function globalStyle(selector: string, style: FlatStyle<object>): void;
export function getCssText(): string;
export function resetStyles(): void;
export function setSSRCollector(fn: ((rule: string) => void) | null): void;

// Styling types (same names as the globals, importable as module types)
export type {
  ClassInput,
  CssInstance,
  CSSProperties,
  FlatStyle,
  KeyframeFrames,
  KeyframeStop,
  Pseudo,
  Size,
  Style,
  StyleResult,
  ThemeConfig,
  VariantDefinitions,
  VariantProps,
  VariantsConfig,
  VariantsFn,
} from "./style";
