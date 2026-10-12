/**
 * /guard/edit — a form in a layer, with its own leave guard.
 *
 * Saving clears the dirty flag *before* close(result): close() goes through
 * the guard like every other way out.
 */
import type { PageProps, RouteContext } from "nuclo-router";
import { css } from "../theme.ts";
import { btn, field, modal, s } from "../ui.ts";

export default function GuardEdit(_ctx: RouteContext, { layer, beforeLeave }: PageProps) {
  let value = "";

  beforeLeave(() => !value || window.confirm("Discard this edit?"));

  function save(): void {
    const result = value;
    value = "";
    layer.close(result);
  }

  return modal(
    layer,
    "Edit",
    // Where the dismiss controls go when this URL is opened cold.
    "/guard",
    div(
      field.row,
      input(field.input, {
        placeholder: "type, then Cancel",
        autofocus: true,
        onInput: (event) => {
          value = (event.target as HTMLInputElement).value;
        },
      }),
    ),
    div(
      css({ row: true, gap: 8, justify: "flex-end" }),
      layer.depth === 0
        ? a({ href: "/guard" }, btn.base, "Back")
        : button(btn.base, { onClick: () => layer.close() }, "Cancel"),
      button(btn.primary, { onClick: save, disabled: () => layer.depth === 0 }, "Save"),
    ),
    p(s.note, "with text in the box, Cancel, the shade, ✕ and the browser's Back all ask first."),
  );
}
