import type { Params, RouteContext } from "nuclo-router";

// Params<pattern> types ctx.params from the pattern itself.
export default function Topic(ctx: RouteContext<Params<"/docs/:topic">>) {
  return article(
    h2(`Topic: ${ctx.params.topic}`),
    p(`Rendered in the Docs layout's outlet. The layout was not rebuilt.`),
    p(`Pattern ${ctx.pattern}, path ${ctx.path}.`),
  );
}
