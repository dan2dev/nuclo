/// <reference path="../types/index.d.ts" />
import "../src/index";
import { list } from "../src/list";
import { on } from "../src/utility/on";
import { bg, createStyleQueries } from "../src/style";

const queries = createStyleQueries([
  ["compact", "@media (max-width: 480px)"],
  ["wide", "@media (min-width: 1024px)"],
] as const);

queries({
  compact: bg("red"),
  hover: bg("blue"),
});

queries(bg("black"), {
  wide: bg("white"),
});

queries({
  // @ts-expect-error unknown query key should not be accepted
  desktop: bg("green"),
});

div(
  on(
    "nuclo:ready",
    function (this: HTMLElement, ev: CustomEvent<{ ok: boolean }>) {
      this.toggleAttribute("data-ready", ev.detail.ok);
    },
  ),
);

div(
  list(
    () => new Set([1, 2, 3]),
    (item) => span(item.toString()),
  ),
);

export {};
