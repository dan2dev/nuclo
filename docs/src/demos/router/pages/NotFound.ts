import type { RouteContext } from "nuclo-router";
import { router } from "../routes.ts";

// The "*" route. A server answers these with a 404 status.
export default function NotFound(ctx: RouteContext) {
  return div(
    h1("Not found"),
    p(`Nothing matches ${ctx.path}.`),
    a({ href: router.href("/") }, "Home"),
  );
}
