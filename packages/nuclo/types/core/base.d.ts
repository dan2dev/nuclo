

declare global {
  export type Primitive = string | number | bigint | boolean | symbol | null | undefined;
  export type ElementTagName = keyof HTMLElementTagNameMap;

  // Core element attribute types
  export type ExpandedElementAttributes<
    TTagName extends ElementTagName = ElementTagName,
  > = Omit<
    {
      [K in keyof HTMLElementTagNameMap[TTagName]]?:
      | HTMLElementTagNameMap[TTagName][K]
      | (() => HTMLElementTagNameMap[TTagName][K]);
    },
    "style"
  > & {
    style?: Partial<CSSStyleDeclaration> | (() => Partial<CSSStyleDeclaration>);
  };

  // Core element type
  export type ExpandedElement<
    TTagName extends ElementTagName = ElementTagName,
  > = Partial<Omit<HTMLElementTagNameMap[TTagName], "tagName">> &
    Pick<HTMLElementTagNameMap[TTagName], "tagName"> & {
      rawMods?: NodeMod<TTagName> | NodeModFn<TTagName>[];
      mods?: NodeMod<TTagName>[];
    };

  // Core modifier types
  export type NodeMod<TTagName extends ElementTagName = ElementTagName> =
    | Primitive
    | (() => Primitive)
    | ExpandedElementAttributes<TTagName>
    | ExpandedElement<TTagName>;

  export type NodeModFn<TTagName extends ElementTagName = ElementTagName> = (
    parent: ExpandedElement<TTagName>,
    index: number,
  ) => NodeMod<TTagName> | void;

  // Core modifier types (selfClosing)
  // export type NodeSelfClosingMod<
  //   TTagName extends ElementTagName = ElementTagName,
  // > = ExpandedElementAttributes<TTagName>    | Primitive
  // | (() => Primitive);



  // Core builder types
  export type ExpandedElementBuilder<
    TTagName extends ElementTagName = ElementTagName,
  > = (
    ...rawMods: (NodeMod<TTagName> | NodeModFn<TTagName>)[]
  ) => (
    parent?: ExpandedElement<TTagName>,
    index?: number,
  ) => ExpandedElement<TTagName>;

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
