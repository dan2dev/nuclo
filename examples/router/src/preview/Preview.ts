/**
 * The shared preview page, reached as /invoices/:id/preview and
 * /customers/:id/preview. It is mounted twice and written once.
 *
 * It is usually opened with `layer.push("./preview")`, so it renders as a
 * modal over whichever record you were looking at — and that record's page
 * keeps its scroll position and anything typed into it.
 */
import type { PageProps, RouteContext } from "nuclo-router";
import { css } from "../theme.ts";
import { btn, card, code, panelOrModal, pill, s } from "../ui.ts";

export default function Preview(ctx: RouteContext, { layer, outlet }: PageProps) {
  // The parent's id, captured by whichever :param pattern mounted us.
  const id = ctx.params.id ?? "—";
  const parent = ctx.path.replace(/\/preview$/, "");

  return panelOrModal(
    layer,
    "Shared preview",
    // Opened cold, the way out is the record it belongs to.
    parent,
    div(
      s.grid,
      card("ctx.pattern", span(css({ font: "mono", text: 12, color: "accent" }), ctx.pattern)),
      card("ctx.params.id", span(css({ font: "mono", text: 12, color: "accent" }), id)),
    ),
    p(
      s.note,
      "one module, mounted under two parents. the pattern above tells you which one you " +
        "came in through, and the id came from that parent's :param — the fragment never " +
        "had to know either.",
    ),
    code(
      `// preview/routes.ts — relative keys, no idea where they live\n` +
        `export const recordSection = {\n` +
        `  "/":         () => import("../pages/Record.ts"),\n` +
        `  "./preview": () => import("./Preview.ts"),\n` +
        `};\n\n` +
        `// routes.ts — the same object under two parents, sharing one cache\n` +
        `"/invoices/:id":  recordSection,\n` +
        `"/customers/:id": recordSection,\n\n` +
        `// and opened the same way from either parent\n` +
        `await layer.push("./preview");`,
    ),
    div(
      s.row,
      // A relative link from inside the fragment: one more segment down.
      // Relative from here too: this page's route is .../preview, so "./raw"
      // is one segment further down. Pushed rather than linked when stacked,
      // so it piles on top instead of replacing the stack a link click would.
      layer.depth === 0
        ? a({ href: `${ctx.path}/raw` }, btn.base, "./raw →")
        : button(btn.base, { onClick: () => void layer.push("./raw") }, 'push("./raw") →'),
      layer.depth === 0
        ? a({ href: parent }, btn.base, "Back")
        : button(btn.base, { onClick: () => layer.close() }, "Close"),
    ),
    div(s.row, pill("info", "nested route"), pill("good", 'push("./preview")')),

    // "./raw" is nested under this page, so it renders here and this page
    // stays mounted while it shows.
    div(
      css({ border: "1px dashed", borderColor: "border", rounded: "md", p: 10, mt: 4 }),
      { id: "preview-outlet" },
      span(s.caption, "outlet() — ./raw renders here"),
      outlet(),
    ),
  );
}
