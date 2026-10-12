// Post.ts: a page with a load(). It runs before the page is built, on every
// visit, and whatever it returns arrives as `data`. While it runs,
// router.pending is true and the previous page stays on screen.
import type { DataLoader, PageProps, RouteContext } from "nuclo-router";

interface Post { title: string; body: string }

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const load: DataLoader<Post> = async (ctx) => {
  await wait(700); // a slow API
  if (ctx.params.slug === "broken") throw new Error("post not found");
  const title = ctx.params.slug.replace(/-/g, " ");
  return { title, body: "Loaded by load() before the page was built." };
};

export default function Post(
  _ctx: RouteContext,
  { data }: PageProps<Post>,
) {
  return article(h1(data.title), p(data.body));
}
