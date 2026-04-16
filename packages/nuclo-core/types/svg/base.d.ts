declare global {
  export type SVGAttributeValue<
    TValue = string | number | boolean | null | undefined,
  > = ValueOrFactory<TValue>;

  // SVG attribute types that accept string values for all SVG properties
  // This is needed because SVG DOM properties like 'width' are SVGAnimatedLength,
  // but we set them as strings using setAttribute()
  // Supports reactive values (functions) for dynamic attributes
  export type SVGAttributes = {
    // Common SVG attributes
    width?: SVGAttributeValue<string | number>;
    height?: SVGAttributeValue<string | number>;
    viewBox?: SVGAttributeValue<string>;
    fill?: SVGAttributeValue<string>;
    stroke?: SVGAttributeValue<string>;
    "stroke-width"?: SVGAttributeValue<string | number>;
    "stroke-linecap"?: SVGAttributeValue<"butt" | "round" | "square">;
    "stroke-linejoin"?: SVGAttributeValue<"miter" | "round" | "bevel">;
    "stroke-dasharray"?: SVGAttributeValue<string>;
    "stroke-dashoffset"?: SVGAttributeValue<string | number>;
    opacity?: SVGAttributeValue<string | number>;
    "fill-opacity"?: SVGAttributeValue<string | number>;
    "stroke-opacity"?: SVGAttributeValue<string | number>;
    transform?: SVGAttributeValue<string>;
    className?: SVGAttributeValue<string>;
    id?: SVGAttributeValue<string>;

    // Path attributes
    d?: SVGAttributeValue<string>;

    // Circle/Ellipse attributes
    cx?: SVGAttributeValue<string | number>;
    cy?: SVGAttributeValue<string | number>;
    r?: SVGAttributeValue<string | number>;
    rx?: SVGAttributeValue<string | number>;
    ry?: SVGAttributeValue<string | number>;

    // Line attributes
    x1?: SVGAttributeValue<string | number>;
    y1?: SVGAttributeValue<string | number>;
    x2?: SVGAttributeValue<string | number>;
    y2?: SVGAttributeValue<string | number>;

    // Rect attributes
    x?: SVGAttributeValue<string | number>;
    y?: SVGAttributeValue<string | number>;

    // Polygon/Polyline attributes
    points?: SVGAttributeValue<string>;

    // Text attributes
    "text-anchor"?: SVGAttributeValue<"start" | "middle" | "end">;
    "dominant-baseline"?: SVGAttributeValue<string>;
    "font-family"?: SVGAttributeValue<string>;
    "font-size"?: SVGAttributeValue<string | number>;
    "font-weight"?: SVGAttributeValue<string | number>;

    // Gradient attributes
    offset?: SVGAttributeValue<string>;
    "stop-color"?: SVGAttributeValue<string>;
    "stop-opacity"?: SVGAttributeValue<string | number>;

    // Use element
    href?: SVGAttributeValue<string>;

    // Filter attributes
    filter?: SVGAttributeValue<string>;

    // Clipping and masking
    "clip-path"?: SVGAttributeValue<string>;
    mask?: SVGAttributeValue<string>;

    // Allow any other string attributes (including reactive functions)
    // Using a more restrictive type to maintain type safety
  } & {
    [K in string]?: SVGAttributeValue;
  };

  // SVG element modifier types
  export type SVGRenderable<TTagName extends SVGTagName = SVGTagName> =
    | Primitive
    | SVGAttributes
    | SVGElementTagNameMap[TTagName]
    | SVGElement
    | Node;

  export type SVGElementModifier<
    TTagName extends keyof SVGElementTagNameMap = keyof SVGElementTagNameMap,
  > =
    | SVGRenderable<TTagName>
    | ValueFactory<Primitive>
    | ((
        parent: SVGElementTagNameMap[TTagName],
        index: number,
      ) => SVGElement | Node); // Allow SVG element and Node builders as children

  export type SVGElementModifierFn<
    TTagName extends keyof SVGElementTagNameMap = keyof SVGElementTagNameMap,
  > = (
    parent: SVGElementTagNameMap[TTagName],
    index: number,
  ) => SVGElementModifier<TTagName> | Node | void;

  export type SVGElementModifierLike<TTagName extends SVGTagName = SVGTagName> =
    | SVGElementModifier<TTagName>
    | SVGElementModifierFn<TTagName>;

  export type DetachedSVGElementFactory<
    TTagName extends SVGTagName = SVGTagName,
  > = SVGElementModifierFn<TTagName> &
    ((
      parent?: SVGElementTagNameMap[TTagName] | ExpandedElement<ElementTagName>,
      index?: number,
    ) => SVGElementTagNameMap[TTagName]);

  // SVG builder type - returns a NodeModFn-compatible function
  // Parameters are optional to allow standalone usage (e.g., svg()() for creating detached SVG)
  // but the function signature is compatible with NodeModFn when used as a child
  export type ExpandedSVGElementBuilder<
    TTagName extends keyof SVGElementTagNameMap = keyof SVGElementTagNameMap,
  > = (
    ...rawMods: readonly SVGElementModifierLike<TTagName>[]
  ) => DetachedSVGElementFactory<TTagName>;
}

export {};
