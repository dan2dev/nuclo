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

export type StyleQueryDefinitions =
	| Record<string, string>
	| ReadonlyArray<readonly [string, string]>;

export type InferStyleQueryKeys<TDefinitions extends StyleQueryDefinitions> =
	TDefinitions extends ReadonlyArray<infer TEntry>
		? TEntry extends readonly [infer TKey extends string, string]
			? TKey
			: never
		: keyof TDefinitions & string;

export type StyleQueryStyles<TDefinitions extends StyleQueryDefinitions> =
	Partial<Record<InferStyleQueryKeys<TDefinitions> | CSSPseudoClass, StyleBuilder>>;

export interface StyleQueryBuilder<TDefinitions extends StyleQueryDefinitions> {
	(defaultStyles: StyleBuilder, queryStyles?: StyleQueryStyles<TDefinitions>): { className: string };
	(queryStyles?: StyleQueryStyles<TDefinitions>): { className: string };
	(className: string): { className: string };
	(className: string, defaultStyles: StyleBuilder, queryStyles?: StyleQueryStyles<TDefinitions>): { className: string };
	(className: string, queryStyles: StyleQueryStyles<TDefinitions>): { className: string };
}

// Set of known CSS pseudo-class names for validation
const PSEUDO_CLASSES: ReadonlySet<string> = new Set<CSSPseudoClass>([
	'hover', 'active', 'focus', 'focus-visible', 'focus-within',
	'visited', 'link', 'target', 'root', 'empty',
	'enabled', 'disabled', 'checked', 'indeterminate', 'default',
	'required', 'optional', 'valid', 'invalid',
	'in-range', 'out-of-range', 'placeholder-shown', 'autofill',
	'read-only', 'read-write',
	'first-child', 'last-child', 'only-child',
	'first-of-type', 'last-of-type', 'only-of-type',
	'nth-child', 'nth-last-child', 'nth-of-type', 'nth-last-of-type',
	'lang', 'dir', 'not', 'is', 'where', 'has',
	'any-link', 'local-link', 'scope',
	'current', 'past', 'future',
	'playing', 'paused', 'seeking', 'muted', 'volume-locked',
	'buffering', 'stalled', 'picture-in-picture',
	'fullscreen', 'modal', 'popover-open',
	'user-invalid', 'user-valid',
]);

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

function isPseudoClass(key: string): key is CSSPseudoClass {
	return PSEUDO_CLASSES.has(key);
}

function getNamedClassName(className: string, styleKey: string): string {
	return `${className}_${simpleHash(styleKey)}`;
}

// Cache for parsed queries to avoid re-parsing
const parsedQueryCache = new Map<string, QueryResult>();

// Create style queries function
// Accepts either Record (for backward compatibility) or Array of [name, query] tuples (for explicit order)
export function createStyleQueries<const TDefinitions extends StyleQueryDefinitions>(
	queries: TDefinitions
): StyleQueryBuilder<TDefinitions> {
	type QueryKey = InferStyleQueryKeys<TDefinitions>;
	type QueryStyles = StyleQueryStyles<TDefinitions>;

	// Convert to array format to preserve order
	const queriesArray: Array<readonly [QueryKey, string]> = Array.isArray(queries)
		? [...queries] as Array<readonly [QueryKey, string]>
		: (Object.entries(queries) as unknown as Array<readonly [QueryKey, string]>);
	
	// Pre-parse and cache all queries
	const parsedQueries = new Map<QueryKey, QueryResult>();
	for (const [queryName, queryValue] of queriesArray) {
		let parsed = parsedQueryCache.get(queryValue);
		if (!parsed) {
			parsed = parseQuery(queryValue);
			parsedQueryCache.set(queryValue, parsed);
		}
		parsedQueries.set(queryName, parsed);
	}

	return function cn(
		classNameOrDefaultStylesOrQueries?: string | StyleBuilder | QueryStyles,
		defaultStylesOrQueries?: StyleBuilder | QueryStyles,
		queryStyles?: QueryStyles
	): { className: string } {
		let namedClassName: string | undefined;
		let defaultStyles: StyleBuilder | undefined;
		let styles: QueryStyles | undefined;

		// Supported signatures:
		// 1. cn({ medium: width("50%") })
		// 2. cn(width("100%"), { medium: width("50%") })
		// 3. cn("card")
		// 4. cn("card", width("100%"))
		// 5. cn("card", { medium: width("50%") })
		// 6. cn("card", width("100%"), { medium: width("50%") })
		if (typeof classNameOrDefaultStylesOrQueries === "string") {
			const trimmedClassName = classNameOrDefaultStylesOrQueries.trim();
			namedClassName = trimmedClassName || undefined;

			if (defaultStylesOrQueries instanceof StyleBuilder) {
				defaultStyles = defaultStylesOrQueries;
				styles = queryStyles;
			} else {
				styles = defaultStylesOrQueries as QueryStyles | undefined;
			}
		} else if (defaultStylesOrQueries !== undefined) {
			defaultStyles = classNameOrDefaultStylesOrQueries as StyleBuilder;
			styles = defaultStylesOrQueries as QueryStyles;
		} else if (classNameOrDefaultStylesOrQueries instanceof StyleBuilder) {
			defaultStyles = classNameOrDefaultStylesOrQueries;
		} else {
			styles = classNameOrDefaultStylesOrQueries as QueryStyles | undefined;
		}

		const hasStyles = styles != null && Object.keys(styles).length > 0;
		if (!defaultStyles && !hasStyles) {
			return { className: namedClassName ?? "" };
		}

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
						query: { type: 'pseudo', pseudoClass: `:${key}` },
						styles: styleBuilder.getStyles()
					});
				}
			}

			if (allQueryStyles.length === 0 && !defaultStyles) {
				return { className: namedClassName ?? "" };
			}

			// Generate a combined hash from all query styles (and default styles if present)
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
			const className = namedClassName
				? getNamedClassName(namedClassName, combinedStyleKey)
				: `n${simpleHash(combinedStyleKey)}`;

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
		if (namedClassName) {
			const styleKey = generateStyleKey(defaultStyles!.getStyles());
			const className = getNamedClassName(namedClassName, styleKey);
			createCSSClassWithStyles(className, defaultStyles!.getStyles());
			return { className };
		}

		return { className: defaultStyles!.getClassName() };
	};
	}

// Backward compatibility: alias for createStyleQueries
export const createBreakpoints: typeof createStyleQueries = createStyleQueries;
