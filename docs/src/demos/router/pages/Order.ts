// Order.ts: a form that needs a record that does not exist yet. push()
// opens /customers/new as a layer on top, so this form is not re-rendered
// and its text survives. Back closes the layer like Cancel does.
import type { PageProps, RouteContext } from "nuclo-router";
import { router } from "../routes.ts";
import { s } from "../styles.ts";

interface Customer { name: string }

export default function Order(_ctx: RouteContext, { layer }: PageProps) {
  let customer: Customer | undefined;

  return form(
    // Enter in the notes has no submit action: it must not reload the frame.
    { onSubmit: (e) => { e.preventDefault(); } },
    h1("New order"),
    input({ placeholder: "Notes: type, then open the layer" }),
    p(s.muted, () =>
      customer ? `Customer: ${customer.name}` : "No customer yet",
    ),
    button("New customer…", {
      type: "button",
      onClick: async () => {
        // push() takes an href, so router.href() adds the base.
        const created = await layer.push<Customer>(
          router.href("/customers/new"),
        );
        if (created) { customer = created; update(); }
      },
    }),
  );
}
