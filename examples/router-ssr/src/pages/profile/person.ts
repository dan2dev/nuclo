// The "/:person" key of the "/profile" section: mounted at /profile/:person,
// inside the layout in index.ts.
import type { Params, RouteContext } from "nuclo-router";
import { s } from "../../ui.ts";

export default function ProfilePersonPage(ctx: RouteContext<Params<"/profile/:person">>) {
  return div(
    h2(ctx.params.person),
    div(
      s.kv,
      span(s.key, "pattern"),
      span(s.val, ctx.pattern),
      span(s.key, "params.person"),
      span(s.val, ctx.params.person),
    ),
  );
}
