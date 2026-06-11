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
// Value types — keyword autocomplete without banning valid CSS.
// `Loose<"a" | "b">` suggests "a"/"b" but accepts any string.
// ---------------------------------------------------------------------------
type Loose<T extends string> = T | (string & {});

/** Length values: numbers become px (except unitless properties), strings pass through. */
export type Size = number | (string & {});

type Display = Loose<
	| "block" | "inline" | "inline-block" | "flex" | "inline-flex"
	| "grid" | "inline-grid" | "none" | "contents" | "flow-root"
	| "table" | "table-cell" | "list-item"
>;
type Position = Loose<"static" | "relative" | "absolute" | "fixed" | "sticky">;
type Overflow = Loose<"visible" | "hidden" | "clip" | "scroll" | "auto">;
type TextAlign = Loose<"left" | "right" | "center" | "justify" | "start" | "end">;
type FontWeight = number | Loose<"normal" | "bold" | "lighter" | "bolder" | "400" | "500" | "600" | "700">;
type AlignItems = Loose<"stretch" | "center" | "start" | "end" | "flex-start" | "flex-end" | "baseline">;
type JustifyContent = Loose<
	| "center" | "start" | "end" | "flex-start" | "flex-end"
	| "space-between" | "space-around" | "space-evenly" | "stretch"
>;
type FlexDirection = Loose<"row" | "row-reverse" | "column" | "column-reverse">;
type FlexWrap = Loose<"nowrap" | "wrap" | "wrap-reverse">;
type BorderStyle = Loose<"none" | "solid" | "dashed" | "dotted" | "double" | "hidden">;
type Cursor = Loose<
	| "auto" | "default" | "pointer" | "grab" | "grabbing" | "text" | "move"
	| "not-allowed" | "wait" | "crosshair" | "zoom-in" | "zoom-out"
>;
type ObjectFit = Loose<"fill" | "contain" | "cover" | "none" | "scale-down">;
type UserSelect = Loose<"none" | "auto" | "text" | "all" | "contain">;
type PointerEvents = Loose<"auto" | "none">;
type WhiteSpace = Loose<"normal" | "nowrap" | "pre" | "pre-wrap" | "pre-line" | "break-spaces">;
type TextTransform = Loose<"none" | "capitalize" | "uppercase" | "lowercase">;
type BoxSizing = Loose<"border-box" | "content-box">;
type Visibility = Loose<"visible" | "hidden" | "collapse">;

/**
 * Plain CSS properties (camelCase, converted to kebab-case at runtime).
 * Color/font/shadow/radius properties live in TokenProps so they pick up theme tokens.
 */
export interface CSSProperties {
	// Layout
	display?: Display;
	position?: Position;
	inset?: Size;
	top?: Size;
	right?: Size;
	bottom?: Size;
	left?: Size;
	zIndex?: number | "auto";
	boxSizing?: BoxSizing;
	aspectRatio?: Size;
	overflow?: Overflow;
	overflowX?: Overflow;
	overflowY?: Overflow;
	visibility?: Visibility;
	objectFit?: ObjectFit;
	objectPosition?: string;
	isolation?: Loose<"auto" | "isolate">;
	float?: Loose<"none" | "left" | "right" | "inline-start" | "inline-end">;
	clear?: Loose<"none" | "left" | "right" | "both" | "inline-start" | "inline-end">;

	// Flex / grid
	flex?: Size;
	flexDirection?: FlexDirection;
	flexWrap?: FlexWrap;
	flexGrow?: number;
	flexShrink?: number;
	flexBasis?: Size;
	order?: number;
	alignItems?: AlignItems;
	alignContent?: JustifyContent;
	alignSelf?: AlignItems | "auto";
	justifyContent?: JustifyContent;
	justifyItems?: AlignItems;
	justifySelf?: AlignItems | "auto";
	placeItems?: string;
	placeContent?: string;
	placeSelf?: string;
	gap?: Size;
	rowGap?: Size;
	columnGap?: Size;
	gridTemplateColumns?: string;
	gridTemplateRows?: string;
	gridTemplateAreas?: string;
	gridColumn?: Size;
	gridRow?: Size;
	gridArea?: string;
	gridAutoFlow?: Loose<"row" | "column" | "dense" | "row dense" | "column dense">;
	gridAutoRows?: Size;
	gridAutoColumns?: Size;

	// Spacing / sizing (full names; short aliases in ShorthandProps)
	padding?: Size;
	paddingTop?: Size;
	paddingRight?: Size;
	paddingBottom?: Size;
	paddingLeft?: Size;
	margin?: Size;
	marginTop?: Size;
	marginRight?: Size;
	marginBottom?: Size;
	marginLeft?: Size;
	width?: Size;
	height?: Size;
	minWidth?: Size;
	minHeight?: Size;
	maxWidth?: Size;
	maxHeight?: Size;

	// Typography
	fontSize?: Size;
	fontStyle?: Loose<"normal" | "italic" | "oblique">;
	fontWeight?: FontWeight;
	lineHeight?: Size;
	letterSpacing?: Size;
	textAlign?: TextAlign;
	textTransform?: TextTransform;
	textDecoration?: Loose<"none" | "underline" | "overline" | "line-through">;
	textDecorationLine?: Loose<"none" | "underline" | "overline" | "line-through">;
	textDecorationStyle?: Loose<"solid" | "double" | "dotted" | "dashed" | "wavy">;
	textDecorationThickness?: Size;
	textUnderlineOffset?: Size;
	textOverflow?: Loose<"clip" | "ellipsis">;
	textShadow?: string;
	textIndent?: Size;
	whiteSpace?: WhiteSpace;
	wordBreak?: Loose<"normal" | "break-all" | "keep-all" | "break-word">;
	overflowWrap?: Loose<"normal" | "break-word" | "anywhere">;
	verticalAlign?: Loose<"baseline" | "top" | "middle" | "bottom" | "text-top" | "text-bottom">;
	fontVariantNumeric?: string;
	fontFeatureSettings?: string;

	// Border / outline (colors + radius in TokenProps)
	border?: string;
	borderTop?: string;
	borderRight?: string;
	borderBottom?: string;
	borderLeft?: string;
	borderWidth?: Size;
	borderStyle?: BorderStyle;
	outline?: string;
	outlineWidth?: Size;
	outlineStyle?: BorderStyle;
	outlineOffset?: Size;

	// Background (color in TokenProps via `bg`)
	backgroundImage?: string;
	backgroundSize?: Loose<"auto" | "cover" | "contain">;
	backgroundPosition?: string;
	backgroundRepeat?: Loose<"repeat" | "no-repeat" | "repeat-x" | "repeat-y" | "round" | "space">;
	backgroundAttachment?: Loose<"scroll" | "fixed" | "local">;
	backgroundClip?: Loose<"border-box" | "padding-box" | "content-box" | "text">;

	// Effects
	opacity?: number | string;
	filter?: string;
	backdropFilter?: string;
	mixBlendMode?: string;
	transform?: string;
	transformOrigin?: string;
	transition?: string;
	transitionProperty?: string;
	transitionDuration?: string;
	transitionTimingFunction?: string;
	transitionDelay?: string;
	animation?: string;
	willChange?: string;
	clipPath?: string;

	// Interaction
	cursor?: Cursor;
	pointerEvents?: PointerEvents;
	userSelect?: UserSelect;
	touchAction?: string;
	resize?: Loose<"none" | "both" | "horizontal" | "vertical">;
	scrollBehavior?: Loose<"auto" | "smooth">;
	scrollSnapType?: string;
	scrollSnapAlign?: string;
	appearance?: Loose<"none" | "auto">;
	accentColor?: string;

	// Misc
	content?: string;
	listStyle?: string;
	tableLayout?: Loose<"auto" | "fixed">;
	borderCollapse?: Loose<"collapse" | "separate">;
	borderSpacing?: Size;
	colorScheme?: Loose<"light" | "dark" | "light dark">;
	containerType?: Loose<"normal" | "size" | "inline-size">;
	containerName?: string;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------
export interface ThemeConfig {
	/** Color tokens — usable in bg, color, borderColor, outlineColor, caretColor, textDecorationColor. */
	colors?: Record<string, string>;
	/** Font-family tokens — usable in font / fontFamily. */
	fonts?: Record<string, string>;
	/** Box-shadow tokens — usable in shadow / boxShadow. */
	shadows?: Record<string, string>;
	/** Border-radius tokens — usable in rounded / borderRadius. */
	radii?: Record<string, string>;
	/**
	 * Responsive variants: name → media condition ("(min-width: 768px)")
	 * or a full at-rule prelude ("@container (min-width: 400px)").
	 * Declaration order = cascade order. Names must not collide with property names.
	 */
	screens?: Record<string, string>;
}

type Tokens<T extends ThemeConfig, K extends keyof ThemeConfig> =
	T[K] extends Record<string, string> ? Extract<keyof T[K], string> : never;

/** Properties whose string values resolve against theme tokens. */
interface TokenProps<T extends ThemeConfig> {
	/** background — color token, color, gradient, or any CSS background shorthand */
	bg?: Loose<Tokens<T, "colors">>;
	backgroundColor?: Loose<Tokens<T, "colors">>;
	color?: Loose<Tokens<T, "colors">>;
	borderColor?: Loose<Tokens<T, "colors">>;
	borderTopColor?: Loose<Tokens<T, "colors">>;
	borderRightColor?: Loose<Tokens<T, "colors">>;
	borderBottomColor?: Loose<Tokens<T, "colors">>;
	borderLeftColor?: Loose<Tokens<T, "colors">>;
	outlineColor?: Loose<Tokens<T, "colors">>;
	caretColor?: Loose<Tokens<T, "colors">>;
	textDecorationColor?: Loose<Tokens<T, "colors">>;
	/** font-family — token or font stack */
	font?: Loose<Tokens<T, "fonts">>;
	fontFamily?: Loose<Tokens<T, "fonts">>;
	/** box-shadow — token or raw value */
	shadow?: Loose<Tokens<T, "shadows">>;
	boxShadow?: Loose<Tokens<T, "shadows">>;
	/** border-radius — token, number (px), or raw value */
	rounded?: Tokens<T, "radii"> | Size;
	borderRadius?: Tokens<T, "radii"> | Size;
}

/** Tailwind-flavored short aliases. */
interface ShorthandProps {
	/** padding */ p?: Size;
	/** padding-left + padding-right */ px?: Size;
	/** padding-top + padding-bottom */ py?: Size;
	pt?: Size; pr?: Size; pb?: Size; pl?: Size;
	/** margin */ m?: Size;
	/** margin-left + margin-right */ mx?: Size;
	/** margin-top + margin-bottom */ my?: Size;
	mt?: Size; mr?: Size; mb?: Size; ml?: Size;
	/** width */ w?: Size;
	/** height */ h?: Size;
	minW?: Size; maxW?: Size; minH?: Size; maxH?: Size;
	/** width + height */ size?: Size;
	/** font-size */ text?: Size;
	/** font-weight */ weight?: FontWeight;
	/** line-height */ leading?: Size;
	/** letter-spacing */ tracking?: Size;
	/** text-align */ align?: TextAlign;
	/** align-items */ items?: AlignItems;
	/** justify-content */ justify?: JustifyContent;
	/** z-index */ z?: number | "auto";
	/** user-select */ select?: UserSelect;

	// Composite utilities (value must be `true`)
	/** display:flex + flex-direction:row */ row?: boolean;
	/** display:flex + flex-direction:column */ col?: boolean;
	/** align-items:center + justify-content:center */ center?: boolean;
	/** overflow:hidden + text-overflow:ellipsis + white-space:nowrap */ truncate?: boolean;
}

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
} as const satisfies Record<string, string>;
type Pseudo = keyof typeof PSEUDO;

/** Flat style: properties only, no variant nesting (used by keyframes/globalStyle). */
export type FlatStyle<T extends ThemeConfig = ThemeConfig> =
	TokenProps<T> & ShorthandProps & CSSProperties & {
		/** Escape hatch: raw CSS declarations, property names passed through as-is. */
		raw?: Record<string, string | number>;
	};

/**
 * Full style object: properties + pseudo variants + theme screens +
 * arbitrary selectors ("&:nth-child(2)", "& > svg") + inline at-rules
 * ("@media (min-width: 768px)", "@container (…)", "@supports (…)").
 */
export type Style<T extends ThemeConfig = ThemeConfig> = FlatStyle<T>
	& { [K in Pseudo]?: Style<T> }
	& { [K in Tokens<T, "screens">]?: Style<T> }
	& { [K in `&${string}`]?: Style<T> }
	& { [K in `@${string}`]?: Style<T> };

// Type alias (not interface) so it keeps the implicit index signature that
// makes it assignable to ExpandedElementAttributes — usable directly as a
// nuclo attributes object.
export type StyleResult = {
	className: string;
	toString(): string;
};

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

/** Inputs accepted by cx(): results, raw class strings, and falsy values. */
export type ClassInput = StyleResult | string | false | null | undefined;

/**
 * Compose class lists with exact conflict resolution: when two inputs style
 * the same (query, selector, property), the last one wins. Works because the
 * engine knows what every class it generated means.
 */
export function cx(...inputs: ClassInput[]): StyleResult {
	const picked = new Map<string, string>();
	for (const input of inputs) {
		if (!input) continue;
		const names = (typeof input === "string" ? input : input.className).split(" ");
		for (const name of names) {
			if (name) picked.set(conflictKeyOf(name) ?? name, name);
		}
	}
	let className = "";
	for (const name of picked.values()) className += (className ? " " : "") + name;
	return makeResult(className);
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
export function createCss<const T extends ThemeConfig>(theme: T = {} as T) {
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
	function keyframes(frames: Record<string, FlatStyle<T>>): string {
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

	return { css, cx, keyframes, globalStyle, theme };
}

// ---------------------------------------------------------------------------
// Default themeless instance — registered as globals by the runtime bootstrap.
// Apps with design tokens create their own instance via createCss(theme).
// ---------------------------------------------------------------------------
const defaultInstance = createCss({});

/** Themeless css() — full property/variant typing, no tokens or screens. */
export const css: (style: Style<object>) => StyleResult = defaultInstance.css;
/** Themeless keyframes() helper. */
export const keyframes: (frames: Record<string, FlatStyle<object>>) => string = defaultInstance.keyframes;
/** Themeless globalStyle() helper. */
export const globalStyle: (selector: string, style: FlatStyle<object>) => void = defaultInstance.globalStyle;
