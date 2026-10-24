import "nuclo";

// Themed styling instance — tokens autocomplete inside css() calls.
// light-dark() picks the first value in light mode and the second in dark mode,
// following the visitor's system setting (see color-scheme on :root below).
export const { css, globalStyle } = createCss({
	colors: {
		text: "light-dark(#0b0d12, #fff8f2)",
		textMuted: "light-dark(#5e6673, #a59d95)",
		background: "light-dark(#ffffff, #080808)",
		surface: "light-dark(#f7f7f8, #121212)",
		border: "light-dark(rgba(16, 18, 24, 0.1), rgba(255, 248, 242, 0.1))",
		accent: "light-dark(#c42800, #ff6a3d)",
		code: "light-dark(#fff0e8, #1d1d1d)",
		primary: "#d92d00",
		primaryHover: "#c42800",
	},
	fonts: {
		body: "system-ui, -apple-system, sans-serif",
		mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
	},
});

globalStyle(":root", { colorScheme: "light dark" });

globalStyle("*, *::before, *::after", { boxSizing: "border-box" });

globalStyle("body", {
	m: 0,
	font: "body",
	leading: 1.6,
	color: "text",
	bg: "background",
});

const focusRing = { outline: "2px solid", outlineColor: "accent", outlineOffset: 3 } as const;

export const styles = {
	page: css({
		col: true,
		items: "center",
		justify: "center",
		gap: "2.5rem",
		minH: "100svh",
		maxW: "56rem",
		mx: "auto",
		px: "1.5rem",
		py: "4rem",
	}),

	hero: css({
		col: true,
		items: "center",
		gap: "1rem",
		align: "center",
	}),

	logo: css({ display: "block", h: "auto" }),

	title: css({
		m: 0,
		text: "clamp(2rem, 6vw, 3rem)",
		weight: 800,
		leading: 1.1,
		tracking: "-0.03em",
		raw: { "text-wrap": "balance" },
	}),

	lead: css({ m: 0, text: "1.125rem", color: "textMuted" }),

	card: css({
		col: true,
		items: "center",
		gap: "1rem",
		w: "100%",
		maxW: "28rem",
		p: "2rem",
		bg: "surface",
		border: "1px solid",
		borderColor: "border",
		rounded: 16,
	}),

	button: css({
		minW: "10rem",
		minH: "2.75rem",
		px: "1.5rem",
		border: "none",
		rounded: 9999,
		text: "1rem",
		weight: 700,
		fontVariantNumeric: "tabular-nums",
		color: "#ffffff",
		bg: "primary",
		cursor: "pointer",
		transition: "background-color 0.15s, transform 0.15s",
		hover: { bg: "primaryHover" },
		active: { transform: "scale(0.97)" },
		focusVisible: focusRing,
	}),

	hint: css({ m: 0, text: "0.875rem", color: "textMuted", align: "center" }),

	code: css({
		font: "mono",
		text: "0.875em",
		bg: "code",
		rounded: 6,
		py: "0.15em",
		px: "0.4em",
	}),

	links: css({
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
		gap: "1rem",
		w: "100%",
	}),

	link: css({
		col: true,
		gap: "0.25rem",
		p: "1.25rem",
		border: "1px solid",
		borderColor: "border",
		rounded: 12,
		color: "text",
		textDecoration: "none",
		transition: "border-color 0.15s",
		hover: { borderColor: "accent" },
		focusVisible: focusRing,
	}),

	arrow: css({ color: "accent" }),

	linkText: css({ text: "0.875rem", color: "textMuted" }),
};
