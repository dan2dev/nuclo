/**
 * /blog/new — static beats dynamic.
 *
 * The table declares both "/blog/new" and "/blog/:slug". This path could have
 * matched either; it matched the static one, and `ctx.pattern` below is the
 * proof. The point of the page is that nothing in the table had to be ordered
 * to make that happen.
 */
import type { RouteContext } from "nuclo-router";
import { css } from "../theme.ts";
import { btn, code, feature, pill, s } from "../ui.ts";

const link = css({ textDecoration: "none" });

export default function BlogNewPage(ctx: RouteContext) {
  // Placed by the page itself: into the layout's region({ id: "main" }).
  return into("main", div(
    s.page,
    feature(
      "static wins, wherever it sits",
      "the matcher compiles the table once into three buckets: static patterns into a Map, " +
        "dynamic ones into a list, catch-alls into another. a lookup does one Map get first and " +
        "returns on a hit, so a path a static pattern claims never reaches a :param pattern — no " +
        "matter which of the two was declared first.",

      div(
        s.row,
        pill("good", "matched"),
        span(s.caption, `ctx.pattern = "${ctx.pattern}"`),
        span(s.caption, `ctx.path = "${ctx.path}"`),
        span(s.caption, `params = ${Object.keys(ctx.params).length} keys`),
      ),

      p(
        s.panelDesc,
        css({ mt: 14 }),
        "a static match carries no params at all — the matcher returns one shared frozen " +
          "object instead of building a new one, since there are no names to fill. a :slug " +
          "match allocates a null-prototype object with the decoded segment in it.",
      ),

      code(
        `// routes.ts — order between these two is irrelevant\n` +
          `"/blog/new":   () => import("./pages/BlogNew.ts"),  // Map lookup, tried first\n` +
          `"/blog/:slug": () => import("./pages/Post.ts"),     // only reached on a Map miss\n` +
          `\n` +
          `// this page\n` +
          `ctx.pattern  "${ctx.pattern}"\n` +
          `ctx.path     "${ctx.path}"\n` +
          `ctx.params   {} — the shared frozen no-params object, not a new one`,
      ),

      div(
        css({ mt: 16 }),
        s.row,
        span(s.caption, "flip between them:"),
        a(btn.primary, link, { href: "/blog/new" }, "/blog/new"),
        a(btn.base, link, { href: "/blog/anything-else" }, "/blog/anything-else"),
      ),

      p(
        s.note,
        'the static entry only claims its own canonical path. "/blog/new/extra" has three ' +
          'segments, so the Map misses and "/blog/:slug/:comment" takes it with slug = "new" — ' +
          "static precedence is per-path, not a prefix that shadows everything below it.",
      ),
    ),
  ));
}
