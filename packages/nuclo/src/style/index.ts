// Cache for generated classes: maps CSS property sets to class names
const styleCache = new Map<string, string>();
let classCounter = 0;

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

	// Generate a new class name
	classCounter++;
	const className = prefix ? `nuclo-${prefix}-${classCounter}` : `nuclo-${classCounter}`;
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
			const index = styleSheet.sheet?.cssRules.length || 0;
			styleSheet.sheet?.insertRule(`@media ${mediaQuery} {}`, index);
			mediaRule = styleSheet.sheet?.cssRules[index] as CSSMediaRule;
		}

		// Check if class already exists in this media query
		const classExists = Array.from(mediaRule.cssRules).some(rule => {
			if (rule instanceof CSSStyleRule) {
				return rule.selectorText === `.${className}`;
			}
			return false;
		});

		if (!classExists) {
			mediaRule.insertRule(`.${className} { ${rules} }`, mediaRule.cssRules.length);
		}
	} else {
		// Regular style rule (no media query)
		const existingRules = Array.from(styleSheet.sheet?.cssRules || []);
		const classExists = existingRules.some(rule => {
			if (rule instanceof CSSStyleRule) {
				return rule.selectorText === `.${className}`;
			}
			return false;
		});

		if (!classExists) {
			styleSheet.sheet?.insertRule(`.${className} { ${rules} }`, styleSheet.sheet.cssRules.length);
		}
	}
}

// Utility class builder for chaining CSS properties
class StyleBuilder {
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

	// Background color
	bg(color: string): this {
		this.styles["background-color"] = color;
		return this;
	}

	// Text color
	color(color: string): this {
		this.styles["color"] = color;
		return this;
	}

	// Font size
	fontSize(size: string): this {
		this.styles["font-size"] = size;
		return this;
	}

	// Display
	display(value: string): this {
		this.styles["display"] = value;
		return this;
	}

	// Display flex or flex property
	flex(value?: string): this {
		if (value !== undefined) {
			this.styles["flex"] = value;
		} else {
			this.styles["display"] = "flex";
		}
		return this;
	}

	// Center content (flex)
	center(): this {
		this.styles["justify-content"] = "center";
		this.styles["align-items"] = "center";
		return this;
	}

	// Bold font
	bold(): this {
		this.styles["font-weight"] = "bold";
		return this;
	}

	// Padding
	padding(value: string): this {
		this.styles["padding"] = value;
		return this;
	}

	// Margin
	margin(value: string): this {
		this.styles["margin"] = value;
		return this;
	}

	// Width
	width(value: string): this {
		this.styles["width"] = value;
		return this;
	}

	// Height
	height(value: string): this {
		this.styles["height"] = value;
		return this;
	}

	// Border
	border(value: string): this {
		this.styles["border"] = value;
		return this;
	}

	// Border radius
	borderRadius(value: string): this {
		this.styles["border-radius"] = value;
		return this;
	}

	// Text align
	textAlign(value: string): this {
		this.styles["text-align"] = value;
		return this;
	}

	// Gap (for flex/grid)
	gap(value: string): this {
		this.styles["gap"] = value;
		return this;
	}

	// Flex direction
	flexDirection(value: string): this {
		this.styles["flex-direction"] = value;
		return this;
	}

	// Display grid
	grid(): this {
		this.styles["display"] = "grid";
		return this;
	}

	// Position
	position(value: string): this {
		this.styles["position"] = value;
		return this;
	}

	// Opacity
	opacity(value: string): this {
		this.styles["opacity"] = value;
		return this;
	}

	// Cursor
	cursor(value: string): this {
		this.styles["cursor"] = value;
		return this;
	}

	// Box shadow
	boxShadow(value: string): this {
		this.styles["box-shadow"] = value;
		return this;
	}

	// Transition
	transition(value: string): this {
		this.styles["transition"] = value;
		return this;
	}

	// Text decoration
	textDecoration(value: string): this {
		this.styles["text-decoration"] = value;
		return this;
	}

	// Letter spacing
	letterSpacing(value: string): this {
		this.styles["letter-spacing"] = value;
		return this;
	}

	// Font weight
	fontWeight(value: string): this {
		this.styles["font-weight"] = value;
		return this;
	}

	// Align items
	alignItems(value: string): this {
		this.styles["align-items"] = value;
		return this;
	}

	// Justify content
	justifyContent(value: string): this {
		this.styles["justify-content"] = value;
		return this;
	}

	// Min width
	minWidth(value: string): this {
		this.styles["min-width"] = value;
		return this;
	}

	// Max width
	maxWidth(value: string): this {
		this.styles["max-width"] = value;
		return this;
	}

	// Min height
	minHeight(value: string): this {
		this.styles["min-height"] = value;
		return this;
	}

	// Accent color
	accentColor(value: string): this {
		this.styles["accent-color"] = value;
		return this;
	}

	// Line height
	lineHeight(value: string): this {
		this.styles["line-height"] = value;
		return this;
	}

	// Font family
	fontFamily(value: string): this {
		this.styles["font-family"] = value;
		return this;
	}

	// Outline
	outline(value: string): this {
		this.styles["outline"] = value;
		return this;
	}
}

// Breakpoints type
type BreakpointStyles<T extends string> = Partial<Record<T, StyleBuilder>>;

// Create breakpoints function
export function createBreakpoints<T extends string>(breakpoints: Record<T, string>) {
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

		const allClassNames: string[] = [];

		// Process default styles (no media query)
		if (defaultStyles) {
			const className = defaultStyles.getClassName();
			allClassNames.push(className);
		}

		// Process breakpoint styles
		if (styles && Object.keys(styles).length > 0) {
			const breakpointEntries = Object.entries(breakpoints) as [T, string][];

			for (const [breakpointName, mediaQuery] of breakpointEntries) {
				const styleBuilder = styles[breakpointName];
				if (styleBuilder) {
					const className = (styleBuilder as StyleBuilder).getClassName(breakpointName, mediaQuery);
					allClassNames.push(className);
				}
			}
		}

		// Return all class names
		return { className: allClassNames.join(' ') };
	};
}

// Legacy function for backward compatibility
export function createCSSClass(className: string, styles: Record<string, string>): void {
	createCSSClassWithStyles(className, styles);
}

// Utility functions that create new StyleBuilders
export function bg(color: string): StyleBuilder {
	return new StyleBuilder().bg(color);
}

export function color(colorValue: string): StyleBuilder {
	return new StyleBuilder().color(colorValue);
}

export function fontSize(size: string): StyleBuilder {
	return new StyleBuilder().fontSize(size);
}

export function flex(value?: string): StyleBuilder {
	return new StyleBuilder().flex(value);
}

export function center(): StyleBuilder {
	return new StyleBuilder().center();
}

export function bold(): StyleBuilder {
	return new StyleBuilder().bold();
}

export function padding(value: string): StyleBuilder {
	return new StyleBuilder().padding(value);
}

export function margin(value: string): StyleBuilder {
	return new StyleBuilder().margin(value);
}

export function width(value: string): StyleBuilder {
	return new StyleBuilder().width(value);
}

export function height(value: string): StyleBuilder {
	return new StyleBuilder().height(value);
}

export function border(value: string): StyleBuilder {
	return new StyleBuilder().border(value);
}

export function borderRadius(value: string): StyleBuilder {
	return new StyleBuilder().borderRadius(value);
}

export function textAlign(value: string): StyleBuilder {
	return new StyleBuilder().textAlign(value);
}

export function gap(value: string): StyleBuilder {
	return new StyleBuilder().gap(value);
}

export function flexDirection(value: string): StyleBuilder {
	return new StyleBuilder().flexDirection(value);
}

export function grid(): StyleBuilder {
	return new StyleBuilder().grid();
}

export function position(value: string): StyleBuilder {
	return new StyleBuilder().position(value);
}

export function opacity(value: string): StyleBuilder {
	return new StyleBuilder().opacity(value);
}

export function cursor(value: string): StyleBuilder {
	return new StyleBuilder().cursor(value);
}

export function boxShadow(value: string): StyleBuilder {
	return new StyleBuilder().boxShadow(value);
}

export function transition(value: string): StyleBuilder {
	return new StyleBuilder().transition(value);
}

export function textDecoration(value: string): StyleBuilder {
	return new StyleBuilder().textDecoration(value);
}

export function letterSpacing(value: string): StyleBuilder {
	return new StyleBuilder().letterSpacing(value);
}

export function fontWeight(value: string): StyleBuilder {
	return new StyleBuilder().fontWeight(value);
}

export function alignItems(value: string): StyleBuilder {
	return new StyleBuilder().alignItems(value);
}

export function justifyContent(value: string): StyleBuilder {
	return new StyleBuilder().justifyContent(value);
}

export function minWidth(value: string): StyleBuilder {
	return new StyleBuilder().minWidth(value);
}

export function maxWidth(value: string): StyleBuilder {
	return new StyleBuilder().maxWidth(value);
}

export function minHeight(value: string): StyleBuilder {
	return new StyleBuilder().minHeight(value);
}

export function accentColor(value: string): StyleBuilder {
	return new StyleBuilder().accentColor(value);
}

export function lineHeight(value: string): StyleBuilder {
	return new StyleBuilder().lineHeight(value);
}

export function fontFamily(value: string): StyleBuilder {
	return new StyleBuilder().fontFamily(value);
}

export function outline(value: string): StyleBuilder {
	return new StyleBuilder().outline(value);
}

export function display(value: string): StyleBuilder {
	return new StyleBuilder().display(value);
}
