import { notFound } from "nuclo-pages";

export interface Post {
  slug: string;
  title: string;
  date: Date;
  body: string;
}

// Stand-in for a database. Only page loads import this, so it never reaches the browser.
const posts: Post[] = [
  {
    slug: "hello-nuclo-pages",
    title: "Hello, Nuclo Pages",
    date: new Date("2026-09-01"),
    body: "Pages are files in src/pages, defined with Page({ load, head, actions, render }). They render on the server, then hydrate.",
  },
  {
    slug: "actions",
    title: "Actions",
    date: new Date("2026-09-12"),
    body: "A page's load and actions only run on the server. Call an action from the view; the page's data reloads and what changed re-renders.",
  },
  {
    slug: "layouts",
    title: "Layouts that stay put",
    date: new Date("2026-09-20"),
    body: "Layouts wrap their folder's pages and keep their DOM and state while you navigate between those pages.",
  },
];

export const listPosts = () => posts.map(({ slug, title, date }) => ({ slug, title, date }));

export const getPost = (slug: string) => posts.find((post) => post.slug === slug) ?? notFound(`No post called "${slug}"`);
