// Strong types for CSS property values
// These types provide autocomplete and type safety for style helper functions

// Display
export type DisplayValue =
	| "block"
	| "inline"
	| "flex"
	| "grid"
	| "inline-block"
	| "inline-flex"
	| "inline-grid"
	| "none"
	| "contents"
	| "table"
	| "table-row"
	| "table-cell"
	| "list-item"
	| "run-in"
	| "flow"
	| "flow-root"
	| "ruby"
	| "ruby-base"
	| "ruby-text"
	| "ruby-base-container"
	| "ruby-text-container"
	| string; // Allow custom values for advanced use cases

// Position
export type PositionValue =
	| "static"
	| "relative"
	| "absolute"
	| "fixed"
	| "sticky"
	| string;

// Text align
export type TextAlignValue =
	| "left"
	| "right"
	| "center"
	| "justify"
	| "start"
	| "end"
	| "match-parent"
	| string;

// Font weight
export type FontWeightValue =
	| "normal"
	| "bold"
	| "bolder"
	| "lighter"
	| "100"
	| "200"
	| "300"
	| "400"
	| "500"
	| "600"
	| "700"
	| "800"
	| "900"
	| number
	| string;

// Font style
export type FontStyleValue =
	| "normal"
	| "italic"
	| "oblique"
	| `oblique ${string}`
	| string;

// Text transform
export type TextTransformValue =
	| "none"
	| "capitalize"
	| "uppercase"
	| "lowercase"
	| "full-width"
	| "full-size-kana"
	| string;

// Text decoration
export type TextDecorationValue =
	| "none"
	| "underline"
	| "overline"
	| "line-through"
	| "blink"
	| string;

// Text decoration style
export type TextDecorationStyleValue =
	| "solid"
	| "double"
	| "dotted"
	| "dashed"
	| "wavy"
	| string;

// Text decoration line
export type TextDecorationLineValue =
	| "none"
	| "underline"
	| "overline"
	| "line-through"
	| "blink"
	| string;

// White space
export type WhiteSpaceValue =
	| "normal"
	| "nowrap"
	| "pre"
	| "pre-wrap"
	| "pre-line"
	| "break-spaces"
	| string;

// Overflow
export type OverflowValue =
	| "visible"
	| "hidden"
	| "clip"
	| "scroll"
	| "auto"
	| string;

// Visibility
export type VisibilityValue =
	| "visible"
	| "hidden"
	| "collapse"
	| string;

// Flex direction
export type FlexDirectionValue =
	| "row"
	| "row-reverse"
	| "column"
	| "column-reverse"
	| string;

// Flex wrap
export type FlexWrapValue =
	| "nowrap"
	| "wrap"
	| "wrap-reverse"
	| string;

// Align items
export type AlignItemsValue =
	| "normal"
	| "stretch"
	| "flex-start"
	| "flex-end"
	| "center"
	| "baseline"
	| "first baseline"
	| "last baseline"
	| "start"
	| "end"
	| "self-start"
	| "self-end"
	| string;

// Justify content
export type JustifyContentValue =
	| "normal"
	| "flex-start"
	| "flex-end"
	| "center"
	| "space-between"
	| "space-around"
	| "space-evenly"
	| "stretch"
	| "start"
	| "end"
	| "left"
	| "right"
	| string;

// Align self
export type AlignSelfValue =
	| "auto"
	| "normal"
	| "stretch"
	| "flex-start"
	| "flex-end"
	| "center"
	| "baseline"
	| "first baseline"
	| "last baseline"
	| "start"
	| "end"
	| "self-start"
	| "self-end"
	| string;

// Align content
export type AlignContentValue =
	| "normal"
	| "flex-start"
	| "flex-end"
	| "center"
	| "space-between"
	| "space-around"
	| "space-evenly"
	| "stretch"
	| "start"
	| "end"
	| "baseline"
	| "first baseline"
	| "last baseline"
	| string;

// Justify self
export type JustifySelfValue =
	| "auto"
	| "normal"
	| "stretch"
	| "flex-start"
	| "flex-end"
	| "center"
	| "baseline"
	| "first baseline"
	| "last baseline"
	| "start"
	| "end"
	| "self-start"
	| "self-end"
	| "left"
	| "right"
	| string;

// Justify items
export type JustifyItemsValue =
	| "normal"
	| "stretch"
	| "flex-start"
	| "flex-end"
	| "center"
	| "baseline"
	| "first baseline"
	| "last baseline"
	| "start"
	| "end"
	| "self-start"
	| "self-end"
	| "left"
	| "right"
	| "legacy"
	| string;

// Grid auto flow
export type GridAutoFlowValue =
	| "row"
	| "column"
	| "dense"
	| "row dense"
	| "column dense"
	| string;

// Border style
export type BorderStyleValue =
	| "none"
	| "hidden"
	| "dotted"
	| "dashed"
	| "solid"
	| "double"
	| "groove"
	| "ridge"
	| "inset"
	| "outset"
	| string;

// Outline style
export type OutlineStyleValue =
	| "none"
	| "hidden"
	| "dotted"
	| "dashed"
	| "solid"
	| "double"
	| "groove"
	| "ridge"
	| "inset"
	| "outset"
	| string;

// Box sizing
export type BoxSizingValue =
	| "content-box"
	| "border-box"
	| string;

// Object fit
export type ObjectFitValue =
	| "fill"
	| "contain"
	| "cover"
	| "none"
	| "scale-down"
	| string;

// Vertical align
export type VerticalAlignValue =
	| "baseline"
	| "sub"
	| "super"
	| "text-top"
	| "text-bottom"
	| "middle"
	| "top"
	| "bottom"
	| string
	| `${number}%`
	| `${number}px`
	| `${number}em`
	| `${number}rem`;

// Text align last
export type TextAlignLastValue =
	| "auto"
	| "left"
	| "right"
	| "center"
	| "justify"
	| "start"
	| "end"
	| string;

// Text justify
export type TextJustifyValue =
	| "auto"
	| "inter-word"
	| "inter-character"
	| "none"
	| string;

// Text overflow
export type TextOverflowValue =
	| "clip"
	| "ellipsis"
	| string;

// Word wrap
export type WordWrapValue =
	| "normal"
	| "break-word"
	| "anywhere"
	| string;

// Overflow wrap
export type OverflowWrapValue =
	| "normal"
	| "break-word"
	| "anywhere"
	| string;

// Background repeat
export type BackgroundRepeatValue =
	| "repeat"
	| "repeat-x"
	| "repeat-y"
	| "no-repeat"
	| "space"
	| "round"
	| string;

// Background attachment
export type BackgroundAttachmentValue =
	| "scroll"
	| "fixed"
	| "local"
	| string;

// Background clip
export type BackgroundClipValue =
	| "border-box"
	| "padding-box"
	| "content-box"
	| "text"
	| string;

// Background origin
export type BackgroundOriginValue =
	| "border-box"
	| "padding-box"
	| "content-box"
	| string;

// Transform style
export type TransformStyleValue =
	| "flat"
	| "preserve-3d"
	| string;

// Backface visibility
export type BackfaceVisibilityValue =
	| "visible"
	| "hidden"
	| string;

// Animation direction
export type AnimationDirectionValue =
	| "normal"
	| "reverse"
	| "alternate"
	| "alternate-reverse"
	| string;

// Animation fill mode
export type AnimationFillModeValue =
	| "none"
	| "forwards"
	| "backwards"
	| "both"
	| string;

// Animation play state
export type AnimationPlayStateValue =
	| "running"
	| "paused"
	| string;

// List style type
export type ListStyleTypeValue =
	| "none"
	| "disc"
	| "circle"
	| "square"
	| "decimal"
	| "decimal-leading-zero"
	| "lower-roman"
	| "upper-roman"
	| "lower-greek"
	| "lower-latin"
	| "upper-latin"
	| "armenian"
	| "georgian"
	| "lower-alpha"
	| "upper-alpha"
	| string;

// List style position
export type ListStylePositionValue =
	| "inside"
	| "outside"
	| string;

// Border collapse
export type BorderCollapseValue =
	| "separate"
	| "collapse"
	| string;

// Caption side
export type CaptionSideValue =
	| "top"
	| "bottom"
	| "left"
	| "right"
	| string;

// Empty cells
export type EmptyCellsValue =
	| "show"
	| "hide"
	| string;

// Table layout
export type TableLayoutValue =
	| "auto"
	| "fixed"
	| string;

// Appearance
export type AppearanceValue =
	| "none"
	| "auto"
	| "button"
	| "textfield"
	| "menulist-button"
	| "searchfield"
	| "textarea"
	| "push-button"
	| "slider-horizontal"
	| "checkbox"
	| "radio"
	| "square-button"
	| "menulist"
	| "listbox"
	| "meter"
	| "progress-bar"
	| string;

// User select
export type UserSelectValue =
	| "none"
	| "auto"
	| "text"
	| "contain"
	| "all"
	| string;

// Pointer events
export type PointerEventsValue =
	| "auto"
	| "none"
	| "visiblePainted"
	| "visibleFill"
	| "visibleStroke"
	| "visible"
	| "painted"
	| "fill"
	| "stroke"
	| "all"
	| string;

// Resize
export type ResizeValue =
	| "none"
	| "both"
	| "horizontal"
	| "vertical"
	| "block"
	| "inline"
	| string;

// Scroll behavior
export type ScrollBehaviorValue =
	| "auto"
	| "smooth"
	| string;

// Isolation
export type IsolationValue =
	| "auto"
	| "isolate"
	| string;

// Mix blend mode
export type MixBlendModeValue =
	| "normal"
	| "multiply"
	| "screen"
	| "overlay"
	| "darken"
	| "lighten"
	| "color-dodge"
	| "color-burn"
	| "hard-light"
	| "soft-light"
	| "difference"
	| "exclusion"
	| "hue"
	| "saturation"
	| "color"
	| "luminosity"
	| string;

// Contain
export type ContainValue =
	| "none"
	| "strict"
	| "content"
	| "size"
	| "layout"
	| "style"
	| "paint"
	| string;

// Page break
export type PageBreakValue =
	| "auto"
	| "always"
	| "avoid"
	| "left"
	| "right"
	| "recto"
	| "verso"
	| string;

// Break
export type BreakValue =
	| "auto"
	| "avoid"
	| "avoid-page"
	| "page"
	| "left"
	| "right"
	| "recto"
	| "verso"
	| "avoid-column"
	| "column"
	| "avoid-region"
	| "region"
	| string;

// Column fill
export type ColumnFillValue =
	| "auto"
	| "balance"
	| "balance-all"
	| string;

// Column rule style
export type ColumnRuleStyleValue =
	| "none"
	| "hidden"
	| "dotted"
	| "dashed"
	| "solid"
	| "double"
	| "groove"
	| "ridge"
	| "inset"
	| "outset"
	| string;

// Column span
export type ColumnSpanValue =
	| "none"
	| "all"
	| string;

// Cursor
export type CursorValue =
	| "auto"
	| "default"
	| "none"
	| "context-menu"
	| "help"
	| "pointer"
	| "progress"
	| "wait"
	| "cell"
	| "crosshair"
	| "text"
	| "vertical-text"
	| "alias"
	| "copy"
	| "move"
	| "no-drop"
	| "not-allowed"
	| "e-resize"
	| "n-resize"
	| "ne-resize"
	| "nw-resize"
	| "s-resize"
	| "se-resize"
	| "sw-resize"
	| "w-resize"
	| "ew-resize"
	| "ns-resize"
	| "nesw-resize"
	| "nwse-resize"
	| "col-resize"
	| "row-resize"
	| "all-scroll"
	| "zoom-in"
	| "zoom-out"
	| "grab"
	| "grabbing"
	| string;

// Generic types for properties that accept various values
export type CSSLengthValue = string | number | `${number}px` | `${number}em` | `${number}rem` | `${number}%` | `${number}vw` | `${number}vh` | `${number}vmin` | `${number}vmax` | `${number}ch` | `${number}ex` | `${number}cm` | `${number}mm` | `${number}in` | `${number}pt` | `${number}pc`;
export type CSSColorValue = string; // Can be hex, rgb, rgba, hsl, hsla, named colors, etc.
export type CSSFontFamilyValue = string; // Font family names
export type CSSTimingFunctionValue = string; // e.g., "ease", "linear", "ease-in", "cubic-bezier(...)"
export type CSSTransformValue = string; // Transform functions
export type CSSFilterValue = string; // Filter functions
export type CSSBackgroundImageValue = string; // url(), gradient functions, etc.
export type CSSAnimationNameValue = string; // Animation name or "none"
export type CSSContentValue = string; // Content value (quoted strings, counters, etc.)

