import { Page, href } from "nuclo-pages";
import { listPosts } from "../../server/posts";
import { styles } from "../../styles";

export default Page({
  prerender: true,
  load: () => listPosts(),
  head: () => ({ title: "Blog · Nuclo Pages" }),
  render: ({ data }) =>
    section(
      h1("Blog"),
      ...data.map((post) =>
        article(styles.card, h2(a({ href: href("/blog/[slug]", { slug: post.slug }) }, post.title)), time(styles.muted, post.date.toISOString().slice(0, 10))),
      ),
    ),
});
