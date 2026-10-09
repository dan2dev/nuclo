/**
 * /files/*rest — the named catch-all.
 *
 * Two things this page is here to show:
 *
 *  1. a `*name` segment swallows the whole tail of the path into one param,
 *     slashes included — it is the only pattern form that can match a
 *     variable number of segments;
 *  2. why `/files/*rest` wins over the table's bare `"*"` route, and the
 *     ordering gotcha that comes with that rule.
 *
 * Everything claimed below is read off packages/nuclo-router/src/match.ts
 * (compile(), matchOne(), and the catchAll.sort() in createMatcher()).
 */
import type { Params, RouteContext } from "nuclo-router";
import { css } from "../theme.ts";
import { card, code, feature, pill, s } from "../ui.ts";

const st = {
  link: css({
    font: "mono",
    text: 12,
    px: 9,
    py: 6,
    rounded: "md",
    border: "1px solid",
    borderColor: "border",
    bg: "surfaceMuted",
    color: "textDim",
    textDecoration: "none",
    hover: { borderColor: "primary", color: "#fff" },
  }),
  value: css({ font: "mono", text: 13, color: "accent", raw: { "word-break": "break-all" } }),
  empty: css({ font: "mono", text: 13, color: "textMuted" }),
};

/** Every link on this page lands back here, with a different tail. */
function tail(href: string, note: string) {
  return card(note, a({ href }, st.link, href));
}

export default function FilesPage(ctx: RouteContext<Params<"/files/*rest">>) {
  // rest is "" for the bare prefix, so guard before splitting: "".split("/")
  // would hand back [""] and claim a segment that is not there.
  const rest = ctx.params.rest;
  const segments = rest === "" ? [] : rest.split("/");

  // Placed by the page itself: into the layout's region({ id: "main" }).
  return into("main", div(
    s.page,

    h2(s.title, "Named catch-all"),
    p(
      s.lead,
      "This page is bound to one pattern — /files/*rest — and every path under " +
        "/files reaches it, however deep. The tail arrives as a single param, " +
        "not as a list: the router joins the leftover segments back together " +
        "with slashes and stores that string under the name after the star.",
    ),

    feature(
      "the tail, as one param",
      "params.rest holds the URL's segments after the literal \"files\", joined back together with \"/\" — the prefix is consumed, everything after it is one value. Each segment was percent-decoded on its own before the join, and empty segments were dropped.",
      div(
        s.cols2,
        card(
          "ctx.pattern",
          span(st.value, ctx.pattern),
          span(s.caption, "the table key, not the URL — constant for every path on this page"),
        ),
        card(
          "ctx.path",
          span(st.value, ctx.path),
          span(s.caption, "canonical: decoded, base stripped, no empty segments"),
        ),
      ),
      div(
        css({ mt: 12 }),
        card(
          "ctx.params.rest",
          rest === ""
            ? span(st.empty, '"" — the bare prefix matched; the tail is empty, not absent')
            : span(st.value, rest),
        ),
      ),
      div(
        css({ mt: 12 }),
        card(
          `split("/") → ${segments.length} segment(s)`,
          segments.length === 0
            ? span(s.caption, "nothing to split")
            : div(s.row, ...segments.map((seg) => pill("info", seg))),
          span(
            s.caption,
            "splitting is this page's own work — the router hands over the joined string",
          ),
        ),
      ),
      div(
        css({ mt: 14 }),
        div(
          s.row,
          tail("/files/a/b/readme.md", "three segments, one param"),
          tail("/files", "bare prefix  ·  rest === \"\""),
          tail("/files/deep/deep/deep/x", "depth is unbounded"),
          tail("/files/a%2Fb", "%2F decodes, then joins"),
          tail("/files//a", "empty segments dropped"),
        ),
      ),
      p(
        s.note,
        "The last two are the price of a joined string: a segment is decoded " +
          "before it is re-joined, so /files/a%2Fb and /files/a/b arrive " +
          "identically, and /files//a is indistinguishable from /files/a. If a " +
          "tail segment can legitimately contain a slash, the catch-all param " +
          "cannot tell you where it was.",
      ),
      code(
        '// routes.ts\n' +
          '"/files/*rest": () => import("./pages/Files.ts"),\n\n' +
          '// GET /files/a/b/readme.md\n' +
          'ctx.pattern            // "/files/*rest"\n' +
          'ctx.path               // "/files/a/b/readme.md"\n' +
          'ctx.params.rest        // "a/b/readme.md"\n\n' +
          '// GET /files\n' +
          'ctx.params.rest        // ""',
      ),
    ),

    feature(
      "why this beats the \"*\" fallback",
      "Catch-alls are collected into their own group and tried only after every static and dynamic pattern has failed. Within that group they are sorted by how many segments sit in front of the star — most first — so declaration order never has to encode specificity. The table's \"*\" route is deliberately not declared last in routes.ts.",
      div(
        s.cols2,
        card(
          "/files/*rest",
          div(s.row, pill("good", "1 segment before *"), pill("neutral", "tried first")),
          span(s.caption, "matches /files and anything under it"),
        ),
        card(
          "*",
          div(s.row, pill("warn", "0 segments before *"), pill("neutral", "tried last")),
          span(
            s.caption,
            "a bare star names its param \"*\", so the 404 page can read params[\"*\"]",
          ),
        ),
      ),
      p(
        s.note,
        "The gotcha: that count is segments, not literal text. A :param segment " +
          "is counted exactly like a literal one, so \"/:kind/*rest\" ranks " +
          "alongside \"/files/*rest\" even though it matches far more paths. Two " +
          "catch-alls with the same segment count fall back to the order they " +
          "were declared in — the sort is stable — exactly as dynamic patterns " +
          "are tried in declaration order.",
      ),
      code(
        '// ordering among catch-alls, by segments before the star\n' +
          '"/files/docs/*rest"   // 2  — tried first\n' +
          '"/files/*rest"        // 1\n' +
          '"/:kind/*rest"        // 1  — the gotcha: a param counts too,\n' +
          '                      //      so this ties with /files/*rest\n' +
          '"*"                   // 0  — the 404, wherever it is declared',
      ),
      p(
        s.note,
        "A star is also only legal as the final segment — \"/files/*rest/meta\" " +
          "throws inside createRouter(), which compiles every key in the table " +
          "up front, not on the navigation that would have hit it.",
      ),
    ),
  ));
}
