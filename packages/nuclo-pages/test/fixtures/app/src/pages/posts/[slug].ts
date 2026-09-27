import { Page, notFound, type LoadEvent } from "nuclo-pages";

export default Page({
  prerender: true,
  load: ({ params }: LoadEvent<"/posts/[slug]">) => {
    if (params.slug === "missing") notFound("No such post");
    return { title: params.slug.toUpperCase() };
  },
  render: ({ data }) => article(h1(data.title)),
});
