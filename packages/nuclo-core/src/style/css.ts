/**
 * nuclo styling — atomic, theme-aware, typed CSS-in-TS.
 *
 * One typed object in, a set of reusable atomic classes out:
 *
 *   const { css, cx } = createCss({
 *     colors: { primary: "#6366f1" },
 *     screens: { md: "(min-width: 768px)" },
 *   });
 *   const button = css({ px: 24, py: 12, bg: "primary", rounded: 8, hover: { bg: "#4f46e5" } });
 *   div(button, "Save"); // button is { className } — a regular nuclo attributes object
 */
import { atom, addRawRule, conflictKeyOf, hash, registerQueries } from "./engine";

// ---------------------------------------------------------------------------
// Types live in types/style.d.ts (shipped with the package) so the published
// global declarations can import them without reaching into unpublished src/.
// They are re-exported here so module-style consumers keep the same surface.
// ---------------------------------------------------------------------------
import type {
	ClassInput,
	CssInstance,
	FlatStyle,
	KeyframeFrames,
	Pseudo,
	Style,
	StyleResult,
	ThemeConfig,
	VariantDefinitions,
	VariantProps,
	VariantsConfig,
	VariantsFn,
} from "../../types/style";

export type {
	ClassInput,
	CssInstance,
	CSSProperties,
	FlatStyle,
	KeyframeFrames,
	KeyframeStop,
	Pseudo,
	Size,
	Style,
	StyleResult,
	ThemeConfig,
	VariantDefinitions,
	VariantProps,
	VariantsConfig,
	VariantsFn,
} from "../../types/style";


const PSEUDO = {
	hover: ":hover",
	focus: ":focus",
	focusVisible: ":focus-visible",
	focusWithin: ":focus-within",
	active: ":active",
	visited: ":visited",
	disabled: ":disabled",
	enabled: ":enabled",
	checked: ":checked",
	required: ":required",
	invalid: ":invalid",
	valid: ":valid",
	readOnly: ":read-only",
	first: ":first-child",
	last: ":last-child",
	only: ":only-child",
	odd: ":nth-child(odd)",
	even: ":nth-child(even)",
	empty: ":empty",
	placeholderShown: ":placeholder-shown",
	placeholder: "::placeholder",
	before: "::before",
	after: "::after",
	selection: "::selection",
	marker: "::marker",
	firstLine: "::first-line",
	firstLetter: "::first-letter",
} as const satisfies Record<Pseudo, string>;

// ---------------------------------------------------------------------------
// Runtime tables
// ---------------------------------------------------------------------------
const ALIAS: Record<string, readonly string[]> = {
	bg: ["background"],
	p: ["padding"],
	px: ["padding-left", "padding-right"],
	py: ["padding-top", "padding-bottom"],
	pt: ["padding-top"], pr: ["padding-right"], pb: ["padding-bottom"], pl: ["padding-left"],
	m: ["margin"],
	mx: ["margin-left", "margin-right"],
	my: ["margin-top", "margin-bottom"],
	mt: ["margin-top"], mr: ["margin-right"], mb: ["margin-bottom"], ml: ["margin-left"],
	w: ["width"], h: ["height"],
	minW: ["min-width"], maxW: ["max-width"], minH: ["min-height"], maxH: ["max-height"],
	size: ["width", "height"],
	text: ["font-size"],
	font: ["font-family"],
	weight: ["font-weight"],
	leading: ["line-height"],
	tracking: ["letter-spacing"],
	align: ["text-align"],
	items: ["align-items"],
	justify: ["justify-content"],
	z: ["z-index"],
	rounded: ["border-radius"],
	shadow: ["box-shadow"],
	select: ["user-select"],
};

const COMPOSITE: Record<string, Record<string, string>> = {
	row: { display: "flex", "flex-direction": "row" },
	col: { display: "flex", "flex-direction": "column" },
	center: { "align-items": "center", "justify-content": "center" },
	truncate: { overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" },
};

/** CSS property → theme token table it resolves against. */
const TOKEN_PROP: Record<string, keyof ThemeConfig> = {
	background: "colors",
	"background-color": "colors",
	color: "colors",
	"border-color": "colors",
	"border-top-color": "colors",
	"border-right-color": "colors",
	"border-bottom-color": "colors",
	"border-left-color": "colors",
	"outline-color": "colors",
	"caret-color": "colors",
	"text-decoration-color": "colors",
	"font-family": "fonts",
	"box-shadow": "shadows",
	"border-radius": "radii",
};

/** Properties where bare numbers stay unitless instead of becoming px. */
const UNITLESS = new Set([
	"z-index", "opacity", "font-weight", "line-height", "flex", "flex-grow",
	"flex-shrink", "order", "aspect-ratio", "zoom", "scale", "column-count",
	"orphans", "widows", "tab-size", "animation-iteration-count", "grid-column", "grid-row",
]);

const kebabCache = new Map<string, string>();
function kebab(prop: string): string {
	let out = kebabCache.get(prop);
	if (out === undefined) {
		out = prop.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
		kebabCache.set(prop, out);
	}
	return out;
}

function toQuery(screen: string): string {
	return screen.charCodeAt(0) === 64 /* @ */ ? screen : "@media " + screen;
}

function combineQuery(outer: string | undefined, inner: string): string {
	// Nested @media conditions combine with "and"; other combinations: inner wins.
	if (outer !== undefined && outer.startsWith("@media") && inner.startsWith("@media")) {
		return outer + " and" + inner.slice(6);
	}
	return inner;
}

function makeResult(className: string): StyleResult {
	const result = { className } as StyleResult;
	// Non-enumerable: attribute application iterates Object.keys() and must
	// only see className.
	Object.defineProperty(result, "toString", {
		value: () => className,
		enumerable: false,
	});
	return result;
}

function collectClasses(inputs: readonly ClassInput[], picked: Map<string, string>): void {
	for (const input of inputs) {
		if (!input) continue;
		if (typeof input === "string") {
			for (const name of input.split(" ")) {
				if (name) picked.set(conflictKeyOf(name) ?? name, name);
			}
		} else if (Array.isArray(input)) {
			collectClasses(input, picked);
		} else {
			for (const name of (input as StyleResult).className.split(" ")) {
				if (name) picked.set(conflictKeyOf(name) ?? name, name);
			}
		}
	}
}

/**
 * Compose class lists with exact conflict resolution: when two inputs style
 * the same (query, selector, property), the last one wins. Works because the
 * engine knows what every class it generated means. Nested arrays are flattened,
 * so `cx([a, cond && b], c)` composes the same as `cx(a, cond && b, c)`.
 */
export function cx(...inputs: ClassInput[]): StyleResult {
	const picked = new Map<string, string>();
	collectClasses(inputs, picked);
	let className = "";
	for (const name of picked.values()) className += (className ? " " : "") + name;
	return makeResult(className);
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
export function createCss<const T extends ThemeConfig>(theme: T = {} as T): CssInstance<T> {
	const screens: Record<string, string> = theme.screens ?? {};
	registerQueries(Object.values(screens).map(toQuery));

	const memo = new WeakMap<object, StyleResult>();

	function toCssValue(prop: string, value: string | number): string {
		if (typeof value === "number") {
			return value === 0 || UNITLESS.has(prop) ? String(value) : value + "px";
		}
		const group = TOKEN_PROP[prop];
		if (group !== undefined) {
			const hit = (theme[group] as Record<string, string> | undefined)?.[value];
			if (hit !== undefined) return hit;
		}
		return value;
	}

	function walk(style: Record<string, unknown>, query: string | undefined, suffix: string, out: string[]): void {
		for (const key in style) {
			const value = style[key];
			if (value == null || value === false) continue;

			if (typeof value === "object") {
				if (key === "raw") {
					const raws = value as Record<string, string | number>;
					for (const prop in raws) out.push(atom(query, suffix, prop, toCssValue(prop, raws[prop])));
					continue;
				}
				const pseudo = (PSEUDO as Record<string, string | undefined>)[key];
				if (pseudo !== undefined) {
					walk(value as Record<string, unknown>, query, suffix + pseudo, out);
					continue;
				}
				const screen = screens[key];
				if (screen !== undefined) {
					walk(value as Record<string, unknown>, combineQuery(query, toQuery(screen)), suffix, out);
					continue;
				}
				const first = key.charCodeAt(0);
				if (first === 38 /* & */) {
					walk(value as Record<string, unknown>, query, suffix + key.slice(1), out);
					continue;
				}
				if (first === 64 /* @ */) {
					walk(value as Record<string, unknown>, combineQuery(query, key), suffix, out);
					continue;
				}
				continue; // unknown nested key — unreachable through the typed API
			}

			if (value === true) {
				const composite = COMPOSITE[key];
				if (composite) for (const prop in composite) out.push(atom(query, suffix, prop, composite[prop]));
				continue;
			}

			const targets = ALIAS[key];
			if (targets !== undefined) {
				for (const prop of targets) out.push(atom(query, suffix, prop, toCssValue(prop, value as string | number)));
			} else {
				const prop = kebab(key);
				out.push(atom(query, suffix, prop, toCssValue(prop, value as string | number)));
			}
		}
	}

	/** Compile a style object into atomic classes. Idempotent and cached. */
	function css(style: Style<T>): StyleResult {
		const hit = memo.get(style);
		if (hit) return hit;
		const classes: string[] = [];
		walk(style as Record<string, unknown>, undefined, "", classes);
		const result = makeResult(classes.join(" "));
		memo.set(style, result);
		return result;
	}

	function flatDecls(style: Record<string, unknown>): string {
		let decls = "";
		const push = (prop: string, v: string): void => {
			decls += (decls ? ";" : "") + prop + ":" + v;
		};
		for (const key in style) {
			const value = style[key];
			if (value == null || value === false) continue;
			if (key === "raw" && typeof value === "object") {
				const raws = value as Record<string, string | number>;
				for (const prop in raws) push(prop, toCssValue(prop, raws[prop]));
				continue;
			}
			if (typeof value === "object") continue;
			if (value === true) {
				const composite = COMPOSITE[key];
				if (composite) for (const prop in composite) push(prop, composite[prop]);
				continue;
			}
			const targets = ALIAS[key];
			if (targets !== undefined) {
				for (const prop of targets) push(prop, toCssValue(prop, value as string | number));
			} else {
				const prop = kebab(key);
				push(prop, toCssValue(prop, value as string | number));
			}
		}
		return decls;
	}

	/** Register a @keyframes block; returns its generated name for use in `animation`. */
	function keyframes(frames: KeyframeFrames<T>): string {
		let body = "";
		for (const stop in frames) {
			body += stop + "{" + flatDecls(frames[stop] as Record<string, unknown>) + "}";
		}
		const name = "nk" + hash(body);
		addRawRule(name, "@keyframes " + name + "{" + body + "}");
		return name;
	}

	/** Global selector styles (body, resets). Flat properties only. */
	function globalStyle(selector: string, style: FlatStyle<T>): void {
		const rule = selector + "{" + flatDecls(style as Record<string, unknown>) + "}";
		addRawRule("g|" + rule, rule);
	}

	/**
	 * Compile a typed variants recipe into a call-with-props function.
	 *
	 *   const button = variants({
	 *     base: { rounded: 8, weight: 600 },
	 *     variants: {
	 *       intent: { primary: { bg: "primary" }, danger: { bg: "danger" } },
	 *       size:   { sm: { px: 8, py: 4 }, lg: { px: 16, py: 10 } },
	 *       block:  { true: { display: "block", w: "100%" } },
	 *     },
	 *     defaultVariants: { intent: "primary", size: "sm" },
	 *     compoundVariants: [{ intent: "danger", size: "lg", css: { weight: 700 } }],
	 *   });
	 *   div(button({ intent: "danger", size: "lg" }), "Delete");
	 *
	 * Every variant style compiles to atomic classes once, at definition time.
	 * A call resolves defaults + props into a selection, composes the matching
	 * precompiled results with cx() (last-wins conflict resolution), and caches
	 * the composed result per selection — so repeated calls are a Map lookup.
	 */
	function variants<const V extends VariantDefinitions<T>>(
		config: VariantsConfig<T, V>,
	): VariantsFn<V> {
		const normalize = (value: unknown): string =>
			value === true ? "true" : value === false ? "false" : String(value);

		const groups = (config.variants ?? {}) as Record<string, Record<string, Style<T>>>;
		const groupNames = Object.keys(groups);
		const defaults = (config.defaultVariants ?? {}) as Record<string, unknown>;

		const baseResult = config.base ? css(config.base) : null;

		// Precompile every variant value's atomic classes once.
		const compiled: Record<string, Record<string, StyleResult>> = {};
		for (const group of groupNames) {
			const values = groups[group];
			const inner: Record<string, StyleResult> = {};
			for (const value in values) inner[value] = css(values[value]);
			compiled[group] = inner;
		}

		// Precompile compound-variant styles with their match conditions.
		const compounds = (config.compoundVariants ?? []).map((entry) => {
			const { css: compoundStyle, ...match } = entry as VariantProps<V> & { css: Style<T> };
			const conditions: Record<string, string> = {};
			for (const group in match) conditions[group] = normalize((match as Record<string, unknown>)[group]);
			return { conditions, result: css(compoundStyle) };
		});

		const cache = new Map<string, StyleResult>();

		return function recipe(props?: VariantProps<V>): StyleResult {
			// Resolve final selection: defaults, overridden by explicit props.
			const selection: Record<string, string> = {};
			for (const group of groupNames) {
				const provided = props ? (props as Record<string, unknown>)[group] : undefined;
				const chosen = provided !== undefined && provided !== null ? provided : defaults[group];
				if (chosen === undefined || chosen === null) continue;
				selection[group] = normalize(chosen);
			}

			// Cache the composed result per selection (stable group order).
			let key = "";
			for (const group of groupNames) key += group + "=" + (selection[group] ?? "") + ";";
			const cached = cache.get(key);
			if (cached) return cached;

			const parts: ClassInput[] = [];
			if (baseResult) parts.push(baseResult);
			for (const group of groupNames) {
				const value = selection[group];
				if (value !== undefined) {
					const result = compiled[group][value];
					if (result) parts.push(result);
				}
			}
			for (const compound of compounds) {
				let matches = true;
				for (const group in compound.conditions) {
					if (selection[group] !== compound.conditions[group]) {
						matches = false;
						break;
					}
				}
				if (matches) parts.push(compound.result);
			}

			const result = cx(...parts);
			cache.set(key, result);
			return result;
		};
	}

	return { css, cx, variants, keyframes, globalStyle, theme };
}

// ---------------------------------------------------------------------------
// Default themeless instance — registered as globals by the runtime bootstrap.
// Apps with design tokens create their own instance via createCss(theme).
//
// Built lazily on first use rather than at module load: most apps that
// import nuclo never call css()/variants()/keyframes()/globalStyle(), and
// createCss() eagerly allocates a memo WeakMap and walks the (empty) theme's
// screens — work worth skipping entirely for those apps.
// ---------------------------------------------------------------------------
let defaultInstance: CssInstance<object> | undefined;
function getDefaultInstance(): CssInstance<object> {
	return (defaultInstance ??= createCss({}));
}

/** Themeless css() — full property/variant typing, no tokens or screens. */
export const css: (style: Style<object>) => StyleResult = (style) => getDefaultInstance().css(style);
/** Themeless variants() recipe helper. */
export const variants: <const V extends VariantDefinitions<object>>(
	config: VariantsConfig<object, V>,
) => VariantsFn<V> = (config) => getDefaultInstance().variants(config);
/** Themeless keyframes() helper. */
export const keyframes: (frames: KeyframeFrames<object>) => string = (frames) => getDefaultInstance().keyframes(frames);
/** Themeless globalStyle() helper. */
export const globalStyle: (selector: string, style: FlatStyle<object>) => void = (selector, style) =>
	getDefaultInstance().globalStyle(selector, style);
