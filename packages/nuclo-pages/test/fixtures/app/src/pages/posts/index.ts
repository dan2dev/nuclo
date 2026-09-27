import { Page, href } from "nuclo-pages";

export default Page({
  prerender: true,
  load: () => ["hello", "world"],
  render: ({ data }) => ul(...data.map((slug) => li(a({ href: href("/posts/[slug]", { slug }) }, slug)))),
});
