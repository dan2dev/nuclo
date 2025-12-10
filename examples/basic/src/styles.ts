import "nuclo";

// Simple color palette
const colors = {
  primary: "#6366f1",
  primaryHover: "#4f46e5",
  danger: "#ef4444",
  dangerHover: "#dc2626",
  text: "#1f2937",
  textLight: "#6b7280",
  bg: "#ffffff",
  bgGradient: "linear-gradient(135deg, #f0f4ff, #e0e7ff)",
  border: "#e2e8f0",
};

export const cn = createStyleQueries({});

// Global styles
export const globalStyles = {
  body: cn(
    bg(colors.bgGradient)
      .margin("0")
      .padding("20px")
      .minHeight("100vh")
      .fontFamily("system-ui, -apple-system, sans-serif")
      .fontSize("16px")
      .color(colors.text)
      .boxSizing("border-box")
  ),

  container: cn(
    bg(colors.bg)
      .padding("30px")
      .borderRadius("16px")
      .boxShadow("0 10px 25px rgba(0, 0, 0, 0.1)")
      .width("100%")
      .maxWidth("500px")
      .margin("0 auto")
  ),

  header: cn(
    fontSize("28px")
      .fontWeight("700")
      .color(colors.primary)
      .marginBottom("24px")
      .textAlign("center")
  ),

  inputContainer: cn(
    display("flex")
      .gap("12px")
      .marginBottom("24px")
  ),

  input: cn(
    flex("1")
      .padding("12px 16px")
      .fontSize("16px")
      .border("2px solid " + colors.border)
      .borderRadius("8px")
      .outline("none")
      .transition("border-color 0.2s"),
    {
      ":focus": border("2px solid " + colors.primary),
    }
  ),

  addButton: cn(
    padding("12px 24px")
      .bg(colors.primary)
      .color(colors.bg)
      .border("none")
      .borderRadius("8px")
      .fontSize("16px")
      .fontWeight("600")
      .cursor("pointer")
      .transition("background-color 0.2s"),
    {
      ":hover": bg(colors.primaryHover),
    }
  ),

  todoList: cn(
    display("flex")
      .flexDirection("column")
      .gap("12px")
  ),

  todoItem: cn(
    display("flex")
      .alignItems("center")
      .gap("12px")
      .padding("16px")
      .bg("#f9fafb")
      .borderRadius("8px")
      .transition("background-color 0.2s"),
    {
      ":hover": bg("#f3f4f6"),
    }
  ),

  checkbox: cn(
    width("20px")
      .height("20px")
      .cursor("pointer")
      .accentColor(colors.primary)
  ),

  todoText: cn(
    flex("1")
      .fontSize("16px")
      .color(colors.text)
  ),

  todoTextCompleted: cn(
    flex("1")
      .fontSize("16px")
      .color(colors.textLight)
      .textDecoration("line-through")
  ),

  deleteButton: cn(
    padding("8px 12px")
      .bg(colors.danger)
      .color(colors.bg)
      .border("none")
      .borderRadius("6px")
      .fontSize("14px")
      .fontWeight("600")
      .cursor("pointer")
      .transition("background-color 0.2s"),
    {
      ":hover": bg(colors.dangerHover),
    }
  ),
};
