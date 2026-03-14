import "nuclo";
import { cn, colors } from "../styles.ts";

export function Footer() {
  return footer(
    cn(
      backgroundColor(colors.bgFooter)
        .borderTop(`1px solid ${colors.border}`)
        .padding("40px 24px"),
      { medium: padding("40px 48px") }
    ),

    div(
      cn(
        maxWidth("1440px")
          .margin("0 auto")
          .display("flex")
          .alignItems("center")
          .justifyContent("space-between")
          .flexWrap("wrap")
          .gap("16px")
      ),

      // Left: logo + tagline
      div(
        cn(display("flex").alignItems("center").gap("10px")),

        // dot
        div(
          cn(
            width("8px")
              .height("8px")
              .borderRadius("50%")
              .backgroundColor(colors.primary)
              .flexShrink("0"),
          ),
        ),
        span(
          cn(fontSize("18px").fontWeight("700").color(colors.text)),
          "nuclo"
        ),
        span(
          cn(fontSize("13px").color(colors.textMuted)),
          "— Imperative DOM Framework"
        ),
      ),

      // Right: copyright + GitHub
      div(
        cn(display("flex").alignItems("center").gap("24px")),

        span(
          cn(fontSize("13px").color(colors.textMuted)),
          "© 2025 nuclo"
        ),

        a(
          {
            href: "https://github.com/dan2dev/nuclo",
            target: "_blank",
            rel: "noopener noreferrer",
          },
          cn(
            fontSize("13px")
              .fontWeight("600")
              .color(colors.primary)
              .transition("opacity 0.15s"),
            { hover: opacity("0.75") }
          ),
          "GitHub ↗"
        ),
      ),
    )
  );
}
