import type { LayoutProps } from "nuclo-pages";

export const head = () => ({ title: "Fixture" });

export default function Layout({ children }: LayoutProps) {
  return div(
    { id: "layout" },
    nav(a({ href: "/" }, "Home"), a({ href: "/posts" }, "Posts"), a({ href: "/counter" }, "Counter")),
    main(children),
  );
}
