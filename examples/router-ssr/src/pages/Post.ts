/**
 * Params + a route loader.
 *
 * `load` runs before this page is built — on the server for the first request,
 * and in the browser for every client-side navigation. So the HTML the server
 * sends already contains the post: view source and the title is there, with no
 * fetch-after-hydration and no loading flash.
 */
import type { DataLoader, PageProps, Params, RouteContext } from "nuclo-router";
import { s } from "../ui.ts";
import { takeServerData } from "../ssr-data.ts";

export interface Post {
  slug: string;
  title: string;
  body: string;
  loadedOn: "server" | "browser";
}

/**
 * Stands in for a database or an API call. Deliberately async.
 *
 * On the first page load in the browser it takes what the server already put
 * in the HTML rather than fetching the same thing again while hydrating —
 * the one piece the router cannot do for you, since only the app knows how
 * its data serializes. Every later navigation falls through and fetches.
 */
/** The pattern this page is mounted at, so `ctx.params.slug` is a `string`. */
type PostParams = Params<"/blog/:slug">;

export const load: DataLoader<Post, PostParams> = async (ctx) => {
  const fromServer = takeServerData<Post>();
  if (fromServer) return fromServer;

  await new Promise((resolve) => setTimeout(resolve, 120));
  const slug = ctx.params.slug;
  return {
    slug,
    title: slug.replace(/-/g, " "),
    body: `Loaded for "${slug}" from ${ctx.pattern}.`,
    // There is no window on the server, which is how the page below can tell
    // you which side produced the data you are looking at.
    loadedOn: typeof window === "undefined" ? "server" : "browser",
  };
};

export default function PostPage(ctx: RouteContext<PostParams>, { data: post }: PageProps<Post>) {
  // Placed by the page itself: into the shell's region({ id: "main" }).
  return into("main", div(
    s.panel,
    h1(s.h1, post.title),
    p(s.lead, post.body),
    div(
      s.kv,
      span(s.key, "loaded on"),
      span(s.val, post.loadedOn),
      span(s.key, "params.slug"),
      span(s.val, post.slug),
      span(s.key, "pattern"),
      span(s.val, ctx.pattern),
    ),
    p(
      s.lead,
      "the data arrived with the page rather than after it. on a cold load this says " +
        "\u201cserver\u201d: the HTML already carried the post, and the loader took that " +
        "instead of fetching it again while hydrating. navigate away and back and it says " +
        "\u201cbrowser\u201d \u2014 the module is cached, the data never is.",
    ),
    p(
      s.lead,
      "try /app/blog/caf%C3%A9 too — the slug reaches the loader already decoded.",
    ),
  ));
}
