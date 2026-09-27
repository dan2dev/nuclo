import { isActive, type LayoutProps } from "nuclo-pages";
import { styles } from "../styles";

// Wraps every page in this folder and below; stays mounted between navigations.
export default function Layout({ children }: LayoutProps) {
  const link = (href: string, label: string) =>
    a(styles.link, { href, "aria-current": () => (isActive(href) ? "page" : "false") }, label);
  return div(
    styles.page,
    nav(styles.nav, img({ src: "/nuclo-logo.svg", alt: "Nuclo", height: 24 }), link("/", "Home"), link("/about", "About")),
    main(children),
  );
}
