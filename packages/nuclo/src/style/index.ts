// Cache for generated utility classes to avoid duplicates
const classCache = new Map<string, string>();

// Sanitize value for use in class name
function sanitizeValue(value: string): string {
	// Remove # from hex colors
	value = value.replace(/^#/, '');
	// Replace special characters with hyphens
	value = value.replace(/[^a-zA-Z0-9]/g, '-');
	// Remove leading/trailing hyphens and collapse multiple hyphens
	value = value.replace(/^-+|-+$/g, '').replace(/-+/g, '-');
	return value.toLowerCase();
}

// Generate utility class name from property and value
function generateUtilityClassName(property: string, value: string): string {
	const cacheKey = `${property}:${value}`;
	
	if (classCache.has(cacheKey)) {
		return classCache.get(cacheKey)!;
	}

	let className: string;
	
	// Map CSS properties to Tailwind-like class prefixes
	const propertyMap: Record<string, string> = {
		'background-color': 'bg',
		'color': 'text',
		'font-size': 'text',
		'display': 'display',
		'flex': 'flex',
		'justify-content': 'justify',
		'align-items': 'items',
		'font-weight': 'font',
		'padding': 'p',
		'margin': 'm',
		'width': 'w',
		'height': 'h',
		'border': 'border',
		'border-radius': 'rounded',
		'text-align': 'text',
		'gap': 'gap',
		'flex-direction': 'flex',
		'position': 'position',
		'opacity': 'opacity',
		'cursor': 'cursor',
		'box-shadow': 'shadow',
		'transition': 'transition',
		'text-decoration': 'underline',
		'letter-spacing': 'tracking',
		'min-width': 'min-w',
		'max-width': 'max-w',
		'min-height': 'min-h',
		'accent-color': 'accent',
		'line-height': 'leading',
		'font-family': 'font',
		'outline': 'outline',
	};

	const prefix = propertyMap[property] || property.replace(/-/g, '-');
	const sanitizedValue = sanitizeValue(value);

	// Handle special cases
	if (property === 'display' && value === 'flex') {
		className = 'flex';
	} else if (property === 'display' && value === 'grid') {
		className = 'grid';
	} else if (property === 'display' && value === 'block') {
		className = 'display-block';
	} else if (property === 'display' && value === 'none') {
		className = 'display-none';
	} else if (property === 'justify-content' && value === 'center' && prefix === 'justify') {
		className = 'justify-center';
	} else if (property === 'align-items' && value === 'center' && prefix === 'items') {
		className = 'items-center';
	} else if (property === 'font-weight' && value === 'bold') {
		className = 'font-bold';
	} else if (property === 'text-align' && value === 'center') {
		className = 'text-center';
	} else if (property === 'flex-direction' && value === 'column') {
		className = 'flex-col';
	} else if (property === 'flex-direction' && value === 'row') {
		className = 'flex-row';
	} else if (property === 'cursor' && value === 'pointer') {
		className = 'cursor-pointer';
	} else if (property === 'text-decoration' && value === 'line-through') {
		className = 'line-through';
	} else {
		// Default: prefix-value format
		className = `${prefix}-${sanitizedValue}`;
	}

	classCache.set(cacheKey, className);
	return className;
}

// CSSStyleSheet API - creates a utility class
function createUtilityClass(className: string, property: string, value: string): void {
	let styleSheet = document.querySelector("#nuclo-styles") as HTMLStyleElement;

	if (!styleSheet) {
		styleSheet = document.createElement("style");
		styleSheet.id = "nuclo-styles";
		document.head.appendChild(styleSheet);
	}

	// Check if class already exists
	const existingRules = Array.from(styleSheet.sheet?.cssRules || []);
	const classExists = existingRules.some(rule => {
		if (rule instanceof CSSStyleRule) {
			return rule.selectorText === `.${className}`;
		}
		return false;
	});

	if (!classExists) {
		styleSheet.sheet?.insertRule(`.${className} { ${property}: ${value}; }`, styleSheet.sheet.cssRules.length);
	}
}

// Create utility class with media query
function createUtilityClassWithMedia(className: string, property: string, value: string, mediaQuery: string): void {
	let styleSheet = document.querySelector("#nuclo-styles") as HTMLStyleElement;

	if (!styleSheet) {
		styleSheet = document.createElement("style");
		styleSheet.id = "nuclo-styles";
		document.head.appendChild(styleSheet);
	}

	// Check if media query rule already exists
	const existingRules = Array.from(styleSheet.sheet?.cssRules || []);
	let mediaRule: CSSMediaRule | null = null;

	for (const rule of existingRules) {
		if (rule instanceof CSSMediaRule && rule.media.mediaText === mediaQuery) {
			mediaRule = rule;
			break;
		}
	}

	if (!mediaRule) {
		// Create new media query rule
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
		mediaRule.insertRule(`.${className} { ${property}: ${value}; }`, mediaRule.cssRules.length);
	}
}

// Utility class builder for chaining CSS properties
class StyleBuilder {
	private classNames: string[] = [];
	private classDefinitions: Array<{ className: string; property: string; value: string }> = [];

	// Get the accumulated class names
	getClassNames(): string[] {
		return [...this.classNames];
	}

	// Get class definitions (for breakpoint support)
	getClassDefinitions(): Array<{ className: string; property: string; value: string }> {
		return [...this.classDefinitions];
	}

	// Get class names as space-separated string
	toString(): string {
		return this.classNames.join(' ');
	}

	// Add a utility class
	private addClass(property: string, value: string): this {
		const className = generateUtilityClassName(property, value);
		// Track the property/value that created this class for breakpoint support
		classToPropertyMap.set(className, { property, value });
		
		// Store the class definition
		this.classDefinitions.push({ className, property, value });
		
		// Create the class immediately (will be overridden by media queries if needed)
		createUtilityClass(className, property, value);
		
		if (!this.classNames.includes(className)) {
			this.classNames.push(className);
		}
		return this;
	}

	// Add a custom style
	add(property: string, value: string): this {
		return this.addClass(property, value);
	}

	// Background color
	bg(color: string): this {
		return this.addClass("background-color", color);
	}

	// Text color
	color(color: string): this {
		return this.addClass("color", color);
	}

	// Font size
	fontSize(size: string): this {
		return this.addClass("font-size", size);
	}

	// Display
	display(value: string): this {
		return this.addClass("display", value);
	}

	// Display flex or flex property
	flex(value?: string): this {
		if (value !== undefined) {
			return this.addClass("flex", value);
		} else {
			return this.addClass("display", "flex");
		}
	}

	// Center content (flex)
	center(): this {
		this.addClass("justify-content", "center");
		return this.addClass("align-items", "center");
	}

	// Bold font
	bold(): this {
		return this.addClass("font-weight", "bold");
	}

	// Padding
	padding(value: string): this {
		return this.addClass("padding", value);
	}

	// Margin
	margin(value: string): this {
		return this.addClass("margin", value);
	}

	// Width
	width(value: string): this {
		return this.addClass("width", value);
	}

	// Height
	height(value: string): this {
		return this.addClass("height", value);
	}

	// Border
	border(value: string): this {
		return this.addClass("border", value);
	}

	// Border radius
	borderRadius(value: string): this {
		return this.addClass("border-radius", value);
	}

	// Text align
	textAlign(value: string): this {
		return this.addClass("text-align", value);
	}

	// Gap (for flex/grid)
	gap(value: string): this {
		return this.addClass("gap", value);
	}

	// Flex direction
	flexDirection(value: string): this {
		return this.addClass("flex-direction", value);
	}

	// Display grid
	grid(): this {
		return this.addClass("display", "grid");
	}

	// Position
	position(value: string): this {
		return this.addClass("position", value);
	}

	// Opacity
	opacity(value: string): this {
		return this.addClass("opacity", value);
	}

	// Cursor
	cursor(value: string): this {
		return this.addClass("cursor", value);
	}

	// Box shadow
	boxShadow(value: string): this {
		return this.addClass("box-shadow", value);
	}

	// Transition
	transition(value: string): this {
		return this.addClass("transition", value);
	}

	// Text decoration
	textDecoration(value: string): this {
		return this.addClass("text-decoration", value);
	}

	// Letter spacing
	letterSpacing(value: string): this {
		return this.addClass("letter-spacing", value);
	}

	// Font weight
	fontWeight(value: string): this {
		return this.addClass("font-weight", value);
	}

	// Align items
	alignItems(value: string): this {
		return this.addClass("align-items", value);
	}

	// Justify content
	justifyContent(value: string): this {
		return this.addClass("justify-content", value);
	}

	// Min width
	minWidth(value: string): this {
		return this.addClass("min-width", value);
	}

	// Max width
	maxWidth(value: string): this {
		return this.addClass("max-width", value);
	}

	// Min height
	minHeight(value: string): this {
		return this.addClass("min-height", value);
	}

	// Accent color
	accentColor(value: string): this {
		return this.addClass("accent-color", value);
	}

	// Line height
	lineHeight(value: string): this {
		return this.addClass("line-height", value);
	}

	// Font family
	fontFamily(value: string): this {
		return this.addClass("font-family", value);
	}

	// Outline
	outline(value: string): this {
		return this.addClass("outline", value);
	}
}

// Breakpoints type
type BreakpointStyles<T extends string> = Partial<Record<T, StyleBuilder>>;

// Helper to extract property and value from a class name
// This is a reverse lookup - we need to track what property/value created each class
const classToPropertyMap = new Map<string, { property: string; value: string }>();

// Create breakpoints function
export function createBreakpoints<T extends string>(breakpoints: Record<T, string>) {
	return function cn(styles?: BreakpointStyles<T>): { className: string } | string {
		if (!styles || Object.keys(styles).length === 0) {
			return "";
		}

		const breakpointEntries = Object.entries(breakpoints) as [T, string][];
		const allClassNames: string[] = [];

		// Process each breakpoint
		let isFirst = true;
		for (const [breakpointName, mediaQuery] of breakpointEntries) {
			const styleBuilder = styles[breakpointName];
			if (styleBuilder) {
				const classDefinitions = (styleBuilder as StyleBuilder).getClassDefinitions();
				
				// For each class definition
				for (const { className, property, value } of classDefinitions) {
					if (isFirst) {
						// Base breakpoint: create classes without media query
						createUtilityClass(className, property, value);
						allClassNames.push(className);
					} else {
						// Subsequent breakpoints: create unique prefixed classes in media queries
						// This prevents leaking between elements (like Tailwind's sm:, md:, lg:)
						const prefixedClassName = `${breakpointName}-${className}`;
						createUtilityClassWithMedia(prefixedClassName, property, value, mediaQuery);
						allClassNames.push(prefixedClassName);
					}
				}
				isFirst = false;
			}
		}

		// Return all class names - each breakpoint has unique classes
		return { className: allClassNames.join(' ') };
	};
}

// Legacy function for backward compatibility
export function createCSSClass(className: string, styles: Record<string, string>): void {
	let styleSheet = document.querySelector("#nuclo-styles") as HTMLStyleElement;

	if (!styleSheet) {
		styleSheet = document.createElement("style");
		styleSheet.id = "nuclo-styles";
		document.head.appendChild(styleSheet);
	}

	const rules = Object.entries(styles)
		.map(([property, value]) => `${property}: ${value}`)
		.join("; ");

	styleSheet.sheet?.insertRule(`.${className} { ${rules} }`, styleSheet.sheet.cssRules.length);
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
