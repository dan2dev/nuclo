import { isActive, route, type LayoutProps } from "nuclo-pages";
import { styles } from "../styles";

const links = [
  ["/blog", "Blog"],
  ["/todos", "Todos"],
  ["/about", "About"],
] as const;

export const head = () => ({ title: "Nuclo Pages", meta: { description: "A full-stack Nuclo app" } });

// The root layout wraps every page and stays mounted while you navigate.
export default function Layout({ children }: LayoutProps) {
  return div(
    styles.page,
    header(
      styles.header,
      a(styles.brand, { href: "/" }, "nuclo/pages"),
      nav(
        styles.nav,
        ...links.map(([href, label]) => a(styles.navLink, { href, "aria-current": () => (isActive(href) ? "page" : "false") }, label)),
      ),
      span(styles.pending, () => (route.pending ? "Loading…" : "")),
    ),
    div("input:", input({ type: "text" })),
    main(children),
    footer(styles.footer, "Server-rendered, hydrated, and navigated by Nuclo Pages."),
  );
}
