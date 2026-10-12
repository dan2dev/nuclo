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
  // Fixed height: the panel must not grow as onNavigate entries arrive.
  log: css({ font: "mono", text: 11, color: "textDim", col: true, gap: 2, h: 150, overflow: "auto" }),
  outlet: css({ minH: 320 }),
  // One fixed-height row for pending and error, so neither state moves the layout below.
  status: css({
    row: true,
    items: "center",
    gap: 10,
    h: 44,
    px: 12,
    mb: 16,
    bg: "surface",
    border: "1px solid",
    borderColor: "border",
    rounded: "md",
    overflow: "hidden",
  }),
  statusError: css({ borderColor: "danger" }),
  statusMsg: css({ text: 13, flex: 1, minW: 0, truncate: true }),
  layout: css({ row: true, gap: 16, items: "stretch" }),
  side: css({
    col: true,
    gap: 8,
    p: 14,
    // Fixed width: content a page places here must not resize the stage.
    flex: "0 0 190px",
    minW: 0,
    bg: "surface",
    border: "1px solid",
    borderColor: "border",
    rounded: "lg",
  }),
  stage: css({
    flex: 1,
    minW: 0,
    p: 14,
    bg: "surface",
    border: "1px dashed",
    borderColor: "primary",
    rounded: "lg",
  }),
  field: css({
    font: "body",
    text: 13,
    w: "100%",
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
 * The layout: it places the router's outlet, and nothing else of the router's.
 * Navigation never rebuilds it, so the filter box below keeps its text and its
 * focus while the page inside changes.
 */
export const Layout = () =>
  div(
    st.layout,
    div(
      st.side,
      label(st.k, { for: "layout-filter" }, "Filter (never rebuilt)"),
      input(st.field, { id: "layout-filter", placeholder: "type, then navigate" }),
      // Regions a page can fill from inside its own content — open a blog
      // post: it returns its article with an into("sidebar", …) inside.
      region({ id: "sidebar", empty: span(s.caption, "(no page content here)") }),
      region({ id: "sidebar2", empty: span(s.caption, "(no page content here)") }),
    ),
    div(
      st.stage,
      // Every page is a row here, bottom first: a pushed layer is a later row
      // over the page beneath it.
      router.outlet(),
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
      // While a chunk is in flight the outgoing page stays on screen and the
      // spinner shows in this row. The row has a fixed height whether it is
      // idle, pending or showing an error — no blank frame, no layout shift.
      div(
        st.status,
        () => (router.error ? st.statusError : ""),
        when(() => router.pending, spinner()),
        when(
          () => router.error !== null,
          pill("bad", "router.error"),
          span(st.statusMsg, { title: "The page you were on is still here — a failed chunk never blanks the app." }, () => router.error?.message ?? ""),
          button(btn.primary, { onClick: () => void router.go("/broken") }, "Retry /broken"),
        ),
        when(
          () => !router.pending && router.error === null,
          span(s.caption, "router.pending / router.error show here; the page below stays mounted either way"),
        ),
      ),
      // The layout owns the outlet the pages land in.
      Layout(),
    ),


    // with router.matches() you can conditionally render based on the current route.
    router.matches({
      "/": () => div("Home route"),
      "/blog/:slug": ({ slug }) => div(`Blog post: ${slug}`),
      "/files/*rest": ({ rest }) => div(`Files: ${rest}`),
      "*": () => import("./pages/NotFound.ts"),
    }),

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
