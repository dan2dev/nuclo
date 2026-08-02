import { css, colors } from "../styles.ts";
import { animations } from "./animations.ts";

export const fx = {
  hairline: css("styles-effects-hairline", { height: "1px", border: "none", backgroundColor: colors.borderPrimary }),
  badgeDot: css("styles-effects-badgeDot", { width: "6px", height: "6px", borderRadius: "50%", backgroundColor: colors.primary, animation: `${animations.pulse} 2.6s ease-out infinite`, flexShrink: 0 }),
  accentText: css("styles-effects-accentText", { display: "inline-block", color: colors.primary }),
  gradientBorder: css("styles-effects-gradientBorder", { backgroundColor: colors.bgCard, border: `1px solid ${colors.borderPrimary}` }),
  demoElevated: css("styles-effects-demoElevated", { boxShadow: "var(--card-glow)" }),
};
