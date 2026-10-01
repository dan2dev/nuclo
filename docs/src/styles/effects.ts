import { css, colors } from "../styles.ts";
import { animations } from "./animations.ts";

export const fx = {
  badgeDot: css("styles-effects-badgeDot", { width: "6px", height: "6px", borderRadius: "50%", backgroundColor: colors.primary, animation: `${animations.pulse} 2.6s ease-out infinite`, flexShrink: 0 }),
  accentText: css("styles-effects-accentText", { display: "inline-block", color: colors.primary }),
};
