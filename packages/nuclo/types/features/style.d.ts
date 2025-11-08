// Style utility functions type definitions

/**
 * Creates a CSS class with the given styles and injects it into the document
 */
declare global {
	function createCSSClass(className: string, styles: Record<string, string>): void;

	/**
	 * Creates a breakpoint-aware class name generator
	 */
	function createBreakpoints<T extends string>(
		breakpoints: Record<T, string>
	): (styles?: Partial<Record<T, StyleBuilder>>) => string;

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

		// Layout
		position(value: string): this;
		padding(value: string): this;
		margin(value: string): this;
		width(value: string): this;
		height(value: string): this;
		minWidth(value: string): this;
		maxWidth(value: string): this;
		minHeight(value: string): this;

		// Flexbox
		flexDirection(value: string): this;
		alignItems(value: string): this;
		justifyContent(value: string): this;
		center(): this;
		gap(value: string): this;

		// Borders
		border(value: string): this;
		borderRadius(value: string): this;
		outline(value: string): this;

		// Effects
		boxShadow(value: string): this;
		opacity(value: string): this;
		transition(value: string): this;

		// Interaction
		cursor(value: string): this;
	}

	// Utility functions that return StyleBuilders
	// Display
	function display(value: string): StyleBuilder;
	function flex(value?: string): StyleBuilder;
	function grid(): StyleBuilder;

	// Colors
	function bg(color: string): StyleBuilder;
	function color(colorValue: string): StyleBuilder;
	function accentColor(value: string): StyleBuilder;

	// Typography
	function fontSize(size: string): StyleBuilder;
	function fontWeight(value: string): StyleBuilder;
	function fontFamily(value: string): StyleBuilder;
	function lineHeight(value: string): StyleBuilder;
	function letterSpacing(value: string): StyleBuilder;
	function textAlign(value: string): StyleBuilder;
	function textDecoration(value: string): StyleBuilder;
	function bold(): StyleBuilder;

	// Layout
	function position(value: string): StyleBuilder;
	function padding(value: string): StyleBuilder;
	function margin(value: string): StyleBuilder;
	function width(value: string): StyleBuilder;
	function height(value: string): StyleBuilder;
	function minWidth(value: string): StyleBuilder;
	function maxWidth(value: string): StyleBuilder;
	function minHeight(value: string): StyleBuilder;

	// Flexbox
	function flexDirection(value: string): StyleBuilder;
	function alignItems(value: string): StyleBuilder;
	function justifyContent(value: string): StyleBuilder;
	function center(): StyleBuilder;
	function gap(value: string): StyleBuilder;

	// Borders
	function border(value: string): StyleBuilder;
	function borderRadius(value: string): StyleBuilder;
	function outline(value: string): StyleBuilder;

	// Effects
	function boxShadow(value: string): StyleBuilder;
	function opacity(value: string): StyleBuilder;
	function transition(value: string): StyleBuilder;

	// Interaction
	function cursor(value: string): StyleBuilder;
}

export {};
