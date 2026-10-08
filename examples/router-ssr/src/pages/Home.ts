// A default export — the plainest loader shape: () => import("./Home.ts").
import type { RouteContext } from "nuclo-router";
import { s } from "../ui.ts";

export default function HomePage(ctx: RouteContext) {
  // Placed by the page itself: into the shell's region({ id: "main" }).
  return view("main", div(
    s.panel,
    h1(s.h1, "Rendered on the server"),
    p(
      s.lead,
      "View source: the HTML below arrived fully formed, styles inlined in <head>. " +
        "The browser then hydrated it in place — the nodes you are looking at were " +
        "created by the server, not replaced on load.",
    ),
    div(
      s.kv,
      span(s.key, "matched pattern"),
      span(s.val, ctx.pattern),
      span(s.key, "path (base stripped)"),
      span(s.val, ctx.path),
    ),
    p(
      s.lead,
      "Click a link above. The first visit to a route fetches its chunk (watch the " +
        "network panel); after the page goes idle the router preloads the rest, so " +
        "every later navigation is instant and never shows the loading pill.",
    ),
  ));
}
