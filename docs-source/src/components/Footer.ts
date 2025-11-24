import "nuclo";
import { s, colors } from "../styles.ts";

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
        s.footerLink,
        "Danilo Celestino de Castro",
        on("mouseenter", (e) => {
          (e.target as HTMLElement).style.color = colors.primary;
        }),
        on("mouseleave", (e) => {
          (e.target as HTMLElement).style.color = colors.textMuted;
        })
      ),
      " · MIT License · ",
      a(
        {
          href: "https://github.com/dan2dev/nuclo",
          target: "_blank",
          rel: "noopener noreferrer"
        },
        s.footerLink,
        "GitHub",
        on("mouseenter", (e) => {
          (e.target as HTMLElement).style.color = colors.primary;
        }),
        on("mouseleave", (e) => {
          (e.target as HTMLElement).style.color = colors.textMuted;
        })
      )
    )
  );
}
