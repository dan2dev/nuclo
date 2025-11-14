export { initializeRuntime } from "./core/runtimeBootstrap";
export { registerGlobalTagBuilders, HTML_TAGS, SVG_TAGS, SELF_CLOSING_TAGS } from "./core/tagRegistry";
export { createElementFactory, createTagBuilder } from "./core/elementFactory";
export { applyNodeModifier } from "./core/modifierProcessor";
export { list } from "./list";
export { when } from "./when";
export { update } from "./core/updateController";
export { applyAttributes } from "./core/attributeManager";
export { appendChildren, createComment, createConditionalComment, replaceNodeSafely } from "./utility/dom";
export { on } from "./utility/on";
export { render } from "./utility/render";
export { isBoolean, isFunction, isNode, isObject, isPrimitive, isTagLike, isZeroArityFunction } from "./utility/typeGuards";
export { isBrowser } from "./utility/environment";
export { createElementWithModifiers } from "./internal/applyModifiers";

// Style utilities - export all style functions
export {
	StyleBuilder,
	createCSSClass,
	createBreakpoints,
	// Display
	display, flex, grid,
	// Colors
	bg, color, accentColor,
	// Typography
	fontSize, fontWeight, fontFamily, lineHeight, letterSpacing,
	textAlign, textDecoration, bold, fontStyle, fontVariant,
	fontStretch, textTransform, textIndent, textOverflow, textShadow,
	whiteSpace, wordSpacing, wordWrap, overflowWrap, textAlignLast,
	textJustify, textDecorationLine, textDecorationColor, textDecorationStyle,
	textDecorationThickness, textUnderlineOffset, verticalAlign,
	// Layout
	position, padding, paddingTop, paddingRight, paddingBottom, paddingLeft,
	margin, marginTop, marginRight, marginBottom, marginLeft,
	width, height, minWidth, maxWidth, minHeight, maxHeight, boxSizing,
	// Positioning
	top, right, bottom, left, zIndex,
	// Flexbox
	flexDirection, alignItems, justifyContent, center, gap,
	flexWrap, flexGrow, flexShrink, flexBasis, alignSelf,
	alignContent, justifySelf, justifyItems,
	// Grid
	gridTemplateColumns, gridTemplateRows, gridTemplateAreas,
	gridColumn, gridRow, gridColumnStart, gridColumnEnd,
	gridRowStart, gridRowEnd, gridArea, gridAutoColumns,
	gridAutoRows, gridAutoFlow,
	// Borders
	border, borderTop, borderRight, borderBottom, borderLeft,
	borderWidth, borderStyle, borderColor, borderTopWidth,
	borderRightWidth, borderBottomWidth, borderLeftWidth,
	borderTopStyle, borderRightStyle, borderBottomStyle, borderLeftStyle,
	borderTopColor, borderRightColor, borderBottomColor, borderLeftColor,
	borderRadius, borderTopLeftRadius, borderTopRightRadius,
	borderBottomLeftRadius, borderBottomRightRadius,
	// Outline
	outline, outlineWidth, outlineStyle, outlineColor, outlineOffset,
	// Background
	backgroundColor, backgroundImage, backgroundRepeat, backgroundPosition,
	backgroundSize, backgroundAttachment, backgroundClip, backgroundOrigin,
	// Effects
	boxShadow, opacity, transition, transitionProperty,
	transitionDuration, transitionTimingFunction, transitionDelay,
	// Transform
	transform, transformOrigin, transformStyle, perspective,
	perspectiveOrigin, backfaceVisibility,
	// Animation
	animation, animationName, animationDuration, animationTimingFunction,
	animationDelay, animationIterationCount, animationDirection,
	animationFillMode, animationPlayState,
	// Filter
	filter, backdropFilter,
	// Overflow
	overflow, overflowX, overflowY,
	// Visibility
	visibility,
	// Object fit/position
	objectFit, objectPosition,
	// List
	listStyle, listStyleType, listStylePosition, listStyleImage,
	// Table
	borderCollapse, borderSpacing, captionSide, emptyCells, tableLayout,
	// Content
	content, quotes, counterReset, counterIncrement,
	// User interface
	appearance, userSelect, pointerEvents, resize, scrollBehavior,
	// Clip
	clip, clipPath,
	// Isolation
	isolation,
	// Mix blend mode
	mixBlendMode,
	// Will change
	willChange,
	// Contain
	contain,
	// Page break
	pageBreakBefore, pageBreakAfter, pageBreakInside,
	// Break
	breakBefore, breakAfter, breakInside,
	// Orphans and widows
	orphans, widows,
	// Column
	columnCount, columnFill, columnGap, columnRule,
	columnRuleColor, columnRuleStyle, columnRuleWidth,
	columnSpan, columnWidth, columns,
	// Interaction
	cursor,
} from "./style";

// Auto-initialize when the module is loaded.
import "./core/runtimeBootstrap";
