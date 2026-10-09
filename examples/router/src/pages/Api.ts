// Api.ts — the router API, member by member, with a live control for each.
//
// What this page demonstrates:
//   · the six read-only members that describe the match — path, pattern,
//     params, search, hash, url — and which two of them read the live
//     location instead of the match
//   · pending and error, the two flags that describe a navigation in flight
//   · where the pages go: the layer stack mounts itself, and each page into()s into a region
//   · go(), go(…, { replace: true }) and href(), driven from buttons and
//     live readouts
//   · stop(), and why you almost never write it yourself
//   · the Router side: createRouter(table, options) and start(url?)
//
// The buttons reach go() and stop() the same way the shell does: through the
// router this page imports.
import type { RouteContext } from "nuclo-router";
import { router } from "../routes.ts";
import { css, cx } from "../theme.ts";
import { btn, card, code, feature, pill, s } from "../ui.ts";

const st = {
  desc: css({ text: 13, color: "textDim" }),
  out: css({ font: "mono", text: 12, color: "accent", raw: { "word-break": "break-all" } }),
  danger: css({ borderColor: "danger" }),
};

/** One API member: the signature as the caption, a one-liner, then controls. */
function member(signature: string, description: string, ...controls: NodeModLike<"div">[]) {
  return card(signature, span(st.desc, description), ...controls);
}

/** A button that navigates. `void` because go() returns a promise nobody awaits. */
function goButton(href: string, label = href) {
  return button(btn.base, { onClick: () => void router.go(href) }, label);
}

/** A label + live value row, re-read on every update(). */
function readout(label: string, read: () => string) {
  return div(s.row, span(s.caption, label), span(st.out, read));
}

export default function ApiPage(_ctx: RouteContext) {
  // Placed by the page itself: into the layout's region({ id: "main" }).
  return into("main", div(
    s.page,
    h2(s.title, "The router API"),
    p(
      s.lead,
      "every member of the router: what it is, and a control that makes it " +
        "move. the readout at the top of the page is the same object these buttons " +
        "talk to, so each click shows up there immediately.",
    ),

    feature(
      "Reading the match",
      "path, pattern, params and search come from the match, so they change only when a navigation commits. hash and url read window.location while the router is running — the router deliberately leaves hash-only clicks to the browser, so the match would never hear about them.",

      div(
        s.cols2,

        member(
          "router.path",
          "the canonical decoded path with the base stripped: %xx decoded, no trailing " +
            "slash, no empty segments. the address bar keeps the href you navigated to; " +
            "this is its canonical form.",
          div(s.row, goButton("/blog//hello/", 'go("/blog//hello/") → /blog/hello')),
        ),

        member(
          "router.pattern",
          "the table key that matched, not the URL. it is the page's identity — " +
            "routes.ts feeds it to document.title from onNavigate.",
          div(s.row, goButton("/files/docs/a/b.md", "→ /files/*rest")),
        ),

        member(
          "router.params",
          "decoded segment values by name, on a null-prototype object so a segment " +
            'called "__proto__" lands as data instead of touching Object.prototype. a ' +
            "param-less match shares one frozen empty object, so never write to what " +
            "you get — spread it ({ ...router.params }) if you need your own.",
          div(s.row, goButton("/blog/hello/42", "two params"), goButton("/blog/caf%C3%A9", "decoding")),
        ),

        member(
          "router.search",
          "the matched URL's URLSearchParams, untouched. the router never flattens a " +
            "query string for you, so a repeated key survives and .getAll() can see it.",
          div(s.row, goButton("/patterns?tab=params&tab=search&q=hi", "repeated key")),
        ),

        member(
          "router.hash",
          "window.location.hash, read live — including the leading \"#\", or \"\" when " +
            "there is none. a click on a #fragment link is left to the browser on " +
            "purpose (native scrolling and history are better), so nothing navigates. " +
            "the getter is live, but the DOM is pull-based: the readout above only " +
            "re-reads on update().",
          div(
            s.row,
            a({ href: "#outlet" }, st.out, "#outlet"),
            button(btn.base, { onClick: () => update() }, "update()"),
          ),
        ),

        member(
          "router.url",
          "window.location.href while the router is running. after stop() — and during " +
            "SSR, where there is no location — it is the href the context was resolved " +
            'from instead, which for a client navigation is the href you passed: go("/patterns") ' +
            'records "/patterns", not an absolute URL.',
          div(s.row, goButton("/api?from=url", "same page, new query")),
        ),
      ),

      div(
        s.note,
        s.row,
        pill("info", "RouteContext"),
        span(
          "your page receives the match as a plain RouteContext. path, pattern, params " +
            "and search are the identical values; hash and url are the ones resolved at " +
            "match time rather than the live ones. that is what lets the same page render " +
            "on a server.",
        ),
      ),
    ),

    feature(
      "Navigating",
      "two flags describe a navigation in flight, one slot renders the result, and three methods move the app.",

      div(
        s.cols2,

        member(
          "router.pending",
          "true from the moment a navigation needs a module that is not in the cache " +
            "until that module arrives — or fails. the outgoing page stays mounted the " +
            "whole time — app.ts puts the spinner above it, so there is no blank frame. " +
            "it flips once per route that loads: arriving caches the module, so a second " +
            "trip to /slow is synchronous and pending never turns true again.",
          div(s.row, goButton("/slow", "watch it flip"), pill("warn", "preload: false")),
        ),

        member(
          "router.error",
          "set when a page module fails to load, cleared by the next commit. go() never " +
            "rejects — a stray link click must not raise an unhandled rejection — so the " +
            "failure surfaces here, and is console.error'd as well. the rejected load is " +
            "evicted from the cache, which is what makes a retry possible. a popstate " +
            "onto a URL this router does not own sets error too: that history entry is " +
            "not ours to render.",
          div(s.row, goButton("/broken", "fail a chunk"), pill("bad", "first visit throws")),
        ),
      ),

      card(
        "the pages: into() + region()",
        span(
          st.desc,
          "the layer stack is a list() whose rows are the open pages. start() mounts it " +
            "beside the app on the first render, and every page into()s itself into a " +
            "region of the layout. server and client build the same tree, so hydrate() " +
            "claims the server's nodes instead of replacing them.",
        ),
        code(`// main.ts — the pages mount themselves with this render
await router.start();
render(App, document.querySelector("#app")!);

// a page says where it goes
export default () => into("main", article(h1("Hello")));`),
        span(
          st.desc,
          "navigating to a cached module with the same page function, path and search " +
            "as the row on screen keeps that row: the URL changes and nothing is " +
            "rebuilt. the scroll that follows uses the kept row's own hash rather than " +
            "the new one, which is one more reason #links are left to the browser.",
        ),
      ),

      div(
        s.cols2,

        member(
          "router.go(href)",
          "pushes a history entry, loads the target's module if it is not cached, " +
            "commits, then scrolls — to the hash's element if there is one, otherwise to " +
            "the top. the promise resolves once the page is on screen and never rejects. " +
            "an href the router does not own (outside base, or matching no pattern when " +
            'there is no "*" route) is read as an explicit request to leave the SPA and ' +
            "handed to location.assign().",
          div(s.row, goButton("/patterns"), goButton("/blog/x?a=1#b")),
        ),

        member(
          "router.go(href, { replace: true })",
          "replaceState instead of pushState: the entry you are on right now is " +
            "overwritten, so Back skips it and lands on whatever preceded it. for " +
            "redirects, and for filter state you do not want piling up in the history.",
          div(
            s.row,
            button(
              btn.primary,
              { onClick: () => void router.go("/patterns", { replace: true }) },
              'go("/patterns", { replace: true })',
            ),
          ),
          span(st.desc, "click it, then press Back: you arrive before /api, not on it."),
        ),

        member(
          "router.href(path)",
          "normalizes a path and prefixes the base option. use it for every " +
            "a({ href }) — the same tree then keeps working when the app moves to a " +
            "sub-path, as ../router-ssr does by mounting under /app, where this call " +
            'returns "/app/patterns". the root is special-cased: href("/") is the base ' +
            'itself, or "/" when there is no base — as in this app.',
          readout('href("/patterns")', () => router.href("/patterns")),
          readout('href("patterns/")', () => router.href("patterns/")),
          readout('href("/")', () => router.href("/")),
        ),
      ),
    ),

    feature(
      "Lifecycle",
      "one router compiles the table and owns the module cache; one Route per page load (or per SSR request) owns the listeners.",

      card(
        "createRouter(table, options): Router",
        span(
          st.desc,
          "compiles the table once — static patterns into a Map, dynamic ones in " +
            "declaration order, catch-alls last by longest literal prefix — and compiles " +
            "no pattern to a regex: a static route is one Map lookup, a dynamic one a " +
            "segment count plus a literal compare per segment. it also holds the module " +
            "cache, so every Route it starts shares the pages already loaded. the object " +
            "it returns is also what the app reads — every member on this page — plus " +
            "start(), below, and match(url?), which resolves a " +
            "URL to its RouteContext (or null) with no import, no history and no " +
            "listeners — a server's 404 check, or is this link ours? the options (base, " +
            "preload, onNavigate) get their own page: ",
        ),
        div(s.row, goButton("/settings", "Settings →")),
      ),

      card(
        "router.start(url?): Promise<Route>",
        span(
          st.desc,
          "resolves the matched route's module before it returns, so the first tree is " +
            "complete on both sides of a render. in the browser it defaults to " +
            "location.href, attaches the popstate and delegated click listeners, fires " +
            "onNavigate for the initial match and queues idle preloading; on the server " +
            "you pass the request URL and none of that happens.",
        ),
        code(`// main.ts — one Route per page load, read through the router
await router.start();
render(App, document.querySelector("#app")!);

// server.ts — one Route per request; run() makes it the one App reads
try {
  const route = await router.start(req.url);
  return html(route.run(() => renderToString(App)));
} catch {
  // nothing matched and the table has no "*" route
  return status(404);
}`),
        span(
          st.desc,
          'it rejects when nothing matches and the table has no "*" route — that ' +
            "rejection is how a server returns a 404. a URL outside base matches nothing " +
            'even with a "*" route, for the same reason: the app does not own that path.',
        ),
      ),

      div(
        cx(s.cardBox, st.danger),
        span(s.caption, "router.stop(): void"),
        div(s.row, pill("bad", "this button breaks the page")),
        span(
          st.desc,
          "detaches both listeners — popstate and the delegated document click — cancels " +
            "idle preloading, and bumps the generation counter so nothing still in flight " +
            "can commit. idempotent: a second call returns immediately. this is what you " +
            "call when tearing down — a test, an HMR dispose, unmounting the app.",
        ),
        span(
          st.desc,
          "click it and the router lets go of the page: the delegated click listener is " +
            "gone, so every link becomes a plain browser navigation — a full page load, " +
            "not a client-side one — and go() returns an already-resolved promise " +
            "without doing anything. router.hash and router.url stop following the address " +
            "bar too, falling back to the last committed match.",
        ),
        div(s.row, pill("good", "rarely yours to call")),
        span(
          st.desc,
          "a second router.start() retires the previous Route for you — one page, one " +
            "Route — so HMR and re-mounts are already handled. that is the real reason " +
            "you seldom write stop() by hand.",
        ),
        div(
          s.row,
          button(btn.danger, { onClick: () => router.stop() }, "router.stop()"),
          button(btn.base, { onClick: () => window.location.reload() }, "reload the page"),
        ),
      ),
    ),
  ));
}
