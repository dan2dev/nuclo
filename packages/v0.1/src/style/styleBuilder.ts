import { STYLE_PROPERTIES, SPECIAL_METHODS, type StylePropertyDefinition } from "./styleProperties";
import { generateStyleKey, simpleHash, getCachedClassName, setCachedClassName } from "./styleCache";
import { createCSSClassWithStyles, classExistsInDOM } from "./cssGenerator";
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
	CSSAspectRatioValue,
	FloatValue,
	ClearValue,
	WritingModeValue,
	DirectionValue,
	UnicodeBidiValue,
	TextOrientationValue,
	HyphensValue,
	LineBreakValue,
	WordBreakValue,
	TouchActionValue,
	OverscrollBehaviorValue,
	ImageRenderingValue,
	ColorSchemeValue,
	CaretColorValue,
	CaretShapeValue,
	BackgroundBlendModeValue,
	ContentVisibilityValue,
	ContainerTypeValue,
	FontKerningValue,
	FontSynthesisValue,
	FontOpticalSizingValue,
	FontDisplayValue,
	FontVariantCapsValue,
	TextRenderingValue,
	TextCombineUprightValue,
	MaskCompositeValue,
	ClipRuleValue,
} from "./cssPropertyTypes";

// Get or create a class name for a set of CSS properties
function getOrCreateClassName(styles: Record<string, string>, prefix = '', mediaQuery?: string): string {
	const styleKey = generateStyleKey(styles);
	const cacheKey = prefix ? `${prefix}:${styleKey}` : styleKey;

	const cached = getCachedClassName(cacheKey);
	if (cached) {
		const cachedClassName = cached;
		// Verify the class exists in the DOM, recreate if not (handles test isolation)
		if (!classExistsInDOM(cachedClassName, mediaQuery)) {
			createCSSClassWithStyles(cachedClassName, styles, mediaQuery);
		}
		return cachedClassName;
	}

	// Generate a hash-based class name from the style key
	const hash = simpleHash(styleKey);
	const className = prefix ? `n${prefix}-${hash}` : `n${hash}`;
	setCachedClassName(cacheKey, className);

	// Create the CSS class with media query if provided
	createCSSClassWithStyles(className, styles, mediaQuery);

	return className;
}

// Utility class builder for chaining CSS properties
export class StyleBuilder {
	private styles: Record<string, string> = {};

	// Get the accumulated styles
	getStyles(): Record<string, string> {
		return { ...this.styles };
	}

	// Get class name for the current styles
	getClassName(prefix = '', mediaQuery?: string): string {
		return getOrCreateClassName(this.styles, prefix, mediaQuery);
	}

	// Get class names as space-separated string (for backward compatibility)
	getClassNames(): string[] {
		return [this.getClassName()];
	}

	// Get class definitions (for backward compatibility)
	getClassDefinitions(): Array<{ className: string; property: string; value: string }> {
		return Object.entries(this.styles).map(([property, value]) => ({
			className: this.getClassName(),
			property,
			value
		}));
	}

	// Get class names as space-separated string
	toString(): string {
		return this.getClassName();
	}

	// Add a custom style
	add(property: string, value: string): this {
		this.styles[property] = value;
		return this;
	}

	// Special methods with custom logic
	bold(): this {
		this.styles["font-weight"] = "bold";
		return this;
	}

	center(): this {
		this.styles["justify-content"] = "center";
		this.styles["align-items"] = "center";
		return this;
	}

	flex(value?: string): this {
		if (value !== undefined) {
			this.styles["flex"] = value;
		} else {
			this.styles["display"] = "flex";
		}
		return this;
	}
}

// TypeScript interface declaration merging - adds types for dynamically generated methods
export interface StyleBuilder {
	display(value: DisplayValue): this;
	grid(): this;
	bg(color: CSSColorValue): this;
	color(colorValue: CSSColorValue): this;
	accentColor(value: CSSColorValue): this;
	fontSize(size: CSSLengthValue): this;
	fontWeight(value: FontWeightValue): this;
	fontFamily(value: CSSFontFamilyValue): this;
	lineHeight(value: CSSLengthValue | "normal" | number): this;
	letterSpacing(value: CSSLengthValue | "normal"): this;
	textAlign(value: TextAlignValue): this;
	textDecoration(value: TextDecorationValue): this;
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
	top(value: CSSLengthValue | "auto"): this;
	right(value: CSSLengthValue | "auto"): this;
	bottom(value: CSSLengthValue | "auto"): this;
	left(value: CSSLengthValue | "auto"): this;
	zIndex(value: number | "auto"): this;
	flexDirection(value: FlexDirectionValue): this;
	alignItems(value: AlignItemsValue): this;
	justifyContent(value: JustifyContentValue): this;
	gap(value: CSSLengthValue): this;
	flexWrap(value: FlexWrapValue): this;
	flexGrow(value: number | string): this;
	flexShrink(value: number | string): this;
	flexBasis(value: CSSLengthValue | "auto" | "content" | "fit-content"): this;
	alignSelf(value: AlignSelfValue): this;
	alignContent(value: AlignContentValue): this;
	justifySelf(value: JustifySelfValue): this;
	justifyItems(value: JustifyItemsValue): this;
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
	outline(value: string): this;
	outlineWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
	outlineStyle(value: OutlineStyleValue): this;
	outlineColor(value: CSSColorValue): this;
	outlineOffset(value: CSSLengthValue): this;
	backgroundColor(value: CSSColorValue): this;
	backgroundImage(value: CSSBackgroundImageValue | "none"): this;
	backgroundRepeat(value: BackgroundRepeatValue): this;
	backgroundPosition(value: string): this;
	backgroundSize(value: CSSLengthValue | "auto" | "cover" | "contain"): this;
	backgroundAttachment(value: BackgroundAttachmentValue): this;
	backgroundClip(value: BackgroundClipValue): this;
	backgroundOrigin(value: BackgroundOriginValue): this;
	boxShadow(value: string | "none"): this;
	opacity(value: number | string): this;
	transition(value: string): this;
	transitionProperty(value: string | "none" | "all"): this;
	transitionDuration(value: string | number): this;
	transitionTimingFunction(value: CSSTimingFunctionValue): this;
	transitionDelay(value: string | number): this;
	transform(value: CSSTransformValue | "none"): this;
	transformOrigin(value: string): this;
	transformStyle(value: TransformStyleValue): this;
	perspective(value: CSSLengthValue | "none"): this;
	perspectiveOrigin(value: string): this;
	backfaceVisibility(value: BackfaceVisibilityValue): this;
	animation(value: string): this;
	animationName(value: CSSAnimationNameValue): this;
	animationDuration(value: string | number): this;
	animationTimingFunction(value: CSSTimingFunctionValue): this;
	animationDelay(value: string | number): this;
	animationIterationCount(value: number | "infinite" | string): this;
	animationDirection(value: AnimationDirectionValue): this;
	animationFillMode(value: AnimationFillModeValue): this;
	animationPlayState(value: AnimationPlayStateValue): this;
	filter(value: CSSFilterValue | "none"): this;
	backdropFilter(value: CSSFilterValue | "none"): this;
	overflow(value: OverflowValue): this;
	overflowX(value: OverflowValue): this;
	overflowY(value: OverflowValue): this;
	visibility(value: VisibilityValue): this;
	objectFit(value: ObjectFitValue): this;
	objectPosition(value: string): this;
	listStyle(value: string): this;
	listStyleType(value: ListStyleTypeValue): this;
	listStylePosition(value: ListStylePositionValue): this;
	listStyleImage(value: CSSBackgroundImageValue | "none"): this;
	borderCollapse(value: BorderCollapseValue): this;
	borderSpacing(value: CSSLengthValue): this;
	captionSide(value: CaptionSideValue): this;
	emptyCells(value: EmptyCellsValue): this;
	tableLayout(value: TableLayoutValue): this;
	content(value: CSSContentValue | "normal" | "none"): this;
	quotes(value: string | "none"): this;
	counterReset(value: string | "none"): this;
	counterIncrement(value: string | "none"): this;
	appearance(value: AppearanceValue): this;
	userSelect(value: UserSelectValue): this;
	pointerEvents(value: PointerEventsValue): this;
	resize(value: ResizeValue): this;
	scrollBehavior(value: ScrollBehaviorValue): this;
	clip(value: string | "auto"): this;
	clipPath(value: string | "none"): this;
	isolation(value: IsolationValue): this;
	mixBlendMode(value: MixBlendModeValue): this;
	willChange(value: string | "auto"): this;
	contain(value: ContainValue): this;
	pageBreakBefore(value: PageBreakValue): this;
	pageBreakAfter(value: PageBreakValue): this;
	pageBreakInside(value: PageBreakValue): this;
	breakBefore(value: BreakValue): this;
	breakAfter(value: BreakValue): this;
	breakInside(value: BreakValue): this;
	orphans(value: number | string): this;
	widows(value: number | string): this;
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
	cursor(value: CursorValue): this;

	// Layout - Additional
	aspectRatio(value: CSSAspectRatioValue): this;
	clear(value: ClearValue): this;
	float(value: FloatValue): this;
	order(value: number | string): this;

	// Flexbox - Place properties
	placeContent(value: string): this;
	placeItems(value: string): this;
	placeSelf(value: string): this;

	// Text - Additional
	hyphens(value: HyphensValue): this;
	lineBreak(value: LineBreakValue): this;
	wordBreak(value: WordBreakValue): this;
	textOrientation(value: TextOrientationValue): this;
	writingMode(value: WritingModeValue): this;
	direction(value: DirectionValue): this;
	unicodeBidi(value: UnicodeBidiValue): this;

	// Background - Additional
	backgroundBlendMode(value: BackgroundBlendModeValue): this;
	backgroundPositionX(value: string): this;
	backgroundPositionY(value: string): this;

	// Border Image
	borderImage(value: string): this;
	borderImageSource(value: CSSBackgroundImageValue | "none"): this;
	borderImageSlice(value: string | number): this;
	borderImageWidth(value: CSSLengthValue | number): this;
	borderImageOutset(value: CSSLengthValue | number): this;
	borderImageRepeat(value: BackgroundRepeatValue): this;

	// Logical Properties - Inset
	inset(value: CSSLengthValue | "auto"): this;
	insetBlock(value: CSSLengthValue): this;
	insetBlockStart(value: CSSLengthValue | "auto"): this;
	insetBlockEnd(value: CSSLengthValue | "auto"): this;
	insetInline(value: CSSLengthValue): this;
	insetInlineStart(value: CSSLengthValue | "auto"): this;
	insetInlineEnd(value: CSSLengthValue | "auto"): this;

	// Logical Properties - Margin
	marginBlock(value: CSSLengthValue | "auto"): this;
	marginBlockStart(value: CSSLengthValue | "auto"): this;
	marginBlockEnd(value: CSSLengthValue | "auto"): this;
	marginInline(value: CSSLengthValue | "auto"): this;
	marginInlineStart(value: CSSLengthValue | "auto"): this;
	marginInlineEnd(value: CSSLengthValue | "auto"): this;

	// Logical Properties - Padding
	paddingBlock(value: CSSLengthValue): this;
	paddingBlockStart(value: CSSLengthValue): this;
	paddingBlockEnd(value: CSSLengthValue): this;
	paddingInline(value: CSSLengthValue): this;
	paddingInlineStart(value: CSSLengthValue): this;
	paddingInlineEnd(value: CSSLengthValue): this;

	// Logical Properties - Size
	inlineSize(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): this;
	blockSize(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): this;
	minInlineSize(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): this;
	minBlockSize(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content"): this;
	maxInlineSize(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content" | "none"): this;
	maxBlockSize(value: CSSLengthValue | "auto" | "fit-content" | "max-content" | "min-content" | "none"): this;

	// Logical Properties - Border
	borderBlock(value: string): this;
	borderBlockStart(value: string): this;
	borderBlockEnd(value: string): this;
	borderInline(value: string): this;
	borderInlineStart(value: string): this;
	borderInlineEnd(value: string): this;
	borderBlockWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
	borderBlockStartWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
	borderBlockEndWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
	borderInlineWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
	borderInlineStartWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
	borderInlineEndWidth(value: CSSLengthValue | "thin" | "medium" | "thick"): this;
	borderBlockStyle(value: BorderStyleValue): this;
	borderBlockStartStyle(value: BorderStyleValue): this;
	borderBlockEndStyle(value: BorderStyleValue): this;
	borderInlineStyle(value: BorderStyleValue): this;
	borderInlineStartStyle(value: BorderStyleValue): this;
	borderInlineEndStyle(value: BorderStyleValue): this;
	borderBlockColor(value: CSSColorValue): this;
	borderBlockStartColor(value: CSSColorValue): this;
	borderBlockEndColor(value: CSSColorValue): this;
	borderInlineColor(value: CSSColorValue): this;
	borderInlineStartColor(value: CSSColorValue): this;
	borderInlineEndColor(value: CSSColorValue): this;

	// Logical Properties - Border Radius
	borderStartStartRadius(value: CSSLengthValue): this;
	borderStartEndRadius(value: CSSLengthValue): this;
	borderEndStartRadius(value: CSSLengthValue): this;
	borderEndEndRadius(value: CSSLengthValue): this;

	// Scroll
	scrollMargin(value: CSSLengthValue): this;
	scrollMarginTop(value: CSSLengthValue): this;
	scrollMarginRight(value: CSSLengthValue): this;
	scrollMarginBottom(value: CSSLengthValue): this;
	scrollMarginLeft(value: CSSLengthValue): this;
	scrollPadding(value: CSSLengthValue): this;
	scrollPaddingTop(value: CSSLengthValue): this;
	scrollPaddingRight(value: CSSLengthValue): this;
	scrollPaddingBottom(value: CSSLengthValue): this;
	scrollPaddingLeft(value: CSSLengthValue): this;
	overscrollBehavior(value: OverscrollBehaviorValue): this;
	overscrollBehaviorX(value: OverscrollBehaviorValue): this;
	overscrollBehaviorY(value: OverscrollBehaviorValue): this;

	// Caret
	caretColor(value: CaretColorValue): this;
	caretShape(value: CaretShapeValue): this;
	caretAnimation(value: string): this;

	// Other
	imageRendering(value: ImageRenderingValue): this;
	colorScheme(value: ColorSchemeValue): this;
	contentVisibility(value: ContentVisibilityValue): this;
	touchAction(value: TouchActionValue): this;

	// Container Queries
	containerType(value: ContainerTypeValue): this;
	containerName(value: string): this;
	container(value: string): this;

	// Font - Additional
	fontFeatureSettings(value: string): this;
	fontKerning(value: FontKerningValue): this;
	fontSynthesis(value: FontSynthesisValue): this;
	fontOpticalSizing(value: FontOpticalSizingValue): this;
	fontDisplay(value: FontDisplayValue): this;
	fontVariantCaps(value: FontVariantCapsValue): this;
	fontVariantNumeric(value: string): this;
	fontVariantLigatures(value: string): this;
	fontVariantEastAsian(value: string): this;
	fontVariantAlternates(value: string): this;
	fontVariantPosition(value: string): this;

	// Text - Additional
	textRendering(value: TextRenderingValue): this;
	textCombineUpright(value: TextCombineUprightValue): this;
	textSizeAdjust(value: string | "auto" | "none" | `${number}%`): this;

	// Mask
	mask(value: string): this;
	maskImage(value: CSSBackgroundImageValue | "none"): this;
	maskMode(value: string): this;
	maskRepeat(value: BackgroundRepeatValue): this;
	maskPosition(value: string): this;
	maskSize(value: CSSLengthValue | "auto" | "cover" | "contain"): this;
	maskOrigin(value: BackgroundOriginValue): this;
	maskClip(value: BackgroundClipValue): this;
	maskComposite(value: MaskCompositeValue): this;

	// Clip
	clipRule(value: ClipRuleValue): this;

	// Grid - Additional
	gridColumnGap(value: CSSLengthValue): this;
	gridRowGap(value: CSSLengthValue): this;
	gridGap(value: CSSLengthValue): this;
}

// Dynamically add methods to StyleBuilder prototype
function registerStyleMethods(): void {
	const proto = StyleBuilder.prototype as unknown as Record<string, unknown>;

	for (const prop of STYLE_PROPERTIES) {
		// Skip if method already exists (e.g., special methods)
		if (prop.name in proto) continue;

		if (prop.isShorthand) {
			// Shorthand methods that use default values
			proto[prop.name] = function(this: StyleBuilder) {
				this.add(prop.cssProperty, prop.defaultValue || "");
				return this;
			};
		} else {
			// Regular methods that take a value
			proto[prop.name] = function(this: StyleBuilder, value: string) {
				this.add(prop.cssProperty, value);
				return this;
			};
		}
	}
}

// Register all methods on StyleBuilder
registerStyleMethods();

// Dynamically create and export utility functions
function createStyleFunction(prop: StylePropertyDefinition): (value?: string) => StyleBuilder {
	if (prop.isShorthand) {
		return () => new StyleBuilder().add(prop.cssProperty, prop.defaultValue || "");
	} else {
		return (value?: string) => new StyleBuilder().add(prop.cssProperty, value || "");
	}
}

// Create export object dynamically
const styleExports: Record<string, ((value?: string) => StyleBuilder)> = {};

// Add regular properties
for (const prop of STYLE_PROPERTIES) {
	styleExports[prop.name] = createStyleFunction(prop);
}

// Add special methods
for (const method of SPECIAL_METHODS) {
	if (method === "bold" || method === "center") {
		styleExports[method] = () => new StyleBuilder()[method]();
	} else if (method === "flex") {
		styleExports[method] = (value?: string) => new StyleBuilder().flex(value);
	}
}

// Export all style functions
export const {
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
	// Layout - Additional
	aspectRatio, clear, float, order,
	// Flexbox - Place properties
	placeContent, placeItems, placeSelf,
	// Text - Additional
	hyphens, lineBreak, wordBreak, textOrientation, writingMode, direction, unicodeBidi,
	// Background - Additional
	backgroundBlendMode, backgroundPositionX, backgroundPositionY,
	// Border Image
	borderImage, borderImageSource, borderImageSlice, borderImageWidth, borderImageOutset, borderImageRepeat,
	// Logical Properties - Inset
	inset, insetBlock, insetBlockStart, insetBlockEnd, insetInline, insetInlineStart, insetInlineEnd,
	// Logical Properties - Margin
	marginBlock, marginBlockStart, marginBlockEnd, marginInline, marginInlineStart, marginInlineEnd,
	// Logical Properties - Padding
	paddingBlock, paddingBlockStart, paddingBlockEnd, paddingInline, paddingInlineStart, paddingInlineEnd,
	// Logical Properties - Size
	inlineSize, blockSize, minInlineSize, minBlockSize, maxInlineSize, maxBlockSize,
	// Logical Properties - Border
	borderBlock, borderBlockStart, borderBlockEnd, borderInline, borderInlineStart, borderInlineEnd,
	borderBlockWidth, borderBlockStartWidth, borderBlockEndWidth, borderInlineWidth, borderInlineStartWidth, borderInlineEndWidth,
	borderBlockStyle, borderBlockStartStyle, borderBlockEndStyle, borderInlineStyle, borderInlineStartStyle, borderInlineEndStyle,
	borderBlockColor, borderBlockStartColor, borderBlockEndColor, borderInlineColor, borderInlineStartColor, borderInlineEndColor,
	// Logical Properties - Border Radius
	borderStartStartRadius, borderStartEndRadius, borderEndStartRadius, borderEndEndRadius,
	// Scroll
	scrollMargin, scrollMarginTop, scrollMarginRight, scrollMarginBottom, scrollMarginLeft,
	scrollPadding, scrollPaddingTop, scrollPaddingRight, scrollPaddingBottom, scrollPaddingLeft,
	overscrollBehavior, overscrollBehaviorX, overscrollBehaviorY,
	// Caret
	caretColor, caretShape, caretAnimation,
	// Other
	imageRendering, colorScheme, contentVisibility, touchAction,
	// Container Queries
	containerType, containerName, container,
	// Font - Additional
	fontFeatureSettings, fontKerning, fontSynthesis, fontOpticalSizing, fontDisplay,
	fontVariantCaps, fontVariantNumeric, fontVariantLigatures, fontVariantEastAsian,
	fontVariantAlternates, fontVariantPosition,
	// Text - Additional
	textRendering, textCombineUpright, textSizeAdjust,
	// Mask
	mask, maskImage, maskMode, maskRepeat, maskPosition, maskSize, maskOrigin, maskClip, maskComposite,
	// Clip
	clipRule,
	// Grid - Additional
	gridColumnGap, gridRowGap, gridGap,
} = styleExports as Record<string, (value?: string) => StyleBuilder>;
