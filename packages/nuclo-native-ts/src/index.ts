/**
 * @nuclo/native-ts — the nuclo API, compiled ahead of time to Swift (UIKit) and Kotlin (Android Views).
 *
 * An app is written as with nuclo and nuclo-native: plain mutable state, builders that take
 * static values or `() => value` functions, and an explicit `update()` that re-runs the functions
 * and touches only the native views whose value changed. There is no JavaScript at run time:
 * `nuclo-native-ts build App.ts` translates the app with the TypeScript type checker, and
 * `src/runtimes/{ios,android}` implement every declaration below natively.
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
  /** Static. `checkbox` builds a switch (`UISwitch` / `CheckBox`); the others a text field. */
  type?: "text" | "password" | "email" | "number" | "checkbox";
  onClick?: (event: NativeEvent) => void;
  onInput?: (event: NativeEvent) => void;
  onChange?: (event: NativeEvent) => void;
  /** Runs once the view is attached to the window. May return a cleanup, run on destroy. */
  onMount?: (element: NativeElement) => void | (() => void);
  /** Runs when nuclo removes the view (a list row goes, a when() branch switches, a screen is popped). */
  onDestroy?: (element: NativeElement) => void;
}

/** What a builder accepts, in any order: children, text, attributes and modifiers. */
export type Child = Node | Modifier | StyleClass | Attributes | Primitive | (() => Primitive) | null | undefined | false;

type Builder = (...children: Child[]) => Node;

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
export declare const li: Builder;

// Text: a label whose text is its string and `() => string` children, joined.
export declare const span: Builder;
export declare const p: Builder;
export declare const h1: Builder;
export declare const h2: Builder;
export declare const h3: Builder;
export declare const h4: Builder;
export declare const label: Builder;
export declare const strong: Builder;
export declare const small: Builder;
export declare const em: Builder;

// Controls.
export declare const button: Builder;
export declare const input: Builder;
export declare const textarea: Builder;
export declare const img: Builder;

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

export declare function on(type: "click" | "input" | "change", listener: (event: NativeEvent) => void): Modifier;
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
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between";
  /** Grows along the parent's direction, sharing the free space by weight. */
  flex?: number;
  gap?: number;
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  width?: number;
  height?: number;
  minHeight?: number;
  position?: "relative" | "absolute";
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  display?: "flex" | "none";
  backgroundColor?: string;
  color?: string;
  opacity?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  textAlign?: "left" | "center" | "right";
}

/** A reusable style, applied as a child: `div(card, "Hello")`. Inline `style` wins over it. */
export interface StyleClass {
  readonly [styleClassBrand]: true;
}

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
export type Route = View | { view: View; title?: string | ((params: Params) => string) };

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

export declare const console: {
  log(...values: (string | number | boolean)[]): void;
};
