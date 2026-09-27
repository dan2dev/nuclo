import { notFound } from "nuclo-pages";

export interface Post {
  slug: string;
  title: string;
  date: Date;
  body: string;
}

// Stand-in for a database: this module only ever runs on the server.
const posts: Post[] = [
  {
    slug: "hello-nuclo-pages",
    title: "Hello, Nuclo Pages",
    date: new Date("2026-09-01"),
    body: "Pages are files in src/pages. Each one can export load(), head() and a view, and is rendered on the server, then hydrated.",
  },
  {
    slug: "server-functions",
    title: "Server functions",
    date: new Date("2026-09-12"),
    body: "$server() functions run in-process during server rendering and become a fetch in the browser — same call, same types.",
  },
  {
    slug: "layouts",
    title: "Layouts that stay put",
    date: new Date("2026-09-20"),
    body: "Layouts wrap their folder's pages and keep their DOM and state while you navigate between those pages.",
  },
];

export const listPosts = $server(async () => posts.map(({ slug, title, date }) => ({ slug, title, date })));

export const getPost = $server(async (slug: string) => posts.find((post) => post.slug === slug) ?? notFound(`No post called "${slug}"`));
