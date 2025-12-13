import { StyleBuilder } from "./styleBuilder";
import { generateStyleKey, simpleHash } from "./styleCache";
import { createCSSClassWithStyles } from "./cssGenerator";

// Comprehensive list of CSS pseudo-classes
export type CSSPseudoClass =
	| 'hover'
	| 'active'
	| 'focus'
	| 'focus-visible'
	| 'focus-within'
	| 'visited'
	| 'link'
	| 'target'
	| 'root'
	| 'empty'
	| 'enabled'
	| 'disabled'
	| 'checked'
	| 'indeterminate'
	| 'default'
	| 'required'
	| 'optional'
	| 'valid'
	| 'invalid'
	| 'in-range'
	| 'out-of-range'
	| 'placeholder-shown'
	| 'autofill'
	| 'read-only'
	| 'read-write'
	| 'first-child'
	| 'last-child'
	| 'only-child'
	| 'first-of-type'
	| 'last-of-type'
	| 'only-of-type'
	| 'nth-child'
	| 'nth-last-child'
	| 'nth-of-type'
	| 'nth-last-of-type'
	| 'lang'
	| 'dir'
	| 'not'
	| 'is'
	| 'where'
	| 'has'
	| 'any-link'
	| 'local-link'
	| 'scope'
	| 'current'
	| 'past'
	| 'future'
	| 'playing'
	| 'paused'
	| 'seeking'
	| 'muted'
	| 'volume-locked'
	| 'buffering'
	| 'stalled'
	| 'picture-in-picture'
	| 'fullscreen'
	| 'modal'
	| 'popover-open'
	| 'user-invalid'
	| 'user-valid';

// Map pseudo-class names to their CSS selector strings
const PSEUDO_CLASS_MAP: Record<CSSPseudoClass, string> = {
	'hover': ':hover',
	'active': ':active',
	'focus': ':focus',
	'focus-visible': ':focus-visible',
	'focus-within': ':focus-within',
	'visited': ':visited',
	'link': ':link',
	'target': ':target',
	'root': ':root',
	'empty': ':empty',
	'enabled': ':enabled',
	'disabled': ':disabled',
	'checked': ':checked',
	'indeterminate': ':indeterminate',
	'default': ':default',
	'required': ':required',
	'optional': ':optional',
	'valid': ':valid',
	'invalid': ':invalid',
	'in-range': ':in-range',
	'out-of-range': ':out-of-range',
	'placeholder-shown': ':placeholder-shown',
	'autofill': ':autofill',
	'read-only': ':read-only',
	'read-write': ':read-write',
	'first-child': ':first-child',
	'last-child': ':last-child',
	'only-child': ':only-child',
	'first-of-type': ':first-of-type',
	'last-of-type': ':last-of-type',
	'only-of-type': ':only-of-type',
	'nth-child': ':nth-child',
	'nth-last-child': ':nth-last-child',
	'nth-of-type': ':nth-of-type',
	'nth-last-of-type': ':nth-last-of-type',
	'lang': ':lang',
	'dir': ':dir',
	'not': ':not',
	'is': ':is',
	'where': ':where',
	'has': ':has',
	'any-link': ':any-link',
	'local-link': ':local-link',
	'scope': ':scope',
	'current': ':current',
	'past': ':past',
	'future': ':future',
	'playing': ':playing',
	'paused': ':paused',
	'seeking': ':seeking',
	'muted': ':muted',
	'volume-locked': ':volume-locked',
	'buffering': ':buffering',
	'stalled': ':stalled',
	'picture-in-picture': ':picture-in-picture',
	'fullscreen': ':fullscreen',
	'modal': ':modal',
	'popover-open': ':popover-open',
	'user-invalid': ':user-invalid',
	'user-valid': ':user-valid',
};

// Style queries type - includes both user queries and built-in pseudo-classes
type QueryStyles<T extends string> = Partial<Record<T | CSSPseudoClass, StyleBuilder>>;

// Supported CSS at-rules
type AtRuleType = 'media' | 'container' | 'supports' | 'style' | 'pseudo';

// Query result type - can be an at-rule or a pseudo-class
type QueryResult = 
	| { type: AtRuleType; condition: string; pseudoClass?: never }
	| { type: 'pseudo'; pseudoClass: string; condition?: never };

// Parse the query string to determine if it's an at-rule or pseudo-class
function parseQuery(query: string): QueryResult {
	const trimmed = query.trim();

	// Check for pseudo-class (starts with : or &:)
	if (trimmed.startsWith('&:') || trimmed.startsWith(':')) {
		const pseudoClass = trimmed.startsWith('&:') ? trimmed.slice(1) : trimmed;
		return { type: 'pseudo', pseudoClass: pseudoClass.trim() };
	}

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

// Check if a key is a built-in pseudo-class
function isPseudoClass(key: string): key is CSSPseudoClass {
	return key in PSEUDO_CLASS_MAP;
}

// Get the CSS selector for a pseudo-class
function getPseudoClassSelector(pseudoClass: CSSPseudoClass): string {
	return PSEUDO_CLASS_MAP[pseudoClass];
}

// Cache for parsed queries to avoid re-parsing
const parsedQueryCache = new Map<string, QueryResult>();

// Create style queries function
// Accepts either Record (for backward compatibility) or Array of [name, query] tuples (for explicit order)
export function createStyleQueries<T extends string>(
	queries: Record<T, string> | Array<[T, string]>
): {
	(defaultStyles: StyleBuilder, queryStyles?: QueryStyles<T | CSSPseudoClass>): { className: string };
	(queryStyles?: QueryStyles<T | CSSPseudoClass>): { className: string };
} {
	// Convert to array format to preserve order
	const queriesArray: Array<[T, string]> = Array.isArray(queries)
		? queries
		: (Object.entries(queries) as Array<[T, string]>);
	
	// Pre-parse and cache all queries
	const parsedQueries = new Map<T, QueryResult>();
	for (const [queryName, queryValue] of queriesArray) {
		let parsed = parsedQueryCache.get(queryValue);
		if (!parsed) {
			parsed = parseQuery(queryValue);
			parsedQueryCache.set(queryValue, parsed);
		}
		parsedQueries.set(queryName, parsed);
	}

	return function cn(
		defaultStylesOrQueries?: StyleBuilder | QueryStyles<T | CSSPseudoClass>,
		queryStyles?: QueryStyles<T | CSSPseudoClass>
	): { className: string } {
		let defaultStyles: StyleBuilder | undefined;
		let styles: QueryStyles<T | CSSPseudoClass> | undefined;

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
				styles = defaultStylesOrQueries as QueryStyles<T | CSSPseudoClass>;
			}

			const hasStyles = styles != null && Object.keys(styles).length > 0;
			if (!defaultStyles && !hasStyles) return { className: "" };

			// If we have queries, create a single class name for all queries
			if (hasStyles) {
				// Collect all query styles in registration order
				const allQueryStyles: Array<{ queryName: string; query: QueryResult; styles: Record<string, string> }> = [];
				
				// Track which keys we've processed to avoid duplicates
				const processedKeys = new Set<string>();

			// Process user-defined queries in the order they were registered
			for (const [queryName] of queriesArray) {
				const styleBuilder = styles?.[queryName];
				if (styleBuilder) {
					processedKeys.add(queryName);
					allQueryStyles.push({
						queryName,
						query: parsedQueries.get(queryName)!,
						styles: (styleBuilder as StyleBuilder).getStyles()
					});
				}
			}

			// Process built-in pseudo-classes (hover, focus, etc.) - only if not already processed
			for (const [key, styleBuilder] of Object.entries(styles ?? {})) {
				if (!processedKeys.has(key) && isPseudoClass(key) && styleBuilder instanceof StyleBuilder) {
					allQueryStyles.push({
						queryName: key,
						query: { type: 'pseudo', pseudoClass: getPseudoClassSelector(key) },
						styles: styleBuilder.getStyles()
						});
					}
				}

				if (allQueryStyles.length === 0 && !defaultStyles) return { className: "" };

				// Generate a combined hash from all query styles (and default styles if present)
				// Pre-allocate array size for better performance
				const allStyleKeys: string[] = [];
				allStyleKeys.length = allQueryStyles.length + (defaultStyles ? 1 : 0);

			let keyIndex = 0;
			if (defaultStyles) {
				const defaultStylesObj = defaultStyles.getStyles();
				allStyleKeys[keyIndex++] = `default:${generateStyleKey(defaultStylesObj)}`;
			}

			for (const { queryName, styles: qStyles } of allQueryStyles) {
				const styleKey = generateStyleKey(qStyles);
				allStyleKeys[keyIndex++] = `${queryName}:${styleKey}`;
			}

			const combinedStyleKey = allStyleKeys.sort().join('||');
			const combinedHash = simpleHash(combinedStyleKey);
			const className = `n${combinedHash}`;

			// Apply default styles first (no at-rule) - these are base styles
			let accumulatedStyles: Record<string, string> = {};
			if (defaultStyles) {
				accumulatedStyles = { ...defaultStyles.getStyles() };
				createCSSClassWithStyles(className, accumulatedStyles);
			}

				type PseudoQuery = Extract<QueryResult, { type: "pseudo" }>;
				type AtRuleQuery = Exclude<QueryResult, { type: "pseudo" }>;

				// Separate at-rules and pseudo-classes for proper handling
				const atRuleQueries: Array<{ queryName: string; query: AtRuleQuery; styles: Record<string, string> }> = [];
				const pseudoClassQueries: Array<{ queryName: string; query: PseudoQuery; styles: Record<string, string> }> = [];

				for (const queryStyle of allQueryStyles) {
					if (queryStyle.query.type === 'pseudo') {
						pseudoClassQueries.push(queryStyle as unknown as { queryName: string; query: PseudoQuery; styles: Record<string, string> });
					} else {
						atRuleQueries.push(queryStyle as unknown as { queryName: string; query: AtRuleQuery; styles: Record<string, string> });
					}
				}

			// Apply at-rule queries first (media, container, supports, etc.)
			// Apply in registration order to ensure proper CSS cascade
			// Each query inherits from all previous queries (cascading)
			for (const { query, styles: qStyles } of atRuleQueries) {
				// Merge accumulated styles (defaults + previous queries) with current query
				// This ensures each query inherits from previous ones
				accumulatedStyles = { ...accumulatedStyles, ...qStyles };
				createCSSClassWithStyles(className, accumulatedStyles, query.condition, query.type);
			}

				// Apply pseudo-class queries (hover, focus, etc.)
				// These don't cascade - each pseudo-class gets its own styles
				for (const { query, styles: qStyles } of pseudoClassQueries) {
					createCSSClassWithStyles(className, qStyles, undefined, 'pseudo', query.pseudoClass);
				}

					return { className };
				}

			// Only default styles (no queries)
			return { className: defaultStyles!.getClassName() };
		};
	}

// Backward compatibility: alias for createStyleQueries
export const createBreakpoints = createStyleQueries;
