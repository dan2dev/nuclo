/**
 * The app shell: nav, a live readout of every route member, a log of
 * onNavigate firing, and the outlet the active page renders into.
 *
 * It reads the router it imports — `router.path`, `router.go()` — so main.ts
 * renders it as plain `render(App, container)`.
 */
import { css, cx } from "./theme.ts";
import { btn, pill, s, spinner } from "./ui.ts";
import { history_, NAV, router } from "./routes.ts";

const st = {
  nav: css({ row: true, items: "center", gap: 6, flexWrap: "wrap", mb: 14 }),
  link: css({
    font: "body",
    text: 13,
    weight: 600,
    px: 11,
    py: 7,
    rounded: "md",
    border: "1px solid",
    borderColor: "border",
    bg: "surfaceMuted",
    color: "textDim",
    textDecoration: "none",
    hover: { borderColor: "primary", color: "#fff" },
  }),
  active: css({ bg: "primary", borderColor: "primary", color: "#fff" }),
  state: css({
    display: "grid",
    gap: 8,
    gridTemplateColumns: "auto 1fr",
    bg: "surface",
    border: "1px solid",
    borderColor: "border",
    rounded: "lg",
    p: 16,
    mb: 16,
  }),
  k: css({ font: "mono", text: 12, color: "textMuted" }),
  v: css({ font: "mono", text: 12, color: "accent", raw: { "word-break": "break-all" } }),
  log: css({ font: "mono", text: 11, color: "textDim", col: true, gap: 2 }),
  outlet: css({ minH: 320 }),
  layout: css({ row: true, gap: 16, items: "stretch" }),
  side: css({
    col: true,
    gap: 8,
    p: 14,
    minW: 190,
    bg: "surface",
    border: "1px solid",
    borderColor: "border",
    rounded: "lg",
  }),
  stage: css({
    flex: 1,
    p: 14,
    bg: "surface",
    border: "1px dashed",
    borderColor: "primary",
    rounded: "lg",
  }),
  field: css({
    font: "body",
    text: 13,
    px: 10,
    py: 7,
    rounded: "md",
    border: "1px solid",
    borderColor: "border",
    bg: "bg",
    color: "text",
  }),
};

/** Every state member of the router, re-read on each update(). */
function liveState() {
  const rows: Array<[string, () => string]> = [
    ["router.path", () => router.path],
    ["router.pattern", () => router.pattern],
    ["router.params", () => JSON.stringify({ ...router.params })],
    ["router.search", () => router.search.toString() || "(empty)"],
    ["router.hash", () => router.hash || "(empty)"],
    ["router.url", () => router.url],
    ["router.pending", () => String(router.pending)],
    ["router.error", () => (router.error ? router.error.message : "null")],
  ];
  return div(
    st.state,
    ...rows.flatMap(([key, read]) => [span(st.k, key), span(st.v, read)]),
    span(st.k, "onNavigate log"),
    div(
      st.log,
      // A list() over the log, so each entry is its own row.
      list(
        () => history_.slice().reverse(),
        (entry, i) => span(i === 0 ? css({ color: "accent" }) : css({}), `${entry.pattern}  →  ${entry.path}`),
      ),
    ),
  );
}

/**
 * A layout that places the active page without ever seeing the router.
 *
 * `region()` marks the spot; every page returns `view("main", …)` and lands
 * in it. Nothing is threaded through props, so this component stays reusable
 * — and because navigation never rebuilds it, the filter box below keeps its
 * text and its focus while the page inside changes.
 */
export const Layout = (props: { sidebar: NodeModLike }) =>
  div(
    st.layout,
    div(
      st.side,
      label(st.k, { for: "layout-filter" }, "Filter (never rebuilt)"),
      input(st.field, { id: "layout-filter", placeholder: "type, then navigate" }),
      props.sidebar,
      // A second region, for pages that place something here themselves —
      // open a blog post: it fills both with one view({ main, sidebar }).
      region({ id: "sidebar", empty: span(s.caption, "(no page content here)") }),
      region({ id: "sidebar2", empty: span(s.caption, "(no page content here)") }),
    ),
    div(
      st.stage,
      region({
        id: "main",
        // Every page is a view() into this region. "stack" renders all of
        // them in arrival order, which is what shows a pushed layer over the
        // page beneath it; "simple" would keep only the newest.
        type: "stack",
        empty: span(s.caption, "Nothing in the main region."),
      }),
    ),
  )

export const App = () =>
  div(
    s.shell,
    h1(s.title, "nuclo-router"),
    p(
      s.lead,
      "Every feature and setting, live. The panel below is a direct readout of the " +
      "router — watch it change as you navigate. All navigation here is " +
      "client-side: no page reload, no flash.",
    ),

    nav(
      st.nav,
      ...NAV.map(([path, label]) =>
        // Plain anchors. One delegated click listener on `document` handles
        // every one of them; nothing per-link is wired up.
        a(
          { href: router.href(path) },
          st.link,
          () => (router.path === path ? st.active : ""),
          label,
        ),
      ),
    ),

    liveState(),

    // Programmatic navigation, straight off the router.
    div(
      cx(s.row, css({ mb: 16 })),
      span(s.caption, "router.go():"),
      button(btn.base, { onClick: () => void router.go("/blog/hello-world") }, "/blog/hello-world"),
      button(btn.base, { onClick: () => void router.go("/blog/hello-world/42") }, "two params"),
      button(btn.base, { onClick: () => void router.go("/files/docs/intro/readme.md") }, "catch-all"),
      button(btn.base, { onClick: () => void router.go("/patterns?tab=params&q=hi#anchor") }, "query + hash"),
      button(
        btn.base,
        { onClick: () => void router.go("/patterns", { replace: true }) },
        "{ replace: true }",
      ),
    ),

    main(
      { id: "outlet" },
      st.outlet,
      // While a chunk is in flight the outgoing page stays on screen and this
      // appears above it — no blank frame, no layout shift.
      when(() => router.pending, spinner()),
      when(
        () => router.error !== null,
        div(
          cx(s.cardBox, css({ borderColor: "danger" })),
          div(s.row, pill("bad", "router.error"), span(() => router.error?.message ?? "")),
          span(
            s.caption,
            "The page you were on is still here — a failed chunk never blanks the app.",
          ),
          div(
            s.row,
            button(
              btn.primary,
              { onClick: () => void router.go(router.error ? "/broken" : "/") },
              "Retry /broken",
            ),
          ),
        ),
      ),
      // The layout owns the region the pages land in; it is handed a sidebar
      // and nothing else. Nothing of the router's is in this tree: the pages
      // mount themselves beside the app, and every page lands in the region
      // through its own view().
      Layout({ sidebar: span(s.caption, "Sidebar — also never rebuilt.") }),
    ),

    footer(
      css({ mt: 26, pt: 14, borderTop: "1px solid", borderColor: "border", text: 12, color: "textMuted" }),
      "Source: ",
      code("examples/router"),
      " · see also ",
      code("examples/router-ssr"),
      " for server rendering, hydration and idle preloading.",
    ),
  );

function code(text: string) {
  return span(css({ font: "mono", color: "textDim" }), text);
}
