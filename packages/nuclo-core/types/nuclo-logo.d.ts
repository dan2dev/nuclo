/**
 * Type declarations for the `nuclo/nuclo-logo` subpath.
 *
 * Hand-written (mirroring src/logo/index.ts) and shipped from `types/` like the
 * other subpaths, so they stay typed when `dist/` holds only watch-mode bundles.
 *
 *   import nucloLogo from "nuclo/nuclo-logo";
 *   main(nucloLogo({ height: 48 }));
 *
 * The logo builds on the nuclo runtime's globals, so the app imports "nuclo" too.
 */

// Load the ambient nuclo globals (SVGElementModifierLike, DetachedSVGElementFactory, …).
import "./index";

export type NucloLogoOptions = {
	/** Height in px; the width follows the logo's proportions. Default 32. */
	height?: number;
	/** Draw the logo when it mounts (skipped under prefers-reduced-motion). Default true. */
	animate?: boolean;
};

/**
 * The Nuclo logo, mark and name, as an `<svg>`. The name takes the text color
 * (currentColor). Extra modifiers (classes, attributes) go on the svg.
 */
export default function nucloLogo(
	options?: NucloLogoOptions,
	...mods: SVGElementModifierLike<"svg">[]
): DetachedSVGElementFactory<"svg">;
