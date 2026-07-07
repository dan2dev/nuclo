import { css, colors } from "../styles.ts";
import { animations } from "./animations.ts";

export const fx = {
  hairline: css({ height: "1px", border: "none", backgroundImage: "var(--grad-line)" }),
  badgeDot: css({ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: colors.primary, animation: `${animations.dotPing} 2.6s ease-out infinite`, flexShrink: 0 }),
  gradientText: css({ display: "inline-block", backgroundImage: "linear-gradient(94deg, var(--c-accent-warm) 0%, var(--c-primary) 46%, var(--c-accent-secondary) 110%)", backgroundClip: "text", color: "transparent", raw: { "-webkit-background-clip": "text", "-webkit-text-fill-color": "transparent" } }),
  shimmer: css({ position: "relative", overflow: "hidden", "&::after": { content: "''", position: "absolute", top: "0", bottom: "0", left: "0", width: "38%", backgroundImage: "linear-gradient(105deg, transparent, var(--sheen), transparent)", animation: `${animations.shimmerSweep} 4.2s ease-in-out 1s infinite`, pointerEvents: "none" } }),
  gradientBorder: css({ border: "1px solid transparent", backgroundImage: "linear-gradient(var(--c-bg-card), var(--c-bg-card)), linear-gradient(155deg, rgba(255,35,0,0.58) 0%, var(--c-border) 30%, var(--c-border) 68%, rgba(255,154,0,0.48) 100%)", raw: { "background-origin": "border-box", "background-clip": "padding-box, border-box" } }),
  demoElevated: css({ boxShadow: "var(--card-glow)" }),
};
