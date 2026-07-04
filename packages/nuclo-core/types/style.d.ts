/**
 * nuclo styling type definitions — atomic, theme-aware, typed CSS-in-TS.
 *
 * This module is the single source of truth for the styling types. It lives in
 * `types/` (shipped in the npm package alongside `dist/`) so that both the
 * hand-written global declarations (`types/features/style.d.ts`) and the
 * runtime implementation (`src/style/css.ts`) can import it — in the repo and
 * in the published tarball alike. Do not move these into `src/`: `src/` is not
 * published, and a d.ts import into it breaks every consumer's types.
 */

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

/**
 * Pseudo-class / pseudo-element variant keys usable inside style objects.
 * The runtime selector for each key lives in the `PSEUDO` table in
 * `src/style/css.ts`, which is typed `satisfies Record<Pseudo, string>` —
 * adding a key on either side without the other is a compile error.
 */
export type Pseudo =
	| "hover" | "focus" | "focusVisible" | "focusWithin" | "active" | "visited"
	| "disabled" | "enabled" | "checked" | "required" | "invalid" | "valid"
	| "readOnly" | "first" | "last" | "only" | "odd" | "even" | "empty"
	| "placeholderShown" | "placeholder" | "before" | "after" | "selection"
	| "marker" | "firstLine" | "firstLetter";

/** Flat style: properties only, no variant nesting (used by keyframes/globalStyle). */
export type FlatStyle<T extends ThemeConfig = ThemeConfig> =
	TokenProps<T> & ShorthandProps & CSSProperties & {
		/** Escape hatch: raw CSS declarations, property names passed through as-is. */
		raw?: Record<string, string | number>;
	};

/**
 * Keyframe selectors: `from`, `to`, and percentage stops autocomplete; any other
 * string (e.g. a comma-separated list like "0%, 100%") is still accepted.
 */
export type KeyframeStop = "from" | "to" | `${number}%`;

/** Frames passed to keyframes(): selector → flat declarations. */
export type KeyframeFrames<T extends ThemeConfig = ThemeConfig> =
	& { [Stop in KeyframeStop]?: FlatStyle<T> }
	& { [stop: string]: FlatStyle<T> | undefined };

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
// Variants — typed, atomic style recipes (base + named variant groups +
// defaults + compound variants). One recipe in, a call-with-props function out.
// ---------------------------------------------------------------------------

/** A map of variant groups: group name → variant value name → style object. */
export type VariantDefinitions<T extends ThemeConfig = ThemeConfig> =
	Record<string, Record<string, Style<T>>>;

/**
 * A group whose only values are "true"/"false" is selected with a real boolean;
 * every other group is selected by its declared value names.
 */
type VariantValue<Keys extends PropertyKey> =
	[Extract<Keys, string>] extends ["true" | "false"] ? boolean : Extract<Keys, string>;

/** Strongly-typed selection of variant values for a given variant definition. */
export type VariantProps<V extends VariantDefinitions> = {
	[Group in keyof V]?: VariantValue<keyof V[Group]>;
};

/** Configuration object accepted by variants(). */
export interface VariantsConfig<T extends ThemeConfig, V extends VariantDefinitions<T>> {
	/** Styles always applied, before any variant. */
	base?: Style<T>;
	/**
	 * Named variant groups: each value maps to a style object. `V` is inferred
	 * with its literal group/value names (so selection, defaults and compounds
	 * are strictly typed), and each style object is checked against `Style<T>`.
	 */
	variants?: V;
	/** Variant values applied when a prop is omitted at the call site. */
	defaultVariants?: VariantProps<NoInfer<V>>;
	/** Extra styles applied when a specific combination of variants is active. */
	compoundVariants?: Array<VariantProps<NoInfer<V>> & { css: Style<T> }>;
}

/** A compiled recipe: call with a selection to get a composed StyleResult. */
export type VariantsFn<V extends VariantDefinitions> = (props?: VariantProps<V>) => StyleResult;

/** Inputs accepted by cx(): results, raw class strings, falsy values, and nested arrays. */
export type ClassInput = StyleResult | string | false | null | undefined | readonly ClassInput[];

/** A themed styling instance returned by createCss(). */
export interface CssInstance<T extends ThemeConfig = ThemeConfig> {
	/**
	 * Compile a style object into atomic CSS classes.
	 * Returns `{ className }` — usable directly as a nuclo attributes object.
	 */
	css(style: Style<T>): StyleResult;
	/**
	 * Compose class lists with exact conflict resolution: when two inputs
	 * style the same (query, selector, property), the last one wins.
	 * Accepts results, raw class strings, nested arrays, and falsy values.
	 */
	cx(...inputs: ClassInput[]): StyleResult;
	/**
	 * Compile a typed variants recipe (base + named variant groups + defaults
	 * + compound variants) into a call-with-props function returning a
	 * composed StyleResult. Variant names and values are inferred and checked.
	 */
	variants<const V extends VariantDefinitions<T>>(config: VariantsConfig<T, V>): VariantsFn<V>;
	/** Register a @keyframes block; returns its generated animation name. */
	keyframes(frames: KeyframeFrames<T>): string;
	/** Global selector styles (body, resets). Flat properties only. */
	globalStyle(selector: string, style: FlatStyle<T>): void;
	/** The theme this instance was created with. */
	theme: T;
}
