import { Page } from "nuclo-pages";
import { styles } from "../styles";

export default Page({
  prerender: true,
  render: () =>
    section(
      h1("Nuclo Pages"),
      p("File-based routing, server rendering with hydration, and server-side data and actions for Nuclo."),
      ul(
        li(a({ href: "/blog" }, "A prerendered blog"), span(styles.muted, " — load() on the server")),
        li(a({ href: "/todos" }, "A todo app"), span(styles.muted, " — actions that reload the page's data")),
        li(a({ href: "/about" }, "A $server() function"), span(styles.muted, " — called from a button")),
        li(a({ href: "/api/health" }, "An API route"), span(styles.muted, " — plain Request → Response")),
      ),
    ),
});
