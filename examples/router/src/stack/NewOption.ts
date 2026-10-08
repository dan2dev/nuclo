/**
 * Layer 1 — opened by the form at the bottom, and itself the opener of layer 2.
 *
 * It has no reference to the Route: `layer.push()` is how a layer opens a
 * layer, and the promise it returns is how the result comes back.
 */
import type { Layer, RouteContext } from "nuclo-router";
import { css } from "../theme.ts";
import { btn, field, modal, pill, s } from "../ui.ts";
import { categories, createOption, type Category } from "./store.ts";

export default function NewOption(_ctx: RouteContext, layer: Layer) {
  let label = "";
  let category = categories[0].id;
  let saving = false;

  async function addCategory(): Promise<void> {
    // The nested push. This layer stays open and keeps its typed-in name
    // while the one above it is open.
    const created = await layer.push<Category>("/stack/new-category");
    if (!created) return;
    category = created.id;
    update();
  }

  async function save(): Promise<void> {
    if (!label.trim() || saving) return;
    saving = true;
    update();
    const created = await createOption(label.trim(), category);
    // Resolves the form's push() with the new option.
    layer.close(created);
  }

  return modal(
    layer,
    "New option",
    // Where the dismiss controls go when this URL is opened cold.
    "/stack",
    div(
      field.row,
      span(field.label, "Label"),
      input(field.input, {
        placeholder: "e.g. Blueberry",
        autofocus: true,
        onInput: (event) => {
          label = (event.target as HTMLInputElement).value;
        },
      }),
    ),
    div(
      field.row,
      span(field.label, "Category"),
      div(
        css({ row: true, gap: 8, items: "center" }),
        select(
          field.input,
          { value: () => category, onChange: (event) => { category = (event.target as HTMLSelectElement).value; } },
          list(
            () => categories,
            (item) => option({ value: item.id }, item.label),
          ),
        ),
        button(btn.base, { onClick: () => void addCategory() }, "+ New"),
      ),
    ),
    div(
      css({ row: true, gap: 8, justify: "flex-end" }),
      layer.depth === 0
        ? a({ href: "/stack" }, btn.base, "Back")
        : button(btn.base, { onClick: () => layer.close() }, "Cancel"),
      button(
        btn.primary,
        { onClick: () => void save(), disabled: () => saving },
        () => (saving ? "Saving…" : "Create option"),
      ),
    ),
    div(
      s.row,
      pill("info", "layer.push()"),
      span(s.caption, "open a nested layer and await what it creates"),
    ),
  );
}
