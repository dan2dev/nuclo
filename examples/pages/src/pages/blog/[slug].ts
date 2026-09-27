import { Page, type LoadEvent } from "nuclo-pages";
import { getPost } from "../../server/posts";
import { styles } from "../../styles";

// Prerendered too: the build finds every post through the links on /blog.
export default Page({
  prerender: true,
  load: ({ params }: LoadEvent<"/blog/[slug]">) => getPost(params.slug),
  head: ({ data }) => ({
    title: `${data.title} · Nuclo Pages`,
    meta: { description: data.body, "og:title": data.title },
  }),
  render: ({ data }) =>
    article(h1(data.title), time(styles.muted, data.date.toISOString().slice(0, 10)), p(data.body), a({ href: "/blog" }, "← All posts")),
});
