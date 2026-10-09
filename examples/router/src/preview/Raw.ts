// A second page inside the fragment, at "./preview/raw". Both keys are
// relative, so both move together when the section is declared under another parent.
import type { PageProps, RouteContext } from "nuclo-router";
import { btn, card, panelOrModal, s } from "../ui.ts";

export default function Raw(ctx: RouteContext, { layer }: PageProps) {
  const parent = ctx.path.replace(/\/preview\/raw$/, "");

  return panelOrModal(
    layer,
    "Shared preview — raw",
    // Opened cold, step back up to the preview it belongs under.
    `${parent}/preview`,
    div(s.grid, card("ctx.pattern", span(ctx.pattern)), card("ctx.path", span(ctx.path))),
    p(
      s.note,
      "a fragment can be more than one page deep. this page's key is \"./preview/raw\", so " +
        "it followed its sibling to whichever parent declared the section.",
    ),
    div(
      s.row,
      a({ href: `${parent}/preview` }, btn.base, "← up a segment"),
      layer.depth === 0
        ? a({ href: parent }, btn.base, "Back to the record")
        : button(btn.base, { onClick: () => layer.close() }, "Close"),
    ),
  );
}
