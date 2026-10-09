// /blog/:slug — the one-param page.
//
// what this page demonstrates:
//   · ctx.params for a single :slug segment, and how the router decodes it
//   · Params<"/blog/:slug">, which types ctx.params from the pattern itself
//   · into({ main, sidebar }): one page placing content into two regions
//   · ctx.pattern (the table key) next to ctx.path (the canonical decoded path)
//   · ctx.search and ctx.hash, and why a ctx is a snapshot of one navigation
//   · when a navigation rebuilds this page, and when it keeps the live dom
//
// every claim below is about this build of nuclo-router: the matching rules
// come from packages/nuclo-router/src/match.ts, the rebuild/reuse rules from
// `reuses()` and `onClick()` in packages/nuclo-router/src/index.ts.
import type { Params, RouteContext } from "nuclo-router";
import { css, cx } from "../theme.ts";
import { btn, card, code, feature, pill, s } from "../ui.ts";

const st = {
  kv: css({ display: "grid", gap: 8, gridTemplateColumns: "auto 1fr", items: "baseline" }),
  k: css({ font: "mono", text: 12, color: "textMuted" }),
  v: css({ font: "mono", text: 12, color: "accent", raw: { "word-break": "break-all" } }),
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
    w: "fit-content",
    hover: { borderColor: "primary", color: "#fff" },
  }),
  hint: css({ text: 12, color: "textMuted", lineHeight: 1.45 }),
  big: css({ font: "mono", text: 20, color: "accent", weight: 700 }),
};

/**
 * Incremented once per *build* of this page. The router caches the page
 * function for the life of the page load, so this module-level counter is the
 * honest witness for the question panel two asks: did that click rebuild the
 * page, or keep the row that was already on screen?
 */
let builds = 0;

function link(href: string, label: string) {
  return a({ href }, st.link, label);
}

function kv(...rows: ReadonlyArray<readonly [string, string]>) {
  return div(st.kv, ...rows.flatMap(([key, value]) => [span(st.k, key), span(st.v, value)]));
}

export default function PostPage(ctx: RouteContext<Params<"/blog/:slug">>) {
  // Captured, not read live: a static string here is what proves reuse. If
  // this were `span(() => builds)` every update() would refresh it, and the
  // demo in panel two would tell you nothing.
  const build = builds += 1;

  // One page, two regions: the body goes into the layout's region({ id:
  // "main" }) and a note into its region({ id: "sidebar" }). Both leave when
  // this page does.
  return into({
    main: div(
      s.page,
      h2(s.title, "one param"),
      p(
        s.lead,
        'this page is the loader for the "/blog/:slug" key in the table. a :name ' +
          "segment matches exactly one segment, and the router hands it over " +
          "decoded, in ctx.params, under the name you wrote.",
      ),

      div(
        { id: "post-params" },
        feature(
          "what this navigation resolved to",
          "every field on ctx is readonly and the router never rewrites one: it is built once per navigation — the snapshot the page was called with, never a live view of the address bar.",
          kv(
            ["ctx.params.slug", JSON.stringify(ctx.params.slug)],
            ["ctx.params", JSON.stringify(ctx.params)],
            ["ctx.pattern", ctx.pattern],
            ["ctx.path", ctx.path],
            ["ctx.search", ctx.search.toString() || "(empty)"],
            ["ctx.hash", ctx.hash || "(empty)"],
            ["ctx.url", ctx.url],
          ),
          p(
            s.note,
            'ctx.params has a null prototype, so a slug of "__proto__" lands in ' +
              "it as data and never on Object.prototype. a param-less (static) " +
              "match gets a shared frozen null-prototype object instead.",
          ),

          div(
            cx(s.grid, css({ mt: 16 })),
            card(
              'percent escapes  ·  "café"',
              link("/blog/caf%C3%A9", "/blog/caf%C3%A9"),
              span(
                st.hint,
                "each segment is decoded on its own after the split. a malformed " +
                  "escape is kept raw rather than thrown out of the match.",
              ),
            ),
            card(
              'a slash inside one param  ·  "a/b"',
              link("/blog/a%2Fb", "/blog/a%2Fb"),
              span(
                st.hint,
                "the path is split on literal slashes first and decoded after, so " +
                  "%2F never becomes a separator — one param, slash and all. " +
                  "ctx.path is the decoded form, so the slash stops being visible " +
                  "there; ctx.params is where the exact value lives.",
              ),
            ),
            card(
              'a plus is a plus  ·  "a+b"',
              link("/blog/a+b", "/blog/a+b"),
              span(
                st.hint,
                "paths are not form bodies: + stays a +. only ctx.search reads it " +
                  "as a space, because that is a URLSearchParams.",
              ),
            ),
            card(
              "query + hash  ·  neither is matched",
              link("/blog/hello?draft=1&page=2#notes", "/blog/hello?draft=1&page=2#notes"),
              span(
                st.hint,
                "matching only ever looks at the path. the rest arrives beside " +
                  "it: ctx.search, a URLSearchParams, and ctx.hash, leading # " +
                  'included ("" when there is none).',
              ),
            ),
            card(
              "two segments  ·  a different route",
              link("/blog/hello/42", "/blog/hello/42"),
              span(
                st.hint,
                "a one-param pattern requires exactly its own segment count, so " +
                  "this one falls to /blog/:slug/:comment. and /blog/new is a " +
                  "static key: it wins over :slug for that one path, wherever it " +
                  "sits in the table.",
              ),
            ),
          ),
        ),
      ),

      div(
        { id: "post-rebuild" },
        feature(
          "rebuild, or reuse",
          "the layer stack is a one-item list(), and this page is its row. a navigation either replaces that row — rebuilding this page from scratch — or keeps it, and the difference is visible in the counter below.",
          div(
            s.row,
            span(st.big, `build #${build}`),
            pill("neutral", "module-level counter"),
          ),
          p(
            s.note,
            "click a different slug above: the path changed, so the row is replaced " +
              "and this number goes up. the dom you are looking at now is gone.",
          ),

          div(
            cx(s.grid, css({ mt: 14 })),
            card(
              "same path + query  ·  kept",
              span(
                st.hint,
                "a navigation through the router reuses the row when the page " +
                  "function, the path and the query string all match what is " +
                  "already there. the row is left untouched, update() runs, the " +
                  "counter stays put. only the synchronous path can do this — a " +
                  "navigation still waiting on its chunk always commits a new row.",
              ),
              // ctx.url, not ctx.path: ctx.path carries no query, so go(ctx.path)
              // from a url that has one changes the query and does rebuild.
              code('router.go(ctx.url) // same path + query → row kept, update() only'),
            ),
            card(
              "hash only  ·  the router never sees it",
              div(s.row, link("#post-params", "#post-params"), link("#post-rebuild", "#post-rebuild")),
              span(
                st.hint,
                "two of the hrefs the delegated click handler leaves to the " +
                  'browser: one starting with "#", and any whose pathname and ' +
                  "search already equal the current ones. the browser scrolls " +
                  "natively, so the counter does not move. (it steps aside for " +
                  "more than those two — download, target, rel=external, " +
                  "data-nuclo-router=off, another origin, and any path the table " +
                  "does not match.)",
              ),
            ),
            card(
              "then press back",
              span(
                st.hint,
                "popstate does reach the router. it resolves the same path and " +
                  "query, keeps the row, and skips scroll restoration — scrolling " +
                  "is applied for push and replace only, so the browser's own " +
                  "restore is not fought over.",
              ),
            ),
            card(
              "ctx.hash vs the live url",
              div(
                s.row,
                pill("neutral", `ctx.hash: ${ctx.hash || "(none)"}`),
                span(st.v, () => `location.hash: ${location.hash || "(none)"}`),
              ),
              button(btn.base, { onClick: () => update() }, "update()"),
              span(
                st.hint,
                "the hash links above move the url without re-running this page, so " +
                  "ctx.hash can fall behind. the live readout is a function child: " +
                  "it is re-read on update(), which is why the button changes it. " +
                  "router.hash reads location.hash directly.",
              ),
            ),
          ),
          p(
            s.note,
            "when a navigation does carry a hash to a new path, the router scrolls " +
              "after the page is built — it calls update() first, then looks the " +
              "element up by id. If the hash names nothing, the current scroll " +
              "position is preserved.",
          ),
        ),
      ),
    ),
    sidebar: div(
      css({ col: true, gap: 6 }),
      span(s.caption, "from /blog/:slug"),
      span(st.hint, 'placed here by the page itself, with into({ main, sidebar }) — ' + `this is build #${build}.`),
    ),
  });
}
