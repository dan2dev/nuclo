/// <reference path="../types/index.d.ts" />
import "../src";
import { list } from "../src/list";
import { on } from "../src/element/events";
import { createCss } from "../src/style";

const { css, cx, variants, keyframes } = createCss({
  colors: { primary: "#3869ec" },
  screens: {
    compact: "(max-width: 480px)",
    wide: "(min-width: 1024px)",
  },
});

css({
  bg: "primary", // theme token autocompletes and resolves
  compact: { bg: "red" },
  hover: { bg: "blue" },
});

css({
  color: "#000",
  wide: { color: "#fff" },
});

css({
  // @ts-expect-error unknown property names are rejected
  paddng: 16,
});

css({
  // @ts-expect-error unknown variant key should not be accepted
  desktop: { bg: "green" },
});

cx(css({ p: 8 }), false, null, undefined, "external-class");

// cx() flattens nested arrays of inputs
cx([css({ p: 8 }), false, "external-class"], css({ m: 4 }));

// ─── variants(): strongly-typed recipes ──────────────────────────────────────

const button = variants({
  base: { rounded: 8, weight: 600 },
  variants: {
    intent: { primary: { bg: "primary" }, danger: { bg: "#ef4444" } },
    size: { sm: { px: 8 }, lg: { px: 16 } },
    block: { true: { display: "block" }, false: {} },
  },
  defaultVariants: { intent: "primary", size: "sm" },
  compoundVariants: [{ intent: "danger", size: "lg", css: { weight: 700 } }],
});

// Valid selections compile; the result is usable as element attributes.
button();
button({ intent: "danger", size: "lg", block: true });
div(button({ size: "sm" }), "Save");

button({
  // @ts-expect-error unknown variant value is rejected
  size: "xl",
});

button({
  // @ts-expect-error unknown variant group is rejected
  shape: "round",
});

variants({
  variants: { size: { sm: { px: 8 } } },
  // @ts-expect-error default references an undefined variant value
  defaultVariants: { size: "lg" },
});

variants({
  variants: { size: { sm: { px: 8 } } },
  // @ts-expect-error compound references an undefined variant value
  compoundVariants: [{ size: "lg", css: { weight: 700 } }],
});

variants({
  variants: {
    // @ts-expect-error variant style values are type-checked (display is a keyword, not a number)
    size: { sm: { display: 123 } },
  },
});

// ─── keyframes(): from/to/percent autocomplete, comma lists still allowed ─────

keyframes({ from: { opacity: 0 }, to: { opacity: 1 }, "50%": { opacity: 0.5 } });
keyframes({ "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.4 } });

div(
  on("nuclo:ready", function (this: HTMLElement, ev: CustomEvent<{ ok: boolean }>) {
    this.toggleAttribute("data-ready", ev.detail.ok);
  }),
);

div(
  list(
    () => new Set([1, 2, 3]),
    (item) => span(item.toString()),
  ),
);

export {};
