/**
 * Every createRouter() setting — `base`, `preload`, `onNavigate` — plus the
 * options go() takes, each with its default and what it actually changes.
 *
 * There are only three settings, and all three are optional: `createRouter`
 * takes `options = {}`, so `createRouter(table)` is a complete router. What
 * follows is what each one does in *this* build, read off packages/
 * nuclo-router/src/index.ts rather than from memory.
 */
import type { RouteContext } from "nuclo-router";
import { css } from "../theme.ts";
import { card, code, feature, pill, s } from "../ui.ts";

const defaults = css({ display: "grid", gridTemplateColumns: "auto auto 1fr", gap: 10, items: "baseline" });
const k = css({ font: "mono", text: 12, color: "accent" });
const v = css({ font: "mono", text: 12, color: "textMuted" });
const d = css({ text: 13, color: "textDim" });

/** The three rows of the defaults table at the top of the page. */
const ROWS: ReadonlyArray<readonly [string, string, string]> = [
  ["base", '"/"', "no prefix — the app owns the whole origin"],
  ["preload", "true", "fetch the remaining chunks once the page goes idle"],
  ["onNavigate", "—", "no hook; nothing happens after a navigation resolves"],
];

export default function SettingsPage(_ctx: RouteContext) {
  // Placed by the page itself: into the layout's region({ id: "main" }).
  return into("main", div(
    s.page,
    h2(s.title, "createRouter() settings"),
    p(
      s.lead,
      "three options, all optional. the defaults are the ones you want in a plain " +
        "single-page app served from the root, which is why this showcase only " +
        "overrides two of them — and says why below.",
    ),

    div(
      defaults,
      ...ROWS.flatMap(([name, value, note]) => [span(k, name), span(v, value), span(d, note)]),
    ),

    // ── base ────────────────────────────────────────────────────────────────
    feature(
      "base",
      "the URL prefix the app is mounted under. the router strips it before matching, " +
        "and router.href() puts it back — so your route table stays written in app-relative " +
        "paths and never learns where it was deployed.",
      div(
        s.row,
        pill("neutral", 'default "/"'),
        pill("info", "stripped before matching"),
        pill("info", "re-added by router.href()"),
      ),
      code(
        [
          'createRouter(table, { base: "/app" })',
          "",
          '  router.href("/docs")  →  "/app/docs"',
          '  router.href("/")      →  "/app"',
          "",
          "  URL the browser is on      matched against",
          '  "/app/docs"            →   "/docs"',
          '  "/app"                 →   "/"',
          '  "/docs"                →   null   — outside base',
          '  "/appendix"            →   null   — the next char must be "/"',
        ].join("\n"),
      ),
      div(
        s.cols2,
        card(
          "a URL outside base matches nothing",
          p(
            s.panelDesc,
            "stripBase() returns null, so nothing is tried against the table — not even the " +
              '"*" route. start() therefore rejects on such a URL: a server that hands the app ' +
              "a path it does not own gets an error, not a silent 404 page rendered at the " +
              "wrong address.",
          ),
        ),
        card(
          "…and a link to one is left alone",
          p(
            s.panelDesc,
            "the delegated click handler calls the same parse() before it preventDefault()s. " +
              "no match, no interception — the browser performs a real navigation, which is " +
              "exactly what makes a server-rendered 404 (or a neighbouring app on the same " +
              "origin) reachable from inside this one.",
          ),
        ),
      ),
      p(
        s.note,
        "three things have to agree on the prefix: this option (it strips), the bundler's " +
          "own base (it prefixes asset and chunk URLs), and the server's static-file and SSR " +
          "routing (it has to serve the app for every path under it). ../router-ssr keeps all " +
          "three honest by reading one constant — src/base.ts, BASE = \"/app\" — and that is " +
          "the live demonstration of this setting. this example leaves base at its default.",
      ),
    ),

    // ── preload ─────────────────────────────────────────────────────────────
    feature(
      "preload",
      "once the page goes idle, load the routes you have not visited yet — one module per " +
        "idle slice, in table declaration order — so the next navigation has nothing to wait for.",
      div(
        s.row,
        pill("neutral", "default true"),
        pill("warn", "preload: false here"),
        pill("good", "preload: true in ../router-ssr"),
      ),
      code(
        [
          "createRouter(table, { preload: true })   // the default",
          "",
          "// browser only — never during SSR. one step per idle callback:",
          "requestIdleCallback(step)   // or setTimeout(step, 200) where it is missing",
          "",
          "//  · skips routes already in the cache",
          "//  · while router.pending, it requeues instead of fetching",
          "//  · a chunk that fails is stepped over, never retried",
          "//  · router.stop() cancels the pending idle callback",
        ].join("\n"),
      ),
      div(
        s.cols2,
        card(
          "why it pauses on pending",
          p(
            s.panelDesc,
            "the loop checks router.pending at the top of every step. a navigation in flight is " +
              "a user waiting on a chunk; speculative work must not compete with it for " +
              "bandwidth, so the step requeues itself and tries again on the next idle slice.",
          ),
        ),
        card(
          "the payoff: a synchronous commit",
          p(
            s.panelDesc,
            "load() returns the cached component rather than a promise, so navigate() takes its " +
              "synchronous branch and commits in the same task: pending is never set, no spinner " +
              "frame is painted, nothing shifts. the page is simply there.",
          ),
        ),
      ),
      p(
        s.note,
        "this example sets preload: false on purpose. with preloading on, every chunk is " +
          "already cached by the time you click, and the /slow and /broken demos would never " +
          "reach their pending or error state — the thing they exist to show. ../router-ssr " +
          "leaves it on, where the network panel shows each chunk arriving on idle, before " +
          "you touch anything.",
      ),
    ),

    // ── onNavigate ──────────────────────────────────────────────────────────
    feature(
      "onNavigate",
      "called in the browser after every resolved navigation, including the initial one. " +
        "the hook for document.title, meta tags and analytics.",
      div(
        s.row,
        pill("neutral", "default none"),
        pill("good", "never called during SSR"),
        pill("info", "runs after update()"),
      ),
      code(
        [
          "// the router's commit, in order:",
          "update();                  // its own re-render",
          "restoreScroll(ctx.hash);   // matching hash target only — skipped on popstate",
          "onNavigate(ctx);           // last — the DOM is already settled",
        ].join("\n"),
      ),
      div(
        s.cols2,
        card(
          "safe to touch document",
          p(
            s.panelDesc,
            "the call sites are guarded by the router's browser check, so an isomorphic routes " +
              "module can set document.title in the hook and still import cleanly on the " +
              "server. ../router-ssr does exactly that: its hook sets document.title, and only " +
              "ever fires in the browser.",
          ),
        ),
        card(
          "ordering, and the update() you owe",
          p(
            s.panelDesc,
            "because the hook runs last, the DOM reflects the new page when it fires — good for " +
              "measuring, or for a scroll of your own. the flip side: the router has already " +
              "re-rendered, so anything the hook itself changes needs its own update() call.",
          ),
        ),
        card(
          "resolved navigations only",
          p(
            s.panelDesc,
            "after the initial call in start(), commit() is the only place it is called from — " +
              "so a chunk that fails to load and a popstate onto a URL outside the routes both " +
              "set router.error without ever reaching the hook.",
          ),
        ),
        card(
          "the initial call is inside start()",
          p(
            s.panelDesc,
            "it fires after the first page module resolves but before start() hands back the " +
              "Route — so the title is already correct by the time you hydrate().",
          ),
        ),
      ),
      p(
        s.note,
        "this example's hook sets the document title and appends to the onNavigate log in " +
          "the live panel above — scroll up and watch it grow as you move around.",
      ),
    ),

    // ── go()'s options ──────────────────────────────────────────────────────
    feature(
      "go(href, options)",
      "the one navigation option: whether the history gets a new entry or has its current " +
        "one overwritten.",
      div(s.row, pill("neutral", "{ replace?: boolean }"), pill("info", "default: push")),
      code(
        [
          "interface NavigateOptions { replace?: boolean }",
          "",
          'router.go("/patterns")                      // pushState — back returns here',
          'router.go("/patterns", { replace: true })   // replaceState — this entry is gone',
        ].join("\n"),
      ),
      div(
        s.cols2,
        card(
          "when replace earns its keep",
          p(
            s.panelDesc,
            "a redirect, or a URL that tracks UI state (a filter, a step in a wizard). without " +
              "it the back button walks through every intermediate state the user never chose " +
              "to visit.",
          ),
        ),
        card(
          "go() off the end of the map",
          p(
            s.panelDesc,
            "an href that matches nothing — outside base, or no pattern for it — is read as an " +
              "explicit request to leave the app: go() performs a full location.assign(). it " +
              "never rejects either way, so a stray call cannot produce an unhandled rejection; " +
              "a load failure surfaces as router.error instead.",
          ),
        ),
      ),
      p(s.note, "the buttons in the panel above call go() directly, including the { replace: true } one."),
    ),

    // ── what this example passes ────────────────────────────────────────────
    feature(
      "the options this showcase runs with",
      "straight out of src/routes.ts — two of the three defaults overridden, each for a reason " +
        "stated in the panels above.",
      code(
        [
          "export const router = createRouter(routeTable, {",
          '  // base: left at its default "/" — ../router-ssr mounts under /app instead.',
          "  preload: false,",
          "  onNavigate: (ctx) => {",
          "    document.title = `${ctx.pattern} — nuclo-router`;",
          "    history_.push({ pattern: ctx.pattern, path: ctx.path });",
          "    if (history_.length > 8) history_.shift();",
          "    // onNavigate runs after the router's own update(), so whatever the hook",
          "    // changes needs one of its own.",
          "    update();",
          "  },",
          "});",
        ].join("\n"),
      ),
    ),
  ));
}
