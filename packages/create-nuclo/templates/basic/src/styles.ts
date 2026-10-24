import "nuclo";

// Your design tokens. Inside css() you can write color: "textMuted" instead of the hex value,
// and wide: { ... } for styles that apply only on screens at least 40rem wide.
export const { css, globalStyle } = createCss({
	colors: {
		text: "#0b0d12",
		textMuted: "#5e6673",
		background: "#ffffff",
		surface: "#f7f7f8",
		border: "rgba(16, 18, 24, 0.1)",
		accent: "#c42800",
	},
	fonts: {
		body: "system-ui, -apple-system, sans-serif",
		mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
	},
	screens: {
		wide: "(min-width: 40rem)",
	},
});

// Styles for plain HTML elements.
globalStyle("*", { boxSizing: "border-box" });
globalStyle("body", { m: 0, font: "body", leading: 1.6, color: "text", bg: "background" });

// A dotted grid behind the logo, fading out toward the edges.
globalStyle("body::before", {
	content: '""',
	position: "fixed",
	inset: 0,
	zIndex: -1,
	backgroundImage: "radial-gradient(rgba(16, 18, 24, 0.12) 1px, transparent 1px)",
	backgroundSize: "22px 22px",
	raw: { "mask-image": "radial-gradient(ellipse 50% 45% at 50% 38%, #000, transparent)" },
});

// Each css() call returns a class. Pass it to a tag: main(styles.page, ...).
export const styles = {
	page: css({
		col: true,
		items: "center",
		justify: "center",
		gap: "3.5rem",
		minH: "100svh",
		maxW: "44rem",
		mx: "auto",
		px: "1.5rem",
		py: "4rem",
	}),

	hero: css({ col: true, items: "center", gap: "1.5rem", align: "center" }),

	logo: css({ maxW: "100%", h: "auto", filter: "drop-shadow(0 18px 24px rgba(255, 63, 0, 0.22))" }),

	message: css({ m: 0, text: "0.9375rem", color: "textMuted", raw: { "text-wrap": "balance" } }),

	code: css({
		font: "mono",
		text: "0.875em",
		color: "text",
		bg: "surface",
		border: "1px solid",
		borderColor: "border",
		rounded: 6,
		px: "0.4em",
		py: "0.1em",
	}),

	// One panel for all the links. The 1px gap between them shows the panel's
	// background, which draws the dividers. Stacked on phones, side by side when wide.
	links: css({
		display: "grid",
		gap: "1px",
		w: "100%",
		bg: "border",
		border: "1px solid",
		borderColor: "border",
		rounded: 16,
		overflow: "hidden",
		boxShadow: "0 24px 60px -36px rgba(15, 23, 42, 0.25)",
		wide: { gridTemplateColumns: "repeat(3, 1fr)" },
	}),

	link: css({
		col: true,
		gap: "0.25rem",
		p: "1.25rem",
		color: "text",
		bg: "background",
		textDecoration: "none",
		hover: { bg: "surface" },
		focusVisible: { outline: "2px solid", outlineColor: "accent", outlineOffset: -2 },
	}),

	linkTitle: css({ row: true, justify: "space-between", weight: 650 }),

	arrow: css({ color: "accent" }),

	linkText: css({ text: "0.875rem", leading: 1.5, color: "textMuted" }),
};
