// Docs.ts: a layout page. Its child route renders inside outlet(), and
// moving between topics never rebuilds this page: the input keeps its text.
import type { PageProps, RouteContext } from "nuclo-router";
import { router } from "../routes.ts";
import { s } from "../styles.ts";

const topics = ["intro", "install", "api"];

export default function Docs(_ctx: RouteContext, { outlet }: PageProps) {
  return div(
    h1("Docs"),
    div(
      s.docs,
      aside(
        s.side,
        // "./intro" resolves against this page's route: /docs/intro
        ...topics.map((t) => a({ href: router.href(`./${t}`) }, t)),
        input({ placeholder: "Notes (kept)" }),
      ),
      section(outlet()),
    ),
  );
}
