// A named catch-all: "/files/*rest" captures everything after the prefix,
// slashes included, as a single param.
import type { Params, RouteContext } from "nuclo-router";
import { s } from "../ui.ts";

// Typed from the pattern: `rest` is a string, and no other name exists.
export default function FilesPage(ctx: RouteContext<Params<"/files/*rest">>) {
  const segments = ctx.params.rest.split("/").filter(Boolean);
  // Placed by the page itself: into the shell's region({ id: "main" }).
  return into("main", div(
    s.panel,
    h1(s.h1, "Catch-all route"),
    div(
      s.kv,
      span(s.key, "pattern"),
      span(s.val, ctx.pattern),
      span(s.key, 'params.rest'),
      span(s.val, () => ctx.params.rest || "(empty)"),
      span(s.key, "segments"),
      span(s.val, String(segments.length)),
    ),
    p(
      s.lead,
      "A catch-all wins over the bare \"*\" fallback because it has the longer " +
        "literal prefix, so /files/anything/deep lands here while /anything lands " +
        "on the 404 page.",
    ),
  ));
}
