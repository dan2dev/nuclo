// variants(): a strongly-typed recipe. Variant names/values are inferred, so an
// unknown selection is a compile error; true/false groups take real booleans.
// Each variant compiles once; a call is a cached lookup + cx() merge, returning
// a StyleResult that drops straight into a tag builder.
import { variants } from "../theme.ts";
import { card, feature, s } from "../ui.ts";

const btn = variants({
  base: {
    py: 10, px: 18, rounded: "md", border: "none", weight: 700, text: 13,
    cursor: "pointer", color: "#fff", transition: "background-color .15s, transform .1s",
    hover: { transform: "translateY(-1px)" },
  },
  variants: {
    intent: {
      primary: { bg: "primary", hover: { bg: "primaryHover" } },
      danger: { bg: "danger", hover: { bg: "dangerHover" } },
      ghost: { bg: "transparent", color: "text", border: "1px solid", borderColor: "border" },
    },
    size: {
      sm: { py: 6, px: 12, text: 12 },
      md: { py: 10, px: 18, text: 13 },
      lg: { py: 14, px: 26, text: 15 },
    },
    block: { true: { display: "block", w: "100%" } },
  },
  defaultVariants: { intent: "primary", size: "md" },
  // Applied only when the whole combination matches.
  compoundVariants: [{ intent: "ghost", size: "lg", css: { borderColor: "primary", color: "primary" } }],
});

// Interactive: cycle the intent, rebuilding the recipe result on each update().
const intents = ["primary", "danger", "ghost"] as const;
let current = 0;

export const recipesSection = feature(
  "variants() — typed recipes",
  "base + named variant groups + defaultVariants + compoundVariants. Selecting an undefined variant value is a compile error; boolean groups (block) are chosen with true/false.",
  div(
    s.grid,
    card("btn()  ·  defaults (primary / md)", button(btn(), "Save")),
    card('intent: "danger"', button(btn({ intent: "danger" }), "Delete")),
    card("ghost + lg  →  compound variant", button(btn({ intent: "ghost", size: "lg" }), "Learn more")),
    card('size: "sm"', button(btn({ size: "sm" }), "Small")),
    card("block: true", button(btn({ block: true }), "Full width")),
    card(
      "interactive selection",
      button(
        () => btn({ intent: intents[current] }),
        () => `intent: ${intents[current]}`,
        on("click", () => { current = (current + 1) % intents.length; update(); }),
      ),
    ),
  ),
);
