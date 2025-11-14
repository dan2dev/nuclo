import { STYLE_PROPERTIES, SPECIAL_METHODS, type StylePropertyDefinition } from "./styleProperties";

// Cache for generated classes: maps CSS property sets to class names
const styleCache = new Map<string, string>();

// Simple hash function to generate a short hash from a string (similar to MD5 but simpler)
function simpleHash(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	// Convert to positive hex string and take first 8 characters
	return Math.abs(hash).toString(16).padStart(8, '0').substring(0, 8);
}

// Generate a cache key from a set of CSS properties
function generateStyleKey(styles: Record<string, string>): string {
	const sortedEntries = Object.entries(styles)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([property, value]) => `${property}:${value}`)
		.join('|');
	return sortedEntries;
}

// Check if a class exists in the DOM
function classExistsInDOM(className: string, mediaQuery?: string): boolean {
	const styleSheet = document.querySelector("#nuclo-styles") as HTMLStyleElement;
	if (!styleSheet || !styleSheet.sheet) {
		return false;
	}

	if (mediaQuery) {
		const rules = Array.from(styleSheet.sheet.cssRules || []);
		const mediaRule = rules.find(rule => {
			if (rule instanceof CSSMediaRule) {
				return rule.media.mediaText === mediaQuery;
			}
			return false;
		}) as CSSMediaRule | undefined;

		if (!mediaRule) {
			return false;
		}

		return Array.from(mediaRule.cssRules).some(rule => {
			if (rule instanceof CSSStyleRule) {
				return rule.selectorText === `.${className}`;
			}
			return false;
		});
	} else {
		const rules = Array.from(styleSheet.sheet.cssRules || []);
		return rules.some(rule => {
			if (rule instanceof CSSStyleRule) {
				return rule.selectorText === `.${className}`;
			}
			return false;
		});
	}
}

// Get or create a class name for a set of CSS properties
function getOrCreateClassName(styles: Record<string, string>, prefix = '', mediaQuery?: string): string {
	const styleKey = generateStyleKey(styles);
	const cacheKey = prefix ? `${prefix}:${styleKey}` : styleKey;

	if (styleCache.has(cacheKey)) {
		const cachedClassName = styleCache.get(cacheKey)!;
		// Verify the class exists in the DOM, recreate if not (handles test isolation)
		if (!classExistsInDOM(cachedClassName, mediaQuery)) {
			createCSSClassWithStyles(cachedClassName, styles, mediaQuery);
		}
		return cachedClassName;
	}

	// Generate a hash-based class name from the style key
	const hash = simpleHash(styleKey);
	const className = prefix ? `n${prefix}-${hash}` : `n${hash}`;
	styleCache.set(cacheKey, className);

	// Create the CSS class with media query if provided
	createCSSClassWithStyles(className, styles, mediaQuery);

	return className;
}

// Create a CSS class with multiple styles
function createCSSClassWithStyles(
	className: string,
	styles: Record<string, string>,
	mediaQuery?: string
): void {
	let styleSheet = document.querySelector("#nuclo-styles") as HTMLStyleElement;

	if (!styleSheet) {
		styleSheet = document.createElement("style");
		styleSheet.id = "nuclo-styles";
		document.head.appendChild(styleSheet);
	}

	const rules = Object.entries(styles)
		.map(([property, value]) => `${property}: ${value}`)
		.join("; ");

	if (mediaQuery) {
		// Create or get media query rule
		const existingRules = Array.from(styleSheet.sheet?.cssRules || []);
		let mediaRule: CSSMediaRule | null = null;

		for (const rule of existingRules) {
			if (rule instanceof CSSMediaRule && rule.media.mediaText === mediaQuery) {
				mediaRule = rule;
				break;
			}
		}

		if (!mediaRule) {
			// Find the correct insertion index: after all style rules, append media queries in order
			// Since we process breakpoints in registration order, we can simply append
			// This ensures: style rules first, then media queries in the order they're processed
			let insertIndex = existingRules.length;

			// Find the last media query rule to insert after it (maintains order)
			for (let i = existingRules.length - 1; i >= 0; i--) {
				if (existingRules[i] instanceof CSSMediaRule) {
					insertIndex = i + 1;
					break;
				} else if (existingRules[i] instanceof CSSStyleRule) {
					// If we hit a style rule, insert after it
					insertIndex = i + 1;
					break;
				}
			}

			styleSheet.sheet?.insertRule(`@media ${mediaQuery} {}`, insertIndex);
			mediaRule = styleSheet.sheet?.cssRules[insertIndex] as CSSMediaRule;
		}

		// Check if class already exists in this media query
		let existingRule: CSSStyleRule | null = null;
		for (const rule of Array.from(mediaRule.cssRules)) {
			if (rule instanceof CSSStyleRule && rule.selectorText === `.${className}`) {
				existingRule = rule;
				break;
			}
		}

		if (existingRule) {
			// Update existing rule by replacing all styles
			// First, clear all existing properties
			while (existingRule.style.length > 0) {
				existingRule.style.removeProperty(existingRule.style[0]);
			}
			// Then set all new properties
			Object.entries(styles).forEach(([property, value]) => {
				existingRule!.style.setProperty(property, value);
			});
		} else {
			mediaRule.insertRule(`.${className} { ${rules} }`, mediaRule.cssRules.length);
		}
	} else {
		// Regular style rule (no media query)
		// Find existing rule or insert at the beginning (before media queries)
		let existingRule: CSSStyleRule | null = null;
		let insertIndex = 0;

		const allRules = Array.from(styleSheet.sheet?.cssRules || []);
		for (let i = 0; i < allRules.length; i++) {
			const rule = allRules[i];
			if (rule instanceof CSSStyleRule && rule.selectorText === `.${className}`) {
				existingRule = rule;
				insertIndex = i;
				break;
			}
			// Track where media queries start to insert default styles before them
			if (!(rule instanceof CSSMediaRule)) {
				insertIndex = i + 1;
			}
		}

		if (existingRule) {
			// Update existing rule by replacing all styles
			// First, clear all existing properties
			while (existingRule.style.length > 0) {
				existingRule.style.removeProperty(existingRule.style[0]);
			}
			// Then set all new properties
			Object.entries(styles).forEach(([property, value]) => {
				existingRule!.style.setProperty(property, value);
			});
		} else {
			styleSheet.sheet?.insertRule(`.${className} { ${rules} }`, insertIndex);
		}
	}
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
	display(value: string): this;
	grid(): this;
	bg(color: string): this;
	color(colorValue: string): this;
	accentColor(value: string): this;
	fontSize(size: string): this;
	fontWeight(value: string): this;
	fontFamily(value: string): this;
	lineHeight(value: string): this;
	letterSpacing(value: string): this;
	textAlign(value: string): this;
	textDecoration(value: string): this;
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
	top(value: string): this;
	right(value: string): this;
	bottom(value: string): this;
	left(value: string): this;
	zIndex(value: string): this;
	flexDirection(value: string): this;
	alignItems(value: string): this;
	justifyContent(value: string): this;
	gap(value: string): this;
	flexWrap(value: string): this;
	flexGrow(value: string): this;
	flexShrink(value: string): this;
	flexBasis(value: string): this;
	alignSelf(value: string): this;
	alignContent(value: string): this;
	justifySelf(value: string): this;
	justifyItems(value: string): this;
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
	outline(value: string): this;
	outlineWidth(value: string): this;
	outlineStyle(value: string): this;
	outlineColor(value: string): this;
	outlineOffset(value: string): this;
	backgroundColor(value: string): this;
	backgroundImage(value: string): this;
	backgroundRepeat(value: string): this;
	backgroundPosition(value: string): this;
	backgroundSize(value: string): this;
	backgroundAttachment(value: string): this;
	backgroundClip(value: string): this;
	backgroundOrigin(value: string): this;
	boxShadow(value: string): this;
	opacity(value: string): this;
	transition(value: string): this;
	transitionProperty(value: string): this;
	transitionDuration(value: string): this;
	transitionTimingFunction(value: string): this;
	transitionDelay(value: string): this;
	transform(value: string): this;
	transformOrigin(value: string): this;
	transformStyle(value: string): this;
	perspective(value: string): this;
	perspectiveOrigin(value: string): this;
	backfaceVisibility(value: string): this;
	animation(value: string): this;
	animationName(value: string): this;
	animationDuration(value: string): this;
	animationTimingFunction(value: string): this;
	animationDelay(value: string): this;
	animationIterationCount(value: string): this;
	animationDirection(value: string): this;
	animationFillMode(value: string): this;
	animationPlayState(value: string): this;
	filter(value: string): this;
	backdropFilter(value: string): this;
	overflow(value: string): this;
	overflowX(value: string): this;
	overflowY(value: string): this;
	visibility(value: string): this;
	objectFit(value: string): this;
	objectPosition(value: string): this;
	listStyle(value: string): this;
	listStyleType(value: string): this;
	listStylePosition(value: string): this;
	listStyleImage(value: string): this;
	borderCollapse(value: string): this;
	borderSpacing(value: string): this;
	captionSide(value: string): this;
	emptyCells(value: string): this;
	tableLayout(value: string): this;
	content(value: string): this;
	quotes(value: string): this;
	counterReset(value: string): this;
	counterIncrement(value: string): this;
	appearance(value: string): this;
	userSelect(value: string): this;
	pointerEvents(value: string): this;
	resize(value: string): this;
	scrollBehavior(value: string): this;
	clip(value: string): this;
	clipPath(value: string): this;
	isolation(value: string): this;
	mixBlendMode(value: string): this;
	willChange(value: string): this;
	contain(value: string): this;
	pageBreakBefore(value: string): this;
	pageBreakAfter(value: string): this;
	pageBreakInside(value: string): this;
	breakBefore(value: string): this;
	breakAfter(value: string): this;
	breakInside(value: string): this;
	orphans(value: string): this;
	widows(value: string): this;
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
	cursor(value: string): this;
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

// Breakpoints type
type BreakpointStyles<T extends string> = Partial<Record<T, StyleBuilder>>;

// Create breakpoints function
// Accepts either Record (for backward compatibility) or Array of [name, mediaQuery] tuples (for explicit order)
export function createBreakpoints<T extends string>(
	breakpoints: Record<T, string> | Array<[T, string]>
) {
	// Convert to array format to preserve order
	const breakpointsArray: Array<[T, string]> = Array.isArray(breakpoints)
		? breakpoints
		: (Object.entries(breakpoints) as Array<[T, string]>);

	return function cn(
		defaultStylesOrBreakpoints?: StyleBuilder | BreakpointStyles<T>,
		breakpointStyles?: BreakpointStyles<T>
	): { className: string } | string {
		let defaultStyles: StyleBuilder | undefined;
		let styles: BreakpointStyles<T> | undefined;

		// Handle both signatures:
		// 1. cn({ medium: width("50%") }) - single argument with breakpoints
		// 2. cn(width("100%"), { medium: width("50%") }) - default styles + breakpoints
		if (breakpointStyles !== undefined) {
			// Two-argument form
			defaultStyles = defaultStylesOrBreakpoints as StyleBuilder;
			styles = breakpointStyles;
		} else if (defaultStylesOrBreakpoints instanceof StyleBuilder) {
			// Single argument, but it's a StyleBuilder (default styles only)
			defaultStyles = defaultStylesOrBreakpoints;
			styles = undefined;
		} else {
			// Single argument with breakpoints
			defaultStyles = undefined;
			styles = defaultStylesOrBreakpoints as BreakpointStyles<T>;
		}

		// If nothing provided, return empty
		if (!defaultStyles && (!styles || Object.keys(styles).length === 0)) {
			return "";
		}

		// If we have breakpoints, create a single class name for all breakpoints
		if (styles && Object.keys(styles).length > 0) {
			// Collect all breakpoint styles in registration order
			const allBreakpointStyles: Array<{ breakpointName: T; mediaQuery: string; styles: Record<string, string> }> = [];

			// Process breakpoints in the order they were registered
			for (const [breakpointName, mediaQuery] of breakpointsArray) {
				const styleBuilder = styles[breakpointName];
				if (styleBuilder) {
					allBreakpointStyles.push({
						breakpointName,
						mediaQuery,
						styles: (styleBuilder as StyleBuilder).getStyles()
					});
				}
			}

			// Generate a combined hash from all breakpoint styles (and default styles if present)
			const allStyleKeys: string[] = [];

			if (defaultStyles) {
				const defaultStylesObj = defaultStyles.getStyles();
				allStyleKeys.push(`default:${generateStyleKey(defaultStylesObj)}`);
			}

			allStyleKeys.push(...allBreakpointStyles.map(({ breakpointName, styles: bpStyles }) => {
				const styleKey = generateStyleKey(bpStyles);
				return `${breakpointName}:${styleKey}`;
			}));

			const combinedStyleKey = allStyleKeys.sort().join('||');
			const combinedHash = simpleHash(combinedStyleKey);
			const className = `n${combinedHash}`;

			// Apply default styles first (no media query) - these are base styles
			let accumulatedStyles: Record<string, string> = {};
			if (defaultStyles) {
				accumulatedStyles = { ...defaultStyles.getStyles() };
				createCSSClassWithStyles(className, accumulatedStyles);
			}

			// Apply all breakpoint styles to the same class name in their respective media queries
			// Apply in registration order to ensure proper CSS cascade
			// Each breakpoint inherits from all previous breakpoints (cascading)
			for (const { breakpointName, mediaQuery, styles: bpStyles } of allBreakpointStyles) {
				// Merge accumulated styles (defaults + previous breakpoints) with current breakpoint
				// This ensures each breakpoint inherits from previous ones
				accumulatedStyles = { ...accumulatedStyles, ...bpStyles };
				createCSSClassWithStyles(className, accumulatedStyles, mediaQuery);
			}

			return { className };
		}

		// Only default styles (no breakpoints)
		if (defaultStyles) {
			const className = defaultStyles.getClassName();
			return { className };
		}

		return "";
	};
}

// Legacy function for backward compatibility
export function createCSSClass(className: string, styles: Record<string, string>): void {
	createCSSClassWithStyles(className, styles);
}

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
} = styleExports as Record<string, (value?: string) => StyleBuilder>;
