import { styles } from "../styles";

export const prerender = true;

export default function Home() {
  return section(
    h1("Nuclo Pages"),
    p("File-based routing, server rendering with hydration, and server functions for Nuclo."),
    ul(
      li(a({ href: "/blog" }, "A prerendered blog"), span(styles.muted, " — load() + $server()")),
      li(a({ href: "/todos" }, "A todo app"), span(styles.muted, " — mutations through server functions")),
      li(a({ href: "/api/health" }, "An API route"), span(styles.muted, " — plain Request → Response")),
    ),
  );
}
