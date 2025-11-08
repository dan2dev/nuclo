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
		xs: "0.5rem",
		sm: "0.75rem",
		md: "1rem",
		lg: "1.5rem",
		xl: "2rem",
		xxl: "3rem",
	},
	borderRadius: {
		sm: "8px",
		md: "12px",
		lg: "16px",
		xl: "20px",
	},
};

// Breakpoints
export const cn = createBreakpoints({
	small: "(max-width: 600px)",
	medium: "(min-width: 601px) and (max-width: 1024px)",
	large: "(min-width: 1025px)",
});

// Global styles
export const globalStyles = {
	// App container with glassmorphism
	appContainer: cn({
		small: bg("rgba(255, 255, 255, 0.95)")
			.padding("1.5rem")
			.borderRadius("20px")
			.width("100%"),
		medium: bg("rgba(255, 255, 255, 0.95)")
			.padding("2rem")
			.borderRadius("24px")
			.width("100%"),
		large: bg("rgba(255, 255, 255, 0.98)")
			.padding("2.5rem")
			.borderRadius("28px")
			.width("100%"),
	}),

	// Header with gradient
	header: cn({
		small: bg(theme.colors.bgGradient)
			.fontSize("2.5rem")
			.padding("2rem 1.5rem")
			.borderRadius(theme.borderRadius.lg)
			.color(theme.colors.bg)
			.textAlign("center")
			.margin("0 0 2rem 0"),
		medium: bg(theme.colors.bgGradient)
			.fontSize("3rem")
			.padding("2.5rem 2rem")
			.borderRadius(theme.borderRadius.xl)
			.color(theme.colors.bg)
			.textAlign("center")
			.margin("0 0 2.5rem 0"),
		large: bg(theme.colors.bgGradient)
			.fontSize("3.5rem")
			.padding("3rem 2.5rem")
			.borderRadius("24px")
			.color(theme.colors.bg)
			.textAlign("center")
			.margin("0 0 3rem 0"),
	}),

	// Input section container
	inputSection: cn({
		small: flex()
			.gap(theme.spacing.sm)
			.margin("0 0 2rem 0")
			.flexDirection("column"),
		medium: flex()
			.gap(theme.spacing.md)
			.margin("0 0 2rem 0")
			.flexDirection("row"),
		large: flex()
			.gap(theme.spacing.md)
			.margin("0 0 2.5rem 0")
			.flexDirection("row"),
	}),

	// Input field
	input: cn({
		small: padding("1rem")
			.fontSize("1rem")
			.borderRadius(theme.borderRadius.md)
			.border(`2px solid ${theme.colors.border}`)
			.bg(theme.colors.bg)
			.color(theme.colors.text)
			.width("100%"),
		medium: padding("1.125rem")
			.fontSize("1.0625rem")
			.borderRadius(theme.borderRadius.md)
			.border(`2px solid ${theme.colors.border}`)
			.bg(theme.colors.bg)
			.color(theme.colors.text)
			.width("100%"),
		large: padding("1.25rem")
			.fontSize("1.125rem")
			.borderRadius(theme.borderRadius.lg)
			.border(`2px solid ${theme.colors.border}`)
			.bg(theme.colors.bg)
			.color(theme.colors.text)
			.width("100%"),
	}),

	// Add button
	addButton: cn({
		small: bg(theme.colors.bgGradient)
			.color(theme.colors.bg)
			.padding("1rem 1.5rem")
			.fontSize("1rem")
			.borderRadius(theme.borderRadius.md)
			.border("none")
			.cursor("pointer")
			.width("100%"),
		medium: bg(theme.colors.bgGradient)
			.color(theme.colors.bg)
			.padding("1.125rem 2rem")
			.fontSize("1.0625rem")
			.borderRadius(theme.borderRadius.md)
			.border("none")
			.cursor("pointer")
			.width("auto"),
		large: bg(theme.colors.bgGradient)
			.color(theme.colors.bg)
			.padding("1.25rem 2.5rem")
			.fontSize("1.125rem")
			.borderRadius(theme.borderRadius.lg)
			.border("none")
			.cursor("pointer")
			.width("auto"),
	}),

	// Stats section
	stats: cn({
		small: bg(theme.colors.bgLight)
			.padding(theme.spacing.md)
			.borderRadius(theme.borderRadius.sm)
			.margin("0 0 1.5rem 0")
			.flex()
			.gap(theme.spacing.sm)
			.flexDirection("column")
			.color(theme.colors.textLight),
		medium: bg(theme.colors.bgLight)
			.padding(theme.spacing.lg)
			.borderRadius(theme.borderRadius.md)
			.margin("0 0 2rem 0")
			.flex()
			.gap(theme.spacing.md)
			.flexDirection("row")
			.color(theme.colors.textLight),
		large: bg(theme.colors.bgLight)
			.padding(theme.spacing.lg)
			.borderRadius(theme.borderRadius.md)
			.margin("0 0 2rem 0")
			.flex()
			.gap(theme.spacing.md)
			.flexDirection("row")
			.color(theme.colors.textLight),
	}),

	// Stats text
	statsText: cn({
		small: fontSize("0.9rem").color(theme.colors.textLight),
		medium: fontSize("0.95rem").color(theme.colors.textLight),
		large: fontSize("1rem").color(theme.colors.textLight),
	}),

	// Todo list container
	todoList: cn({
		small: flex().flexDirection("column").gap("0.75rem"),
		medium: flex().flexDirection("column").gap("0.875rem"),
		large: flex().flexDirection("column").gap("1rem"),
	}),

	// Todo item
	todoItem: cn({
		small: bg(theme.colors.bg)
			.padding("1rem")
			.borderRadius(theme.borderRadius.sm)
			.border(`1px solid ${theme.colors.border}`)
			.flex()
			.gap("0.75rem"),
		medium: bg(theme.colors.bg)
			.padding("1.25rem")
			.borderRadius(theme.borderRadius.md)
			.border(`1px solid ${theme.colors.border}`)
			.flex()
			.gap("1rem"),
		large: bg(theme.colors.bg)
			.padding("1.5rem")
			.borderRadius(theme.borderRadius.md)
			.border(`1px solid ${theme.colors.border}`)
			.flex()
			.gap("1.25rem"),
	}),

	// Todo text
	todoText: cn({
		small: fontSize("0.95rem")
			.color(theme.colors.text)
			.flex()
			.width("100%"),
		medium: fontSize("1rem")
			.color(theme.colors.text)
			.flex()
			.width("100%"),
		large: fontSize("1.0625rem")
			.color(theme.colors.text)
			.flex()
			.width("100%"),
	}),

	// Todo text done
	todoTextDone: cn({
		small: fontSize("0.95rem")
			.color(theme.colors.textMuted)
			.opacity("0.6"),
		medium: fontSize("1rem")
			.color(theme.colors.textMuted)
			.opacity("0.6"),
		large: fontSize("1.0625rem")
			.color(theme.colors.textMuted)
			.opacity("0.6"),
	}),

	// Delete button
	deleteButton: cn({
		small: bg(theme.colors.dangerBg)
			.color(theme.colors.danger)
			.padding("0.5rem 0.75rem")
			.borderRadius("6px")
			.border(`1px solid ${theme.colors.dangerLight}`)
			.cursor("pointer")
			.fontSize("0.875rem"),
		medium: bg(theme.colors.dangerBg)
			.color(theme.colors.danger)
			.padding("0.625rem 1rem")
			.borderRadius(theme.borderRadius.sm)
			.border(`1px solid ${theme.colors.dangerLight}`)
			.cursor("pointer")
			.fontSize("0.9rem"),
		large: bg(theme.colors.dangerBg)
			.color(theme.colors.danger)
			.padding("0.75rem 1.25rem")
			.borderRadius(theme.borderRadius.sm)
			.border(`1px solid ${theme.colors.dangerLight}`)
			.cursor("pointer")
			.fontSize("0.95rem"),
	}),

	// Clear completed button
	clearButton: cn({
		small: bg(theme.colors.dangerBg)
			.color(theme.colors.danger)
			.padding("0.625rem 1rem")
			.borderRadius(theme.borderRadius.sm)
			.border(`1px solid ${theme.colors.dangerLight}`)
			.cursor("pointer")
			.fontSize("0.875rem")
			.width("100%"),
		medium: bg(theme.colors.dangerBg)
			.color(theme.colors.danger)
			.padding("0.75rem 1.25rem")
			.borderRadius(theme.borderRadius.sm)
			.border(`1px solid ${theme.colors.dangerLight}`)
			.cursor("pointer")
			.fontSize("0.9rem")
			.width("auto"),
		large: bg(theme.colors.dangerBg)
			.color(theme.colors.danger)
			.padding("0.75rem 1.5rem")
			.borderRadius(theme.borderRadius.sm)
			.border(`1px solid ${theme.colors.dangerLight}`)
			.cursor("pointer")
			.fontSize("0.95rem")
			.width("auto"),
	}),

	// Empty state
	emptyState: cn({
		small: flex()
			.flexDirection("column")
			.center()
			.padding("3rem 1.5rem")
			.opacity("0.5")
			.textAlign("center")
			.gap(theme.spacing.md)
			.color(theme.colors.textMuted),
		medium: flex()
			.flexDirection("column")
			.center()
			.padding("4rem 2rem")
			.opacity("0.5")
			.textAlign("center")
			.gap(theme.spacing.lg)
			.color(theme.colors.textMuted),
		large: flex()
			.flexDirection("column")
			.center()
			.padding("5rem 3rem")
			.opacity("0.6")
			.textAlign("center")
			.gap(theme.spacing.lg)
			.color(theme.colors.textMuted),
	}),

	// Empty state text
	emptyText: cn({
		small: fontSize("1rem")
			.color(theme.colors.textMuted)
			.margin("0"),
		medium: fontSize("1.125rem")
			.color(theme.colors.textMuted)
			.margin("0"),
		large: fontSize("1.25rem")
			.color(theme.colors.textMuted)
			.margin("0"),
	}),

	// Checkbox
	checkbox: cn({
		small: width("20px").height("20px").cursor("pointer"),
		medium: width("22px").height("22px").cursor("pointer"),
		large: width("24px").height("24px").cursor("pointer"),
	}),
};
