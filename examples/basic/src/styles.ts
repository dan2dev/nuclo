// Theme configuration
export const theme = {
	colors: {
		primary: "#667eea",
		primaryDark: "#5a67d8",
		secondary: "#764ba2",
		danger: "#e53e3e",
		dangerLight: "#fc8181",
		dangerBg: "#fff5f5",
		success: "#48bb78",
		text: "#2d3748",
		textLight: "#718096",
		textMuted: "#a0aec0",
		bg: "#ffffff",
		bgLight: "#f7fafc",
		bgGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
		border: "#e2e8f0",
		shadow: "rgba(0, 0, 0, 0.1)",
	},
	spacing: {
		xs: "0.25rem",
		sm: "0.5rem",
		md: "0.75rem",
		lg: "1rem",
		xl: "1.5rem",
		xxl: "2rem",
	},
	borderRadius: {
		sm: "6px",
		md: "8px",
		lg: "12px",
		xl: "16px",
	},
};

// Breakpoints
export const cn = createBreakpoints({
	small: "(max-width: 600px)",
	medium: "(min-width: 601px) and (max-width: 1024px)",
	large: "(min-width: 1025px)",
});

// Global styles - cascading from small to large (only override what changes)
export const globalStyles = {
	// App container with glassmorphism
	appContainer: cn({
		small: bg("rgba(255, 255, 255, 0.95)")
			.padding(theme.spacing.lg)
			.borderRadius(theme.borderRadius.xl)
			.width("100%"),
		medium: padding(theme.spacing.xl),
		large: padding("2rem"),
	}),

	// Header with gradient
	header: cn({
		small: bg(theme.colors.bgGradient)
			.fontSize("1.5rem")
			.padding(theme.spacing.lg)
			.borderRadius(theme.borderRadius.md)
			.color(theme.colors.bg)
			.textAlign("center")
			.margin(`0 0 ${theme.spacing.lg} 0`),
		medium: fontSize("1.75rem").padding(theme.spacing.xl),
		large: fontSize("2rem").borderRadius(theme.borderRadius.lg),
	}),

	// Input section container
	inputSection: cn({
		small: flex()
			.gap(theme.spacing.sm)
			.margin(`0 0 ${theme.spacing.lg} 0`)
			.flexDirection("column"),
		medium: flexDirection("row").gap(theme.spacing.md),
	}),

	// Input field
	input: cn({
		small: padding(theme.spacing.md)
			.fontSize("0.9375rem")
			.borderRadius(theme.borderRadius.sm)
			.border(`2px solid ${theme.colors.border}`)
			.bg(theme.colors.bg)
			.color(theme.colors.text)
			.width("100%"),
		medium: padding(theme.spacing.lg),
		large: borderRadius(theme.borderRadius.md),
	}),

	// Add button
	addButton: cn({
		small: bg(theme.colors.bgGradient)
			.color(theme.colors.bg)
			.padding(`${theme.spacing.md} ${theme.spacing.lg}`)
			.fontSize("0.9375rem")
			.borderRadius(theme.borderRadius.sm)
			.border("none")
			.cursor("pointer")
			.width("100%"),
		medium: width("auto"),
		large: borderRadius(theme.borderRadius.md),
	}),

	// Stats section
	stats: cn({
		small: bg(theme.colors.bgLight)
			.padding(theme.spacing.md)
			.borderRadius(theme.borderRadius.sm)
			.margin(`0 0 ${theme.spacing.lg} 0`)
			.flex()
			.gap(theme.spacing.sm)
			.flexDirection("column")
			.color(theme.colors.textLight),
		medium: flexDirection("row")
			.padding(theme.spacing.lg)
			.gap(theme.spacing.md),
	}),

	// Stats text
	statsText: cn({
		small: fontSize("0.875rem").color(theme.colors.textLight),
	}),

	// Todo list container
	todoList: cn({
		small: flex().flexDirection("column").gap(theme.spacing.sm),
		medium: gap(theme.spacing.md),
	}),

	// Todo item
	todoItem: cn({
		small: bg(theme.colors.bg)
			.padding(theme.spacing.md)
			.borderRadius(theme.borderRadius.sm)
			.border(`1px solid ${theme.colors.border}`)
			.flex()
			.gap(theme.spacing.sm),
		medium: padding(theme.spacing.lg).gap(theme.spacing.md),
	}),

	// Todo text
	todoText: cn({
		small: fontSize("0.9375rem")
			.color(theme.colors.text)
			.flex()
			.width("100%"),
	}),

	// Todo text done
	todoTextDone: cn({
		small: fontSize("0.9375rem")
			.color(theme.colors.textMuted)
			.opacity("0.6"),
	}),

	// Delete button
	deleteButton: cn({
		small: bg(theme.colors.dangerBg)
			.color(theme.colors.danger)
			.padding(`${theme.spacing.sm} ${theme.spacing.md}`)
			.borderRadius(theme.borderRadius.sm)
			.border(`1px solid ${theme.colors.dangerLight}`)
			.cursor("pointer")
			.fontSize("0.8125rem"),
	}),

	// Clear completed button
	clearButton: cn({
		small: bg(theme.colors.dangerBg)
			.color(theme.colors.danger)
			.padding(`${theme.spacing.sm} ${theme.spacing.md}`)
			.borderRadius(theme.borderRadius.sm)
			.border(`1px solid ${theme.colors.dangerLight}`)
			.cursor("pointer")
			.fontSize("0.8125rem")
			.width("100%"),
		medium: width("auto").padding(`${theme.spacing.md} ${theme.spacing.lg}`),
	}),

	// Empty state
	emptyState: cn({
		small: flex()
			.flexDirection("column")
			.center()
			.padding(`${theme.spacing.xxl} ${theme.spacing.lg}`)
			.opacity("0.5")
			.textAlign("center")
			.gap(theme.spacing.md)
			.color(theme.colors.textMuted),
		medium: padding(`3rem ${theme.spacing.xl}`),
	}),

	// Empty state text
	emptyText: cn({
		small: fontSize("0.9375rem")
			.color(theme.colors.textMuted)
			.margin("0"),
	}),

	// Checkbox
	checkbox: cn({
		small: width("18px").height("18px").cursor("pointer"),
	}),
};
