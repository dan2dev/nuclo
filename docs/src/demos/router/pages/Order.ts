// Order.ts: a form that needs a record that does not exist yet. push()
// opens ./customer (/orders/new/customer) as a layer on top, so this form is
// not re-rendered and its text survives. Back closes the layer like Cancel does.
// The layer's URL is nested under this page's, so a reload or a fresh tab on it
// renders this page first: it puts the stack back, itself beneath, the layer on top.
import type { PageProps, RouteContext } from "nuclo-router";
import { router } from "../routes.ts";
import { s } from "../styles.ts";

interface Customer { name: string }

export default function Order(ctx: RouteContext, { layer, outlet }: PageProps) {
  let customer: Customer | undefined;

  const newCustomer = async () => {
    // "./customer" resolves against this page's route: /orders/new/customer.
    const created = await layer.push<Customer>("./customer");
    if (created) { customer = created; update(); }
  };

  // Built on the layer's URL (a cold load): back to ours, then reopen the layer.
  if (router.path !== ctx.path) {
    void router.go(router.href(ctx.path), { replace: true }).then(newCustomer);
  }

  return div(
    form(
      // Enter in the notes has no submit action: it must not reload the frame.
      { onSubmit: (e) => { e.preventDefault(); } },
      h1("New order"),
      input({ placeholder: "Notes: type, then open the layer" }),
      p(s.muted, () =>
        customer ? `Customer: ${customer.name}` : "No customer yet",
      ),
      button("New customer…", { type: "button", onClick: newCustomer }),
    ),
    // Where ./customer lands when it is navigated to rather than pushed
    // (Forward after it closed): a form of its own, so outside this one.
    outlet(),
  );
}
