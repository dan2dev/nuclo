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
		bg(color: string): this;
		color(color: string): this;
		fontSize(size: string): this;
		flex(): this;
		center(): this;
		bold(): this;
		padding(value: string): this;
		margin(value: string): this;
		width(value: string): this;
		height(value: string): this;
		border(value: string): this;
		borderRadius(value: string): this;
		textAlign(value: string): this;
		gap(value: string): this;
		flexDirection(value: string): this;
		grid(): this;
		position(value: string): this;
		opacity(value: string): this;
		cursor(value: string): this;
	}

	// Utility functions that return StyleBuilders
	function bg(color: string): StyleBuilder;
	function color(colorValue: string): StyleBuilder;
	function fontSize(size: string): StyleBuilder;
	function flex(): StyleBuilder;
	function center(): StyleBuilder;
	function bold(): StyleBuilder;
	function padding(value: string): StyleBuilder;
	function margin(value: string): StyleBuilder;
	function width(value: string): StyleBuilder;
	function height(value: string): StyleBuilder;
	function border(value: string): StyleBuilder;
	function borderRadius(value: string): StyleBuilder;
	function textAlign(value: string): StyleBuilder;
	function gap(value: string): StyleBuilder;
	function flexDirection(value: string): StyleBuilder;
	function grid(): StyleBuilder;
	function position(value: string): StyleBuilder;
	function opacity(value: string): StyleBuilder;
	function cursor(value: string): StyleBuilder;
}

export {};
