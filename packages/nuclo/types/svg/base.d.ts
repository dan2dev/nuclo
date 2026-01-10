declare global {
  // SVG attribute types that accept string values for all SVG properties
  // This is needed because SVG DOM properties like 'width' are SVGAnimatedLength,
  // but we set them as strings using setAttribute()
  // Supports reactive values (functions) for dynamic attributes
  export type SVGAttributes = {
    // Common SVG attributes
    width?: string | number | (() => string | number);
    height?: string | number | (() => string | number);
    viewBox?: string | (() => string);
    fill?: string | (() => string);
    stroke?: string | (() => string);
    "stroke-width"?: string | number | (() => string | number);
    "stroke-linecap"?: "butt" | "round" | "square" | (() => "butt" | "round" | "square");
    "stroke-linejoin"?: "miter" | "round" | "bevel" | (() => "miter" | "round" | "bevel");
    "stroke-dasharray"?: string | (() => string);
    "stroke-dashoffset"?: string | number | (() => string | number);
    opacity?: string | number | (() => string | number);
    "fill-opacity"?: string | number | (() => string | number);
    "stroke-opacity"?: string | number | (() => string | number);
    transform?: string | (() => string);
    className?: string | (() => string);
    id?: string | (() => string);

    // Path attributes
    d?: string | (() => string);

    // Circle/Ellipse attributes
    cx?: string | number | (() => string | number);
    cy?: string | number | (() => string | number);
    r?: string | number | (() => string | number);
    rx?: string | number | (() => string | number);
    ry?: string | number | (() => string | number);

    // Line attributes
    x1?: string | number | (() => string | number);
    y1?: string | number | (() => string | number);
    x2?: string | number | (() => string | number);
    y2?: string | number | (() => string | number);

    // Rect attributes
    x?: string | number | (() => string | number);
    y?: string | number | (() => string | number);

    // Polygon/Polyline attributes
    points?: string | (() => string);

    // Text attributes
    "text-anchor"?: "start" | "middle" | "end" | (() => "start" | "middle" | "end");
    "dominant-baseline"?: string | (() => string);
    "font-family"?: string | (() => string);
    "font-size"?: string | number | (() => string | number);
    "font-weight"?: string | number | (() => string | number);

    // Gradient attributes
    offset?: string | (() => string);
    "stop-color"?: string | (() => string);
    "stop-opacity"?: string | number | (() => string | number);

    // Use element
    href?: string | (() => string);

    // Filter attributes
    filter?: string | (() => string);

    // Clipping and masking
    "clip-path"?: string | (() => string);
    mask?: string | (() => string);

    // Allow any other string attributes (including reactive functions)
    // Using a more restrictive type to maintain type safety
  } & {
    [K in string]?: string | number | (() => string) | (() => number);
  };

  // SVG element modifier types
  export type SVGElementModifier<TTagName extends keyof SVGElementTagNameMap = keyof SVGElementTagNameMap> =
    | Primitive
    | (() => Primitive)
    | SVGAttributes
    | SVGElementTagNameMap[TTagName]
    | SVGElement  // Allow any SVG element as a child
    | Node  // Allow any DOM Node (including Comment, Text, etc.)
    | ((parent: SVGElementTagNameMap[TTagName], index: number) => SVGElement | Node);  // Allow SVG element and Node builders as children

  export type SVGElementModifierFn<TTagName extends keyof SVGElementTagNameMap = keyof SVGElementTagNameMap> = (
    parent: SVGElementTagNameMap[TTagName],
    index: number,
  ) => SVGElementModifier<TTagName> | Node | void;

  // SVG builder type - returns a NodeModFn-compatible function
  // Parameters are optional to allow standalone usage (e.g., svg()() for creating detached SVG)
  // but the function signature is compatible with NodeModFn when used as a child
  export type ExpandedSVGElementBuilder<
    TTagName extends keyof SVGElementTagNameMap = keyof SVGElementTagNameMap,
  > = (
    ...rawMods: Array<SVGElementModifier<TTagName> | SVGElementModifierFn<TTagName>>
  ) => (
    parent?: SVGElementTagNameMap[TTagName] | ExpandedElement<ElementTagName>,
    index?: number,
  ) => SVGElementTagNameMap[TTagName];
}

export {};