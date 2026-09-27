import { notFound, type LoadEvent, type PageProps } from "nuclo-pages";

export const prerender = true;

export const load = ({ params }: LoadEvent<"/posts/[slug]">) => {
  if (params.slug === "missing") notFound("No such post");
  return { title: params.slug.toUpperCase() };
};

export default function Post({ data }: PageProps<typeof load>) {
  return article(h1(data.title));
}
