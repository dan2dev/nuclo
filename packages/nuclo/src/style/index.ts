// Re-export everything from the modularized files
export { StyleBuilder } from "./styleBuilder";
export { createStyleQueries, createBreakpoints } from "./styleQueries";
export { createCSSClass } from "./cssGenerator";

// Re-export all style utility functions from styleBuilder
export {
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
} from "./styleBuilder";
