// keyframes(): register an @keyframes block once and get back its generated
// name to drop into `animation`. from/to and percentage stops autocomplete;
// comma-separated stops ("0%, 100%") are accepted too. globalStyle() (used for
// the page reset in ui.ts) registers unscoped rules.
import { css, keyframes } from "../theme.ts";
import { card, feature, s } from "../ui.ts";

const spin = keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

const pulse = keyframes({
  "0%, 100%": { opacity: 1, transform: "scale(1)" },
  "50%": { opacity: 0.4, transform: "scale(0.8)" },
});

const rise = keyframes({
  from: { opacity: 0, transform: "translateY(10px)" },
  to: { opacity: 1, transform: "translateY(0)" },
});

export const animationSection = feature(
  "keyframes() & animation",
  "keyframes() returns the generated animation name; reference it in `animation`. Global resets/defaults use globalStyle() (see ui.ts).",
  div(
    s.grid,
    card("from / to  ·  spinner", div(css({ size: 34, rounded: "pill", border: "3px solid", borderColor: "border", borderTopColor: "primary", animation: `${spin} .8s linear infinite` }))),
    card('percent stops  ·  "0%, 100%" + "50%"', div(css({ size: 18, rounded: "pill", bg: "accent", animation: `${pulse} 1.4s ease-in-out infinite` }))),
    card("enter animation  ·  from/to", div(css({ p: 14, rounded: "md", bg: "surfaceMuted", text: 13, color: "textDim", animation: `${rise} .7s ease-out both` }), "fades + rises in")),
  ),
);
