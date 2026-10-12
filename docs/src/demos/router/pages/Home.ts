import { router } from "../routes.ts";

export default function Home() {
  return div(
    h1("Home"),
    p(
      "A real nuclo-router app. Links are plain <a href>s; ",
      "the router owns the ones that match its table.",
    ),
    p(
      a({ href: router.href("/docs/intro") }, "Docs → intro"),
      " · ",
      a({ href: router.href("/blog/hello-world") }, "A post with a loader"),
      " · ",
      a({ href: router.href("/orders/new") }, "A form that opens a layer"),
    ),
  );
}
