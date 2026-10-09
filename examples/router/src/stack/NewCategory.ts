/**
 * Layer 2 — opened by layer 1, which only ever had its own Layer handle.
 *
 * Nothing here knows about the Route, or about who opened it. It resolves
 * with the category it created and lets its caller decide what that means.
 */
import type { PageProps, RouteContext } from "nuclo-router";
import { css } from "../theme.ts";
import { btn, field, modal, s } from "../ui.ts";
import { createCategory } from "./store.ts";

export default function NewCategory(_ctx: RouteContext, { layer }: PageProps) {
  let label = "";
  let saving = false;

  async function save(): Promise<void> {
    if (!label.trim() || saving) return;
    saving = true;
    update();
    const created = await createCategory(label.trim());
    // Resolves layer 1's `layer.push()` — see NewOption.ts.
    layer.close(created);
  }

  return modal(
    layer,
    "New category",
    // Where the dismiss controls go when this URL is opened cold.
    "/stack/new-option",
    div(
      field.row,
      label_("Name"),
      input(field.input, {
        placeholder: "e.g. Berry",
        autofocus: true,
        onInput: (event) => {
          label = (event.target as HTMLInputElement).value;
        },
      }),
    ),
    div(
      css({ row: true, gap: 8, justify: "flex-end" }),
      layer.depth === 0
        ? a({ href: "/stack/new-option" }, btn.base, "Back")
        : button(btn.base, { onClick: () => layer.close() }, "Cancel"),
      button(
        btn.primary,
        { onClick: () => void save(), disabled: () => saving },
        () => (saving ? "Saving…" : "Create category"),
      ),
    ),
    p(s.note, "closing this resolves the push() in the layer below, not in the page at the bottom."),
  );
}

const label_ = (text: string) => span(field.label, text);
