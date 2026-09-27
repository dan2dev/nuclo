import { href, type PageProps } from "nuclo-pages";
import { listPosts } from "../../server/posts";
import { styles } from "../../styles";

export const prerender = true;

export const load = () => listPosts();

export const head = () => ({ title: "Blog · Nuclo Pages" });

export default function Blog({ data }: PageProps<typeof load>) {
  return section(
    h1("Blog"),
    ...data.map((post) =>
      article(styles.card, h2(a({ href: href("/blog/[slug]", { slug: post.slug }) }, post.title)), time(styles.muted, post.date.toISOString().slice(0, 10))),
    ),
  );
}
