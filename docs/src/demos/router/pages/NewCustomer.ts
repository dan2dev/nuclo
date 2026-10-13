// NewCustomer.ts: the pushed page. close(result) resolves the push() that
// opened it; close() with nothing is a dismissal. Enter in the name saves,
// like the Save button. Navigated to rather than pushed (Forward after it
// closed) it renders in the order's outlet at layer.depth 0, with no push()
// to resolve, so it offers the way back instead of a Save that does nothing.
import type { PageProps, RouteContext } from "nuclo-router";
import { router } from "../routes.ts";
import { s } from "../styles.ts";

export default function NewCustomer(
  _ctx: RouteContext,
  { layer }: PageProps,
) {
  // ".." is the order this page sits under: /orders/new.
  if (layer.depth === 0) return p(s.muted, a({ href: router.href("..") }, "Back to the order"));
  let name = "";
  return form(
    s.layer,
    { onSubmit: (e) => { e.preventDefault(); layer.close({ name: name || "Ada" }); } },
    h2(`New customer (layer depth ${layer.depth})`),
    input({
      placeholder: "Name",
      onInput: (e) => { name = e.currentTarget.value; },
    }),
    button("Save", {
      type: "button",
      onClick: () => layer.close({ name: name || "Ada" }),
    }),
    button("Cancel", { type: "button", onClick: () => layer.close() }),
  );
}
