/**
 * The docs section's layout.
 *
 * It is declared as `"/"` inside ./routes.ts, which makes it the parent of
 * every other key in that table. The router builds it once and renders
 * whichever child is active into its `outlet()` — so moving between the links
 * below never rebuilds this page.
 *
 * The filter box is the proof: type into it, then click through the nav. The
 * text and the focus stay exactly where they were, because this is literally
 * the same DOM node throughout.
 */
import type { Layer, Outlet, RouteContext } from "nuclo-router";
import { css, cx } from "../theme.ts";
import { card, code, feature, field, pill, s } from "../ui.ts";
import { DOCS_BASE, DOCS_NAV } from "./routes.ts";

const st = {
  nav: css({ row: true, items: "center", gap: 6, flexWrap: "wrap", mb: 14 }),
  link: css({
    font: "body",
    text: 12,
    weight: 600,
    px: 10,
    py: 6,
    rounded: "md",
    border: "1px solid",
    borderColor: "border",
    bg: "bg",
    color: "textDim",
    textDecoration: "none",
    hover: { borderColor: "accent", color: "#fff" },
  }),
  active: css({ bg: "accent", borderColor: "accent", color: "#07211c" }),
  outlet: css({ border: "1px dashed", borderColor: "accent", rounded: "md", p: 14, minH: 150 }),
  outletLabel: css({ font: "mono", text: 11, color: "accent", mb: 10 }),
};

/** How many times this layout has been built, across the whole session. */
let builds = 0;

export default function DocsShell(ctx: RouteContext, _layer: Layer, _data: unknown, outlet: Outlet) {
  builds++;

  // Placed by the page itself: into the layout's region({ id: "main" }).
  return view("main", div(
    s.page,

    feature(
      "A layout that survives its children",
      "this page is the “/” entry of a nested table, which makes it the parent of " +
        "every other key in it. the router renders the active child into its outlet() and " +
        "leaves this page alone — same node, same state, no rebuild.",

      div(
        s.row,
        pill("info", `this level  ${ctx.pattern}`),
        pill("neutral", `path  ${ctx.path}`),
        span(
          cx(s.caption, css({ color: "accent" })),
          // Re-read on every update(): if this number ever moves while you
          // click the nav below, the layout was rebuilt.
          () => `built ${builds}× this session`,
        ),
      ),

      code(
        `// docs/routes.ts — the section, written relative to wherever it lives\n` +
          `export const docsSection = {\n` +
          `  "/":          () => import("./Shell.ts"),   // this page\n` +
          `  "./intro":    () => import("./pages/Intro.ts"),\n` +
          `  "./:topic":   () => import("./pages/Topic.ts"),\n` +
          `  "./*rest":    () => import("./pages/NotFound.ts"),\n` +
          `};\n\n` +
          `// routes.ts — one line for the whole section\n` +
          `"${DOCS_BASE}": docsSection,`,
      ),
    ),

    feature(
      "Type here, then click a link",
      "the counter above does not move and this box keeps its text and its focus, because " +
        "the router never rebuilt this page. only the dashed block below changed.",

      div(
        field.row,
        span(field.label, "Filter (proof this layout is never rebuilt)"),
        input(field.input, { id: "docs-filter", placeholder: "type anything…" }),
      ),

      nav(
        st.nav,
        ...DOCS_NAV.map(([path, label]) => {
          const href = `${DOCS_BASE}${path === "/" ? "" : path}`;
          return a(
            { href },
            st.link,
            // Re-read on every update(), so the active pill follows the child
            // route. An app mounted under a `base` would compare router.path.
            () => (location.pathname === href ? st.active : ""),
            label,
          );
        }),
      ),

      div(
        st.outlet,
        { id: "docs-outlet" },
        div(
          st.outletLabel,
          // Reads the live location, so it follows the child without this
          // layout being rebuilt.
          () =>
            location.pathname === DOCS_BASE
              ? "outlet() — empty: /docs is the layout itself, so there is no child here"
              : "outlet() — the active child renders here",
        ),
        outlet(),
      ),
    ),

    feature(
      "How it compares to resolving it yourself",
      "a section can also own a router of its own, created but never started, and resolve " +
        "the tail with router.match(). that buys the feature its own base and fallback — " +
        "but the app then sees one route whose path changes, so the shell is rebuilt on " +
        "every child navigation. nesting is what keeps a parent mounted.",

      p(
        s.note,
        "one thing nesting does not give you: an index child. “/” is the layout " +
          "itself, so /docs renders this page with an empty outlet rather than a separate " +
          "index page inside it. put the section's landing content here, or give it a real " +
          "child path like ./overview.",
      ),

      div(
        s.cols2,
        card(
          "nested table (this page)",
          span("the router owns the chain. the parent keeps its DOM, and each level gets its own ctx, data and outlet."),
        ),
        card(
          "child router + match()",
          span(
            "the feature owns resolution, so it gets its own base and 404 — at the cost " +
              "of the parent being rebuilt, and of running its own loaders.",
          ),
        ),
      ),

      code(
        `// the other shape, for when a feature wants its own base and fallback\n` +
          `"${DOCS_BASE}/*rest": () => import("./docs/Shell.ts"),\n\n` +
          `const docs = createRouter(docsRoutes, { base: "${DOCS_BASE}" });\n` +
          `const hit = docs.match();            // { pattern: "/:topic", params, … }\n` +
          `const page = await docsRoutes[hit.pattern]();`,
      ),
    ),
  ));
}
