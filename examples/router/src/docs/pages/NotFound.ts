// The child's own fallback. The app's "*" route never sees these URLs.
import type { RouteContext } from "nuclo-router";
import { card, pill, s } from "../../ui.ts";

export default function DocsNotFound(ctx: RouteContext) {
  return div(
    s.grid,
    card(
      "the child's 404",
      div(s.row, pill("warn", `pattern "${ctx.pattern}"`)),
      span(() => `nothing in the docs table matched "${ctx.path}".`),
    ),
    card(
      "two independent fallbacks",
      span(
        "the app's \"*\" page never rendered: a \"./*rest\" key inside the section is " +
          "its own catch-all, tried after the section's static and :param children — and " +
          "the layout stays mounted even for a 404.",
      ),
    ),
  );
}
