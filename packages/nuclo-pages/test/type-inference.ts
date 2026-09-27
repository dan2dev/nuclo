/**
 * Compile-time tests of the public types (checked by `bun run typecheck`, never executed).
 * `// @ts-expect-error` lines must fail to compile, everything else must compile.
 */
/// <reference path="../types/globals.d.ts" />
import type {
  ErrorProps,
  Head,
  HeadProps,
  LayoutProps,
  LoadEvent,
  Middleware,
  PageProps,
  RequestEvent,
  RequestHandler,
  RouteId,
  RouteParams,
} from "nuclo-pages";
import { error, href, isActive, isHttpError, isRedirect, navigate, notFound, redirect, route } from "nuclo-pages";
import { getRequestEvent } from "nuclo-pages/server";
import handler from "virtual:nuclo-pages/handler";

// What src/routes.gen.d.ts generates for an app.
declare module "nuclo-pages" {
  interface Register {
    routes: {
      "/": {};
      "/blog/[slug]": { slug: string };
      "/docs/[...path]": { path: string };
      "/orgs/[org]/projects/[id]": { org: string; id: string };
    };
  }
  interface Locals {
    user?: { name: string };
  }
}

/** Mutually assignable (what matters to users; deferred indexed types stay comparable). */
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const assert = <T extends true>(_: T) => {};

// Route ids and params come from the registry.
assert<Equal<RouteId, "/" | "/blog/[slug]" | "/docs/[...path]" | "/orgs/[org]/projects/[id]">>(true);
assert<Equal<RouteParams<"/orgs/[org]/projects/[id]">, { org: string; id: string }>>(true);
// @ts-expect-error unknown route id
type Unknown = LoadEvent<"/nope">;

// load → data → view, fully inferred.
const load = async ({ params, url }: LoadEvent<"/blog/[slug]">) => ({ title: params.slug, at: new Date(), q: url.searchParams.get("q") });
type Props = PageProps<typeof load>;
assert<Equal<Props["data"], { title: string; at: Date; q: string | null }>>(true);
assert<Equal<Props["params"], { slug: string }>>(true);
assert<Equal<Equal<Props["params"], { id: string }>, false>>(true);
assert<Equal<Props["url"], URL>>(true);
assert<Equal<HeadProps<typeof load>["data"], Props["data"]>>(true);

// Pages without a load name their route instead.
assert<Equal<PageProps<"/docs/[...path]">["params"], { path: string }>>(true);
assert<Equal<PageProps<"/docs/[...path]">["data"], undefined>>(true);

// Layouts: data from their own load, children is the outlet.
const layoutLoad = () => ({ user: "ana" });
const Layout = ({ data, children }: LayoutProps<typeof layoutLoad>) => div(span(data.user), main(children));
const _layoutView: (props: LayoutProps<typeof layoutLoad>) => unknown = Layout;
assert<Equal<LayoutProps["data"], undefined>>(true);

// Views are nuclo elements.
const Post = ({ data }: Props) => article(h1(data.title));
const _page: (props: Props) => NodeModFn<"article"> = Post;

const ErrorView = ({ status, message }: ErrorProps) => h1(`${status} ${message}`);
const _head: Head = { title: "x", meta: { description: "d", "og:title": "t" }, link: [{ rel: "canonical", href: "/" }] };
void [ErrorView, _layoutView, _page, _head];

// href is typed by route.
href("/");
href("/blog/[slug]", { slug: "hello" });
href("/orgs/[org]/projects/[id]", { org: "a", id: "1" });
// @ts-expect-error missing params
href("/blog/[slug]");
// @ts-expect-error wrong param name
href("/blog/[slug]", { id: "x" });
// @ts-expect-error unknown route
href("/nope");

// Control flow never returns.
assert<Equal<ReturnType<typeof redirect>, never>>(true);
assert<Equal<ReturnType<typeof error>, never>>(true);
assert<Equal<ReturnType<typeof notFound>, never>>(true);
redirect("/login", 303);
// @ts-expect-error not a redirect status
redirect("/login", 200);
const check = (caught: unknown) => {
  if (isRedirect(caught)) return caught.location satisfies string;
  if (isHttpError(caught)) return caught.status satisfies number;
};
void check;

// Router state and navigation.
const _path: string = route.url.pathname;
const _pending: boolean = route.pending;
const _active: boolean = isActive("/blog") || isActive("/", true);
const _navigation: Promise<void> = navigate("/blog/x", { replace: true });
void [_path, _pending, _navigation, _active];

// Server functions keep their signature and become async.
const getPost = $server(async (slug: string) => ({ slug, views: 1 }));
const sync = $server((a: number, b: number) => a + b);
assert<Equal<typeof getPost, (slug: string) => Promise<{ slug: string; views: number }>>>(true);
assert<Equal<ReturnType<typeof sync>, Promise<number>>>(true);
// @ts-expect-error wrong argument type
void getPost(1);

// Request events, API routes and middleware.
const GET: RequestHandler<"/blog/[slug]"> = ({ params, cookies, locals }) => {
  assert<Equal<typeof params, { slug: string }>>(true);
  cookies.set("seen", params.slug, { maxAge: 60, sameSite: "strict" });
  return Response.json({ user: locals.user?.name });
};
const middleware: Middleware = async (event, next) => {
  event.locals.user = { name: "ana" };
  event.setHeaders({ "x-a": "1" });
  return next();
};
const event: RequestEvent = getRequestEvent();
const _handled: Promise<Response> = handler(new Request("http://x/"), { env: {} });
void [GET, middleware, event, _handled];
