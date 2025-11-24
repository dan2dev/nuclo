import "nuclo";

// Theme configuration - Modern, vibrant design
export const theme = {
	colors: {
		primary: "#6366f1",
		primaryLight: "#818cf8",
		primaryDark: "#4f46e5",
		accent: "#8b5cf6",
		accentLight: "#a78bfa",
		danger: "#ef4444",
		dangerLight: "#f87171",
		success: "#10b981",
		text: "#1f2937",
		textLight: "#6b7280",
		textMuted: "#9ca3af",
		bg: "#ffffff",
		bgGradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
		bgSoft: "#f8fafc",
		border: "#e2e8f0",
		borderLight: "#f1f5f9",
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
		sm: "8px",
		md: "12px",
		lg: "16px",
		xl: "20px",
	},
	shadows: {
		sm: "0 1px 3px rgba(0, 0, 0, 0.1)",
		md: "0 4px 6px rgba(0, 0, 0, 0.07)",
		lg: "0 10px 25px rgba(0, 0, 0, 0.1)",
		colored: "0 8px 20px rgba(99, 102, 241, 0.3)",
	},
};

// Style Queries (Media, Container, Feature)
// Pseudo-classes (hover, focus, active, etc.) are automatically available
export const cn = createStyleQueries({
	small: "@container (min-width: 341px)",
	medium: "@container (min-width: 601px)",
	large: "@container (min-width: 1025px)",
});


// Global styles - cascading from small to large (only override what changes)
export const globalStyles = {
	// Body styles
	// body: cn(bg("linear-gradient(to bottom right, #f0f4ff, #e0e7ff)")
	// 	.margin("0")
	// 	.padding(theme.spacing.lg)
	// 	.minHeight("100vh")
	// 	.fontFamily("'Inter', system-ui, -apple-system, sans-serif")
	// 	.fontSize("16px")
	// 	.color(theme.colors.text)
	// 	.lineHeight("1.6"),
	// ),
	body: cn(bg("linear-gradient(to bottom right, #f0f4ff, #e0e7ff)")
		.margin("0")
		// .display("blo")
		// .containerType("inline-size")
		// .containerType("inline-size")
		.containerType("inline-size")
		.padding(theme.spacing.lg)
		.paddingLeft(`23px`)
		.minHeight("100vh")
		.fontFamily("'Inter', system-ui, -apple-system, sans-serif")
		.fontSize("16px")
		.color(theme.colors.text)
		.boxSizing("border-box")
		.lineHeight("1.6"),
	),
	red: cn(bg("#FF0000")
		.padding(theme.spacing.xl)
		.borderRadius(theme.borderRadius.lg)
		.boxShadow(theme.shadows.lg)
		.width("100%")
		.maxWidth("400px")
		.margin("0 auto"), {
		small: bg("#FF3333"),
	}),

	blue: cn(bg("#0000FF")
		.padding(theme.spacing.xl)
		.borderRadius(theme.borderRadius.lg)
		.boxShadow(theme.shadows.lg)
		.width("100%")
		.maxWidth("400px")
		.margin("0 auto"), {
		small: bg("#3333FF"),
	}),

	// App wrapper
	appWrapper: cn(width("100%").maxWidth("600px").margin("0 auto")),

	// App container with modern card design
	appContainer: cn(
		bg(theme.colors.bg)
			.padding(theme.spacing.xl)
			.borderRadius(theme.borderRadius.xl)
			.boxShadow(theme.shadows.lg)
			.width("100%"),
		{
			medium: padding("2rem"),
			large: padding("2.5rem"),
		}),

	// Header with gradient
	header: cn(fontSize("2rem")
		.bg(theme.colors.primary)
		.fontWeight("700")
		.padding(`${theme.spacing.xxl} ${theme.spacing.xl}`)
		.borderRadius(theme.borderRadius.lg)
		.color("#ffffff")
		.textAlign("center")
		.margin(`0 0 ${theme.spacing.xxl} 0`)
		.boxShadow("0 8px 24px rgba(99, 102, 241, 0.35)")
		.letterSpacing("-0.5px")
		.display("flex")
		.alignItems("center")
		.justifyContent("center")
		.gap(theme.spacing.md), {
		medium: bg("#FF0000").fontSize("2.25rem").padding(`${theme.spacing.xxl} ${theme.spacing.xxl}`),

		large: fontSize("2.5rem"),
	}),

	// H1 reset
	h1Reset: cn(margin("0").padding("0").fontSize("inherit").fontWeight("inherit")),

	// Input section container
	inputSection: cn(flex().gap(theme.spacing.md).margin(`0 0 ${theme.spacing.xl} 0`).flexDirection("column"), {
		medium: flexDirection("row"),
	}),

	// Input field with modern design
	input: cn(padding(`${theme.spacing.lg} ${theme.spacing.xl}`)
		.fontSize("1rem")
		.borderRadius(theme.borderRadius.md)
		.border(`2px solid ${theme.colors.border}`)
		.bg("#ffffff")
		.color(theme.colors.text)
		.width("100%")
		.outline("none")
		.transition("all 0.2s ease")
		.boxShadow("0 1px 3px rgba(0, 0, 0, 0.05)")
		.fontFamily("inherit"),
	),

	// Add button with gradient
	addButton: cn(bg(theme.colors.primary)
		.color("#ffffff")
		.padding(`${theme.spacing.lg} ${theme.spacing.xl}`)
		.fontSize("1rem")
		.fontWeight("600")
		.borderRadius(theme.borderRadius.md)
		.border("none")
		.cursor("pointer")
		.width("100%")
		.boxShadow("0 4px 12px rgba(99, 102, 241, 0.4)")
		.transition("all 0.2s ease")
		.display("flex")
		.alignItems("center")
		.justifyContent("center")
		.gap(theme.spacing.sm)
		.outline("none"), {
		medium: width("auto").minWidth("160px"),
		hover: bg(theme.colors.primaryDark).boxShadow("0 6px 16px rgba(99, 102, 241, 0.5)"),
		active: bg(theme.colors.primaryDark).transform("scale(0.98)"),
	}),

	// Stats section
	stats: cn(bg("#ffffff")
		.padding(`${theme.spacing.lg} ${theme.spacing.xl}`)
		.borderRadius(theme.borderRadius.md)
		.margin(`0 0 ${theme.spacing.xl} 0`)
		.flex()
		.alignItems("center")
		.justifyContent("space-between")
		.gap(theme.spacing.md)
		.flexDirection("column")
		.border(`2px solid ${theme.colors.border}`)
		.boxShadow("0 2px 8px rgba(0, 0, 0, 0.08)"), {
		medium: flexDirection("row").padding(theme.spacing.xl),
	}),

	// Stats text
	statsText: cn(fontSize("1rem").fontWeight("600").color(theme.colors.text)),

	// Todo list container
	todoList: cn(flex().flexDirection("column").gap(theme.spacing.md)),

	// Todo item with modern card
	todoItem: cn(
		bg("#ffffff")
			.padding(`${theme.spacing.lg} ${theme.spacing.xl}`)
			.borderRadius(theme.borderRadius.md)
			.border(`2px solid ${theme.colors.border}`)
			.flex()
			.flexDirection("column")
			.alignItems("center")
			.gap(theme.spacing.lg)
			.transition("all 0.2s ease")
			.boxShadow("0 2px 8px rgba(0, 0, 0, 0.08)"), {
		medium: padding(`${theme.spacing.xl} ${theme.spacing.xl}`),
	}),

	// Todo text
	todoText: cn(fontSize("1rem").color(theme.colors.text).flex("1").lineHeight("1.5").fontWeight("500")),

	// Todo text done with strikethrough
	todoTextDone: cn(fontSize("1rem")
		.color(theme.colors.textMuted)
		.flex("1")
		.lineHeight("1.5")
		.textDecoration("line-through")
		.opacity("0.6")
		.fontWeight("500"),
	),

	// Delete button with modern design
	deleteButton: cn(bg("#fef2f2")
		.color(theme.colors.danger)
		.padding(theme.spacing.md)
		.borderRadius(theme.borderRadius.sm)
		.border(`2px solid #fee2e2`)
		.cursor("pointer")
		.fontSize("1.125rem")
		.transition("all 0.2s ease")
		.display("flex")
		.alignItems("center")
		.justifyContent("center")
		.width("40px")
		.height("40px")
		.minWidth("40px"),
	),

	// Clear completed button
	clearButton: cn(bg("#fef2f2")
		.color(theme.colors.danger)
		.padding(`${theme.spacing.sm} ${theme.spacing.lg}`)
		.borderRadius(theme.borderRadius.sm)
		.border(`2px solid #fee2e2`)
		.cursor("pointer")
		.fontSize("0.875rem")
		.fontWeight("600")
		.transition("all 0.2s ease")
		.width("100%"), {
		medium: width("auto"),
	}),

	// Empty state with modern design
	emptyState: cn(flex()
		.flexDirection("column")
		.alignItems("center")
		.justifyContent("center")
		.padding(`${theme.spacing.xxl} ${theme.spacing.lg}`)
		.textAlign("center")
		.gap(theme.spacing.lg)
		.color(theme.colors.textMuted)
		.bg(theme.colors.bgSoft)
		.borderRadius(theme.borderRadius.lg)
		.border(`2px dashed ${theme.colors.border}`),
		{
			medium: padding(`3rem ${theme.spacing.xxl}`),
		}),

	// Empty state text
	emptyText: cn(fontSize("1rem").color(theme.colors.textLight).margin("0").fontWeight("500")),

	// Checkbox with modern styling
	checkbox: cn(width("20px").height("20px").cursor("pointer").accentColor(theme.colors.primary).minWidth("20px")),

	// Subtasks list (nested under todo)
	subtaskList: cn(flex().flexDirection("column").gap(theme.spacing.sm).paddingLeft(theme.spacing.lg).margin("0")),

	// Subtask item - smaller than todo item
	subtaskItem: cn(
		bg("#ffffff")
			.padding(`${theme.spacing.sm} ${theme.spacing.lg}`)
			.borderRadius(theme.borderRadius.sm)
			.border(`1px solid ${theme.colors.border}`)
			.flex()
			.flexDirection("column")
			.alignItems("center")
			.gap(theme.spacing.md)
			.boxShadow("0 1px 4px rgba(0, 0, 0, 0.03)"),
	),

	// Row for subtask input + add button
	subtaskInputRow: cn(flex().gap(theme.spacing.md).margin(`0 0 ${theme.spacing.md} 0`).alignItems("center")),
};
