import { css, colors } from "../styles.ts";
import { animations } from "./animations.ts";

export const fx = {
  hairline: css({ height: "1px", border: "none", backgroundColor: colors.borderPrimary }),
  badgeDot: css({ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: colors.primary, animation: `${animations.dotPing} 2.6s ease-out infinite`, flexShrink: 0 }),
  accentText: css({ display: "inline-block", color: colors.primary }),
  gradientBorder: css({ backgroundColor: colors.bgCard, border: `1px solid ${colors.borderPrimary}` }),
  demoElevated: css({ boxShadow: "var(--card-glow)" }),
};
