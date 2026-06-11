/// <reference path="../types/index.d.ts" />
import "../src/index";
import { list } from "../src/list";
import { on } from "../src/utility/on";
import { createCss } from "../src/style";

const { css, cx } = createCss({
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
