import { StyleBuilder } from "./styleBuilder";
import { generateStyleKey, simpleHash } from "./styleCache";
import { createCSSClassWithStyles } from "./cssGenerator";

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
