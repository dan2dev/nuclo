// A param route inside the child table — the child does its own capturing.
import type { RouteContext } from "nuclo-router";
import { card, s } from "../../ui.ts";

export default function DocsTopic(ctx: RouteContext) {
  return div(
    s.grid,
    card("the child matched", span(`pattern "${ctx.pattern}" · path "${ctx.path}"`)),
    card("params.topic", span(() => ctx.params.topic ?? "")),
    card(
      "params reach every level",
      span(
        "the layout above and this page are two levels of one match, so both see the same " +
          "params — each with its own pattern and its own slice of the path.",
      ),
    ),
  );
}
