import { Layout } from "nuclo-pages";

export default Layout({
  head: () => ({ title: "Fixture" }),
  render: ({ children }) =>
    div(
      { id: "layout" },
      nav(a({ href: "/" }, "Home"), a({ href: "/posts" }, "Posts"), a({ href: "/counter" }, "Counter")),
      main(children),
    ),
});
