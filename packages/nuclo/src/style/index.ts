// CSSStyleSheet API
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

// Utility class builder for chaining CSS properties
class StyleBuilder {
	private styles: Record<string, string> = {};

	// Get the accumulated styles
	getStyles(): Record<string, string> {
		return { ...this.styles };
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

	// Display flex
	flex(): this {
		this.styles["display"] = "flex";
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
}

// Counter for generating unique class names
let classCounter = 0;

// Breakpoints type
type BreakpointConfig = Record<string, string>;
type BreakpointStyles<T extends string> = Partial<Record<T, StyleBuilder>>;

// Create breakpoints function
export function createBreakpoints<T extends string>(breakpoints: Record<T, string>) {
	return function cn(styles?: BreakpointStyles<T>): { className: string } | string {
		if (!styles || Object.keys(styles).length === 0) {
			return "";
		}

		const className = `nuclo-bp-${classCounter++}`;
		const breakpointEntries = Object.entries(breakpoints) as [T, string][];

		// Generate CSS for each breakpoint
		for (const [breakpointName, mediaQuery] of breakpointEntries) {
			const styleBuilder = styles[breakpointName];
			if (styleBuilder) {
				const cssStyles = (styleBuilder as StyleBuilder).getStyles();
				createCSSClassWithMedia(className, cssStyles, mediaQuery);
			}
		}

		// Return an object that will be recognized as an attribute modifier
		return { className };
	};
}

// Helper to create CSS class with media query
function createCSSClassWithMedia(className: string, styles: Record<string, string>, mediaQuery: string): void {
	let styleSheet = document.querySelector("#nuclo-styles") as HTMLStyleElement;

	if (!styleSheet) {
		styleSheet = document.createElement("style");
		styleSheet.id = "nuclo-styles";
		document.head.appendChild(styleSheet);
	}

	const rules = Object.entries(styles)
		.map(([property, value]) => `${property}: ${value}`)
		.join("; ");

	const cssRule = `@media ${mediaQuery} { .${className} { ${rules} } }`;
	styleSheet.sheet?.insertRule(cssRule, styleSheet.sheet.cssRules.length);
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

export function flex(): StyleBuilder {
	return new StyleBuilder().flex();
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
