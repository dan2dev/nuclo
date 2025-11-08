declare global {
  // SVG attribute types that accept string values for all SVG properties
  // This is needed because SVG DOM properties like 'width' are SVGAnimatedLength,
  // but we set them as strings using setAttribute()
  export type SVGAttributes = {
    // Common SVG attributes
    width?: string | number;
    height?: string | number;
    viewBox?: string;
    fill?: string;
    stroke?: string;
    "stroke-width"?: string | number;
    "stroke-linecap"?: "butt" | "round" | "square";
    "stroke-linejoin"?: "miter" | "round" | "bevel";
    "stroke-dasharray"?: string;
    "stroke-dashoffset"?: string | number;
    opacity?: string | number;
    "fill-opacity"?: string | number;
    "stroke-opacity"?: string | number;
    transform?: string;
    className?: string;
    id?: string;

    // Path attributes
    d?: string;

    // Circle/Ellipse attributes
    cx?: string | number;
    cy?: string | number;
    r?: string | number;
    rx?: string | number;
    ry?: string | number;

    // Line attributes
    x1?: string | number;
    y1?: string | number;
    x2?: string | number;
    y2?: string | number;

    // Rect attributes
    x?: string | number;
    y?: string | number;

    // Polygon/Polyline attributes
    points?: string;

    // Text attributes
    "text-anchor"?: "start" | "middle" | "end";
    "dominant-baseline"?: string;
    "font-family"?: string;
    "font-size"?: string | number;
    "font-weight"?: string | number;

    // Gradient attributes
    offset?: string;
    "stop-color"?: string;
    "stop-opacity"?: string | number;

    // Use element
    href?: string;

    // Filter attributes
    filter?: string;

    // Clipping and masking
    "clip-path"?: string;
    mask?: string;

    // Allow any other string attributes
    [key: string]: string | number | undefined;
  };

  // SVG element modifier types
  export type SVGElementModifier<TTagName extends keyof SVGElementTagNameMap = keyof SVGElementTagNameMap> =
    | Primitive
    | (() => Primitive)
    | SVGAttributes
    | SVGElementTagNameMap[TTagName]
    | SVGElement  // Allow any SVG element as a child
    | ((parent?: any, index?: number) => SVGElement);  // Allow SVG element builders as children

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