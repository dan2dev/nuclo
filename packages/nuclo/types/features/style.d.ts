// Style utility functions type definitions

import type {
	DisplayValue,
	PositionValue,
	TextAlignValue,
	FontWeightValue,
	FontStyleValue,
	TextTransformValue,
	TextDecorationValue,
	TextDecorationStyleValue,
	TextDecorationLineValue,
	WhiteSpaceValue,
	OverflowValue,
	VisibilityValue,
	FlexDirectionValue,
	FlexWrapValue,
	AlignItemsValue,
	JustifyContentValue,
	AlignSelfValue,
	AlignContentValue,
	JustifySelfValue,
	JustifyItemsValue,
	GridAutoFlowValue,
	BorderStyleValue,
	OutlineStyleValue,
	BoxSizingValue,
	ObjectFitValue,
	VerticalAlignValue,
	TextAlignLastValue,
	TextJustifyValue,
	TextOverflowValue,
	WordWrapValue,
	OverflowWrapValue,
	BackgroundRepeatValue,
	BackgroundAttachmentValue,
	BackgroundClipValue,
	BackgroundOriginValue,
	TransformStyleValue,
	BackfaceVisibilityValue,
	AnimationDirectionValue,
	AnimationFillModeValue,
	AnimationPlayStateValue,
	ListStyleTypeValue,
	ListStylePositionValue,
	BorderCollapseValue,
	CaptionSideValue,
	EmptyCellsValue,
	TableLayoutValue,
	AppearanceValue,
	UserSelectValue,
	PointerEventsValue,
	ResizeValue,
	ScrollBehaviorValue,
	IsolationValue,
	MixBlendModeValue,
	ContainValue,
	PageBreakValue,
	BreakValue,
	ColumnFillValue,
	ColumnRuleStyleValue,
	ColumnSpanValue,
	CursorValue,
	CSSLengthValue,
	CSSColorValue,
	CSSFontFamilyValue,
	CSSTimingFunctionValue,
	CSSTransformValue,
	CSSFilterValue,
	CSSBackgroundImageValue,
	CSSAnimationNameValue,
	CSSContentValue,
} from "../../src/style/cssPropertyTypes";

/**
 * Creates a CSS class with the given styles and injects it into the document
 */
declare global {
	function createCSSClass(className: string, styles: Record<string, string>): void;

	/**
	 * Creates a style query class name generator for responsive and conditional styles.
	 * Supports @media, @container, @supports queries.
	 *
	 * Query values should include the at-rule prefix:
	 * - "@media (min-width: 768px)" for media queries
	 * - "@container (min-width: 400px)" for container queries
	 * - "@supports (display: grid)" for feature queries
	 *
	 * For backward compatibility, values without a prefix are treated as media queries.
	 *
	 * Supports two signatures:
	 * 1. cn(queryStyles) - Only query-specific styles
	 * 2. cn(defaultStyles, queryStyles) - Default styles + query overrides
	 */
	function createStyleQueries<T extends string>(
		queries: Record<T, string>
	): {
		(styles?: Partial<Record<T, StyleBuilder>>): { className: string } | string;
		(defaultStyles: StyleBuilder, queryStyles?: Partial<Record<T, StyleBuilder>>): { className: string } | string;
	};

	/**
	 * @deprecated Use createStyleQueries instead. Alias for backward compatibility.
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
		display(value: DisplayValue): this;
		flex(value?: CSSLengthValue | "auto" | "initial" | "none" | "1" | "0"): this;
		grid(): this;

		// Colors
		bg(color: CSSColorValue): this;
		color(color: CSSColorValue): this;
		accentColor(value: CSSColorValue): this;

		// Typography
		fontSize(size: CSSLengthValue): this;
		fontWeight(value: FontWeightValue): this;
		fontFamily(value: CSSFontFamilyValue): this;
		lineHeight(value: CSSLengthValue | "normal" | number): this;
		letterSpacing(value: CSSLengthValue | "normal"): this;
		textAlign(value: TextAlignValue): this;
		textDecoration(value: TextDecorationValue): this;
		bold(): this;
		fontStyle(value: FontStyleValue): this;
		fontVariant(value: string): this;
		fontStretch(value: string): this;
		textTransform(value: TextTransformValue): this;
		textIndent(value: CSSLengthValue): this;
		textOverflow(value: TextOverflowValue): this;
		textShadow(value: string): this;
		whiteSpace(value: WhiteSpaceValue): this;
		wordSpacing(value: CSSLengthValue | "normal"): this;
		wordWrap(value: WordWrapValue): this;
		overflowWrap(value: OverflowWrapValue): this;
		textAlignLast(value: TextAlignLastValue): this;
		textJustify(value: TextJustifyValue): this;
		textDecorationLine(value: TextDecorationLineValue): this;
		textDecorationColor(value: CSSColorValue): this;
		textDecorationStyle(value: TextDecorationStyleValue): this;
		textDecorationThickness(value: CSSLengthValue | "auto" | "from-font"): this;
		textUnderlineOffset(value: CSSLengthValue | "auto"): this;
		verticalAlign(value: VerticalAlignValue): this;

		// Layout
		position(value: PositionValue): this;
		padding(value: CSSLengthValue): this;
		paddingTop(value: CSSLengthValue): this;
		paddingRight(value: CSSLengthValue): this;
		paddingBottom(value: CSSLengthValue): this;
		paddingLeft(value: CSSLengthValue): this;
		margin(value: CSSLengthValue | "auto"): this;
		marginTop(value: CSSLengthValue | "auto"): this;
		marginRight(value: CSSLengthValue | "auto"): this;
		marginBottom(value: CSSLengthValue | "auto"): this;
		marginLeft(value: CSSLengthValue | "auto"): this;
		width(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): this;
		height(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): this;
		minWidth(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): this;
		maxWidth(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content" | "none"): this;
		minHeight(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): this;
		maxHeight(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content" | "none"): this;
		boxSizing(value: BoxSizingValue): this;

		// Positioning
		top(value: CSSLengthValue | "auto"): this;
		right(value: CSSLengthValue | "auto"): this;
		bottom(value: CSSLengthValue | "auto"): this;
		left(value: CSSLengthValue | "auto"): this;
		zIndex(value: number | "auto"): this;

		// Flexbox
		flexDirection(value: FlexDirectionValue): this;
		alignItems(value: AlignItemsValue): this;
		justifyContent(value: JustifyContentValue): this;
		center(): this;
		gap(value: CSSLengthValue): this;
		flexWrap(value: FlexWrapValue): this;
		flexGrow(value: number | string): this;
		flexShrink(value: number | string): this;
		flexBasis(value: CSSLengthValue | "auto" | "content" | "fit-content"): this;
		alignSelf(value: AlignSelfValue): this;
		alignContent(value: AlignContentValue): this;
		justifySelf(value: JustifySelfValue): this;
		justifyItems(value: JustifyItemsValue): this;

		// Grid
		gridTemplateColumns(value: string): this;
		gridTemplateRows(value: string): this;
		gridTemplateAreas(value: string): this;
		gridColumn(value: string): this;
		gridRow(value: string): this;
		gridColumnStart(value: string | number | "auto"): this;
		gridColumnEnd(value: string | number | "auto"): this;
		gridRowStart(value: string | number | "auto"): this;
		gridRowEnd(value: string | number | "auto"): this;
		gridArea(value: string): this;
		gridAutoColumns(value: CSSLengthValue): this;
		gridAutoRows(value: CSSLengthValue): this;
		gridAutoFlow(value: GridAutoFlowValue): this;

		// Borders
		border(value: string): this;
		borderTop(value: string): this;
		borderRight(value: string): this;
		borderBottom(value: string): this;
		borderLeft(value: string): this;
		borderWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
		borderStyle(value: BorderStyleValue): this;
		borderColor(value: CSSColorValue): this;
		borderTopWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
		borderRightWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
		borderBottomWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
		borderLeftWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
		borderTopStyle(value: BorderStyleValue): this;
		borderRightStyle(value: BorderStyleValue): this;
		borderBottomStyle(value: BorderStyleValue): this;
		borderLeftStyle(value: BorderStyleValue): this;
		borderTopColor(value: CSSColorValue): this;
		borderRightColor(value: CSSColorValue): this;
		borderBottomColor(value: CSSColorValue): this;
		borderLeftColor(value: CSSColorValue): this;
		borderRadius(value: CSSLengthValue): this;
		borderTopLeftRadius(value: CSSLengthValue): this;
		borderTopRightRadius(value: CSSLengthValue): this;
		borderBottomLeftRadius(value: CSSLengthValue): this;
		borderBottomRightRadius(value: CSSLengthValue): this;

		// Outline
		outline(value: string): this;
		outlineWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
		outlineStyle(value: OutlineStyleValue): this;
		outlineColor(value: CSSColorValue): this;
		outlineOffset(value: CSSLengthValue): this;

		// Background
		backgroundColor(value: CSSColorValue): this;
		backgroundImage(value: CSSBackgroundImageValue | "none"): this;
		backgroundRepeat(value: BackgroundRepeatValue): this;
		backgroundPosition(value: string): this;
		backgroundSize(value: CSSLengthValue | "auto" | "cover" | "contain"): this;
		backgroundAttachment(value: BackgroundAttachmentValue): this;
		backgroundClip(value: BackgroundClipValue): this;
		backgroundOrigin(value: BackgroundOriginValue): this;

		// Effects
		boxShadow(value: string | "none"): this;
		opacity(value: number | string): this;
		transition(value: string): this;
		transitionProperty(value: string | "none" | "all"): this;
		transitionDuration(value: string | number): this;
		transitionTimingFunction(value: CSSTimingFunctionValue): this;
		transitionDelay(value: string | number): this;

		// Transform
		transform(value: CSSTransformValue | "none"): this;
		transformOrigin(value: string): this;
		transformStyle(value: TransformStyleValue): this;
		perspective(value: CSSLengthValue | "none"): this;
		perspectiveOrigin(value: string): this;
		backfaceVisibility(value: BackfaceVisibilityValue): this;

		// Animation
		animation(value: string): this;
		animationName(value: CSSAnimationNameValue): this;
		animationDuration(value: string | number): this;
		animationTimingFunction(value: CSSTimingFunctionValue): this;
		animationDelay(value: string | number): this;
		animationIterationCount(value: number | "infinite" | string): this;
		animationDirection(value: AnimationDirectionValue): this;
		animationFillMode(value: AnimationFillModeValue): this;
		animationPlayState(value: AnimationPlayStateValue): this;

		// Filter
		filter(value: CSSFilterValue | "none"): this;
		backdropFilter(value: CSSFilterValue | "none"): this;

		// Overflow
		overflow(value: OverflowValue): this;
		overflowX(value: OverflowValue): this;
		overflowY(value: OverflowValue): this;

		// Visibility
		visibility(value: VisibilityValue): this;

		// Object fit/position
		objectFit(value: ObjectFitValue): this;
		objectPosition(value: string): this;

		// List
		listStyle(value: string): this;
		listStyleType(value: ListStyleTypeValue): this;
		listStylePosition(value: ListStylePositionValue): this;
		listStyleImage(value: CSSBackgroundImageValue | "none"): this;

		// Table
		borderCollapse(value: BorderCollapseValue): this;
		borderSpacing(value: CSSLengthValue): this;
		captionSide(value: CaptionSideValue): this;
		emptyCells(value: EmptyCellsValue): this;
		tableLayout(value: TableLayoutValue): this;

		// Content
		content(value: CSSContentValue | "normal" | "none"): this;
		quotes(value: string | "none"): this;
		counterReset(value: string | "none"): this;
		counterIncrement(value: string | "none"): this;

		// User interface
		appearance(value: AppearanceValue): this;
		userSelect(value: UserSelectValue): this;
		pointerEvents(value: PointerEventsValue): this;
		resize(value: ResizeValue): this;
		scrollBehavior(value: ScrollBehaviorValue): this;

		// Clip
		clip(value: string | "auto"): this;
		clipPath(value: string | "none"): this;

		// Isolation
		isolation(value: IsolationValue): this;

		// Mix blend mode
		mixBlendMode(value: MixBlendModeValue): this;

		// Will change
		willChange(value: string | "auto"): this;

		// Contain
		contain(value: ContainValue): this;

		// Page break
		pageBreakBefore(value: PageBreakValue): this;
		pageBreakAfter(value: PageBreakValue): this;
		pageBreakInside(value: PageBreakValue): this;

		// Break
		breakBefore(value: BreakValue): this;
		breakAfter(value: BreakValue): this;
		breakInside(value: BreakValue): this;

		// Orphans and widows
		orphans(value: number | string): this;
		widows(value: number | string): this;

		// Column
		columnCount(value: number | "auto" | string): this;
		columnFill(value: ColumnFillValue): this;
		columnGap(value: CSSLengthValue | "normal"): this;
		columnRule(value: string): this;
		columnRuleColor(value: CSSColorValue): this;
		columnRuleStyle(value: ColumnRuleStyleValue): this;
		columnRuleWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
		columnSpan(value: ColumnSpanValue): this;
		columnWidth(value: CSSLengthValue | "auto"): this;
		columns(value: string): this;

		// Interaction
		cursor(value: CursorValue): this;
	}

	// Utility functions available globally (like HTML tags)
	// Display
	function display(value: DisplayValue): StyleBuilder;
	function flex(value?: CSSLengthValue | "auto" | "initial" | "none" | "1" | "0"): StyleBuilder;
	function grid(): StyleBuilder;

	// Colors
	function bg(color: CSSColorValue): StyleBuilder;
	function color(colorValue: CSSColorValue): StyleBuilder;
	function accentColor(value: CSSColorValue): StyleBuilder;

	// Typography
	function fontSize(size: CSSLengthValue): StyleBuilder;
	function fontWeight(value: FontWeightValue): StyleBuilder;
	function fontFamily(value: CSSFontFamilyValue): StyleBuilder;
	function lineHeight(value: CSSLengthValue | "normal" | number): StyleBuilder;
	function letterSpacing(value: CSSLengthValue | "normal"): StyleBuilder;
	function textAlign(value: TextAlignValue): StyleBuilder;
	function textDecoration(value: TextDecorationValue): StyleBuilder;
	function bold(): StyleBuilder;
	function fontStyle(value: FontStyleValue): StyleBuilder;
	function fontVariant(value: string): StyleBuilder;
	function fontStretch(value: string): StyleBuilder;
	function textTransform(value: TextTransformValue): StyleBuilder;
	function textIndent(value: CSSLengthValue): StyleBuilder;
	function textOverflow(value: TextOverflowValue): StyleBuilder;
	function textShadow(value: string): StyleBuilder;
	function whiteSpace(value: WhiteSpaceValue): StyleBuilder;
	function wordSpacing(value: CSSLengthValue | "normal"): StyleBuilder;
	function wordWrap(value: WordWrapValue): StyleBuilder;
	function overflowWrap(value: OverflowWrapValue): StyleBuilder;
	function textAlignLast(value: TextAlignLastValue): StyleBuilder;
	function textJustify(value: TextJustifyValue): StyleBuilder;
	function textDecorationLine(value: TextDecorationLineValue): StyleBuilder;
	function textDecorationColor(value: CSSColorValue): StyleBuilder;
	function textDecorationStyle(value: TextDecorationStyleValue): StyleBuilder;
	function textDecorationThickness(value: CSSLengthValue | "auto" | "from-font"): StyleBuilder;
	function textUnderlineOffset(value: CSSLengthValue | "auto"): StyleBuilder;
	function verticalAlign(value: VerticalAlignValue): StyleBuilder;

	// Layout
	function position(value: PositionValue): StyleBuilder;
	function padding(value: CSSLengthValue): StyleBuilder;
	function paddingTop(value: CSSLengthValue): StyleBuilder;
	function paddingRight(value: CSSLengthValue): StyleBuilder;
	function paddingBottom(value: CSSLengthValue): StyleBuilder;
	function paddingLeft(value: CSSLengthValue): StyleBuilder;
	function margin(value: CSSLengthValue | "auto"): StyleBuilder;
	function marginTop(value: CSSLengthValue | "auto"): StyleBuilder;
	function marginRight(value: CSSLengthValue | "auto"): StyleBuilder;
	function marginBottom(value: CSSLengthValue | "auto"): StyleBuilder;
	function marginLeft(value: CSSLengthValue | "auto"): StyleBuilder;
	function width(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): StyleBuilder;
	function height(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): StyleBuilder;
	function minWidth(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): StyleBuilder;
	function maxWidth(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content" | "none"): StyleBuilder;
	function minHeight(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): StyleBuilder;
	function maxHeight(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content" | "none"): StyleBuilder;
	function boxSizing(value: BoxSizingValue): StyleBuilder;

	// Positioning (Note: top conflicts with window.top and is skipped at runtime)
	// function top(value: CSSLengthValue | "auto"): StyleBuilder; // Use module import: import { top } from "nuclo"
	function right(value: CSSLengthValue | "auto"): StyleBuilder;
	function bottom(value: CSSLengthValue | "auto"): StyleBuilder;
	function left(value: CSSLengthValue | "auto"): StyleBuilder;
	function zIndex(value: number | "auto"): StyleBuilder;

	// Flexbox
	function flexDirection(value: FlexDirectionValue): StyleBuilder;
	function alignItems(value: AlignItemsValue): StyleBuilder;
	function justifyContent(value: JustifyContentValue): StyleBuilder;
	function center(): StyleBuilder;
	function gap(value: CSSLengthValue): StyleBuilder;
	function flexWrap(value: FlexWrapValue): StyleBuilder;
	function flexGrow(value: number | string): StyleBuilder;
	function flexShrink(value: number | string): StyleBuilder;
	function flexBasis(value: CSSLengthValue | "auto" | "content" | "fit-content"): StyleBuilder;
	function alignSelf(value: AlignSelfValue): StyleBuilder;
	function alignContent(value: AlignContentValue): StyleBuilder;
	function justifySelf(value: JustifySelfValue): StyleBuilder;
	function justifyItems(value: JustifyItemsValue): StyleBuilder;

	// Grid
	function gridTemplateColumns(value: string): StyleBuilder;
	function gridTemplateRows(value: string): StyleBuilder;
	function gridTemplateAreas(value: string): StyleBuilder;
	function gridColumn(value: string): StyleBuilder;
	function gridRow(value: string): StyleBuilder;
	function gridColumnStart(value: string | number | "auto"): StyleBuilder;
	function gridColumnEnd(value: string | number | "auto"): StyleBuilder;
	function gridRowStart(value: string | number | "auto"): StyleBuilder;
	function gridRowEnd(value: string | number | "auto"): StyleBuilder;
	function gridArea(value: string): StyleBuilder;
	function gridAutoColumns(value: CSSLengthValue): StyleBuilder;
	function gridAutoRows(value: CSSLengthValue): StyleBuilder;
	function gridAutoFlow(value: GridAutoFlowValue): StyleBuilder;

	// Borders
	function border(value: string): StyleBuilder;
	function borderTop(value: string): StyleBuilder;
	function borderRight(value: string): StyleBuilder;
	function borderBottom(value: string): StyleBuilder;
	function borderLeft(value: string): StyleBuilder;
	function borderWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): StyleBuilder;
	function borderStyle(value: BorderStyleValue): StyleBuilder;
	function borderColor(value: CSSColorValue): StyleBuilder;
	function borderTopWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): StyleBuilder;
	function borderRightWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): StyleBuilder;
	function borderBottomWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): StyleBuilder;
	function borderLeftWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): StyleBuilder;
	function borderTopStyle(value: BorderStyleValue): StyleBuilder;
	function borderRightStyle(value: BorderStyleValue): StyleBuilder;
	function borderBottomStyle(value: BorderStyleValue): StyleBuilder;
	function borderLeftStyle(value: BorderStyleValue): StyleBuilder;
	function borderTopColor(value: CSSColorValue): StyleBuilder;
	function borderRightColor(value: CSSColorValue): StyleBuilder;
	function borderBottomColor(value: CSSColorValue): StyleBuilder;
	function borderLeftColor(value: CSSColorValue): StyleBuilder;
	function borderRadius(value: CSSLengthValue): StyleBuilder;
	function borderTopLeftRadius(value: CSSLengthValue): StyleBuilder;
	function borderTopRightRadius(value: CSSLengthValue): StyleBuilder;
	function borderBottomLeftRadius(value: CSSLengthValue): StyleBuilder;
	function borderBottomRightRadius(value: CSSLengthValue): StyleBuilder;

	// Outline
	function outline(value: string): StyleBuilder;
	function outlineWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): StyleBuilder;
	function outlineStyle(value: OutlineStyleValue): StyleBuilder;
	function outlineColor(value: CSSColorValue): StyleBuilder;
	function outlineOffset(value: CSSLengthValue): StyleBuilder;

	// Background
	function backgroundColor(value: CSSColorValue): StyleBuilder;
	function backgroundImage(value: CSSBackgroundImageValue | "none"): StyleBuilder;
	function backgroundRepeat(value: BackgroundRepeatValue): StyleBuilder;
	function backgroundPosition(value: string): StyleBuilder;
	function backgroundSize(value: CSSLengthValue | "auto" | "cover" | "contain"): StyleBuilder;
	function backgroundAttachment(value: BackgroundAttachmentValue): StyleBuilder;
	function backgroundClip(value: BackgroundClipValue): StyleBuilder;
	function backgroundOrigin(value: BackgroundOriginValue): StyleBuilder;

	// Effects
	function boxShadow(value: string | "none"): StyleBuilder;
	function opacity(value: number | string): StyleBuilder;
	function transition(value: string): StyleBuilder;
	function transitionProperty(value: string | "none" | "all"): StyleBuilder;
	function transitionDuration(value: string | number): StyleBuilder;
	function transitionTimingFunction(value: CSSTimingFunctionValue): StyleBuilder;
	function transitionDelay(value: string | number): StyleBuilder;

	// Transform
	function transform(value: CSSTransformValue | "none"): StyleBuilder;
	function transformOrigin(value: string): StyleBuilder;
	function transformStyle(value: TransformStyleValue): StyleBuilder;
	function perspective(value: CSSLengthValue | "none"): StyleBuilder;
	function perspectiveOrigin(value: string): StyleBuilder;
	function backfaceVisibility(value: BackfaceVisibilityValue): StyleBuilder;

	// Animation
	function animation(value: string): StyleBuilder;
	function animationName(value: CSSAnimationNameValue): StyleBuilder;
	function animationDuration(value: string | number): StyleBuilder;
	function animationTimingFunction(value: CSSTimingFunctionValue): StyleBuilder;
	function animationDelay(value: string | number): StyleBuilder;
	function animationIterationCount(value: number | "infinite" | string): StyleBuilder;
	function animationDirection(value: AnimationDirectionValue): StyleBuilder;
	function animationFillMode(value: AnimationFillModeValue): StyleBuilder;
	function animationPlayState(value: AnimationPlayStateValue): StyleBuilder;

	// Filter (Note: conflicts with SVG filter element, use module import if needed)
	// function filter(value: CSSFilterValue | "none"): StyleBuilder; // Use: import { filter } from "nuclo"
	function backdropFilter(value: CSSFilterValue | "none"): StyleBuilder;

	// Overflow
	function overflow(value: OverflowValue): StyleBuilder;
	function overflowX(value: OverflowValue): StyleBuilder;
	function overflowY(value: OverflowValue): StyleBuilder;

	// Visibility
	function visibility(value: VisibilityValue): StyleBuilder;

	// Object fit/position
	function objectFit(value: ObjectFitValue): StyleBuilder;
	function objectPosition(value: string): StyleBuilder;

	// List
	function listStyle(value: string): StyleBuilder;
	function listStyleType(value: ListStyleTypeValue): StyleBuilder;
	function listStylePosition(value: ListStylePositionValue): StyleBuilder;
	function listStyleImage(value: CSSBackgroundImageValue | "none"): StyleBuilder;

	// Table
	function borderCollapse(value: BorderCollapseValue): StyleBuilder;
	function borderSpacing(value: CSSLengthValue): StyleBuilder;
	function captionSide(value: CaptionSideValue): StyleBuilder;
	function emptyCells(value: EmptyCellsValue): StyleBuilder;
	function tableLayout(value: TableLayoutValue): StyleBuilder;

	// Content
	function content(value: CSSContentValue | "normal" | "none"): StyleBuilder;
	function quotes(value: string | "none"): StyleBuilder;
	function counterReset(value: string | "none"): StyleBuilder;
	function counterIncrement(value: string | "none"): StyleBuilder;

	// User interface
	function appearance(value: AppearanceValue): StyleBuilder;
	function userSelect(value: UserSelectValue): StyleBuilder;
	function pointerEvents(value: PointerEventsValue): StyleBuilder;
	function resize(value: ResizeValue): StyleBuilder;
	function scrollBehavior(value: ScrollBehaviorValue): StyleBuilder;

	// Clip (Note: clipPath conflicts with SVG clipPath element, use module import if needed)
	function clip(value: string | "auto"): StyleBuilder;
	// function clipPath(value: string | "none"): StyleBuilder; // Use: import { clipPath } from "nuclo"

	// Isolation
	function isolation(value: IsolationValue): StyleBuilder;

	// Mix blend mode
	function mixBlendMode(value: MixBlendModeValue): StyleBuilder;

	// Will change
	function willChange(value: string | "auto"): StyleBuilder;

	// Contain
	function contain(value: ContainValue): StyleBuilder;

	// Page break
	function pageBreakBefore(value: PageBreakValue): StyleBuilder;
	function pageBreakAfter(value: PageBreakValue): StyleBuilder;
	function pageBreakInside(value: PageBreakValue): StyleBuilder;

	// Break
	function breakBefore(value: BreakValue): StyleBuilder;
	function breakAfter(value: BreakValue): StyleBuilder;
	function breakInside(value: BreakValue): StyleBuilder;

	// Orphans and widows
	function orphans(value: number | string): StyleBuilder;
	function widows(value: number | string): StyleBuilder;

	// Column
	function columnCount(value: number | "auto" | string): StyleBuilder;
	function columnFill(value: ColumnFillValue): StyleBuilder;
	function columnGap(value: CSSLengthValue | "normal"): StyleBuilder;
	function columnRule(value: string): StyleBuilder;
	function columnRuleColor(value: CSSColorValue): StyleBuilder;
	function columnRuleStyle(value: ColumnRuleStyleValue): StyleBuilder;
	function columnRuleWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): StyleBuilder;
	function columnSpan(value: ColumnSpanValue): StyleBuilder;
	function columnWidth(value: CSSLengthValue | "auto"): StyleBuilder;
	function columns(value: string): StyleBuilder;

	// Interaction
	function cursor(value: CursorValue): StyleBuilder;
}

// Export StyleBuilder class with all its methods (for module imports)
export class StyleBuilder {
	getStyles(): Record<string, string>;
	add(property: string, value: string): this;

	// Display
	display(value: DisplayValue): this;
	flex(value?: CSSLengthValue | "auto" | "initial" | "none" | "1" | "0"): this;
	grid(): this;

	// Colors
	bg(color: CSSColorValue): this;
	color(color: CSSColorValue): this;
	accentColor(value: CSSColorValue): this;

	// Typography
	fontSize(size: CSSLengthValue): this;
	fontWeight(value: FontWeightValue): this;
	fontFamily(value: CSSFontFamilyValue): this;
	lineHeight(value: CSSLengthValue | "normal" | number): this;
	letterSpacing(value: CSSLengthValue | "normal"): this;
	textAlign(value: TextAlignValue): this;
	textDecoration(value: TextDecorationValue): this;
	bold(): this;
	fontStyle(value: FontStyleValue): this;
	fontVariant(value: string): this;
	fontStretch(value: string): this;
	textTransform(value: TextTransformValue): this;
	textIndent(value: CSSLengthValue): this;
	textOverflow(value: TextOverflowValue): this;
	textShadow(value: string): this;
	whiteSpace(value: WhiteSpaceValue): this;
	wordSpacing(value: CSSLengthValue | "normal"): this;
	wordWrap(value: WordWrapValue): this;
	overflowWrap(value: OverflowWrapValue): this;
	textAlignLast(value: TextAlignLastValue): this;
	textJustify(value: TextJustifyValue): this;
	textDecorationLine(value: TextDecorationLineValue): this;
	textDecorationColor(value: CSSColorValue): this;
	textDecorationStyle(value: TextDecorationStyleValue): this;
	textDecorationThickness(value: CSSLengthValue | "auto" | "from-font"): this;
	textUnderlineOffset(value: CSSLengthValue | "auto"): this;
	verticalAlign(value: VerticalAlignValue): this;

	// Layout
	position(value: PositionValue): this;
	padding(value: CSSLengthValue): this;
	paddingTop(value: CSSLengthValue): this;
	paddingRight(value: CSSLengthValue): this;
	paddingBottom(value: CSSLengthValue): this;
	paddingLeft(value: CSSLengthValue): this;
	margin(value: CSSLengthValue | "auto"): this;
	marginTop(value: CSSLengthValue | "auto"): this;
	marginRight(value: CSSLengthValue | "auto"): this;
	marginBottom(value: CSSLengthValue | "auto"): this;
	marginLeft(value: CSSLengthValue | "auto"): this;
	width(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): this;
	height(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): this;
	minWidth(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): this;
	maxWidth(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content" | "none"): this;
	minHeight(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): this;
	maxHeight(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content" | "none"): this;
	boxSizing(value: BoxSizingValue): this;

	// Positioning
	top(value: CSSLengthValue | "auto"): this;
	right(value: CSSLengthValue | "auto"): this;
	bottom(value: CSSLengthValue | "auto"): this;
	left(value: CSSLengthValue | "auto"): this;
	zIndex(value: number | "auto"): this;

	// Flexbox
	flexDirection(value: FlexDirectionValue): this;
	alignItems(value: AlignItemsValue): this;
	justifyContent(value: JustifyContentValue): this;
	center(): this;
	gap(value: CSSLengthValue): this;
	flexWrap(value: FlexWrapValue): this;
	flexGrow(value: number | string): this;
	flexShrink(value: number | string): this;
	flexBasis(value: CSSLengthValue | "auto" | "content" | "fit-content"): this;
	alignSelf(value: AlignSelfValue): this;
	alignContent(value: AlignContentValue): this;
	justifySelf(value: JustifySelfValue): this;
	justifyItems(value: JustifyItemsValue): this;

	// Grid
	gridTemplateColumns(value: string): this;
	gridTemplateRows(value: string): this;
	gridTemplateAreas(value: string): this;
	gridColumn(value: string): this;
	gridRow(value: string): this;
	gridColumnStart(value: string | number | "auto"): this;
	gridColumnEnd(value: string | number | "auto"): this;
	gridRowStart(value: string | number | "auto"): this;
	gridRowEnd(value: string | number | "auto"): this;
	gridArea(value: string): this;
	gridAutoColumns(value: CSSLengthValue): this;
	gridAutoRows(value: CSSLengthValue): this;
	gridAutoFlow(value: GridAutoFlowValue): this;

	// Borders
	border(value: string): this;
	borderTop(value: string): this;
	borderRight(value: string): this;
	borderBottom(value: string): this;
	borderLeft(value: string): this;
	borderWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
	borderStyle(value: BorderStyleValue): this;
	borderColor(value: CSSColorValue): this;
	borderTopWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
	borderRightWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
	borderBottomWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
	borderLeftWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
	borderTopStyle(value: BorderStyleValue): this;
	borderRightStyle(value: BorderStyleValue): this;
	borderBottomStyle(value: BorderStyleValue): this;
	borderLeftStyle(value: BorderStyleValue): this;
	borderTopColor(value: CSSColorValue): this;
	borderRightColor(value: CSSColorValue): this;
	borderBottomColor(value: CSSColorValue): this;
	borderLeftColor(value: CSSColorValue): this;
	borderRadius(value: CSSLengthValue): this;
	borderTopLeftRadius(value: CSSLengthValue): this;
	borderTopRightRadius(value: CSSLengthValue): this;
	borderBottomLeftRadius(value: CSSLengthValue): this;
	borderBottomRightRadius(value: CSSLengthValue): this;

	// Outline
	outline(value: string): this;
	outlineWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
	outlineStyle(value: OutlineStyleValue): this;
	outlineColor(value: CSSColorValue): this;
	outlineOffset(value: CSSLengthValue): this;

	// Background
	backgroundColor(value: CSSColorValue): this;
	backgroundImage(value: CSSBackgroundImageValue | "none"): this;
	backgroundRepeat(value: BackgroundRepeatValue): this;
	backgroundPosition(value: string): this;
	backgroundSize(value: CSSLengthValue | "auto" | "cover" | "contain"): this;
	backgroundAttachment(value: BackgroundAttachmentValue): this;
	backgroundClip(value: BackgroundClipValue): this;
	backgroundOrigin(value: BackgroundOriginValue): this;

	// Effects
	boxShadow(value: string | "none"): this;
	opacity(value: number | string): this;
	transition(value: string): this;
	transitionProperty(value: string | "none" | "all"): this;
	transitionDuration(value: string | number): this;
	transitionTimingFunction(value: CSSTimingFunctionValue): this;
	transitionDelay(value: string | number): this;

	// Transform
	transform(value: CSSTransformValue | "none"): this;
	transformOrigin(value: string): this;
	transformStyle(value: TransformStyleValue): this;
	perspective(value: CSSLengthValue | "none"): this;
	perspectiveOrigin(value: string): this;
	backfaceVisibility(value: BackfaceVisibilityValue): this;

	// Animation
	animation(value: string): this;
	animationName(value: CSSAnimationNameValue): this;
	animationDuration(value: string | number): this;
	animationTimingFunction(value: CSSTimingFunctionValue): this;
	animationDelay(value: string | number): this;
	animationIterationCount(value: number | "infinite" | string): this;
	animationDirection(value: AnimationDirectionValue): this;
	animationFillMode(value: AnimationFillModeValue): this;
	animationPlayState(value: AnimationPlayStateValue): this;

	// Filter
	filter(value: CSSFilterValue | "none"): this;
	backdropFilter(value: CSSFilterValue | "none"): this;

	// Overflow
	overflow(value: OverflowValue): this;
	overflowX(value: OverflowValue): this;
	overflowY(value: OverflowValue): this;

	// Visibility
	visibility(value: VisibilityValue): this;

	// Object fit/position
	objectFit(value: ObjectFitValue): this;
	objectPosition(value: string): this;

	// List
	listStyle(value: string): this;
	listStyleType(value: ListStyleTypeValue): this;
	listStylePosition(value: ListStylePositionValue): this;
	listStyleImage(value: CSSBackgroundImageValue | "none"): this;

	// Table
	borderCollapse(value: BorderCollapseValue): this;
	borderSpacing(value: CSSLengthValue): this;
	captionSide(value: CaptionSideValue): this;
	emptyCells(value: EmptyCellsValue): this;
	tableLayout(value: TableLayoutValue): this;

	// Content
	content(value: CSSContentValue | "normal" | "none"): this;
	quotes(value: string | "none"): this;
	counterReset(value: string | "none"): this;
	counterIncrement(value: string | "none"): this;

	// User interface
	appearance(value: AppearanceValue): this;
	userSelect(value: UserSelectValue): this;
	pointerEvents(value: PointerEventsValue): this;
	resize(value: ResizeValue): this;
	scrollBehavior(value: ScrollBehaviorValue): this;

	// Clip
	clip(value: string | "auto"): this;
	clipPath(value: string | "none"): this;

	// Isolation
	isolation(value: IsolationValue): this;

	// Mix blend mode
	mixBlendMode(value: MixBlendModeValue): this;

	// Will change
	willChange(value: string | "auto"): this;

	// Contain
	contain(value: ContainValue): this;

	// Page break
	pageBreakBefore(value: PageBreakValue): this;
	pageBreakAfter(value: PageBreakValue): this;
	pageBreakInside(value: PageBreakValue): this;

	// Break
	breakBefore(value: BreakValue): this;
	breakAfter(value: BreakValue): this;
	breakInside(value: BreakValue): this;

	// Orphans and widows
	orphans(value: number | string): this;
	widows(value: number | string): this;

	// Column
	columnCount(value: number | "auto" | string): this;
	columnFill(value: ColumnFillValue): this;
	columnGap(value: CSSLengthValue | "normal"): this;
	columnRule(value: string): this;
	columnRuleColor(value: CSSColorValue): this;
	columnRuleStyle(value: ColumnRuleStyleValue): this;
	columnRuleWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
	columnSpan(value: ColumnSpanValue): this;
	columnWidth(value: CSSLengthValue | "auto"): this;
	columns(value: string): this;

	// Interaction
	cursor(value: CursorValue): this;
}

// Utility functions that return StyleBuilders - exported at module level
// Display
export function display(value: DisplayValue): StyleBuilder;
export function flex(value?: CSSLengthValue | "auto" | "initial" | "none" | "1" | "0"): StyleBuilder;
export function grid(): StyleBuilder;

// Colors
export function bg(color: CSSColorValue): StyleBuilder;
export function color(colorValue: CSSColorValue): StyleBuilder;
export function accentColor(value: CSSColorValue): StyleBuilder;

// Typography
export function fontSize(size: CSSLengthValue): StyleBuilder;
export function fontWeight(value: FontWeightValue): StyleBuilder;
export function fontFamily(value: CSSFontFamilyValue): StyleBuilder;
export function lineHeight(value: CSSLengthValue | "normal" | number): StyleBuilder;
export function letterSpacing(value: CSSLengthValue | "normal"): StyleBuilder;
export function textAlign(value: TextAlignValue): StyleBuilder;
export function textDecoration(value: TextDecorationValue): StyleBuilder;
export function bold(): StyleBuilder;
export function fontStyle(value: FontStyleValue): StyleBuilder;
export function fontVariant(value: string): StyleBuilder;
export function fontStretch(value: string): StyleBuilder;
export function textTransform(value: TextTransformValue): StyleBuilder;
export function textIndent(value: CSSLengthValue): StyleBuilder;
export function textOverflow(value: TextOverflowValue): StyleBuilder;
export function textShadow(value: string): StyleBuilder;
export function whiteSpace(value: WhiteSpaceValue): StyleBuilder;
export function wordSpacing(value: CSSLengthValue | "normal"): StyleBuilder;
export function wordWrap(value: WordWrapValue): StyleBuilder;
export function overflowWrap(value: OverflowWrapValue): StyleBuilder;
export function textAlignLast(value: TextAlignLastValue): StyleBuilder;
export function textJustify(value: TextJustifyValue): StyleBuilder;
export function textDecorationLine(value: TextDecorationLineValue): StyleBuilder;
export function textDecorationColor(value: CSSColorValue): StyleBuilder;
export function textDecorationStyle(value: TextDecorationStyleValue): StyleBuilder;
export function textDecorationThickness(value: CSSLengthValue | "auto" | "from-font"): StyleBuilder;
export function textUnderlineOffset(value: CSSLengthValue | "auto"): StyleBuilder;
export function verticalAlign(value: VerticalAlignValue): StyleBuilder;

// Layout
export function position(value: PositionValue): StyleBuilder;
export function padding(value: CSSLengthValue): StyleBuilder;
export function paddingTop(value: CSSLengthValue): StyleBuilder;
export function paddingRight(value: CSSLengthValue): StyleBuilder;
export function paddingBottom(value: CSSLengthValue): StyleBuilder;
export function paddingLeft(value: CSSLengthValue): StyleBuilder;
export function margin(value: CSSLengthValue | "auto"): StyleBuilder;
export function marginTop(value: CSSLengthValue | "auto"): StyleBuilder;
export function marginRight(value: CSSLengthValue | "auto"): StyleBuilder;
export function marginBottom(value: CSSLengthValue | "auto"): StyleBuilder;
export function marginLeft(value: CSSLengthValue | "auto"): StyleBuilder;
export function width(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): StyleBuilder;
export function height(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): StyleBuilder;
export function minWidth(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): StyleBuilder;
export function maxWidth(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content" | "none"): StyleBuilder;
export function minHeight(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): StyleBuilder;
export function maxHeight(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content" | "none"): StyleBuilder;
export function boxSizing(value: BoxSizingValue): StyleBuilder;

// Positioning
export function top(value: CSSLengthValue | "auto"): StyleBuilder;
export function right(value: CSSLengthValue | "auto"): StyleBuilder;
export function bottom(value: CSSLengthValue | "auto"): StyleBuilder;
export function left(value: CSSLengthValue | "auto"): StyleBuilder;
export function zIndex(value: number | "auto"): StyleBuilder;

// Flexbox
export function flexDirection(value: FlexDirectionValue): StyleBuilder;
export function alignItems(value: AlignItemsValue): StyleBuilder;
export function justifyContent(value: JustifyContentValue): StyleBuilder;
export function center(): StyleBuilder;
export function gap(value: CSSLengthValue): StyleBuilder;
export function flexWrap(value: FlexWrapValue): StyleBuilder;
export function flexGrow(value: number | string): StyleBuilder;
export function flexShrink(value: number | string): StyleBuilder;
export function flexBasis(value: CSSLengthValue | "auto" | "content" | "fit-content"): StyleBuilder;
export function alignSelf(value: AlignSelfValue): StyleBuilder;
export function alignContent(value: AlignContentValue): StyleBuilder;
export function justifySelf(value: JustifySelfValue): StyleBuilder;
export function justifyItems(value: JustifyItemsValue): StyleBuilder;

// Grid
export function gridTemplateColumns(value: string): StyleBuilder;
export function gridTemplateRows(value: string): StyleBuilder;
export function gridTemplateAreas(value: string): StyleBuilder;
export function gridColumn(value: string): StyleBuilder;
export function gridRow(value: string): StyleBuilder;
export function gridColumnStart(value: string | number | "auto"): StyleBuilder;
export function gridColumnEnd(value: string | number | "auto"): StyleBuilder;
export function gridRowStart(value: string | number | "auto"): StyleBuilder;
export function gridRowEnd(value: string | number | "auto"): StyleBuilder;
export function gridArea(value: string): StyleBuilder;
export function gridAutoColumns(value: CSSLengthValue): StyleBuilder;
export function gridAutoRows(value: CSSLengthValue): StyleBuilder;
export function gridAutoFlow(value: GridAutoFlowValue): StyleBuilder;

// Borders
export function border(value: string): StyleBuilder;
export function borderTop(value: string): StyleBuilder;
export function borderRight(value: string): StyleBuilder;
export function borderBottom(value: string): StyleBuilder;
export function borderLeft(value: string): StyleBuilder;
export function borderWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): StyleBuilder;
export function borderStyle(value: BorderStyleValue): StyleBuilder;
export function borderColor(value: CSSColorValue): StyleBuilder;
export function borderTopWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): StyleBuilder;
export function borderRightWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): StyleBuilder;
export function borderBottomWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): StyleBuilder;
export function borderLeftWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): StyleBuilder;
export function borderTopStyle(value: BorderStyleValue): StyleBuilder;
export function borderRightStyle(value: BorderStyleValue): StyleBuilder;
export function borderBottomStyle(value: BorderStyleValue): StyleBuilder;
export function borderLeftStyle(value: BorderStyleValue): StyleBuilder;
export function borderTopColor(value: CSSColorValue): StyleBuilder;
export function borderRightColor(value: CSSColorValue): StyleBuilder;
export function borderBottomColor(value: CSSColorValue): StyleBuilder;
export function borderLeftColor(value: CSSColorValue): StyleBuilder;
export function borderRadius(value: CSSLengthValue): StyleBuilder;
export function borderTopLeftRadius(value: CSSLengthValue): StyleBuilder;
export function borderTopRightRadius(value: CSSLengthValue): StyleBuilder;
export function borderBottomLeftRadius(value: CSSLengthValue): StyleBuilder;
export function borderBottomRightRadius(value: CSSLengthValue): StyleBuilder;

// Outline
export function outline(value: string): StyleBuilder;
export function outlineWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): StyleBuilder;
export function outlineStyle(value: OutlineStyleValue): StyleBuilder;
export function outlineColor(value: CSSColorValue): StyleBuilder;
export function outlineOffset(value: CSSLengthValue): StyleBuilder;

// Background
export function backgroundColor(value: CSSColorValue): StyleBuilder;
export function backgroundImage(value: CSSBackgroundImageValue | "none"): StyleBuilder;
export function backgroundRepeat(value: BackgroundRepeatValue): StyleBuilder;
export function backgroundPosition(value: string): StyleBuilder;
export function backgroundSize(value: CSSLengthValue | "auto" | "cover" | "contain"): StyleBuilder;
export function backgroundAttachment(value: BackgroundAttachmentValue): StyleBuilder;
export function backgroundClip(value: BackgroundClipValue): StyleBuilder;
export function backgroundOrigin(value: BackgroundOriginValue): StyleBuilder;

// Effects
export function boxShadow(value: string | "none"): StyleBuilder;
export function opacity(value: number | string): StyleBuilder;
export function transition(value: string): StyleBuilder;
export function transitionProperty(value: string | "none" | "all"): StyleBuilder;
export function transitionDuration(value: string | number): StyleBuilder;
export function transitionTimingFunction(value: CSSTimingFunctionValue): StyleBuilder;
export function transitionDelay(value: string | number): StyleBuilder;

// Transform
export function transform(value: CSSTransformValue | "none"): StyleBuilder;
export function transformOrigin(value: string): StyleBuilder;
export function transformStyle(value: TransformStyleValue): StyleBuilder;
export function perspective(value: CSSLengthValue | "none"): StyleBuilder;
export function perspectiveOrigin(value: string): StyleBuilder;
export function backfaceVisibility(value: BackfaceVisibilityValue): StyleBuilder;

// Animation
export function animation(value: string): StyleBuilder;
export function animationName(value: CSSAnimationNameValue): StyleBuilder;
export function animationDuration(value: string | number): StyleBuilder;
export function animationTimingFunction(value: CSSTimingFunctionValue): StyleBuilder;
export function animationDelay(value: string | number): StyleBuilder;
export function animationIterationCount(value: number | "infinite" | string): StyleBuilder;
export function animationDirection(value: AnimationDirectionValue): StyleBuilder;
export function animationFillMode(value: AnimationFillModeValue): StyleBuilder;
export function animationPlayState(value: AnimationPlayStateValue): StyleBuilder;

// Filter
export function filter(value: CSSFilterValue | "none"): StyleBuilder;
export function backdropFilter(value: CSSFilterValue | "none"): StyleBuilder;

// Overflow
export function overflow(value: OverflowValue): StyleBuilder;
export function overflowX(value: OverflowValue): StyleBuilder;
export function overflowY(value: OverflowValue): StyleBuilder;

// Visibility
export function visibility(value: VisibilityValue): StyleBuilder;

// Object fit/position
export function objectFit(value: ObjectFitValue): StyleBuilder;
export function objectPosition(value: string): StyleBuilder;

// List
export function listStyle(value: string): StyleBuilder;
export function listStyleType(value: ListStyleTypeValue): StyleBuilder;
export function listStylePosition(value: ListStylePositionValue): StyleBuilder;
export function listStyleImage(value: CSSBackgroundImageValue | "none"): StyleBuilder;

// Table
export function borderCollapse(value: BorderCollapseValue): StyleBuilder;
export function borderSpacing(value: CSSLengthValue): StyleBuilder;
export function captionSide(value: CaptionSideValue): StyleBuilder;
export function emptyCells(value: EmptyCellsValue): StyleBuilder;
export function tableLayout(value: TableLayoutValue): StyleBuilder;

// Content
export function content(value: CSSContentValue | "normal" | "none"): StyleBuilder;
export function quotes(value: string | "none"): StyleBuilder;
export function counterReset(value: string | "none"): StyleBuilder;
export function counterIncrement(value: string | "none"): StyleBuilder;

// User interface
export function appearance(value: AppearanceValue): StyleBuilder;
export function userSelect(value: UserSelectValue): StyleBuilder;
export function pointerEvents(value: PointerEventsValue): StyleBuilder;
export function resize(value: ResizeValue): StyleBuilder;
export function scrollBehavior(value: ScrollBehaviorValue): StyleBuilder;

// Clip
export function clip(value: string | "auto"): StyleBuilder;
export function clipPath(value: string | "none"): StyleBuilder;

// Isolation
export function isolation(value: IsolationValue): StyleBuilder;

// Mix blend mode
export function mixBlendMode(value: MixBlendModeValue): StyleBuilder;

// Will change
export function willChange(value: string | "auto"): StyleBuilder;

// Contain
export function contain(value: ContainValue): StyleBuilder;

// Page break
export function pageBreakBefore(value: PageBreakValue): StyleBuilder;
export function pageBreakAfter(value: PageBreakValue): StyleBuilder;
export function pageBreakInside(value: PageBreakValue): StyleBuilder;

// Break
export function breakBefore(value: BreakValue): StyleBuilder;
export function breakAfter(value: BreakValue): StyleBuilder;
export function breakInside(value: BreakValue): StyleBuilder;

// Orphans and widows
export function orphans(value: number | string): StyleBuilder;
export function widows(value: number | string): StyleBuilder;

// Column
export function columnCount(value: number | "auto" | string): StyleBuilder;
export function columnFill(value: ColumnFillValue): StyleBuilder;
export function columnGap(value: CSSLengthValue | "normal"): StyleBuilder;
export function columnRule(value: string): StyleBuilder;
export function columnRuleColor(value: CSSColorValue): StyleBuilder;
export function columnRuleStyle(value: ColumnRuleStyleValue): StyleBuilder;
export function columnRuleWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): StyleBuilder;
export function columnSpan(value: ColumnSpanValue): StyleBuilder;
export function columnWidth(value: CSSLengthValue | "auto"): StyleBuilder;
export function columns(value: string): StyleBuilder;

// Interaction
export function cursor(value: CursorValue): StyleBuilder;

// Style queries / breakpoints
export function createStyleQueries<T extends string>(
	queries: Record<T, string>
): {
	(styles?: Partial<Record<T, StyleBuilder>>): { className: string } | string;
	(defaultStyles: StyleBuilder, queryStyles?: Partial<Record<T, StyleBuilder>>): { className: string } | string;
};

/**
 * @deprecated Use createStyleQueries instead. Alias for backward compatibility.
 */
export function createBreakpoints<T extends string>(
	breakpoints: Record<T, string>
): {
	(styles?: Partial<Record<T, StyleBuilder>>): { className: string } | string;
	(defaultStyles: StyleBuilder, breakpointStyles?: Partial<Record<T, StyleBuilder>>): { className: string } | string;
};

export function createCSSClass(className: string, styles: Record<string, string>): void;
