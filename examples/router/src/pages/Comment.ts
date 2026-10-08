// "/blog/:slug/:comment" — two params in one pattern.
//
// what this page demonstrates:
//   • reading more than one param out of ctx.params
//   • why this pattern never competes with "/blog/:slug": a param pattern with
//     no *catch-all matches an exact segment count, so a /blog/… path with
//     three segments can only land here and one with two segments can only
//     land on the one-param page
//   • that the separation is structural, not ordered — declaration order in the
//     table is only consulted between dynamic patterns that could both match,
//     and these two never can
import type { Params, RouteContext } from "nuclo-router";
import { btn, card, code, feature, pill, s } from "../ui.ts";

export default function CommentPage(ctx: RouteContext<Params<"/blog/:slug/:comment">>) {
  // Params<…> types ctx.params from the pattern: both names are strings, and
  // a name the pattern does not declare is a type error rather than an
  // undefined at runtime. Without it, params is `readonly [name: string]:
  // string` and every name type-checks.
  const slug = ctx.params.slug;
  const comment = ctx.params.comment;

  // Placed by the page itself: into the layout's region({ id: "main" }).
  return view("main", div(
    s.page,

    h2(s.title, "two params"),
    p(
      s.lead,
      "the same matcher that filled :slug on the previous page fills both names here. " +
        "nothing about the second param is special — what is worth looking at is why " +
        "adding it created no ambiguity to resolve.",
    ),

    feature(
      "segment count is the discriminator",
      "a pattern without a trailing *catch-all requires the path to have exactly as many " +
        "segments as the pattern does. /blog/:slug accepts two; /blog/:slug/:comment accepts " +
        "three. the sets are disjoint, so neither pattern has to be declared before the other — " +
        "the matcher computes no specificity score for dynamic patterns at all. it walks them in " +
        "declaration order and takes the first whose segment count and literals fit.",

      div(
        s.cols2,

        card(
          "ctx.params",
          div(s.row, pill("info", "slug"), span(slug || "(empty)")),
          div(s.row, pill("info", "comment"), span(comment || "(empty)")),
          p(
            s.note,
            "each segment is decoded on its own with decodeURIComponent, so %2F inside a " +
              "segment arrives as a literal slash in the value without becoming a path separator. " +
              "a malformed escape is kept raw rather than failing the match.",
          ),
        ),

        card(
          "ctx.pattern vs ctx.path",
          div(s.row, pill("neutral", "pattern"), span(ctx.pattern)),
          div(s.row, pill("neutral", "path"), span(ctx.path)),
          p(
            s.note,
            "pattern is the table key verbatim — the string you wrote. path is the canonical " +
              "decoded path with the base stripped, empty segments dropped and no trailing slash.",
          ),
        ),
      ),

      code(
        `// routes.ts
"/blog/new":            …   // static — one Map lookup, wins outright
"/blog/:slug":          …   // dynamic, exactly 2 segments
"/blog/:slug/:comment": …   // dynamic, exactly 3 segments

// match.ts, matchOne() — run for every dynamic and catch-all pattern:
if (c.rest === null ? segs.length !== n : segs.length < n) return null;
//      no catch-all  ^ exact count      ^ catch-all: at least n`,
      ),

      p(
        s.panelDesc,
        "one consequence falls out of that line: a pattern with a *catch-all is the only kind " +
          "that matches a variable number of segments, which is why catch-alls are the only " +
          "bucket the matcher sorts — longest literal prefix first, measured as the number of " +
          "segments before the *. the other half of the separation comes from earlier in the " +
          "lookup, not from that line: /blog/new still beats /blog/:slug for its one path " +
          "because the static Map is consulted first and returns on a hit, before any dynamic " +
          "pattern is considered at all.",
      ),

      div(
        s.row,
        a(btn.base, { href: `/blog/${encodeURIComponent(slug)}` }, "↑ one param: /blog/:slug"),
        a(
          btn.base,
          { href: `/blog/${encodeURIComponent(slug)}/${encodeURIComponent(comment)}-reply` },
          "→ sibling comment",
        ),
        a(btn.base, { href: "/blog/new" }, "static /blog/new"),
        a(btn.primary, { href: "/patterns" }, "back to patterns"),
      ),

      p(
        s.note,
        "the sibling link changes only :comment, so it matches this same pattern and this same " +
          "page function — but the row is still rebuilt, because the router only reuses a row " +
          "when the page function, the path and the search string are all unchanged.",
      ),
    ),
  ));
}
