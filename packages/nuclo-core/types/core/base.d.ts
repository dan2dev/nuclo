declare global {
  export type Primitive =
    | string
    | number
    | bigint
    | boolean
    | symbol
    | null
    | undefined;
  export type ElementTagName = keyof HTMLElementTagNameMap;
  export type SVGTagName = keyof SVGElementTagNameMap;

  export type ValueFactory<TValue> = () => TValue;
  export type ValueOrFactory<TValue> = TValue | ValueFactory<TValue>;
  export type InferFactoryResult<TFactory> = TFactory extends (
    ...args: unknown[]
  ) => infer TResult
    ? TResult
    : never;

  /**
   * Subset of value kinds that can legitimately become HTML attribute values at runtime.
   * Used to restrict custom-attribute slots ([data-*], [aria-*], and the string fallback)
   * so TS flags obvious mistakes (e.g., passing an element as an attribute) while still
   * tolerating the shapes that applyAttributes actually accepts.
   */
  export type AttributePrimitive =
    | string
    | number
    | boolean
    | bigint
    | null
    | undefined;

  /**
   * CSS Style object — any CSSStyleDeclaration key plus the string/number escape hatch
   * for cases where the typed key is too strict (e.g., custom properties, `any-hover`).
   */
  export type CSSStyleObject = {
    [K in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[K] | string | number;
  } & {
    [K in `--${string}`]?: string | number;
  };

  /**
   * Attribute map for a given HTML tag.
   *
   * Design goals:
   *  1. Strict autocomplete for native DOM properties (via HTMLElementTagNameMap).
   *  2. First-class `data-*` and `aria-*` typing — only primitive-ish values allowed.
   *  3. A narrow string fallback for escape-hatch attributes (svg-in-html, custom role,
   *     legacy camelCase handlers) that refuses object/function shapes that would never
   *     serialize correctly. This preserves the catch-all without nuking inference.
   */
  export type ExpandedElementAttributes<
    TTagName extends ElementTagName = ElementTagName,
  > = {
    [K in keyof HTMLElementTagNameMap[TTagName]]?: K extends "style"
      ? ValueOrFactory<CSSStyleObject>
      : ValueOrFactory<HTMLElementTagNameMap[TTagName][K]>;
  } & {
    [K in `data-${string}`]?: ValueOrFactory<AttributePrimitive>;
  } & {
    [K in `aria-${string}`]?: ValueOrFactory<AttributePrimitive>;
  } & {
    // Restricted fallback — keeps custom-attribute support without collapsing autocomplete.
    [key: string]: ValueOrFactory<AttributePrimitive | CSSStyleObject>;
  };

  export type DetachedExpandedElementFactory<
    TTagName extends ElementTagName = ElementTagName,
  > = NodeModFn<TTagName> &
    ((
      parent?: ExpandedElement<TTagName>,
      index?: number,
    ) => ExpandedElement<TTagName>);

  /**
   * Core element type. Intersection of the real DOM element for `TTagName`
   * with optional, `readonly` introspection metadata (`rawMods` / `mods`).
   *
   * The intersection means an `ExpandedElement<"div">` *is-a* `HTMLDivElement`
   * at the type level — Node / Element / HTMLElement members are always
   * present, so callers don't need `as unknown as Node` bridges.
   *
   * The metadata is `readonly` so library internals can't be mutated by
   * callers and optional because SSR / hydration may produce elements
   * before modifiers have been applied.
   *
   * @template TTagName Key of `HTMLElementTagNameMap` (e.g. `"div"`, `"button"`).
   */
  export type ExpandedElement<
    TTagName extends ElementTagName = ElementTagName,
  > = HTMLElementTagNameMap[TTagName] & {
    readonly rawMods?: ReadonlyArray<NodeModLike<ElementTagName>>;
    readonly mods?: ReadonlyArray<NodeMod<ElementTagName>>;
  };

  export type NodeRenderable<TTagName extends ElementTagName = ElementTagName> =
    | Primitive
    | ExpandedElementAttributes<TTagName>
    | ExpandedElement<TTagName>
    | Node;

  export type NodeMod<TTagName extends ElementTagName = ElementTagName> =
    | NodeRenderable<TTagName>
    | ValueFactory<Primitive>
    | ((parent: ExpandedElement<TTagName>, index: number) => Node);

  export type NodeModFn<TTagName extends ElementTagName = ElementTagName> = (
    parent: ExpandedElement<TTagName>,
    index: number,
  ) => NodeMod<TTagName> | void;

  export type NodeModLike<TTagName extends ElementTagName = ElementTagName> =
    | NodeMod<TTagName>
    | NodeModFn<TTagName>
    | NodeModFn<ElementTagName>;

  /**
   * Pulls the ExpandedElement out of any builder-shaped value — useful for writing
   * return-type declarations without hand-wiring generic parameters.
   */
  export type InferExpandedElement<TValue> =
    TValue extends ExpandedElement<infer TTagName>
      ? ExpandedElement<TTagName>
      : TValue extends DetachedExpandedElementFactory<infer TTagName>
        ? ExpandedElement<TTagName>
        : TValue extends ExpandedElementBuilder<infer TTagName>
          ? ExpandedElement<TTagName>
          : TValue extends NodeModFn<infer TTagName>
            ? ExpandedElement<TTagName>
            : Extract<TValue, Element>;

  /**
   * Tag builder — accepts any number of modifiers as a readonly tuple, preserving
   * the tuple literal for callers that want to chain `.map`/`.length` off the result.
   */
  export type ExpandedElementBuilder<
    TTagName extends ElementTagName = ElementTagName,
  > = <const TMods extends readonly NodeModLike<TTagName>[]>(
    ...rawMods: TMods
  ) => DetachedExpandedElementFactory<TTagName>;
}

export {};
