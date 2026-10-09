/**
 * The `"*"` route — the 404.
 *
 * Demonstrates:
 *  - what a bare `"*"` match looks like: `ctx.pattern` is `"*"` and
 *    `ctx.params["*"]` holds the whole unmatched path,
 *  - that `"*"` is tried last however it is declared — in this example's
 *    table it deliberately sits in the middle, between `/broken` and
 *    `/eager`,
 *  - the server-side half: a server branches on `route.pattern === "*"` to
 *    answer with a real HTTP 404, and without a `"*"` route `start()`
 *    rejects instead — the other way to produce one.
 */
import type { RouteContext } from "nuclo-router";
import { css } from "../theme.ts";
import { card, code, feature, pill, s } from "../ui.ts";

const st = {
  link: css({
    font: "mono",
    text: 13,
    px: 10,
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
  title: css({ text: 26, weight: 800, letterSpacing: "-0.02em", mt: 10, mb: 4 }),
};

function value(text: string) {
  return text === "" ? span(st.empty, "(empty string)") : span(st.value, text);
}

export default function NotFoundPage(ctx: RouteContext) {
  // Placed by the page itself: into the layout's region({ id: "main" }).
  return into("main", div(
    s.page,

    div(s.row, pill("bad", "404"), pill("neutral", 'pattern: "*"')),
    h2(st.title, "nothing matched"),

    feature(
      "the match",
      'a bare "*" is a catch-all with no literal prefix and no explicit name — ' +
        'compile() falls back to "*" for the capture name. so it matches any ' +
        'path and parks the whole of it in params under the key "*". that is ' +
        "the only thing separating it from the named catch-all on /files/*rest " +
        "— same mechanism, zero literal segments.",

      div(
        s.grid,
        card("ctx.pattern", value(ctx.pattern)),
        card("ctx.path", value(ctx.path)),
        card('ctx.params["*"]', value(ctx.params["*"])),
      ),

      p(
        s.note,
        "the tail is joined from the path's segments, so it carries no leading " +
          "slash and no empty ones: /a//deep/ arrives as a/deep. ctx.path next to " +
          "it is the same segments in canonical form — a leading slash, the " +
          "empty ones collapsed away and no trailing slash: /a/deep.",
      ),

      code(
        '// routes.ts\n' +
          '"/files/*rest": () => import("./pages/Files.ts"),   // params.rest\n' +
          '"*":            () => import("./pages/NotFound.ts"), // params["*"]',
      ),
    ),

    feature(
      "order does not matter, and the server still has to agree",
      'matching runs in three passes: static patterns by one Map lookup, then ' +
        'dynamic ones in declaration order, then catch-alls sorted by longest ' +
        'literal prefix. "*" has no literal prefix at all, so it sorts last among ' +
        'catch-alls, which are themselves tried last — it can sit anywhere.',

      div(
        s.cols2,
        card(
          "where it sits in this table",
          p(
            s.panelDesc,
            'in routes.ts "*" is declared between /broken and /eager, in the middle ' +
              "of the table. /eager, declared after it, still wins for /eager — and " +
              "/files/anything still reaches /files/*rest rather than here, because a " +
              "longer literal prefix is preferred.",
          ),
        ),
        card(
          "the server's 404",
          p(
            s.panelDesc,
            "a page rendered with a 200 is not a 404. the SSR example reads the " +
              "pattern back off the Route and sets the status from it, so crawlers and " +
              "curl see the same answer the user does.",
          ),
          code(
            "// ../router-ssr/src/server.ts\n" +
              'const status = route.pattern === "*" ? 404 : 200;',
          ),
        ),
      ),

      p(
        s.note,
        'without a "*" route there is nothing to render and start() rejects instead, ' +
          "which is the other way to produce a 404 — catch it and answer with one " +
          "yourself. the SSR example does both: the reject branch covers URLs outside " +
          "its base, the pattern check covers unknown paths inside it.",
      ),

      code(
        "let route;\n" +
          "try {\n" +
          "  route = await router.start(request.url);\n" +
          "} catch {\n" +
          '  // nothing matched AND no "*" in the table\n' +
          '  return new Response("Not found", { status: 404 });\n' +
          "}",
      ),
    ),

    div(
      s.row,
      span(s.caption, "try:"),
      a({ href: "/nope" }, st.link, "/nope"),
      a({ href: "/a/deep/unmatched/path" }, st.link, "/a/deep/unmatched/path"),
      a({ href: "/" }, st.link, "← back to /"),
    ),

    p(
      s.note,
      'these are plain anchors handled client-side: with a "*" route in the table ' +
        "every same-origin in-base URL matches something, so the one delegated " +
        "click listener the router put on document keeps " +
        "them in the SPA and no request reaches the server. drop the \"*\" and the " +
        "same clicks fall through to a real navigation — which is what makes a " +
        "server-rendered 404 reachable.",
    ),
  ));
}
