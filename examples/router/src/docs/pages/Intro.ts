// A static route inside the child table.
import type { RouteContext } from "nuclo-router";
import { card, s } from "../../ui.ts";

export default function DocsIntro(ctx: RouteContext) {
  return div(
    s.grid,
    card("the child matched", span(`pattern "${ctx.pattern}" · path "${ctx.path}"`)),
    card(
      "its own chunk",
      span(
        "a nested table's entries are dynamic imports like any other, so each child is " +
          "still its own chunk. nesting changes where a page renders, not how it loads.",
      ),
    ),
  );
}
