declare global {
  // SVG element modifier types
  export type SVGElementModifier<TTagName extends keyof SVGElementTagNameMap = keyof SVGElementTagNameMap> =
    | Primitive
    | (() => Primitive)
    | Partial<SVGElementTagNameMap[TTagName]>
    | SVGElementTagNameMap[TTagName];

  export type SVGElementModifierFn<TTagName extends keyof SVGElementTagNameMap = keyof SVGElementTagNameMap> = (
    parent: SVGElementTagNameMap[TTagName],
    index: number,
  ) => SVGElementModifier<TTagName> | void;

  // SVG builder type
  export type ExpandedSVGElementBuilder<
    TTagName extends keyof SVGElementTagNameMap = keyof SVGElementTagNameMap,
  > = (
    ...rawMods: Array<SVGElementModifier<TTagName> | SVGElementModifierFn<TTagName>>
  ) => (
    parent?: SVGElementTagNameMap[TTagName],
    index?: number,
  ) => SVGElementTagNameMap[TTagName];
}

export {};