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
export function on<
  K extends NucloHTMLElementEventName,
  TTagName extends NucloHTMLElementTagNameForEvent<K> = NucloHTMLElementTagNameForEvent<K>,
>(
  type: K,
  listener: TypedEventListener<
    HTMLElementTagNameMap[TTagName],
    NucloHTMLElementEventForName<K>
  >,
  options?: boolean | AddEventListenerOptions
): NodeModFn<TTagName>;
export function on<TTagName extends ElementTagName = ElementTagName>(
  type: "mount",
  listener: MountCallback<HTMLElementTagNameMap[TTagName]>,
): NodeModFn<TTagName>;
export function on<TTagName extends ElementTagName = ElementTagName>(
  type: "destroy",
  listener: DestroyCallback<HTMLElementTagNameMap[TTagName]>,
): NodeModFn<TTagName>;
export function on<K extends string, E extends Event = Event, TTagName extends ElementTagName = ElementTagName>(
  type: K,
  listener: TypedEventListener<HTMLElementTagNameMap[TTagName], E>,
  options?: boolean | AddEventListenerOptions
): NodeModFn<TTagName>;

// Styling (themeless default instance + themed factory)
export function createCss<const T extends ThemeConfig>(theme?: T): CssInstance<T>;
export function css(style: Style<object>): StyleResult;
export function css(name: string, style: Style<object>): StyleResult;
export function cx(...inputs: ClassInput[]): StyleResult;
export function variants<const V extends VariantDefinitions<object>>(
  config: VariantsConfig<object, V>,
): VariantsFn<V>;
export function keyframes(frames: KeyframeFrames<object>): string;
export function globalStyle(selector: string, style: FlatStyle<object>): void;
export function getCssText(): string;
export function resetStyles(): void;

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
