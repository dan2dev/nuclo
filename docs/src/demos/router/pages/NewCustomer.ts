// NewCustomer.ts: the pushed page. close(result) resolves the push() that
// opened it; close() with nothing is a dismissal. Enter in the name saves,
// like the Save button. On a cold load there is no layer beneath
// (layer.depth is 0), so it offers a link out instead.
import type { PageProps, RouteContext } from "nuclo-router";
import { router } from "../routes.ts";
import { s } from "../styles.ts";

export default function NewCustomer(
  _ctx: RouteContext,
  { layer }: PageProps,
) {
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
    layer.depth > 0
      ? button("Cancel", { type: "button", onClick: () => layer.close() })
      : a({ href: router.href("/orders/new") }, "Back to the order"),
  );
}
