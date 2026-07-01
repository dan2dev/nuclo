// Styling global type definitions.
//
// nuclo styling is atomic, theme-aware, typed CSS-in-TS:
//
//   const { css, cx } = createCss({
//     colors: { primary: "#6366f1" },
//     screens: { md: "(min-width: 768px)" },
//   });
//   const button = css({ px: 24, bg: "primary", hover: { bg: "#4f46e5" }, md: { px: 32 } });
//   div(button, "Save");
//
// The themeless defaults (css, cx, keyframes, globalStyle) are registered as
// globals by the runtime bootstrap; themed instances come from createCss().

import type {
	ClassInput as NucloClassInput,
	CSSProperties as NucloCSSProperties,
	FlatStyle as NucloFlatStyle,
	KeyframeFrames as NucloKeyframeFrames,
	KeyframeStop as NucloKeyframeStop,
	Size as NucloSize,
	Style as NucloStyle,
	StyleResult as NucloStyleResult,
	ThemeConfig as NucloThemeConfig,
	VariantDefinitions as NucloVariantDefinitions,
	VariantProps as NucloVariantProps,
	VariantsConfig as NucloVariantsConfig,
	VariantsFn as NucloVariantsFn,
} from "../../src/style/css";

declare global {
	export type Size = NucloSize;
	export type CSSProperties = NucloCSSProperties;
	export type ThemeConfig = NucloThemeConfig;
	export type FlatStyle<T extends ThemeConfig = ThemeConfig> = NucloFlatStyle<T>;
	export type Style<T extends ThemeConfig = ThemeConfig> = NucloStyle<T>;
	export type StyleResult = NucloStyleResult;
	export type ClassInput = NucloClassInput;
	export type KeyframeStop = NucloKeyframeStop;
	export type KeyframeFrames<T extends ThemeConfig = ThemeConfig> = NucloKeyframeFrames<T>;
	export type VariantDefinitions<T extends ThemeConfig = ThemeConfig> = NucloVariantDefinitions<T>;
	export type VariantProps<V extends VariantDefinitions> = NucloVariantProps<V>;
	export type VariantsConfig<T extends ThemeConfig, V extends VariantDefinitions<T>> = NucloVariantsConfig<T, V>;
	export type VariantsFn<V extends VariantDefinitions> = NucloVariantsFn<V>;

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

	/**
	 * Create a themed styling instance. Theme tokens (colors, fonts, shadows,
	 * radii) become autocompleted values; `screens` become responsive variant
	 * keys usable inside style objects.
	 */
	function createCss<const T extends ThemeConfig>(theme?: T): CssInstance<T>;

	/** Themeless css() — full property/variant typing, no tokens or screens. */
	function css(style: Style<object>): StyleResult;
	/** Compose class lists with last-wins conflict resolution. */
	function cx(...inputs: ClassInput[]): StyleResult;
	/** Themeless variants() recipe helper. */
	function variants<const V extends VariantDefinitions<object>>(
		config: VariantsConfig<object, V>,
	): VariantsFn<V>;
	/** Themeless keyframes() helper. */
	function keyframes(frames: KeyframeFrames<object>): string;
	/** Themeless globalStyle() helper. */
	function globalStyle(selector: string, style: FlatStyle<object>): void;
}

export {};
