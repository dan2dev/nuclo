import { styles } from "../styles";

// Rendered to HTML at build time.
export const prerender = true;

export const head = () => ({ title: "About · Nuclo Pages" });

export default function About() {
  return section(
    h1("About"),
    p("A Nuclo Pages app: file-based routing, server rendering with hydration, and server functions."),
    p(styles.muted, "Try ", a({ href: "/api/hello" }, "/api/hello"), ", an API route in src/pages/api/hello.ts."),
  );
}
