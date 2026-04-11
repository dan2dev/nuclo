

declare global {
  export type Primitive = string | number | bigint | boolean | symbol | null | undefined;
  export type ElementTagName = keyof HTMLElementTagNameMap;
  export type SVGTagName = keyof SVGElementTagNameMap;
  export type ValueFactory<TValue> = () => TValue;
  export type ValueOrFactory<TValue> = TValue | ValueFactory<TValue>;
  export type InferFactoryResult<TFactory> = TFactory extends (...args: unknown[]) => infer TResult
    ? TResult
    : never;

  // CSS Style object type that accepts any CSS property as string or number
  export type CSSStyleObject = {
    [K in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[K] | string | number;
  };

  // Core element attribute types
  export type ExpandedElementAttributes<
    TTagName extends ElementTagName = ElementTagName,
  > = {
    [K in keyof HTMLElementTagNameMap[TTagName]]?:
      K extends "style"
        ? ValueOrFactory<CSSStyleObject>
        : ValueOrFactory<HTMLElementTagNameMap[TTagName][K]>;
  } & {
    // Allow custom attributes (data-*, aria-*, etc.)
    [key: string]: ValueOrFactory<unknown>;
  };

  export type DetachedExpandedElementFactory<
    TTagName extends ElementTagName = ElementTagName,
  > = NodeModFn<TTagName> & ((
    parent?: ExpandedElement<TTagName>,
    index?: number,
  ) => ExpandedElement<TTagName>);

  // Core element type
  export type ExpandedElement<
    TTagName extends ElementTagName = ElementTagName,
  > = Partial<Omit<HTMLElementTagNameMap[TTagName], "tagName">> &
    Pick<HTMLElementTagNameMap[TTagName], "tagName"> & {
      rawMods?: ReadonlyArray<NodeModLike<ElementTagName>>;
      mods?: ReadonlyArray<NodeMod<ElementTagName>>;
    };

  // Core modifier types
  export type NodeRenderable<TTagName extends ElementTagName = ElementTagName> =
    | Primitive
    | ExpandedElementAttributes<TTagName>
    | ExpandedElement<TTagName>
    | Node;

  export type NodeMod<TTagName extends ElementTagName = ElementTagName> =
    | NodeRenderable<TTagName>
    | ValueFactory<Primitive>
    | ((parent: ExpandedElement<TTagName>, index: number) => Node);  // Allow Node builders

  export type NodeModFn<TTagName extends ElementTagName = ElementTagName> = (
    parent: ExpandedElement<TTagName>,
    index: number,
  ) => NodeMod<TTagName> | void;

  export type NodeModLike<TTagName extends ElementTagName = ElementTagName> =
    | NodeMod<TTagName>
    | NodeModFn<TTagName>;

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

  // Core modifier types (selfClosing)
  // export type NodeSelfClosingMod<
  //   TTagName extends ElementTagName = ElementTagName,
  // > = ExpandedElementAttributes<TTagName>    | Primitive
  // | (() => Primitive);



  // Core builder types
  export type ExpandedElementBuilder<
    TTagName extends ElementTagName = ElementTagName,
  > = (
    ...rawMods: readonly NodeModLike<TTagName>[]
  ) => DetachedExpandedElementFactory<TTagName>;

  // export type SelfClosingElementBuilder<
  //   TTagName extends ElementTagName = ElementTagName,
  // > = (
  //   ...rawMods: NodeSelfClosingMod<TTagName>[]
  // ) => (
  //   parent?: ExpandedElement<TTagName>,
  //   index?: number,
  // ) => ExpandedElement<TTagName>;
}

export { };
