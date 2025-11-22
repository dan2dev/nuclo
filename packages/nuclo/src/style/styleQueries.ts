import { StyleBuilder } from "./styleBuilder";
import { generateStyleKey, simpleHash } from "./styleCache";
import { createCSSClassWithStyles } from "./cssGenerator";

// Style queries type
type QueryStyles<T extends string> = Partial<Record<T, StyleBuilder>>;

// Supported CSS at-rules
type AtRuleType = 'media' | 'container' | 'supports' | 'style';

// Parse the at-rule prefix from a query string
function parseAtRule(query: string): { type: AtRuleType; condition: string } {
	const trimmed = query.trim();

	// Check for @media prefix
	if (trimmed.startsWith('@media ')) {
		return { type: 'media', condition: trimmed.slice(7).trim() };
	}

	// Check for @container prefix
	if (trimmed.startsWith('@container ')) {
		return { type: 'container', condition: trimmed.slice(11).trim() };
	}

	// Check for @supports prefix
	if (trimmed.startsWith('@supports ')) {
		return { type: 'supports', condition: trimmed.slice(10).trim() };
	}

	// Check for @style prefix (for future CSS style queries)
	if (trimmed.startsWith('@style ')) {
		return { type: 'style', condition: trimmed.slice(7).trim() };
	}

	// Default: treat as media query for backward compatibility
	return { type: 'media', condition: trimmed };
}

// Create style queries function
// Accepts either Record (for backward compatibility) or Array of [name, query] tuples (for explicit order)
export function createStyleQueries<T extends string>(
	queries: Record<T, string> | Array<[T, string]>
) {
	// Convert to array format to preserve order
	const queriesArray: Array<[T, string]> = Array.isArray(queries)
		? queries
		: (Object.entries(queries) as Array<[T, string]>);

	return function cn(
		defaultStylesOrQueries?: StyleBuilder | QueryStyles<T>,
		queryStyles?: QueryStyles<T>
	): { className: string } | string {
		let defaultStyles: StyleBuilder | undefined;
		let styles: QueryStyles<T> | undefined;

		// Handle both signatures:
		// 1. cn({ medium: width("50%") }) - single argument with queries
		// 2. cn(width("100%"), { medium: width("50%") }) - default styles + queries
		if (queryStyles !== undefined) {
			// Two-argument form
			defaultStyles = defaultStylesOrQueries as StyleBuilder;
			styles = queryStyles;
		} else if (defaultStylesOrQueries instanceof StyleBuilder) {
			// Single argument, but it's a StyleBuilder (default styles only)
			defaultStyles = defaultStylesOrQueries;
			styles = undefined;
		} else {
			// Single argument with queries
			defaultStyles = undefined;
			styles = defaultStylesOrQueries as QueryStyles<T>;
		}

		// If nothing provided, return empty
		if (!defaultStyles && (!styles || Object.keys(styles).length === 0)) {
			return "";
		}

		// If we have queries, create a single class name for all queries
		if (styles && Object.keys(styles).length > 0) {
			// Collect all query styles in registration order
			const allQueryStyles: Array<{ queryName: T; atRule: { type: AtRuleType; condition: string }; styles: Record<string, string> }> = [];

			// Process queries in the order they were registered
			for (const [queryName, queryValue] of queriesArray) {
				const styleBuilder = styles[queryName];
				if (styleBuilder) {
					allQueryStyles.push({
						queryName,
						atRule: parseAtRule(queryValue),
						styles: (styleBuilder as StyleBuilder).getStyles()
					});
				}
			}

			// Generate a combined hash from all query styles (and default styles if present)
			const allStyleKeys: string[] = [];

			if (defaultStyles) {
				const defaultStylesObj = defaultStyles.getStyles();
				allStyleKeys.push(`default:${generateStyleKey(defaultStylesObj)}`);
			}

			allStyleKeys.push(...allQueryStyles.map(({ queryName, styles: qStyles }) => {
				const styleKey = generateStyleKey(qStyles);
				return `${queryName}:${styleKey}`;
			}));

			const combinedStyleKey = allStyleKeys.sort().join('||');
			const combinedHash = simpleHash(combinedStyleKey);
			const className = `n${combinedHash}`;

			// Apply default styles first (no at-rule) - these are base styles
			let accumulatedStyles: Record<string, string> = {};
			if (defaultStyles) {
				accumulatedStyles = { ...defaultStyles.getStyles() };
				createCSSClassWithStyles(className, accumulatedStyles);
			}

			// Apply all query styles to the same class name in their respective at-rules
			// Apply in registration order to ensure proper CSS cascade
			// Each query inherits from all previous queries (cascading)
			for (const { atRule, styles: qStyles } of allQueryStyles) {
				// Merge accumulated styles (defaults + previous queries) with current query
				// This ensures each query inherits from previous ones
				accumulatedStyles = { ...accumulatedStyles, ...qStyles };
				createCSSClassWithStyles(className, accumulatedStyles, atRule.condition, atRule.type);
			}

			return { className };
		}

		// Only default styles (no queries)
		if (defaultStyles) {
			const className = defaultStyles.getClassName();
			return { className };
		}

		return "";
	};
}

// Backward compatibility: alias for createStyleQueries
export const createBreakpoints = createStyleQueries;
