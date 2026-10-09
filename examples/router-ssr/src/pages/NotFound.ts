// The "*" fallback. The server turns this match into a real HTTP 404 by
// checking route.pattern — see src/server.ts.
import type { RouteContext } from "nuclo-router";
import { s } from "../ui.ts";

export default function NotFoundPage(ctx: RouteContext) {
  // Placed by the page itself: into the shell's region({ id: "main" }).
  return into("main", div(
    s.panel,
    h1(s.h1, "404 — no route matched"),
    p(s.lead, "The bare \"*\" pattern matched, which is how a router-level 404 works."),
    div(
      s.kv,
      span(s.key, "pattern"),
      span(s.val, ctx.pattern),
      span(s.key, "path"),
      span(s.val, ctx.path),
      span(s.key, 'params["*"]'),
      span(s.val, () => ctx.params["*"] || "(root)"),
    ),
    p(
      s.lead,
      "Because the server inspects route.pattern it answered this request with a " +
        "real 404 status, not a 200 — check your network panel. Precedence puts " +
        "\"*\" last no matter where it sits in the table, so it only ever catches " +
        "what nothing else did.",
    ),
  ));
}
