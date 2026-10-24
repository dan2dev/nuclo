import "nuclo";

// Themed styling instance — tokens autocomplete inside css() calls.
export const { css, globalStyle, keyframes } = createCss({
	colors: {
		text: "#0b0d12",
		textMuted: "#5e6673",
		background: "#ffffff",
		surface: "#f7f7f8",
		border: "rgba(16, 18, 24, 0.1)",
		accent: "#c42800",
		primary: "#d92d00",
		primaryHover: "#c42800",
	},
	fonts: {
		body: "system-ui, -apple-system, sans-serif",
	},
});

globalStyle("*, *::before, *::after", { boxSizing: "border-box" });

globalStyle("body", {
	m: 0,
	font: "body",
	leading: 1.6,
	color: "text",
	bg: "background",
});

const focusRing = { outline: "2px solid", outlineColor: "accent", outlineOffset: 3 } as const;

const rise = keyframes({
	from: { opacity: 0, transform: "translateY(0.75rem)" },
	to: { opacity: 1, transform: "none" },
});

// The intro: each block rises in `delay` seconds after load, as the logo's ink sets.
const intro = (delay: number) => ({
	animation: `${rise} 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) ${delay}s both`,
	"@media (prefers-reduced-motion: reduce)": { animation: "none" },
});

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

	logo: css({ display: "block", filter: "drop-shadow(0 18px 24px rgba(255, 63, 0, 0.22))" }),

	card: css({
		...intro(1.1),
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

	links: css({
		...intro(1.2),
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
