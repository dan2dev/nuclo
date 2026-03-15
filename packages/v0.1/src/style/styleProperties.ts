// Style properties registry - defines all CSS properties that can be used
// This allows dynamic generation of methods and functions

export interface StylePropertyDefinition {
	/** The method/function name (e.g., "bg", "fontSize") */
	name: string;
	/** The CSS property name (e.g., "background-color", "font-size") */
	cssProperty: string;
	/** Optional: Default value to use if none provided */
	defaultValue?: string;
	/** Optional: Whether this is a shorthand that takes no arguments */
	isShorthand?: boolean;
}

export const STYLE_PROPERTIES: readonly StylePropertyDefinition[] = [
	// Display
	{ name: "display", cssProperty: "display" },
	{ name: "grid", cssProperty: "display", defaultValue: "grid", isShorthand: true },

	// Colors
	{ name: "bg", cssProperty: "background-color" },
	{ name: "color", cssProperty: "color" },
	{ name: "accentColor", cssProperty: "accent-color" },

	// Typography
	{ name: "fontSize", cssProperty: "font-size" },
	{ name: "fontWeight", cssProperty: "font-weight" },
	{ name: "fontFamily", cssProperty: "font-family" },
	{ name: "lineHeight", cssProperty: "line-height" },
	{ name: "letterSpacing", cssProperty: "letter-spacing" },
	{ name: "textAlign", cssProperty: "text-align" },
	{ name: "textDecoration", cssProperty: "text-decoration" },
	{ name: "fontStyle", cssProperty: "font-style" },
	{ name: "fontVariant", cssProperty: "font-variant" },
	{ name: "fontStretch", cssProperty: "font-stretch" },
	{ name: "textTransform", cssProperty: "text-transform" },
	{ name: "textIndent", cssProperty: "text-indent" },
	{ name: "textOverflow", cssProperty: "text-overflow" },
	{ name: "textShadow", cssProperty: "text-shadow" },
	{ name: "whiteSpace", cssProperty: "white-space" },
	{ name: "wordSpacing", cssProperty: "word-spacing" },
	{ name: "wordWrap", cssProperty: "word-wrap" },
	{ name: "overflowWrap", cssProperty: "overflow-wrap" },
	{ name: "textAlignLast", cssProperty: "text-align-last" },
	{ name: "textJustify", cssProperty: "text-justify" },
	{ name: "textDecorationLine", cssProperty: "text-decoration-line" },
	{ name: "textDecorationColor", cssProperty: "text-decoration-color" },
	{ name: "textDecorationStyle", cssProperty: "text-decoration-style" },
	{ name: "textDecorationThickness", cssProperty: "text-decoration-thickness" },
	{ name: "textUnderlineOffset", cssProperty: "text-underline-offset" },
	{ name: "verticalAlign", cssProperty: "vertical-align" },

	// Layout
	{ name: "position", cssProperty: "position" },
	{ name: "padding", cssProperty: "padding" },
	{ name: "paddingTop", cssProperty: "padding-top" },
	{ name: "paddingRight", cssProperty: "padding-right" },
	{ name: "paddingBottom", cssProperty: "padding-bottom" },
	{ name: "paddingLeft", cssProperty: "padding-left" },
	{ name: "margin", cssProperty: "margin" },
	{ name: "marginTop", cssProperty: "margin-top" },
	{ name: "marginRight", cssProperty: "margin-right" },
	{ name: "marginBottom", cssProperty: "margin-bottom" },
	{ name: "marginLeft", cssProperty: "margin-left" },
	{ name: "width", cssProperty: "width" },
	{ name: "height", cssProperty: "height" },
	{ name: "minWidth", cssProperty: "min-width" },
	{ name: "maxWidth", cssProperty: "max-width" },
	{ name: "minHeight", cssProperty: "min-height" },
	{ name: "maxHeight", cssProperty: "max-height" },
	{ name: "boxSizing", cssProperty: "box-sizing" },

	// Positioning
	{ name: "top", cssProperty: "top" },
	{ name: "right", cssProperty: "right" },
	{ name: "bottom", cssProperty: "bottom" },
	{ name: "left", cssProperty: "left" },
	{ name: "zIndex", cssProperty: "z-index" },

	// Flexbox
	{ name: "flexDirection", cssProperty: "flex-direction" },
	{ name: "alignItems", cssProperty: "align-items" },
	{ name: "justifyContent", cssProperty: "justify-content" },
	{ name: "gap", cssProperty: "gap" },
	{ name: "flexWrap", cssProperty: "flex-wrap" },
	{ name: "flexGrow", cssProperty: "flex-grow" },
	{ name: "flexShrink", cssProperty: "flex-shrink" },
	{ name: "flexBasis", cssProperty: "flex-basis" },
	{ name: "alignSelf", cssProperty: "align-self" },
	{ name: "alignContent", cssProperty: "align-content" },
	{ name: "justifySelf", cssProperty: "justify-self" },
	{ name: "justifyItems", cssProperty: "justify-items" },

	// Grid
	{ name: "gridTemplateColumns", cssProperty: "grid-template-columns" },
	{ name: "gridTemplateRows", cssProperty: "grid-template-rows" },
	{ name: "gridTemplateAreas", cssProperty: "grid-template-areas" },
	{ name: "gridColumn", cssProperty: "grid-column" },
	{ name: "gridRow", cssProperty: "grid-row" },
	{ name: "gridColumnStart", cssProperty: "grid-column-start" },
	{ name: "gridColumnEnd", cssProperty: "grid-column-end" },
	{ name: "gridRowStart", cssProperty: "grid-row-start" },
	{ name: "gridRowEnd", cssProperty: "grid-row-end" },
	{ name: "gridArea", cssProperty: "grid-area" },
	{ name: "gridAutoColumns", cssProperty: "grid-auto-columns" },
	{ name: "gridAutoRows", cssProperty: "grid-auto-rows" },
	{ name: "gridAutoFlow", cssProperty: "grid-auto-flow" },

	// Borders
	{ name: "border", cssProperty: "border" },
	{ name: "borderTop", cssProperty: "border-top" },
	{ name: "borderRight", cssProperty: "border-right" },
	{ name: "borderBottom", cssProperty: "border-bottom" },
	{ name: "borderLeft", cssProperty: "border-left" },
	{ name: "borderWidth", cssProperty: "border-width" },
	{ name: "borderStyle", cssProperty: "border-style" },
	{ name: "borderColor", cssProperty: "border-color" },
	{ name: "borderTopWidth", cssProperty: "border-top-width" },
	{ name: "borderRightWidth", cssProperty: "border-right-width" },
	{ name: "borderBottomWidth", cssProperty: "border-bottom-width" },
	{ name: "borderLeftWidth", cssProperty: "border-left-width" },
	{ name: "borderTopStyle", cssProperty: "border-top-style" },
	{ name: "borderRightStyle", cssProperty: "border-right-style" },
	{ name: "borderBottomStyle", cssProperty: "border-bottom-style" },
	{ name: "borderLeftStyle", cssProperty: "border-left-style" },
	{ name: "borderTopColor", cssProperty: "border-top-color" },
	{ name: "borderRightColor", cssProperty: "border-right-color" },
	{ name: "borderBottomColor", cssProperty: "border-bottom-color" },
	{ name: "borderLeftColor", cssProperty: "border-left-color" },
	{ name: "borderRadius", cssProperty: "border-radius" },
	{ name: "borderTopLeftRadius", cssProperty: "border-top-left-radius" },
	{ name: "borderTopRightRadius", cssProperty: "border-top-right-radius" },
	{ name: "borderBottomLeftRadius", cssProperty: "border-bottom-left-radius" },
	{ name: "borderBottomRightRadius", cssProperty: "border-bottom-right-radius" },

	// Outline
	{ name: "outline", cssProperty: "outline" },
	{ name: "outlineWidth", cssProperty: "outline-width" },
	{ name: "outlineStyle", cssProperty: "outline-style" },
	{ name: "outlineColor", cssProperty: "outline-color" },
	{ name: "outlineOffset", cssProperty: "outline-offset" },

	// Background
	{ name: "backgroundColor", cssProperty: "background-color" },
	{ name: "backgroundImage", cssProperty: "background-image" },
	{ name: "backgroundRepeat", cssProperty: "background-repeat" },
	{ name: "backgroundPosition", cssProperty: "background-position" },
	{ name: "backgroundSize", cssProperty: "background-size" },
	{ name: "backgroundAttachment", cssProperty: "background-attachment" },
	{ name: "backgroundClip", cssProperty: "background-clip" },
	{ name: "backgroundOrigin", cssProperty: "background-origin" },

	// Effects
	{ name: "boxShadow", cssProperty: "box-shadow" },
	{ name: "opacity", cssProperty: "opacity" },
	{ name: "transition", cssProperty: "transition" },
	{ name: "transitionProperty", cssProperty: "transition-property" },
	{ name: "transitionDuration", cssProperty: "transition-duration" },
	{ name: "transitionTimingFunction", cssProperty: "transition-timing-function" },
	{ name: "transitionDelay", cssProperty: "transition-delay" },

	// Transform
	{ name: "transform", cssProperty: "transform" },
	{ name: "transformOrigin", cssProperty: "transform-origin" },
	{ name: "transformStyle", cssProperty: "transform-style" },
	{ name: "perspective", cssProperty: "perspective" },
	{ name: "perspectiveOrigin", cssProperty: "perspective-origin" },
	{ name: "backfaceVisibility", cssProperty: "backface-visibility" },

	// Animation
	{ name: "animation", cssProperty: "animation" },
	{ name: "animationName", cssProperty: "animation-name" },
	{ name: "animationDuration", cssProperty: "animation-duration" },
	{ name: "animationTimingFunction", cssProperty: "animation-timing-function" },
	{ name: "animationDelay", cssProperty: "animation-delay" },
	{ name: "animationIterationCount", cssProperty: "animation-iteration-count" },
	{ name: "animationDirection", cssProperty: "animation-direction" },
	{ name: "animationFillMode", cssProperty: "animation-fill-mode" },
	{ name: "animationPlayState", cssProperty: "animation-play-state" },

	// Filter
	{ name: "filter", cssProperty: "filter" },
	{ name: "backdropFilter", cssProperty: "backdrop-filter" },

	// Overflow
	{ name: "overflow", cssProperty: "overflow" },
	{ name: "overflowX", cssProperty: "overflow-x" },
	{ name: "overflowY", cssProperty: "overflow-y" },

	// Visibility
	{ name: "visibility", cssProperty: "visibility" },

	// Object fit/position
	{ name: "objectFit", cssProperty: "object-fit" },
	{ name: "objectPosition", cssProperty: "object-position" },

	// List
	{ name: "listStyle", cssProperty: "list-style" },
	{ name: "listStyleType", cssProperty: "list-style-type" },
	{ name: "listStylePosition", cssProperty: "list-style-position" },
	{ name: "listStyleImage", cssProperty: "list-style-image" },

	// Table
	{ name: "borderCollapse", cssProperty: "border-collapse" },
	{ name: "borderSpacing", cssProperty: "border-spacing" },
	{ name: "captionSide", cssProperty: "caption-side" },
	{ name: "emptyCells", cssProperty: "empty-cells" },
	{ name: "tableLayout", cssProperty: "table-layout" },

	// Content
	{ name: "content", cssProperty: "content" },
	{ name: "quotes", cssProperty: "quotes" },
	{ name: "counterReset", cssProperty: "counter-reset" },
	{ name: "counterIncrement", cssProperty: "counter-increment" },

	// User interface
	{ name: "appearance", cssProperty: "appearance" },
	{ name: "userSelect", cssProperty: "user-select" },
	{ name: "pointerEvents", cssProperty: "pointer-events" },
	{ name: "resize", cssProperty: "resize" },
	{ name: "scrollBehavior", cssProperty: "scroll-behavior" },

	// Clip
	{ name: "clip", cssProperty: "clip" },
	{ name: "clipPath", cssProperty: "clip-path" },

	// Isolation
	{ name: "isolation", cssProperty: "isolation" },

	// Mix blend mode
	{ name: "mixBlendMode", cssProperty: "mix-blend-mode" },

	// Will change
	{ name: "willChange", cssProperty: "will-change" },

	// Contain
	{ name: "contain", cssProperty: "contain" },

	// Page break
	{ name: "pageBreakBefore", cssProperty: "page-break-before" },
	{ name: "pageBreakAfter", cssProperty: "page-break-after" },
	{ name: "pageBreakInside", cssProperty: "page-break-inside" },

	// Break
	{ name: "breakBefore", cssProperty: "break-before" },
	{ name: "breakAfter", cssProperty: "break-after" },
	{ name: "breakInside", cssProperty: "break-inside" },

	// Orphans and widows
	{ name: "orphans", cssProperty: "orphans" },
	{ name: "widows", cssProperty: "widows" },

	// Column
	{ name: "columnCount", cssProperty: "column-count" },
	{ name: "columnFill", cssProperty: "column-fill" },
	{ name: "columnGap", cssProperty: "column-gap" },
	{ name: "columnRule", cssProperty: "column-rule" },
	{ name: "columnRuleColor", cssProperty: "column-rule-color" },
	{ name: "columnRuleStyle", cssProperty: "column-rule-style" },
	{ name: "columnRuleWidth", cssProperty: "column-rule-width" },
	{ name: "columnSpan", cssProperty: "column-span" },
	{ name: "columnWidth", cssProperty: "column-width" },
	{ name: "columns", cssProperty: "columns" },

	// Interaction
	{ name: "cursor", cssProperty: "cursor" },

	// Layout - Additional
	{ name: "aspectRatio", cssProperty: "aspect-ratio" },
	{ name: "clear", cssProperty: "clear" },
	{ name: "float", cssProperty: "float" },
	{ name: "order", cssProperty: "order" },

	// Flexbox - Place properties (shorthand)
	{ name: "placeContent", cssProperty: "place-content" },
	{ name: "placeItems", cssProperty: "place-items" },
	{ name: "placeSelf", cssProperty: "place-self" },

	// Text - Additional
	{ name: "hyphens", cssProperty: "hyphens" },
	{ name: "lineBreak", cssProperty: "line-break" },
	{ name: "wordBreak", cssProperty: "word-break" },
	{ name: "textOrientation", cssProperty: "text-orientation" },
	{ name: "writingMode", cssProperty: "writing-mode" },
	{ name: "direction", cssProperty: "direction" },
	{ name: "unicodeBidi", cssProperty: "unicode-bidi" },

	// Background - Additional
	{ name: "backgroundBlendMode", cssProperty: "background-blend-mode" },
	{ name: "backgroundPositionX", cssProperty: "background-position-x" },
	{ name: "backgroundPositionY", cssProperty: "background-position-y" },

	// Border Image
	{ name: "borderImage", cssProperty: "border-image" },
	{ name: "borderImageSource", cssProperty: "border-image-source" },
	{ name: "borderImageSlice", cssProperty: "border-image-slice" },
	{ name: "borderImageWidth", cssProperty: "border-image-width" },
	{ name: "borderImageOutset", cssProperty: "border-image-outset" },
	{ name: "borderImageRepeat", cssProperty: "border-image-repeat" },

	// Logical Properties - Inset
	{ name: "inset", cssProperty: "inset" },
	{ name: "insetBlock", cssProperty: "inset-block" },
	{ name: "insetBlockStart", cssProperty: "inset-block-start" },
	{ name: "insetBlockEnd", cssProperty: "inset-block-end" },
	{ name: "insetInline", cssProperty: "inset-inline" },
	{ name: "insetInlineStart", cssProperty: "inset-inline-start" },
	{ name: "insetInlineEnd", cssProperty: "inset-inline-end" },

	// Logical Properties - Margin
	{ name: "marginBlock", cssProperty: "margin-block" },
	{ name: "marginBlockStart", cssProperty: "margin-block-start" },
	{ name: "marginBlockEnd", cssProperty: "margin-block-end" },
	{ name: "marginInline", cssProperty: "margin-inline" },
	{ name: "marginInlineStart", cssProperty: "margin-inline-start" },
	{ name: "marginInlineEnd", cssProperty: "margin-inline-end" },

	// Logical Properties - Padding
	{ name: "paddingBlock", cssProperty: "padding-block" },
	{ name: "paddingBlockStart", cssProperty: "padding-block-start" },
	{ name: "paddingBlockEnd", cssProperty: "padding-block-end" },
	{ name: "paddingInline", cssProperty: "padding-inline" },
	{ name: "paddingInlineStart", cssProperty: "padding-inline-start" },
	{ name: "paddingInlineEnd", cssProperty: "padding-inline-end" },

	// Logical Properties - Size
	{ name: "inlineSize", cssProperty: "inline-size" },
	{ name: "blockSize", cssProperty: "block-size" },
	{ name: "minInlineSize", cssProperty: "min-inline-size" },
	{ name: "minBlockSize", cssProperty: "min-block-size" },
	{ name: "maxInlineSize", cssProperty: "max-inline-size" },
	{ name: "maxBlockSize", cssProperty: "max-block-size" },

	// Logical Properties - Border
	{ name: "borderBlock", cssProperty: "border-block" },
	{ name: "borderBlockStart", cssProperty: "border-block-start" },
	{ name: "borderBlockEnd", cssProperty: "border-block-end" },
	{ name: "borderInline", cssProperty: "border-inline" },
	{ name: "borderInlineStart", cssProperty: "border-inline-start" },
	{ name: "borderInlineEnd", cssProperty: "border-inline-end" },
	{ name: "borderBlockWidth", cssProperty: "border-block-width" },
	{ name: "borderBlockStartWidth", cssProperty: "border-block-start-width" },
	{ name: "borderBlockEndWidth", cssProperty: "border-block-end-width" },
	{ name: "borderInlineWidth", cssProperty: "border-inline-width" },
	{ name: "borderInlineStartWidth", cssProperty: "border-inline-start-width" },
	{ name: "borderInlineEndWidth", cssProperty: "border-inline-end-width" },
	{ name: "borderBlockStyle", cssProperty: "border-block-style" },
	{ name: "borderBlockStartStyle", cssProperty: "border-block-start-style" },
	{ name: "borderBlockEndStyle", cssProperty: "border-block-end-style" },
	{ name: "borderInlineStyle", cssProperty: "border-inline-style" },
	{ name: "borderInlineStartStyle", cssProperty: "border-inline-start-style" },
	{ name: "borderInlineEndStyle", cssProperty: "border-inline-end-style" },
	{ name: "borderBlockColor", cssProperty: "border-block-color" },
	{ name: "borderBlockStartColor", cssProperty: "border-block-start-color" },
	{ name: "borderBlockEndColor", cssProperty: "border-block-end-color" },
	{ name: "borderInlineColor", cssProperty: "border-inline-color" },
	{ name: "borderInlineStartColor", cssProperty: "border-inline-start-color" },
	{ name: "borderInlineEndColor", cssProperty: "border-inline-end-color" },

	// Logical Properties - Border Radius
	{ name: "borderStartStartRadius", cssProperty: "border-start-start-radius" },
	{ name: "borderStartEndRadius", cssProperty: "border-start-end-radius" },
	{ name: "borderEndStartRadius", cssProperty: "border-end-start-radius" },
	{ name: "borderEndEndRadius", cssProperty: "border-end-end-radius" },

	// Scroll
	{ name: "scrollMargin", cssProperty: "scroll-margin" },
	{ name: "scrollMarginTop", cssProperty: "scroll-margin-top" },
	{ name: "scrollMarginRight", cssProperty: "scroll-margin-right" },
	{ name: "scrollMarginBottom", cssProperty: "scroll-margin-bottom" },
	{ name: "scrollMarginLeft", cssProperty: "scroll-margin-left" },
	{ name: "scrollPadding", cssProperty: "scroll-padding" },
	{ name: "scrollPaddingTop", cssProperty: "scroll-padding-top" },
	{ name: "scrollPaddingRight", cssProperty: "scroll-padding-right" },
	{ name: "scrollPaddingBottom", cssProperty: "scroll-padding-bottom" },
	{ name: "scrollPaddingLeft", cssProperty: "scroll-padding-left" },
	{ name: "overscrollBehavior", cssProperty: "overscroll-behavior" },
	{ name: "overscrollBehaviorX", cssProperty: "overscroll-behavior-x" },
	{ name: "overscrollBehaviorY", cssProperty: "overscroll-behavior-y" },

	// Caret
	{ name: "caretColor", cssProperty: "caret-color" },
	{ name: "caretShape", cssProperty: "caret-shape" },
	{ name: "caretAnimation", cssProperty: "caret-animation" },

	// Other
	{ name: "imageRendering", cssProperty: "image-rendering" },
	{ name: "colorScheme", cssProperty: "color-scheme" },
	{ name: "contentVisibility", cssProperty: "content-visibility" },
	{ name: "touchAction", cssProperty: "touch-action" },

	// Container Queries
	{ name: "containerType", cssProperty: "container-type" },
	{ name: "containerName", cssProperty: "container-name" },
	{ name: "container", cssProperty: "container" },

	// Font - Additional
	{ name: "fontFeatureSettings", cssProperty: "font-feature-settings" },
	{ name: "fontKerning", cssProperty: "font-kerning" },
	{ name: "fontSynthesis", cssProperty: "font-synthesis" },
	{ name: "fontOpticalSizing", cssProperty: "font-optical-sizing" },
	{ name: "fontDisplay", cssProperty: "font-display" },
	{ name: "fontVariantCaps", cssProperty: "font-variant-caps" },
	{ name: "fontVariantNumeric", cssProperty: "font-variant-numeric" },
	{ name: "fontVariantLigatures", cssProperty: "font-variant-ligatures" },
	{ name: "fontVariantEastAsian", cssProperty: "font-variant-east-asian" },
	{ name: "fontVariantAlternates", cssProperty: "font-variant-alternates" },
	{ name: "fontVariantPosition", cssProperty: "font-variant-position" },

	// Text - Additional
	{ name: "textRendering", cssProperty: "text-rendering" },
	{ name: "textCombineUpright", cssProperty: "text-combine-upright" },
	{ name: "textSizeAdjust", cssProperty: "text-size-adjust" },

	// Mask
	{ name: "mask", cssProperty: "mask" },
	{ name: "maskImage", cssProperty: "mask-image" },
	{ name: "maskMode", cssProperty: "mask-mode" },
	{ name: "maskRepeat", cssProperty: "mask-repeat" },
	{ name: "maskPosition", cssProperty: "mask-position" },
	{ name: "maskSize", cssProperty: "mask-size" },
	{ name: "maskOrigin", cssProperty: "mask-origin" },
	{ name: "maskClip", cssProperty: "mask-clip" },
	{ name: "maskComposite", cssProperty: "mask-composite" },

	// Clip
	{ name: "clipRule", cssProperty: "clip-rule" },

	// Grid - Additional
	{ name: "gridColumnGap", cssProperty: "grid-column-gap" },
	{ name: "gridRowGap", cssProperty: "grid-row-gap" },
	{ name: "gridGap", cssProperty: "grid-gap" },
] as const;

// Special methods that have custom logic beyond simple property setting
export const SPECIAL_METHODS = [
	"bold",      // Sets font-weight: bold
	"center",    // Sets justify-content: center and align-items: center
	"flex",      // Can set display: flex OR flex property depending on argument
] as const;
