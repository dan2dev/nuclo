import { Page } from "nuclo-pages";
import { styles } from "../styles";

export default Page({
  // Rendered to HTML at build time.
  prerender: true,
  head: () => ({ title: "About · Nuclo Pages" }),
  render: () =>
    section(
      h1("About"),
      p("A Nuclo Pages app: file-based routing, server rendering with hydration, and server-side data and actions."),
      p(styles.muted, "Try ", a({ href: "/api/hello" }, "/api/hello"), ", an API route in src/pages/api/hello.ts."),
    ),
});
