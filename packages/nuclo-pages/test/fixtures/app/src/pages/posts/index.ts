import { href, type PageProps } from "nuclo-pages";

export const prerender = true;

export const load = () => ["hello", "world"];

export default function Posts({ data }: PageProps<typeof load>) {
  return ul(...data.map((slug) => li(a({ href: href("/posts/[slug]", { slug }) }, slug))));
}
