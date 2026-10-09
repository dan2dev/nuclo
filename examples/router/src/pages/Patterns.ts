/**
 * Pattern matching, end to end.
 *
 * The segment kinds a pattern is built from, the order the matcher tries the
 * table in, how a URL is canonicalized and decoded on the way in, and the two
 * patterns that throw at createRouter() time.
 *
 * Every claim on this page was read out of the package's source, not inferred
 * from behaviour: match.ts for the matching itself — compile() for the forms
 * and the errors, createMatcher() for the three buckets and the precedence
 * order, splitPath()/decodeSegment() for normalization, matchOne() for how
 * params are filled in — and index.ts for ctx, start() and router.href().
 *
 * Every link is a real navigation. Follow one and watch the Route readout at
 * the top of the shell change — then come back with the browser's Back
 * button, which is just a popstate the router handles like any other.
 */
import type { RouteContext } from "nuclo-router";
import { css, cx } from "../theme.ts";
import { card, code, feature, pill, s } from "../ui.ts";

const st = {
  link: css({
    font: "mono",
    text: 12,
    color: "accent",
    bg: "surfaceMuted",
    border: "1px solid",
    borderColor: "border",
    rounded: "sm",
    px: 8,
    py: 4,
    textDecoration: "none",
    display: "inline-block",
    whiteSpace: "nowrap",
    hover: { borderColor: "primary", color: "#fff" },
    transition: "border-color .15s, color .15s",
  }),
  /** One proof per row: the link, then the single thing it demonstrates. */
  proofRow: css({ row: true, items: "baseline", gap: 10, flexWrap: "wrap", py: 3 }),
  proof: css({ text: 13, color: "textDim" }),
  proofs: css({ col: true, gap: 2 }),

  kv: css({ display: "grid", gridTemplateColumns: "auto 1fr", gap: 8, items: "baseline" }),
  k: css({ font: "mono", text: 12, color: "textMuted" }),
  v: css({ font: "mono", text: 12, color: "accent", wordBreak: "break-all" }),

  table: css({ width: "100%", borderCollapse: "collapse", font: "mono", text: 12 }),
  th: css({
    textAlign: "left",
    weight: 600,
    color: "textMuted",
    py: 8,
    px: 9,
    borderBottom: "1px solid",
    borderColor: "border",
    whiteSpace: "nowrap",
  }),
  td: css({
    py: 8,
    px: 9,
    borderBottom: "1px solid",
    borderColor: "border",
    color: "textDim",
    verticalAlign: "top",
  }),
  tdWhy: css({ font: "body", text: 13, color: "textDim" }),

  rules: css({ col: true, gap: 10, m: 0, pl: 0, listStyle: "none" }),
  step: css({ row: true, items: "baseline", gap: 10, text: 14, color: "textDim" }),
  n: css({
    font: "mono",
    text: 11,
    color: "#fff",
    bg: "primary",
    rounded: "pill",
    px: 7,
    py: 2,
    flexShrink: 0,
  }),
};

/** A clickable path plus the one fact following it establishes. */
function proof(href: string, proves: string) {
  return div(st.proofRow, a({ href }, st.link, href), span(st.proof, proves));
}

function proofs(...rows: NodeModLike<"div">[]) {
  return div(st.proofs, ...rows);
}

function kv(key: string, read: () => string) {
  return [span(st.k, key), span(st.v, read)] as const;
}

/** "you type" → "the router sees" → why, for the normalization rules. */
const normalization: ReadonlyArray<readonly [string, string, string]> = [
  ["/docs/", `path "/docs"`, "a trailing slash is dropped — splitPath() only keeps non-empty segments"],
  ["//docs//", `path "/docs"`, "empty segments are dropped too, so the three spellings are one route"],
  ["/a%20b", `path "/a b"`, "patterns are decoded at compile time as well, so the pattern \"/a b\" matches this"],
  ["/blog/caf%C3%A9", `slug "café"`, "param values arrive percent-decoded; you never call decodeURIComponent"],
  ["/blog/a%2Fb", `slug "a/b"`, "the split happens on raw \"/\" before decoding, so one param can hold a slash"],
  ["/blog/a+b", `slug "a+b"`, "\"+\" is not a space — that is a form-encoding rule, not a path rule"],
  ["/blog/%zz", `slug "%zz"`, "a malformed escape is kept raw rather than throwing out of the match"],
  ["/Docs", "no match for \"/docs\"", "literal comparison is case-sensitive, in the Map lookup and per segment"],
  [
    "/a/../b",
    `path "/a/../b"`,
    "dot segments are not resolved; \"..\" is an ordinary segment, matched by a literal or a :param like any other",
  ],
];

export default function PatternsPage(ctx: RouteContext) {
  // Placed by the page itself: into the layout's region({ id: "main" }).
  return into("main", div(
    into("sidebar", span(s.caption, "I'm the sidebar content.")),
    s.page,
    h2(s.title, "Patterns"),
    p(
      s.lead,
      "A route table is a plain object: pattern string in, loader out. Matching it " +
      "builds no regexes — a static path is one Map lookup, a dynamic one is a " +
      "segment-count check plus a string compare per segment. This page is the " +
      "whole of that behaviour.",
    ),

    feature(
      "What matched right now",
      "ctx is handed to the page by the router, already resolved. Every field is " +
      "readonly and the router never writes to it again — a navigation builds a " +
      "fresh ctx rather than mutating this one.",
      div(
        st.kv,
        ...kv("ctx.pattern", () => ctx.pattern),
        ...kv("ctx.path", () => ctx.path),
        ...kv("ctx.params", () => JSON.stringify({ ...ctx.params })),
        ...kv("ctx.search", () => ctx.search.toString() || "(empty)"),
        ...kv("Object.getPrototypeOf(ctx.params)", () => String(Object.getPrototypeOf(ctx.params))),
      ),
      p(
        s.note,
        "This route is static, so its params object is the matcher's shared frozen " +
        "empty one — a param-less match allocates nothing. The prototype is null " +
        "either way; see the __proto__ link further down for why that matters.",
      ),
    ),

    feature(
      "Pattern forms",
      "A pattern is a path built from three kinds of segment: a literal, a \":name\", " +
      "and a trailing \"*tail\". That is the entire grammar — there is no optional " +
      "segment, no regex constraint and no typed param.",
      code(
        [
          "// routes.ts — excerpts from this showcase's own table",
          '"/":                     () => import("./pages/Overview.ts"),   // static',
          '"/patterns/nested/deep": () => import("./pages/Deep.ts"),       // static, any depth',
          '"/blog/new":             () => import("./pages/BlogNew.ts"),    // static, beats :slug',
          '"/blog/:slug":           () => import("./pages/Post.ts"),       // one param',
          '"/blog/:slug/:comment":  () => import("./pages/Comment.ts"),    // two',
          '"/files/*rest":          () => import("./pages/Files.ts"),      // named catch-all',
          '"*":                     () => import("./pages/NotFound.ts"),   // the 404',
        ].join("\n"),
      ),
      div(
        s.grid,
        card(
          "static",
          div(s.row, pill("good", "Map lookup")),
          span(st.proof, "no params, no allocation, no scan of the table."),
          proof("/patterns/nested/deep", "depth is free — a static pattern is one key."),
        ),
        card(
          "param  ·  :slug",
          div(s.row, pill("info", "exact segment count")),
          span(st.proof, "one :name matches exactly one segment, never zero and never two."),
          proofs(
            proof("/blog/hello", "slug = \"hello\"."),
            proof("/blog/hello/42", "two segments need the two-param pattern."),
          ),
        ),
        card(
          "catch-all  ·  *rest",
          div(s.row, pill("warn", "tail, slashes included")),
          span(st.proof, "the remaining segments are re-joined with \"/\" into one param."),
          proofs(
            proof("/files/a/b/readme.md", "rest = \"a/b/readme.md\"."),
            proof("/files", "the bare prefix matches too, with rest = \"\"."),
          ),
        ),
        card(
          "bare catch-all  ·  *",
          div(s.row, pill("bad", "the 404")),
          span(st.proof, "zero literal segments, so the sort puts it last — it only ever gets what nothing else took."),
          proof("/anything-else", "falls through everything to \"*\"."),
        ),
      ),
    ),

    feature(
      "Precedence",
      "The table is compiled once into three buckets, and a match tries them in a fixed " +
      "order. Declaration order only ever breaks ties inside the dynamic bucket — which " +
      "is why \"*\" can sit in the middle of the table, as it does in this showcase, and " +
      "still only catch what nothing else did.",
      ul(
        st.rules,
        li(
          st.step,
          span(st.n, "1"),
          span(
            "static wins, always. ",
            strong("/blog/new"),
            " beats ",
            strong("/blog/:slug"),
            " for exactly that path, however the two are ordered.",
          ),
        ),
        li(
          st.step,
          span(st.n, "2"),
          span("then dynamic patterns, in declaration order, first one whose literals and segment count fit."),
        ),
        li(
          st.step,
          span(st.n, "3"),
          span("then catch-alls, sorted by literal-segment count, longest first."),
        ),
        li(
          st.step,
          span(st.n, "4"),
          span("nothing matched at all → no route, and start() rejects unless a \"*\" exists."),
        ),
      ),
      div(
        cx(s.cardBox, css({ mt: 14 })),
        span(s.caption, "the gotcha in step 3"),
        span(
          st.proof,
          "\"literal-segment count\" is the length of the segment list before the tail — " +
          "and a :param occupies a slot in that list. So \"/a/:b/*r\" (two slots) is " +
          "tried before \"/*r2\" (zero), even though \"/a/:b\" is not more literal than " +
          "anything. If two catch-alls can both swallow a path, the one with more " +
          "segments ahead of its tail gets it.",
        ),
        code(
          [
            "// match.ts",
            "catchAll.sort((a, b) => b.lits.length - a.lits.length);",
            "",
            '//   "/a/:b/*r"  ->  lits = ["a", ""]   length 2   tried first',
            '//   "/*r2"      ->  lits = []          length 0   tried second',
          ].join("\n"),
        ),
      ),
      proofs(
        proof("/blog/new", "static, so the BlogNew page — not Post with slug \"new\"."),
        proof("/blog/hello", "no static key, so the :slug pattern takes it."),
        proof("/files/a/b/readme.md", "\"/files/*rest\" has one literal segment; \"*\" has none."),
      ),
    ),

    feature(
      "Normalization & decoding",
      "A URL is split into segments on raw \"/\", each segment is percent-decoded on its " +
      "own, and the canonical path is those segments re-joined. Patterns go through the " +
      "same function, so both sides of a comparison are already decoded.",
      div(
        css({ overflowX: "auto" }),
        table(
          st.table,
          thead(
            tr(th(st.th, "you ask for"), th(st.th, "the router sees"), th(st.th, "why")),
          ),
          tbody(
            ...normalization.map(([input, seen, why]) =>
              tr(td(st.td, input), td(cx(st.td, st.v), seen), td(cx(st.td, st.tdWhy), why)),
            ),
          ),
        ),
      ),
      p(
        s.note,
        "Four of those rules are live links here. The first three land on /blog/:slug, " +
        "which prints the slug it was handed; the last proves the case rule by missing " +
        "every pattern and falling through to \"*\":",
      ),
      proofs(
        proof("/blog/caf%C3%A9", "percent escapes are decoded into the param."),
        proof("/blog/a%2Fb", "%2F survives the split and decodes inside one segment."),
        proof("/blog/a+b", "\"+\" stays \"+\"."),
        proof("/Patterns", "wrong case, so no static hit — this one reaches \"*\"."),
      ),
    ),

    feature(
      "Edge cases worth knowing",
      "None of these are configurable; they fall out of how compile(), createMatcher() " +
      "and matchOne() are written. They are listed because each one is a decision you " +
      "would otherwise have to discover.",
      div(
        s.cols2,
        card(
          'unnamed tail  ·  "/files/*"',
          span(st.proof, "an empty name falls back to \"*\", so the tail arrives as params[\"*\"]. Name it unless you enjoy bracket access."),
        ),
        card(
          '"*" inside a segment is literal',
          span(st.proof, "only a segment that *starts* with \"*\" is a catch-all. The pattern \"/a/b*c\" matches the path \"/a/b*c\" and nothing else."),
        ),
        card(
          'repeated param  ·  "/x/:a/:a"',
          span(st.proof, "params are filled left to right into one object, so the last segment wins: \"/x/1/2\" gives a = \"2\"."),
        ),
        card(
          'tail beats a param of the same name',
          span(st.proof, "the catch-all is written after the param loop. \"/x/:rest/*rest\" on \"/x/1/2/3\" gives rest = \"2/3\", not \"1\"."),
        ),
        card(
          "two keys, one canonical path",
          span(st.proof, "\"/docs\" and \"/docs/\" compile to the same static key, and the bucket is a Map — the later declaration silently replaces the earlier one."),
        ),
        card(
          "params has a null prototype",
          span(st.proof, "a segment named __proto__ or constructor lands in params as an ordinary string. There is no prototype to pollute."),
          proof("/blog/__proto__", "slug = \"__proto__\", and it is just data."),
        ),
      ),
    ),

    feature(
      "Table errors",
      "Two patterns are rejected, and both are rejected eagerly: the table is compiled " +
      "inside createRouter(), before any navigation, so a bad pattern is a startup crash " +
      "rather than a 404 someone finds in production.",
      code(
        [
          "createRouter({",
          '  "/a/*rest/b": loader,',
          "});",
          '// Error: nuclo-router: "/a/*rest/b" — a *catch-all must be the last segment',
          "",
          "createRouter({",
          '  "/a/:": loader,',
          "});",
          '// Error: nuclo-router: "/a/:" — ":" needs a param name',
        ].join("\n"),
      ),
      div(
        s.row,
        pill("bad", "throws"),
        span(st.proof, "a *catch-all that is not the last segment"),
      ),
      div(
        s.row,
        pill("bad", "throws"),
        span(st.proof, "a \":\" with no name after it"),
      ),
      p(
        s.note,
        "Everything else is accepted, including the shadowing cases above. The router " +
        "does not try to detect an unreachable pattern — a route that something else " +
        "always wins is legal, and sometimes exactly what you meant.",
      ),
    ),

    p(
      s.note,
      "The links on this page are written as plain paths because this showcase is mounted " +
      "at the root. Under a base, build hrefs with router.href(path) — it prefixes the " +
      "base, and the matcher strips it again before any of the above applies.",
    ),
  ));
}
