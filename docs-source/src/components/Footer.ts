import "nuclo";
import { cn, s, colors } from "../styles.ts";

export function Footer() {
  return footer(
    s.footer,
    div(
      s.footerText,
      "Created by ",
      a(
        {
          href: "https://github.com/dan2dev",
          target: "_blank",
          rel: "noopener noreferrer"
        },
        cn(
          color(colors.textMuted).transition("color 0.2s"),
          {
            hover: color(colors.primary)
          }
        ),
        "Danilo Celestino de Castro"
      ),
      " · MIT License · ",
      a(
        {
          href: "https://github.com/dan2dev/nuclo",
          target: "_blank",
          rel: "noopener noreferrer"
        },
        cn(
          color(colors.textMuted).transition("color 0.2s"),
          {
            hover: color(colors.primary)
          }
        ),
        "GitHub"
      )
    )
  );
}
