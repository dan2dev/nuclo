/**
 * /links — the link-handling matrix.
 *
 * Link handling is exactly one listener: a non-capturing `click` on
 * `document`, added in start() — next to the `popstate` listener, the only
 * other one the Route installs — and removed by route.stop(). There is no
 * <Link> component and nothing is wired up per link: a plain <a> is the whole
 * API.
 *
 * That listener's only job is to decide, for one click, whether this app owns
 * the destination. When it does, it calls preventDefault() and navigates.
 * When it does not, it returns and the browser does what it has always done.
 * Getting that second half right is what makes cmd-click, downloads,
 * in-page anchors and a server-rendered 404 keep working.
 *
 * Every card below is one branch of that decision, and every one of them is
 * clickable. The guard order is listed verbatim at the bottom of the page,
 * because when two branches apply the first one wins.
 */
import { css, cx } from "../theme.ts";
import { card, code, feature, pill, s } from "../ui.ts";
import type { RouteContext } from "nuclo-router";

const st = {
  link: css({
    font: "body",
    text: 13,
    weight: 600,
    color: "#c7cbff",
    textDecoration: "none",
    borderBottom: "1px dashed",
    borderColor: "border",
    cursor: "pointer",
    hover: { color: "#fff", borderColor: "primary" },
  }),
  dead: css({ color: "textMuted", borderColor: "border" }),
  target: css({
    bg: "surfaceMuted",
    border: "1px solid",
    borderColor: "accent",
    rounded: "md",
    p: 16,
    mt: 18,
    raw: { "scroll-margin-top": "16px" },
  }),
  why: css({ text: 12, color: "textDim" }),
};

/** How many times the preventDefault() demo has swallowed a click. */
let swallowed = 0;

/** A labelled card: the pill says which way the click went, then the why. */
function branch(caption: string, tone: "good" | "warn", label: string, why: string, ...body: NodeModLike<"div">[]) {
  return card(caption, div(s.row, pill(tone, label)), ...body, span(st.why, why));
}

/** Clicks the router turns into a navigation. */
function intercepted(ctx: RouteContext) {
  return feature(
    "the router navigates",
    "Left-click, no modifiers, an in-origin href that one of the table's patterns matches. " +
      "The listener calls preventDefault() and hands the path to the same navigate() that " +
      "route.go() uses — so these are pushState navigations, not reloads.",

    branch(
      'a({ href: "/patterns" })',
      "good",
      "intercepted",
      "The ordinary case. Nothing marks this anchor as special; the delegated listener on document sees it like any other.",
      a({ href: "/patterns" }, st.link, "/patterns"),
    ),

    branch(
      "a click on a nested child",
      "good",
      "intercepted",
      "event.target is the <strong>, not the anchor. The listener starts from target.closest(\"a\"), so any depth of markup inside a link still resolves to it.",
      a({ href: "/patterns/nested/deep" }, st.link, span("go ", strong("deep"), " — click the bold word")),
    ),

    branch(
      'href="patterns" (relative)',
      "good",
      "intercepted",
      `Resolved with new URL(href, location.href). You are on ${ctx.path}, so this lands on /patterns. Relative hrefs are not special-cased — they go through the same URL constructor as everything else.`,
      a({ href: "patterns" }, st.link, "patterns"),
    ),

    branch(
      'target="_self"',
      "good",
      "intercepted",
      'The guard rejects a target that is set and is not "_self". "_self" means "this browsing context", which is exactly what a client-side navigation does, so it passes.',
      a({ href: "/patterns", target: "_self" }, st.link, "/patterns (_self)"),
    ),

    branch(
      "query + hash",
      "good",
      "intercepted",
      "The pathname differs from the current one, so this is a real navigation. The router pushes pathname + search + hash together, then scrolls to the hash's element if that id exists on the new page — otherwise to the top.",
      a({ href: "/patterns?tab=params&q=hi#anchor" }, st.link, "/patterns?tab=params&q=hi#anchor"),
    ),

    branch(
      "an SVG <a>",
      "good",
      "intercepted",
      "SVGAElement has no string .href property — its href is an SVGAnimatedString. The listener reads the href attribute instead of the property, so SVG links work with no extra code. closest(\"a\") matches it because the localName is the same.",
      svgSvg(
        { width: 190, height: 36, viewBox: "0 0 190 36" },
        aSvg(
          { href: "/patterns" },
          rectSvg({ x: 1, y: 1, width: 188, height: 34, rx: 8, fill: "#1c2440", stroke: "#2a3355" }),
          textSvg(
            { x: 95, y: 23, "text-anchor": "middle", fill: "#c7cbff", "font-size": 12, "font-family": "monospace" },
            "svg <a> → /patterns",
          ),
        ),
      ),
      code(
        [
          "// src/index.ts, inside onClick",
          'const href = anchor.getAttribute("href");',
          "// …",
          "// The attribute, not anchor.href: SVG <a> has no string href.",
          "url = new URL(href, window.location.href);",
        ].join("\n"),
      ),
    ),
  );
}

/** Clicks the router deliberately does not touch. */
function left(ctx: RouteContext) {
  const sameUrl = ctx.path + (ctx.search.toString() ? `?${ctx.search}` : "");

  return feature(
    "the router steps aside",
    "Each of these returns early, before preventDefault() — so the browser's own behaviour runs " +
      "untouched. None of them is a workaround: they are the cases where the platform already " +
      "does the right thing, and intercepting would take it away.",

    branch(
      "cmd / ctrl / shift / alt click",
      "warn",
      "left to the browser",
      "Cmd-click (ctrl-click on Windows/Linux) this link and watch it open in a new tab. Shift opens a window, alt saves the target. The user asked the browser for something a pushState cannot do.",
      a({ href: "/patterns" }, st.link, "cmd/ctrl-click me"),
    ),

    branch(
      "a non-primary button",
      "warn",
      "left to the browser",
      "The guard is event.button !== 0. Modern browsers deliver middle- and right-button clicks as auxclick rather than click, so the router would not see them anyway — the check is there so it holds wherever a click does arrive with another button.",
      a({ href: "/patterns" }, st.link, "middle-click me"),
    ),

    branch(
      "preventDefault() already called",
      "warn",
      "left to the browser",
      "The listener is on document and does not capture, so handlers on the anchor itself run first. If one of them cancelled the event, event.defaultPrevented is already true and the router treats the click as handled.",
      a(
        {
          href: "/patterns",
          onClick: (event) => {
            event.preventDefault();
            swallowed++;
            update();
          },
        },
        st.link,
        "the app handles this one",
      ),
      span(s.caption, () => `preventDefault() called ${swallowed}× · still on ${ctx.path}`),
    ),

    branch(
      "no <a> in the ancestry",
      "warn",
      "left to the browser",
      'target.closest("a") returns null, so the listener returns. This is why the one document listener costs nothing: the overwhelming majority of clicks in an app leave it after a single closest() call.',
      span(cx(st.link, st.dead), "a span that looks like a link"),
    ),

    branch(
      "an anchor with no href",
      "warn",
      "left to the browser",
      "getAttribute(\"href\") is null. An anchor without an href is not a link — the browser gives it no navigation behaviour either, and the router matches that.",
      a(st.link, st.dead, "an <a> with no href"),
    ),

    branch(
      'href="#…"',
      "warn",
      "left to the browser",
      "Checked by the first character of the attribute. Native in-page anchors scroll, update the fragment and push a history entry better than a route change can — including back/forward between fragments.",
      a({ href: "#hash-target" }, st.link, "#hash-target"),
    ),

    branch(
      "download",
      "warn",
      "left to the browser",
      "Same href as the intercepted link at the top of the page; one attribute flips the branch. Checked with hasAttribute, so a bare download counts. Clicking really does save a file.",
      a({ href: "/patterns", download: "patterns.html" }, st.link, "/patterns + download"),
    ),

    branch(
      'data-nuclo-router="off"',
      "warn",
      "left to the browser",
      'The explicit opt-out, for a link that must be a full page load — a sign-out that has to hit the server, a path another app owns. The comparison is to the exact string "off"; any other value is ignored.',
      a({ href: "/patterns", "data-nuclo-router": "off" }, st.link, "/patterns (opted out)"),
    ),

    branch(
      'target="_blank"',
      "warn",
      "left to the browser",
      'Any target that is set and is not "_self" — _blank, _parent, _top, or a named frame. The destination is not this browsing context, so this Route has nothing to do with it.',
      a({ href: "/patterns", target: "_blank" }, st.link, "/patterns (_blank)"),
    ),

    branch(
      'rel="external"',
      "warn",
      "left to the browser",
      'The rel attribute is split on whitespace and checked for the "external" token, so rel="noopener external" matches and rel="externalish" does not. The author is saying this link leaves the app even though the URL looks local.',
      a({ href: "/patterns", rel: "noopener external" }, st.link, "/patterns (rel=external)"),
    ),

    branch(
      "a cross-origin href",
      "warn",
      "left to the browser",
      "url.origin !== location.origin. A different origin is by definition not this app's route table. This one genuinely leaves the page — use back to come home.",
      a({ href: "https://example.com" }, st.link, "https://example.com"),
    ),

    branch(
      "the same pathname and search",
      "warn",
      "left to the browser",
      "Both links have the pathname and query string you are on right now. The first adds only a fragment; the second is the identical URL, which the browser reloads. Native hash scrolling and hash history are better than anything the router would do here, and this is also the guard that catches a fragment link written out in full.",
      a({ href: `${sameUrl}#hash-target` }, st.link, `${sameUrl}#hash-target`),
      a({ href: sameUrl }, cx(st.link, st.dead), `${sameUrl} (reloads)`),
    ),

    branch(
      "an href the URL parser rejects",
      "warn",
      "left to the browser",
      "new URL() is in a try/catch; a throw means the router cannot reason about the destination, so it leaves it alone rather than guessing.",
      a({ href: "http://[" }, cx(st.link, st.dead), "http://[" ),
    ),

    branch(
      "a path the router does not own",
      "warn",
      "left to the browser",
      "The last guard re-runs the matcher: outside the configured base, or matching no pattern, means a real browser navigation — which is what keeps a server-rendered 404 reachable instead of swallowed. Read the note under this panel before you trust the pill: it does not apply to THIS example.",
      a({ href: "/nothing/here" }, st.link, "/nothing/here"),
      code('// this example\'s table\n"*": () => import("./pages/NotFound.ts"),'),
      span(
        s.note,
        "This table has a \"*\" route, so every in-origin path matches something and /nothing/here is " +
          "intercepted — you will land on the client-rendered NotFound page, not a server one. " +
          "Remove \"*\" and the same click falls through to a real request, which is the right default " +
          "for an app whose server already renders a 404.",
      ),
    ),
  );
}

export function LinksPage(ctx: RouteContext) {
  // Placed by the page itself: into the layout's region({ id: "main" }).
  return view("main", div(
    s.page,

    h2(s.panelTitle, "Link handling"),
    p(
      s.lead,
      "One delegated click listener on document, thirteen reasons it might not act. " +
        "Left column: clicks that become client-side navigations. Right column: clicks the " +
        "router hands back to the browser, and why handing them back is the feature.",
    ),

    div(s.cols2, intercepted(ctx), left(ctx)),

    div(
      { id: "hash-target" },
      st.target,
      div(s.row, pill("info", "#hash-target"), span(s.caption, "you are here")),
      p(
        s.panelDesc,
        "The element the fragment links above point at. Both of them get here without the router " +
          "doing anything: the browser scrolls, sets location.hash and pushes a history entry, and " +
          "back/forward between fragments keeps working. (The smooth scroll is CSS, from ui.ts.)",
      ),
      p(
        s.panelDesc,
        "A fragment on a navigation the router does handle is a different path: after the page " +
          "commits, the router looks up the hash's element and scrollIntoView()s it, falling back " +
          "to leaving the current scroll position unchanged if there is no match. Route changes " +
          "without a matching hash also preserve scroll; popstate leaves restoration to the browser.",
      ),
    ),

    section(
      s.panel,
      h3(s.panelTitle, "Guard order"),
      p(
        s.panelDesc,
        "Verbatim from the listener. The order matters whenever two branches apply at once: a " +
          "cmd-click on a download link never reaches the download check, and the opt-out never " +
          "reaches the origin check.",
      ),
      code(
        [
          'document.addEventListener("click", onClick)   // once per Route, non-capturing',
          "",
          " 1  event.defaultPrevented                        → out",
          " 2  event.button !== 0                             → out",
          " 3  metaKey | ctrlKey | shiftKey | altKey          → out",
          ' 4  target.closest("a") == null                    → out',
          ' 5  no href attribute, or href starts with "#"     → out',
          " 6  [download]                                     → out",
          ' 7  [data-nuclo-router="off"]                      → out',
          ' 8  [target] set and not "_self"                   → out',
          ' 9  [rel] token list contains "external"           → out',
          " 10 new URL(href, location.href) threw             → out",
          " 11 url.origin !== location.origin                 → out",
          " 12 same pathname AND same search                  → out",
          " 13 no pattern matches it (or outside base)        → out",
          "",
          "preventDefault()",
          'navigate(url.pathname + url.search + url.hash, "push")',
        ].join("\n"),
      ),
      p(
        s.note,
        "Nothing here reads the DOM beyond the clicked anchor's attributes, and nothing is " +
          "registered per link — so links rendered later, by a list() row or an async page, are " +
          "handled with no registration step. Write hrefs with route.href(path) when the app is " +
          "mounted under a base, so the base ends up in the attribute the browser and the listener " +
          "both read.",
      ),
    ),
  ));
}
