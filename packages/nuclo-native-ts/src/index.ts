/**
 * @nuclo/native-ts — the nuclo API, compiled ahead of time to Swift (UIKit), Kotlin (Android Views)
 * and Rust (GTK 4, GPUI), and bundled for the web (DOM).
 *
 * An app is written as with nuclo and nuclo-native: plain mutable state, builders that take
 * static values or `() => value` functions, and an explicit `update()` that re-runs the functions
 * and touches only the native views whose value changed. There is no JavaScript at run time:
 * `nuclo-native-ts build App.ts` translates the app with the TypeScript type checker, and
 * `src/runtimes/*` implement every declaration below, once per platform.
 *
 * This module only declares types: it is the contract both the type checker and the compiler read.
 * Apps import from it explicitly (`import { div, update } from "@nuclo/native-ts"`) instead of
 * relying on globals, so anything outside it — DOM APIs, Node APIs, `any` — fails to type-check
 * or is reported by the compiler with its file and line.
 *
 * Numbers: `number` is inferred per variable, property, parameter and return value. A slot that
 * only ever holds whole numbers becomes `Int`, anything else `Double`. Annotate with `Int` or
 * `Double` (below) to choose explicitly.
 */

/** A number kept as an integer natively (Swift `Int`, Kotlin `Int`). */
export type Int = number;
/** A number kept as a float natively (Swift and Kotlin `Double`). */
export type Double = number;

declare const nodeBrand: unique symbol;
declare const modifierBrand: unique symbol;
declare const styleClassBrand: unique symbol;
declare const elementBrand: unique symbol;
declare const outletBrand: unique symbol;
declare const timerBrand: unique symbol;
declare const frameBrand: unique symbol;

// ---------------------------------------------------------------------------
// Nodes and children
// ---------------------------------------------------------------------------

/** A built view: what a tag builder returns (`UIView` / `android.view.View` natively). */
export interface Node {
  readonly [nodeBrand]: true;
}

/** Something a builder applies to its node instead of adding a view: list(), when(), region(), into(), scope(), on(). */
export interface Modifier {
  readonly [modifierBrand]: true;
}

/** The native view behind a node, as `onMount` / `onDestroy` receive it. */
export interface NativeElement {
  readonly [elementBrand]: true;
}

/** The control an `input` event comes from (nuclo code reads `(e.target as HTMLInputElement).value`). */
export interface HTMLInputElement {
  readonly value: string;
  readonly checked: boolean;
}

export interface NativeEvent {
  readonly target: HTMLInputElement;
}

/** A pointer (finger, mouse, pen) on a view. Coordinates are in points, `x`/`y` from the view's top-left corner. */
export interface PointerEvent {
  readonly x: Double;
  readonly y: Double;
  readonly pageX: Double;
  readonly pageY: Double;
  readonly pointerId: Int;
}

export type GestureState = "start" | "move" | "end" | "cancel";

/** A drag recognized by the platform (it starts once the pointer leaves the touch slop). */
export interface PanEvent {
  readonly state: GestureState;
  /** Distance from where the drag started. */
  readonly translationX: Double;
  readonly translationY: Double;
  /** Points per second, at the last movement. */
  readonly velocityX: Double;
  readonly velocityY: Double;
  /** The pointer, from the view's top-left corner. */
  readonly x: Double;
  readonly y: Double;
}

/** Two fingers (or ctrl + wheel on a desktop) moving apart or together. */
export interface PinchEvent {
  readonly state: GestureState;
  /** 1 when the gesture starts. */
  readonly scale: Double;
  readonly focalX: Double;
  readonly focalY: Double;
}

/** The scroll position of an `overflow: "scroll"` box. */
export interface ScrollEvent {
  readonly scrollTop: Double;
  readonly scrollLeft: Double;
  readonly scrollHeight: Double;
  readonly scrollWidth: Double;
  readonly clientHeight: Double;
  readonly clientWidth: Double;
}

export interface KeyboardEvent {
  /** As in the DOM: "Enter", "Escape", "ArrowLeft", "a"… */
  readonly key: string;
}

export type Primitive = string | number;

/** A value given once, or a function `update()` calls again (dirty-checked before the view is touched). */
export type Dynamic<T> = T | (() => T);

export interface Attributes {
  style?: Dynamic<Style>;
  className?: Dynamic<StyleClass>;
  value?: Dynamic<string>;
  placeholder?: Dynamic<string>;
  checked?: Dynamic<boolean>;
  disabled?: Dynamic<boolean>;
  src?: Dynamic<string>;
  /** `a`: the URL the platform opens when the link is activated. */
  href?: Dynamic<string>;
  /** What assistive technology reads for the view (`aria-label`, `accessibilityLabel`, `contentDescription`). */
  ariaLabel?: Dynamic<string>;
  /** `optgroup`: the heading over its options. */
  label?: Dynamic<string>;
  /** Static. `checkbox` builds a switch (`UISwitch` / `CheckBox`); the others a text field. */
  type?: "text" | "password" | "email" | "number" | "checkbox";
  onClick?: (event: NativeEvent) => void;
  onInput?: (event: NativeEvent) => void;
  onChange?: (event: NativeEvent) => void;
  onFocus?: (event: NativeEvent) => void;
  onBlur?: (event: NativeEvent) => void;
  /** A key pressed while the view (a field, or a focusable box on a desktop) has the focus. */
  onKeyDown?: (event: KeyboardEvent) => void;
  onPointerDown?: (event: PointerEvent) => void;
  onPointerMove?: (event: PointerEvent) => void;
  onPointerUp?: (event: PointerEvent) => void;
  onPointerCancel?: (event: PointerEvent) => void;
  /** A drag. The view keeps the gesture once it starts: a scrolling parent stops scrolling. */
  onPan?: (event: PanEvent) => void;
  onPinch?: (event: PinchEvent) => void;
  /** The pointer held in place (500 ms). */
  onLongPress?: (event: PointerEvent) => void;
  onDoubleClick?: (event: PointerEvent) => void;
  /** On an `overflow: "scroll"` box. */
  onScroll?: (event: ScrollEvent) => void;
  /** Runs once the view is attached to the window. May return a cleanup, run on destroy. */
  onMount?: (element: NativeElement) => void | (() => void);
  /** Runs when nuclo removes the view (a list row goes, a when() branch switches, a screen is popped). */
  onDestroy?: (element: NativeElement) => void;
}

/** What a builder accepts, in any order: children, text, attributes and modifiers. */
export type Child = Node | Modifier | StyleClass | Attributes | Primitive | (() => Primitive) | null | undefined | false;

type Builder = (...children: Child[]) => Node;

/**
 * `progress` and `meter`: a bar drawn the same on every platform (a track with a fill). `value` is a
 * number or `() => number`; the rest are number literals. `style` is the track's: 160×16 for
 * `progress`, 80×16 for `meter`.
 */
export interface GaugeAttributes extends Omit<Attributes, "value"> {
  value?: Dynamic<number>;
  /** 0 by default. */
  min?: number;
  /** 1 by default. */
  max?: number;
  /** `meter`: the end of the low range. */
  low?: number;
  /** `meter`: the start of the high range. */
  high?: number;
  /** `meter`: the best value. The fill is green near it, yellow a range away and red two ranges away. */
  optimum?: number;
}
type GaugeBuilder = (...children: (Child | GaugeAttributes)[]) => Node;

// Containers: a flex column unless `style.flexDirection` is "row".
export declare const div: Builder;
export declare const section: Builder;
export declare const header: Builder;
export declare const footer: Builder;
export declare const main: Builder;
export declare const nav: Builder;
export declare const article: Builder;
export declare const aside: Builder;
export declare const form: Builder;
export declare const ul: Builder;
export declare const ol: Builder;
export declare const li: Builder;
export declare const figure: Builder;
export declare const fieldset: Builder;
export declare const blockquote: Builder;
export declare const address: Builder;
export declare const hgroup: Builder;
export declare const menu: Builder;
export declare const search: Builder;
export declare const dl: Builder;
export declare const details: Builder;
export declare const dialog: Builder;
/** A column of `tr` rows; `td` / `th` cells share a row's width equally. */
export declare const table: Builder;
export declare const thead: Builder;
export declare const tbody: Builder;
export declare const tfoot: Builder;
export declare const tr: Builder;
export declare const td: Builder;
export declare const th: Builder;
/** A 1-point horizontal rule. */
export declare const hr: Builder;

// Text: a label whose text is its string and `() => string` children, joined.
export declare const span: Builder;
export declare const p: Builder;
export declare const h1: Builder;
export declare const h2: Builder;
export declare const h3: Builder;
export declare const h4: Builder;
export declare const h5: Builder;
export declare const h6: Builder;
export declare const label: Builder;
export declare const strong: Builder;
export declare const b: Builder;
export declare const small: Builder;
export declare const em: Builder;
export declare const i: Builder;
export declare const u: Builder;
export declare const s: Builder;
export declare const del: Builder;
export declare const ins: Builder;
export declare const mark: Builder;
export declare const code: Builder;
export declare const pre: Builder;
export declare const kbd: Builder;
export declare const samp: Builder;
export declare const var_: Builder;
export declare const abbr: Builder;
export declare const cite: Builder;
export declare const q: Builder;
export declare const dfn: Builder;
export declare const sub: Builder;
export declare const sup: Builder;
export declare const time: Builder;
export declare const legend: Builder;
export declare const caption: Builder;
export declare const figcaption: Builder;
export declare const summary: Builder;
export declare const dt: Builder;
export declare const dd: Builder;
/** Text that opens its `href` with the platform (the browser, or the app that owns the URL). */
export declare const a: Builder;

// Controls.
export declare const button: Builder;
export declare const input: Builder;
export declare const textarea: Builder;
export declare const img: Builder;

// Tags that are plain boxes, inline text, or draw nothing (head, meta, script, style, …: display none).
export declare const bdi: Builder;
export declare const bdo: Builder;
export declare const data: Builder;
export declare const output: Builder;
export declare const rt: Builder;
export declare const rp: Builder;
export declare const ruby: Builder;
export declare const body: Builder;
export declare const html: Builder;
export declare const colgroup: Builder;
export declare const col: Builder;
export declare const map: Builder;
export declare const picture: Builder;
export declare const slot: Builder;
export declare const head: Builder;
export declare const base: Builder;
export declare const link: Builder;
export declare const meta: Builder;
export declare const script: Builder;
export declare const style: Builder;
export declare const title: Builder;
export declare const template: Builder;
export declare const noscript: Builder;
export declare const datalist: Builder;
export declare const area: Builder;
export declare const source: Builder;
export declare const track: Builder;
/** A 16-point gap: the line break between block children. */
export declare const br: Builder;
/** Draws nothing. */
export declare const wbr: Builder;
/**
 * A choice among `option`s (and `optgroup`s of them), written directly inside the `select`, or built by a
 * `list()` there. It shows the chosen option's text and opens the options below it when pressed; `onChange`
 * gets the picked option's value as `event.target.value`. `value` is what is chosen (a string, or a
 * `() => string`): without it the select keeps its own choice, the first option at first. `style` is the
 * box around the control and the options (1px border, rounded, white); `disabled` stops it opening.
 */
export declare const select: Builder;
/** An option of a `select`: its `value` (the text, when there is none) and the text it shows. */
export declare const option: Builder;
/** A heading over the options in it: `label` is the heading. */
export declare const optgroup: Builder;
/** A bar filled to `value` of `max`; without a value the track is empty. */
export declare const progress: GaugeBuilder;
/** A bar filled to `value` between `min` and `max`, colored by `low`, `high` and `optimum`. */
export declare const meter: GaugeBuilder;

// ---------------------------------------------------------------------------
// The update cycle
// ---------------------------------------------------------------------------

/** Re-runs every dynamic value, or only those inside `scope(id)` nodes for the given ids. */
export declare function update(...scopeIds: string[]): void;

/** Makes the node an update root: `update("id")` refreshes only what is inside it. */
export declare function scope(...ids: string[]): Modifier;

/**
 * Shows a view (or a router's outlet) in the window. The first call is the app; each later call
 * is a layer over it, the size of the window, that lets touches through where it has no view
 * (overlays: modals, toasts).
 */
export declare function render(view: (() => Node) | Outlet): void;

/** nuclo's hydrate(): there is no server-rendered tree natively, so it renders. */
export declare function hydrate(view: (() => Node) | Outlet): void;

/** Re-runs every dynamic value and applies each one, whether or not it changed. */
export declare function forceUpdate(): void;

/** Renders one node per item, rebuilding only rows whose item is new (by identity, as nuclo). */
export declare function list<T>(items: () => readonly T[], render: (item: T, index: Int) => Node | null): Modifier;

export interface WhenBuilder extends Modifier {
  when(condition: boolean | (() => boolean), ...content: Child[]): WhenBuilder;
  else(...content: Child[]): WhenBuilder;
}

/** Shows the content of the first branch whose condition holds; a branch is built when it opens. */
export declare function when(condition: boolean | (() => boolean), ...content: Child[]): WhenBuilder;

export interface RegionOptions {
  id: string;
  /** `latest` (default) shows the newest view put into it, `stack` all of them in order. */
  type?: "stack" | "latest";
  /** Shown while the region holds no view. */
  empty?: Child;
}

/** A named place in the tree that into() fills from anywhere. */
export declare function region(options: RegionOptions): Modifier;

/** Puts content into the region `id` for as long as this into() is in the tree. */
export declare function into(id: string, ...content: Child[]): Modifier;

export declare function on(type: "click" | "input" | "change" | "focus" | "blur", listener: (event: NativeEvent) => void): Modifier;
export declare function on(type: "pointerDown" | "pointerMove" | "pointerUp" | "pointerCancel" | "longPress" | "doubleClick", listener: (event: PointerEvent) => void): Modifier;
export declare function on(type: "pan", listener: (event: PanEvent) => void): Modifier;
export declare function on(type: "pinch", listener: (event: PinchEvent) => void): Modifier;
export declare function on(type: "scroll", listener: (event: ScrollEvent) => void): Modifier;
export declare function on(type: "keyDown", listener: (event: KeyboardEvent) => void): Modifier;
export declare function on(type: "mount", listener: (element: NativeElement) => void | (() => void)): Modifier;
export declare function on(type: "destroy", listener: (element: NativeElement) => void): Modifier;

// ---------------------------------------------------------------------------
// Styling
// ---------------------------------------------------------------------------

/**
 * The style subset every runtime lays out the same way: a flex box per container (column by
 * default), in points (iOS) or dp (Android).
 */
export interface Style {
  flexDirection?: "row" | "column";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
  /** This item's own cross-axis alignment, over its parent's `alignItems`. */
  alignSelf?: "flex-start" | "center" | "flex-end" | "stretch";
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  /** `wrap`: items that don't fit start a new line (a row's lines stack downwards). */
  flexWrap?: "nowrap" | "wrap";
  /** Grows along the parent's direction, sharing the free space by weight. */
  flex?: number;
  gap?: number;
  margin?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  /** Points, or a share of the parent's width: `"50%"` or `` `${progress}%` ``. */
  width?: number | `${number}%`;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  /** width / height: the missing dimension follows the other. */
  aspectRatio?: number;
  /**
   * `hidden` clips children to the box. `scroll` makes the box scroll along its direction (a
   * column vertically, a row horizontally) with the platform's own scrolling.
   */
  overflow?: "visible" | "hidden" | "scroll";
  position?: "relative" | "absolute";
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  /** Among siblings: a higher value is drawn (and touched) above. */
  zIndex?: number;
  display?: "flex" | "none";
  backgroundColor?: string;
  color?: string;
  opacity?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  /** A drop shadow: all four, or `shadowRadius` alone for a soft black one. */
  shadowColor?: string;
  shadowRadius?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  /** `monospace`, `serif` and `sans-serif` are the platform's own; other names are looked up. */
  fontFamily?: string;
  /** In points, as `fontSize`. */
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: "left" | "center" | "right";
  textDecoration?: "none" | "underline" | "line-through";
  /** Text is cut with an ellipsis after this many lines. */
  numberOfLines?: number;
  // Transforms are applied after layout, around the box's centre: translate, then rotate, then scale.
  translateX?: number;
  translateY?: number;
  scale?: number;
  /** Degrees, clockwise. */
  rotate?: number;
  /**
   * Milliseconds. When set, a change of opacity, transform, background colour, border radius or
   * of the box's `width` / `height` is animated by the platform instead of applied at once (the
   * boxes around it follow, frame by frame).
   */
  transitionDuration?: number;
  transitionDelay?: number;
  /** `spring` overshoots and settles, as a platform sheet does. */
  transitionEasing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "spring";
  /** Merged over the style while a pointer is down on the view (`:active`). */
  pressed?: Style;
  /** While a pointer is over the view, where the platform has one (`:hover`). */
  hover?: Style;
  /** While a field has the focus (`:focus`). */
  focused?: Style;
  // nuclo-core's short keys. Each is the native key (or keys) named in its comment.
  /** padding */ p?: number;
  /** paddingLeft + paddingRight */ px?: number;
  /** paddingTop + paddingBottom */ py?: number;
  pt?: number;
  pr?: number;
  pb?: number;
  pl?: number;
  /** margin */ m?: number;
  /** marginLeft + marginRight */ mx?: number;
  /** marginTop + marginBottom */ my?: number;
  mt?: number;
  mr?: number;
  mb?: number;
  ml?: number;
  /** width */ w?: number;
  /** height */ h?: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  /** width + height */ size?: number;
  /** fontSize */ text?: number;
  /** fontWeight */ weight?: "normal" | "bold";
  /** lineHeight */ leading?: number;
  /** letterSpacing */ tracking?: number;
  /** textAlign */ align?: "left" | "center" | "right";
  /** alignItems */ items?: "flex-start" | "center" | "flex-end" | "stretch";
  /** justifyContent */ justify?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  /** zIndex */ z?: number;
  /** backgroundColor */ bg?: string;
  /** borderRadius */ rounded?: number;
  /** flexDirection: row */ row?: boolean;
  /** flexDirection: column */ col?: boolean;
  /** alignItems and justifyContent: center */ center?: boolean;
  /** numberOfLines: 1 */ truncate?: boolean;
}

/** A reusable style, applied as a child: `div(card, "Hello")`. Inline `style` wins over it. */
export interface StyleClass {
  readonly [styleClassBrand]: true;
}

/** nuclo's named form: the name is a CSS class name on the web, and only a label natively. */
export declare function css(name: string, style: Style): StyleClass;
export declare function css(style: Style): StyleClass;

/** Merges classes left to right; falsy entries are skipped. */
export declare function cx(...classes: (StyleClass | null | undefined | false)[]): StyleClass;

type VariantGroups = Record<string, Record<string, Style>>;
type VariantValue<G extends Record<string, Style>> = keyof G extends "true" | "false" ? boolean : keyof G & string;
export type VariantSelection<V extends VariantGroups> = { [K in keyof V]?: VariantValue<V[K]> };

export interface VariantsConfig<V extends VariantGroups> {
  base?: Style;
  variants: V;
  defaultVariants?: VariantSelection<V>;
  compoundVariants?: (VariantSelection<V> & { css: Style })[];
}

/** A typed recipe: an unknown variant name or value is a compile error, `true`/`false` groups take booleans. */
export declare function variants<const V extends VariantGroups>(config: VariantsConfig<V>): (selection?: VariantSelection<V>) => StyleClass;

// ---------------------------------------------------------------------------
// Navigation (the nuclo-native router: native stacks and tabs)
// ---------------------------------------------------------------------------

export type Params = Record<string, string>;
export type View = (params: Params) => Node;
export type Route = View | {
  view: View;
  title?: string | ((params: Params) => string);
  /** `modal`: presented over the stack with the platform's sheet, and dismissed by `back()`. */
  presentation?: "push" | "modal";
  /** `false` hides the navigation bar on this screen. */
  header?: boolean;
};

export interface Tab {
  path: string;
  title: string;
  /** A semantic name each runtime maps to its icon set: home, list, cloud, star, person, settings. */
  icon?: string;
}

export interface RouterOptions {
  initial?: string;
  tabs?: Tab[];
}

/** The navigation a router shows: render(router.outlet). */
export interface Outlet {
  readonly [outletBrand]: true;
}

export interface Router {
  readonly path: string;
  readonly canGoBack: boolean;
  /** Pushes a screen onto the current tab's stack (`/posts/:id` patterns give params). */
  go(path: string): void;
  back(): void;
  /** Replaces the current screen, without a transition. */
  replace(path: string): void;
  /** Selects the tab that owns `path` and makes it the only screen there. */
  reset(path: string): void;
  readonly outlet: Outlet;
}

/** iOS: UITabBarController + UINavigationController. Android: a bottom bar and a view stack with system back. */
export declare function createRouter(routes: Record<string, Route>, options?: RouterOptions): Router;

// ---------------------------------------------------------------------------
// Async and timers
// ---------------------------------------------------------------------------

export interface Response {
  readonly ok: boolean;
  readonly status: Int;
  text(): Promise<string>;
  /** Decodes into `T`: interfaces, arrays, strings, numbers and booleans (generated decoders, no reflection). */
  json<T>(): Promise<T>;
}

export interface RequestInit {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
  headers?: Record<string, string>;
}

/** URLSession on iOS, HttpURLConnection on a background thread on Android; resumes on the main thread. */
export declare function fetch(url: string, init?: RequestInit): Promise<Response>;

/** Resolves after `ms` milliseconds. */
export declare function delay(ms: number): Promise<void>;

export interface Timer {
  readonly [timerBrand]: true;
}

export declare function setTimeout(callback: () => void, ms: number): Timer;
export declare function setInterval(callback: () => void, ms: number): Timer;
export declare function clearTimeout(timer: Timer): void;
export declare function clearInterval(timer: Timer): void;

export interface Frame {
  readonly [frameBrand]: true;
}

/** Runs `callback` before the next frame is drawn; `time` is in milliseconds, as `Date.now()` counts them. */
export declare function requestAnimationFrame(callback: (time: Double) => void): Frame;
export declare function cancelAnimationFrame(frame: Frame): void;

// ---------------------------------------------------------------------------
// Native components and functions
// ---------------------------------------------------------------------------

/** A component's props as an app passes them: values may be functions, callbacks stay callbacks. */
export type NativeProps<P> = {
  [K in keyof P]: NonNullable<P[K]> extends (...args: never[]) => unknown ? P[K] : Dynamic<P[K]>;
} & Pick<Attributes, "style" | "className" | "onMount" | "onDestroy">;

/**
 * A view written for the platform, used like any builder:
 *
 *   interface MapProps { latitude: Double; longitude: Double; onMove?: (lat: Double, lng: Double) => void }
 *   const MapView = native<MapProps>("MapView");
 *   MapView({ latitude: () => lat, longitude: 13.4, style: { height: 240 } })
 *
 * `P` is an interface of the app; the compiler turns it into a class per target, and each target
 * supplies a `MapView` implementing the runtime's `NativeComponent<MapProps>` in
 * `native/<target>/` beside the app's entry file. A missing or mistyped implementation fails that
 * platform's build. Each dynamic prop is dirty-checked; the component's `update` runs when one changed.
 */
export declare function native<P>(name: string): (props: NativeProps<P>, ...children: Child[]) => Node;

// Native functions need no API: write `declare function vibrate(ms: Int): void` in the app, and
// implement `vibrate` in `native/<target>/`. Numbers must be annotated `Int` or `Double`.

export declare const console: {
  log(...values: (string | number | boolean)[]): void;
};
