// Style utility functions type definitions

/**
 * Creates a CSS class with the given styles and injects it into the document
 */
declare global {
	function createCSSClass(className: string, styles: Record<string, string>): void;

	/**
	 * Creates a breakpoint-aware class name generator
	 * 
	 * Supports two signatures:
	 * 1. cn(breakpointStyles) - Only breakpoint-specific styles
	 * 2. cn(defaultStyles, breakpointStyles) - Default styles + breakpoint overrides
	 */
	function createBreakpoints<T extends string>(
		breakpoints: Record<T, string>
	): {
		(styles?: Partial<Record<T, StyleBuilder>>): { className: string } | string;
		(defaultStyles: StyleBuilder, breakpointStyles?: Partial<Record<T, StyleBuilder>>): { className: string } | string;
	};

	/**
	 * Style builder class for chaining CSS properties
	 */
	class StyleBuilder {
		getStyles(): Record<string, string>;
		add(property: string, value: string): this;

		// Display
		display(value: string): this;
		flex(value?: string): this;
		grid(): this;

		// Colors
		bg(color: string): this;
		color(color: string): this;
		accentColor(value: string): this;

		// Typography
		fontSize(size: string): this;
		fontWeight(value: string): this;
		fontFamily(value: string): this;
		lineHeight(value: string): this;
		letterSpacing(value: string): this;
		textAlign(value: string): this;
		textDecoration(value: string): this;
		bold(): this;
		fontStyle(value: string): this;
		fontVariant(value: string): this;
		fontStretch(value: string): this;
		textTransform(value: string): this;
		textIndent(value: string): this;
		textOverflow(value: string): this;
		textShadow(value: string): this;
		whiteSpace(value: string): this;
		wordSpacing(value: string): this;
		wordWrap(value: string): this;
		overflowWrap(value: string): this;
		textAlignLast(value: string): this;
		textJustify(value: string): this;
		textDecorationLine(value: string): this;
		textDecorationColor(value: string): this;
		textDecorationStyle(value: string): this;
		textDecorationThickness(value: string): this;
		textUnderlineOffset(value: string): this;
		verticalAlign(value: string): this;

		// Layout
		position(value: string): this;
		padding(value: string): this;
		paddingTop(value: string): this;
		paddingRight(value: string): this;
		paddingBottom(value: string): this;
		paddingLeft(value: string): this;
		margin(value: string): this;
		marginTop(value: string): this;
		marginRight(value: string): this;
		marginBottom(value: string): this;
		marginLeft(value: string): this;
		width(value: string): this;
		height(value: string): this;
		minWidth(value: string): this;
		maxWidth(value: string): this;
		minHeight(value: string): this;
		maxHeight(value: string): this;
		boxSizing(value: string): this;

		// Positioning
		top(value: string): this;
		right(value: string): this;
		bottom(value: string): this;
		left(value: string): this;
		zIndex(value: string): this;

		// Flexbox
		flexDirection(value: string): this;
		alignItems(value: string): this;
		justifyContent(value: string): this;
		center(): this;
		gap(value: string): this;
		flexWrap(value: string): this;
		flexGrow(value: string): this;
		flexShrink(value: string): this;
		flexBasis(value: string): this;
		alignSelf(value: string): this;
		alignContent(value: string): this;
		justifySelf(value: string): this;
		justifyItems(value: string): this;

		// Grid
		gridTemplateColumns(value: string): this;
		gridTemplateRows(value: string): this;
		gridTemplateAreas(value: string): this;
		gridColumn(value: string): this;
		gridRow(value: string): this;
		gridColumnStart(value: string): this;
		gridColumnEnd(value: string): this;
		gridRowStart(value: string): this;
		gridRowEnd(value: string): this;
		gridArea(value: string): this;
		gridAutoColumns(value: string): this;
		gridAutoRows(value: string): this;
		gridAutoFlow(value: string): this;

		// Borders
		border(value: string): this;
		borderTop(value: string): this;
		borderRight(value: string): this;
		borderBottom(value: string): this;
		borderLeft(value: string): this;
		borderWidth(value: string): this;
		borderStyle(value: string): this;
		borderColor(value: string): this;
		borderTopWidth(value: string): this;
		borderRightWidth(value: string): this;
		borderBottomWidth(value: string): this;
		borderLeftWidth(value: string): this;
		borderTopStyle(value: string): this;
		borderRightStyle(value: string): this;
		borderBottomStyle(value: string): this;
		borderLeftStyle(value: string): this;
		borderTopColor(value: string): this;
		borderRightColor(value: string): this;
		borderBottomColor(value: string): this;
		borderLeftColor(value: string): this;
		borderRadius(value: string): this;
		borderTopLeftRadius(value: string): this;
		borderTopRightRadius(value: string): this;
		borderBottomLeftRadius(value: string): this;
		borderBottomRightRadius(value: string): this;

		// Outline
		outline(value: string): this;
		outlineWidth(value: string): this;
		outlineStyle(value: string): this;
		outlineColor(value: string): this;
		outlineOffset(value: string): this;

		// Background
		backgroundColor(value: string): this;
		backgroundImage(value: string): this;
		backgroundRepeat(value: string): this;
		backgroundPosition(value: string): this;
		backgroundSize(value: string): this;
		backgroundAttachment(value: string): this;
		backgroundClip(value: string): this;
		backgroundOrigin(value: string): this;

		// Effects
		boxShadow(value: string): this;
		opacity(value: string): this;
		transition(value: string): this;
		transitionProperty(value: string): this;
		transitionDuration(value: string): this;
		transitionTimingFunction(value: string): this;
		transitionDelay(value: string): this;

		// Transform
		transform(value: string): this;
		transformOrigin(value: string): this;
		transformStyle(value: string): this;
		perspective(value: string): this;
		perspectiveOrigin(value: string): this;
		backfaceVisibility(value: string): this;

		// Animation
		animation(value: string): this;
		animationName(value: string): this;
		animationDuration(value: string): this;
		animationTimingFunction(value: string): this;
		animationDelay(value: string): this;
		animationIterationCount(value: string): this;
		animationDirection(value: string): this;
		animationFillMode(value: string): this;
		animationPlayState(value: string): this;

		// Filter
		filter(value: string): this;
		backdropFilter(value: string): this;

		// Overflow
		overflow(value: string): this;
		overflowX(value: string): this;
		overflowY(value: string): this;

		// Visibility
		visibility(value: string): this;

		// Object fit/position
		objectFit(value: string): this;
		objectPosition(value: string): this;

		// List
		listStyle(value: string): this;
		listStyleType(value: string): this;
		listStylePosition(value: string): this;
		listStyleImage(value: string): this;

		// Table
		borderCollapse(value: string): this;
		borderSpacing(value: string): this;
		captionSide(value: string): this;
		emptyCells(value: string): this;
		tableLayout(value: string): this;

		// Content
		content(value: string): this;
		quotes(value: string): this;
		counterReset(value: string): this;
		counterIncrement(value: string): this;

		// User interface
		appearance(value: string): this;
		userSelect(value: string): this;
		pointerEvents(value: string): this;
		resize(value: string): this;
		scrollBehavior(value: string): this;

		// Clip
		clip(value: string): this;
		clipPath(value: string): this;

		// Isolation
		isolation(value: string): this;

		// Mix blend mode
		mixBlendMode(value: string): this;

		// Will change
		willChange(value: string): this;

		// Contain
		contain(value: string): this;

		// Page break
		pageBreakBefore(value: string): this;
		pageBreakAfter(value: string): this;
		pageBreakInside(value: string): this;

		// Break
		breakBefore(value: string): this;
		breakAfter(value: string): this;
		breakInside(value: string): this;

		// Orphans and widows
		orphans(value: string): this;
		widows(value: string): this;

		// Column
		columnCount(value: string): this;
		columnFill(value: string): this;
		columnGap(value: string): this;
		columnRule(value: string): this;
		columnRuleColor(value: string): this;
		columnRuleStyle(value: string): this;
		columnRuleWidth(value: string): this;
		columnSpan(value: string): this;
		columnWidth(value: string): this;
		columns(value: string): this;

		// Interaction
		cursor(value: string): this;
	}
}

// Export StyleBuilder class with all its methods (for module imports)
export class StyleBuilder {
	getStyles(): Record<string, string>;
	add(property: string, value: string): this;

	// Display
	display(value: string): this;
	flex(value?: string): this;
	grid(): this;

	// Colors
	bg(color: string): this;
	color(color: string): this;
	accentColor(value: string): this;

	// Typography
	fontSize(size: string): this;
	fontWeight(value: string): this;
	fontFamily(value: string): this;
	lineHeight(value: string): this;
	letterSpacing(value: string): this;
	textAlign(value: string): this;
	textDecoration(value: string): this;
	bold(): this;
	fontStyle(value: string): this;
	fontVariant(value: string): this;
	fontStretch(value: string): this;
	textTransform(value: string): this;
	textIndent(value: string): this;
	textOverflow(value: string): this;
	textShadow(value: string): this;
	whiteSpace(value: string): this;
	wordSpacing(value: string): this;
	wordWrap(value: string): this;
	overflowWrap(value: string): this;
	textAlignLast(value: string): this;
	textJustify(value: string): this;
	textDecorationLine(value: string): this;
	textDecorationColor(value: string): this;
	textDecorationStyle(value: string): this;
	textDecorationThickness(value: string): this;
	textUnderlineOffset(value: string): this;
	verticalAlign(value: string): this;

	// Layout
	position(value: string): this;
	padding(value: string): this;
	paddingTop(value: string): this;
	paddingRight(value: string): this;
	paddingBottom(value: string): this;
	paddingLeft(value: string): this;
	margin(value: string): this;
	marginTop(value: string): this;
	marginRight(value: string): this;
	marginBottom(value: string): this;
	marginLeft(value: string): this;
	width(value: string): this;
	height(value: string): this;
	minWidth(value: string): this;
	maxWidth(value: string): this;
	minHeight(value: string): this;
	maxHeight(value: string): this;
	boxSizing(value: string): this;

	// Positioning
	top(value: string): this;
	right(value: string): this;
	bottom(value: string): this;
	left(value: string): this;
	zIndex(value: string): this;

	// Flexbox
	flexDirection(value: string): this;
	alignItems(value: string): this;
	justifyContent(value: string): this;
	center(): this;
	gap(value: string): this;
	flexWrap(value: string): this;
	flexGrow(value: string): this;
	flexShrink(value: string): this;
	flexBasis(value: string): this;
	alignSelf(value: string): this;
	alignContent(value: string): this;
	justifySelf(value: string): this;
	justifyItems(value: string): this;

	// Grid
	gridTemplateColumns(value: string): this;
	gridTemplateRows(value: string): this;
	gridTemplateAreas(value: string): this;
	gridColumn(value: string): this;
	gridRow(value: string): this;
	gridColumnStart(value: string): this;
	gridColumnEnd(value: string): this;
	gridRowStart(value: string): this;
	gridRowEnd(value: string): this;
	gridArea(value: string): this;
	gridAutoColumns(value: string): this;
	gridAutoRows(value: string): this;
	gridAutoFlow(value: string): this;

	// Borders
	border(value: string): this;
	borderTop(value: string): this;
	borderRight(value: string): this;
	borderBottom(value: string): this;
	borderLeft(value: string): this;
	borderWidth(value: string): this;
	borderStyle(value: string): this;
	borderColor(value: string): this;
	borderTopWidth(value: string): this;
	borderRightWidth(value: string): this;
	borderBottomWidth(value: string): this;
	borderLeftWidth(value: string): this;
	borderTopStyle(value: string): this;
	borderRightStyle(value: string): this;
	borderBottomStyle(value: string): this;
	borderLeftStyle(value: string): this;
	borderTopColor(value: string): this;
	borderRightColor(value: string): this;
	borderBottomColor(value: string): this;
	borderLeftColor(value: string): this;
	borderRadius(value: string): this;
	borderTopLeftRadius(value: string): this;
	borderTopRightRadius(value: string): this;
	borderBottomLeftRadius(value: string): this;
	borderBottomRightRadius(value: string): this;

	// Outline
	outline(value: string): this;
	outlineWidth(value: string): this;
	outlineStyle(value: string): this;
	outlineColor(value: string): this;
	outlineOffset(value: string): this;

	// Background
	backgroundColor(value: string): this;
	backgroundImage(value: string): this;
	backgroundRepeat(value: string): this;
	backgroundPosition(value: string): this;
	backgroundSize(value: string): this;
	backgroundAttachment(value: string): this;
	backgroundClip(value: string): this;
	backgroundOrigin(value: string): this;

	// Effects
	boxShadow(value: string): this;
	opacity(value: string): this;
	transition(value: string): this;
	transitionProperty(value: string): this;
	transitionDuration(value: string): this;
	transitionTimingFunction(value: string): this;
	transitionDelay(value: string): this;

	// Transform
	transform(value: string): this;
	transformOrigin(value: string): this;
	transformStyle(value: string): this;
	perspective(value: string): this;
	perspectiveOrigin(value: string): this;
	backfaceVisibility(value: string): this;

	// Animation
	animation(value: string): this;
	animationName(value: string): this;
	animationDuration(value: string): this;
	animationTimingFunction(value: string): this;
	animationDelay(value: string): this;
	animationIterationCount(value: string): this;
	animationDirection(value: string): this;
	animationFillMode(value: string): this;
	animationPlayState(value: string): this;

	// Filter
	filter(value: string): this;
	backdropFilter(value: string): this;

	// Overflow
	overflow(value: string): this;
	overflowX(value: string): this;
	overflowY(value: string): this;

	// Visibility
	visibility(value: string): this;

	// Object fit/position
	objectFit(value: string): this;
	objectPosition(value: string): this;

	// List
	listStyle(value: string): this;
	listStyleType(value: string): this;
	listStylePosition(value: string): this;
	listStyleImage(value: string): this;

	// Table
	borderCollapse(value: string): this;
	borderSpacing(value: string): this;
	captionSide(value: string): this;
	emptyCells(value: string): this;
	tableLayout(value: string): this;

	// Content
	content(value: string): this;
	quotes(value: string): this;
	counterReset(value: string): this;
	counterIncrement(value: string): this;

	// User interface
	appearance(value: string): this;
	userSelect(value: string): this;
	pointerEvents(value: string): this;
	resize(value: string): this;
	scrollBehavior(value: string): this;

	// Clip
	clip(value: string): this;
	clipPath(value: string): this;

	// Isolation
	isolation(value: string): this;

	// Mix blend mode
	mixBlendMode(value: string): this;

	// Will change
	willChange(value: string): this;

	// Contain
	contain(value: string): this;

	// Page break
	pageBreakBefore(value: string): this;
	pageBreakAfter(value: string): this;
	pageBreakInside(value: string): this;

	// Break
	breakBefore(value: string): this;
	breakAfter(value: string): this;
	breakInside(value: string): this;

	// Orphans and widows
	orphans(value: string): this;
	widows(value: string): this;

	// Column
	columnCount(value: string): this;
	columnFill(value: string): this;
	columnGap(value: string): this;
	columnRule(value: string): this;
	columnRuleColor(value: string): this;
	columnRuleStyle(value: string): this;
	columnRuleWidth(value: string): this;
	columnSpan(value: string): this;
	columnWidth(value: string): this;
	columns(value: string): this;

	// Interaction
	cursor(value: string): this;
}

// Utility functions that return StyleBuilders - exported at module level
// Display
export function display(value: string): StyleBuilder;
export function flex(value?: string): StyleBuilder;
export function grid(): StyleBuilder;

// Colors
export function bg(color: string): StyleBuilder;
export function color(colorValue: string): StyleBuilder;
export function accentColor(value: string): StyleBuilder;

// Typography
export function fontSize(size: string): StyleBuilder;
export function fontWeight(value: string): StyleBuilder;
export function fontFamily(value: string): StyleBuilder;
export function lineHeight(value: string): StyleBuilder;
export function letterSpacing(value: string): StyleBuilder;
export function textAlign(value: string): StyleBuilder;
export function textDecoration(value: string): StyleBuilder;
export function bold(): StyleBuilder;
export function fontStyle(value: string): StyleBuilder;
export function fontVariant(value: string): StyleBuilder;
export function fontStretch(value: string): StyleBuilder;
export function textTransform(value: string): StyleBuilder;
export function textIndent(value: string): StyleBuilder;
export function textOverflow(value: string): StyleBuilder;
export function textShadow(value: string): StyleBuilder;
export function whiteSpace(value: string): StyleBuilder;
export function wordSpacing(value: string): StyleBuilder;
export function wordWrap(value: string): StyleBuilder;
export function overflowWrap(value: string): StyleBuilder;
export function textAlignLast(value: string): StyleBuilder;
export function textJustify(value: string): StyleBuilder;
export function textDecorationLine(value: string): StyleBuilder;
export function textDecorationColor(value: string): StyleBuilder;
export function textDecorationStyle(value: string): StyleBuilder;
export function textDecorationThickness(value: string): StyleBuilder;
export function textUnderlineOffset(value: string): StyleBuilder;
export function verticalAlign(value: string): StyleBuilder;

// Layout
export function position(value: string): StyleBuilder;
export function padding(value: string): StyleBuilder;
export function paddingTop(value: string): StyleBuilder;
export function paddingRight(value: string): StyleBuilder;
export function paddingBottom(value: string): StyleBuilder;
export function paddingLeft(value: string): StyleBuilder;
export function margin(value: string): StyleBuilder;
export function marginTop(value: string): StyleBuilder;
export function marginRight(value: string): StyleBuilder;
export function marginBottom(value: string): StyleBuilder;
export function marginLeft(value: string): StyleBuilder;
export function width(value: string): StyleBuilder;
export function height(value: string): StyleBuilder;
export function minWidth(value: string): StyleBuilder;
export function maxWidth(value: string): StyleBuilder;
export function minHeight(value: string): StyleBuilder;
export function maxHeight(value: string): StyleBuilder;
export function boxSizing(value: string): StyleBuilder;

// Positioning
export function top(value: string): StyleBuilder;
export function right(value: string): StyleBuilder;
export function bottom(value: string): StyleBuilder;
export function left(value: string): StyleBuilder;
export function zIndex(value: string): StyleBuilder;

// Flexbox
export function flexDirection(value: string): StyleBuilder;
export function alignItems(value: string): StyleBuilder;
export function justifyContent(value: string): StyleBuilder;
export function center(): StyleBuilder;
export function gap(value: string): StyleBuilder;
export function flexWrap(value: string): StyleBuilder;
export function flexGrow(value: string): StyleBuilder;
export function flexShrink(value: string): StyleBuilder;
export function flexBasis(value: string): StyleBuilder;
export function alignSelf(value: string): StyleBuilder;
export function alignContent(value: string): StyleBuilder;
export function justifySelf(value: string): StyleBuilder;
export function justifyItems(value: string): StyleBuilder;

// Grid
export function gridTemplateColumns(value: string): StyleBuilder;
export function gridTemplateRows(value: string): StyleBuilder;
export function gridTemplateAreas(value: string): StyleBuilder;
export function gridColumn(value: string): StyleBuilder;
export function gridRow(value: string): StyleBuilder;
export function gridColumnStart(value: string): StyleBuilder;
export function gridColumnEnd(value: string): StyleBuilder;
export function gridRowStart(value: string): StyleBuilder;
export function gridRowEnd(value: string): StyleBuilder;
export function gridArea(value: string): StyleBuilder;
export function gridAutoColumns(value: string): StyleBuilder;
export function gridAutoRows(value: string): StyleBuilder;
export function gridAutoFlow(value: string): StyleBuilder;

// Borders
export function border(value: string): StyleBuilder;
export function borderTop(value: string): StyleBuilder;
export function borderRight(value: string): StyleBuilder;
export function borderBottom(value: string): StyleBuilder;
export function borderLeft(value: string): StyleBuilder;
export function borderWidth(value: string): StyleBuilder;
export function borderStyle(value: string): StyleBuilder;
export function borderColor(value: string): StyleBuilder;
export function borderTopWidth(value: string): StyleBuilder;
export function borderRightWidth(value: string): StyleBuilder;
export function borderBottomWidth(value: string): StyleBuilder;
export function borderLeftWidth(value: string): StyleBuilder;
export function borderTopStyle(value: string): StyleBuilder;
export function borderRightStyle(value: string): StyleBuilder;
export function borderBottomStyle(value: string): StyleBuilder;
export function borderLeftStyle(value: string): StyleBuilder;
export function borderTopColor(value: string): StyleBuilder;
export function borderRightColor(value: string): StyleBuilder;
export function borderBottomColor(value: string): StyleBuilder;
export function borderLeftColor(value: string): StyleBuilder;
export function borderRadius(value: string): StyleBuilder;
export function borderTopLeftRadius(value: string): StyleBuilder;
export function borderTopRightRadius(value: string): StyleBuilder;
export function borderBottomLeftRadius(value: string): StyleBuilder;
export function borderBottomRightRadius(value: string): StyleBuilder;

// Outline
export function outline(value: string): StyleBuilder;
export function outlineWidth(value: string): StyleBuilder;
export function outlineStyle(value: string): StyleBuilder;
export function outlineColor(value: string): StyleBuilder;
export function outlineOffset(value: string): StyleBuilder;

// Background
export function backgroundColor(value: string): StyleBuilder;
export function backgroundImage(value: string): StyleBuilder;
export function backgroundRepeat(value: string): StyleBuilder;
export function backgroundPosition(value: string): StyleBuilder;
export function backgroundSize(value: string): StyleBuilder;
export function backgroundAttachment(value: string): StyleBuilder;
export function backgroundClip(value: string): StyleBuilder;
export function backgroundOrigin(value: string): StyleBuilder;

// Effects
export function boxShadow(value: string): StyleBuilder;
export function opacity(value: string): StyleBuilder;
export function transition(value: string): StyleBuilder;
export function transitionProperty(value: string): StyleBuilder;
export function transitionDuration(value: string): StyleBuilder;
export function transitionTimingFunction(value: string): StyleBuilder;
export function transitionDelay(value: string): StyleBuilder;

// Transform
export function transform(value: string): StyleBuilder;
export function transformOrigin(value: string): StyleBuilder;
export function transformStyle(value: string): StyleBuilder;
export function perspective(value: string): StyleBuilder;
export function perspectiveOrigin(value: string): StyleBuilder;
export function backfaceVisibility(value: string): StyleBuilder;

// Animation
export function animation(value: string): StyleBuilder;
export function animationName(value: string): StyleBuilder;
export function animationDuration(value: string): StyleBuilder;
export function animationTimingFunction(value: string): StyleBuilder;
export function animationDelay(value: string): StyleBuilder;
export function animationIterationCount(value: string): StyleBuilder;
export function animationDirection(value: string): StyleBuilder;
export function animationFillMode(value: string): StyleBuilder;
export function animationPlayState(value: string): StyleBuilder;

// Filter
export function filter(value: string): StyleBuilder;
export function backdropFilter(value: string): StyleBuilder;

// Overflow
export function overflow(value: string): StyleBuilder;
export function overflowX(value: string): StyleBuilder;
export function overflowY(value: string): StyleBuilder;

// Visibility
export function visibility(value: string): StyleBuilder;

// Object fit/position
export function objectFit(value: string): StyleBuilder;
export function objectPosition(value: string): StyleBuilder;

// List
export function listStyle(value: string): StyleBuilder;
export function listStyleType(value: string): StyleBuilder;
export function listStylePosition(value: string): StyleBuilder;
export function listStyleImage(value: string): StyleBuilder;

// Table
export function borderCollapse(value: string): StyleBuilder;
export function borderSpacing(value: string): StyleBuilder;
export function captionSide(value: string): StyleBuilder;
export function emptyCells(value: string): StyleBuilder;
export function tableLayout(value: string): StyleBuilder;

// Content
export function content(value: string): StyleBuilder;
export function quotes(value: string): StyleBuilder;
export function counterReset(value: string): StyleBuilder;
export function counterIncrement(value: string): StyleBuilder;

// User interface
export function appearance(value: string): StyleBuilder;
export function userSelect(value: string): StyleBuilder;
export function pointerEvents(value: string): StyleBuilder;
export function resize(value: string): StyleBuilder;
export function scrollBehavior(value: string): StyleBuilder;

// Clip
export function clip(value: string): StyleBuilder;
export function clipPath(value: string): StyleBuilder;

// Isolation
export function isolation(value: string): StyleBuilder;

// Mix blend mode
export function mixBlendMode(value: string): StyleBuilder;

// Will change
export function willChange(value: string): StyleBuilder;

// Contain
export function contain(value: string): StyleBuilder;

// Page break
export function pageBreakBefore(value: string): StyleBuilder;
export function pageBreakAfter(value: string): StyleBuilder;
export function pageBreakInside(value: string): StyleBuilder;

// Break
export function breakBefore(value: string): StyleBuilder;
export function breakAfter(value: string): StyleBuilder;
export function breakInside(value: string): StyleBuilder;

// Orphans and widows
export function orphans(value: string): StyleBuilder;
export function widows(value: string): StyleBuilder;

// Column
export function columnCount(value: string): StyleBuilder;
export function columnFill(value: string): StyleBuilder;
export function columnGap(value: string): StyleBuilder;
export function columnRule(value: string): StyleBuilder;
export function columnRuleColor(value: string): StyleBuilder;
export function columnRuleStyle(value: string): StyleBuilder;
export function columnRuleWidth(value: string): StyleBuilder;
export function columnSpan(value: string): StyleBuilder;
export function columnWidth(value: string): StyleBuilder;
export function columns(value: string): StyleBuilder;

// Interaction
export function cursor(value: string): StyleBuilder;
