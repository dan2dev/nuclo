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
import { ErrorPage, Layout, Page, error, href, isActive, isHttpError, isRedirect, navigate, notFound, redirect, route } from "nuclo-pages";
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

// A page: data flows from load into head and render; actions become async calls.
type Todo = { id: number; text: string; done: boolean };
Page({
  prerender: true,
  load: async (): Promise<Todo[]> => [],
  head: ({ data }) => ({ title: `${data.length} todos` }),
  actions: {
    add: async (text: string) => ({ id: 2, text }),
    clear: () => {},
  },
  render: ({ data, actions, params, url }) => {
    assert<Equal<typeof data, Todo[]>>(true);
    assert<Equal<typeof actions.add, (text: string) => Promise<{ id: number; text: string }>>>(true);
    assert<Equal<typeof actions.clear, () => Promise<void>>>(true);
    assert<Equal<typeof params, Record<string, string>>>(true);
    assert<Equal<typeof url, URL>>(true);
    // @ts-expect-error unknown action
    void actions.remove();
    // @ts-expect-error wrong argument type
    void actions.add(1);
    return section(h1(String(data.length)), button({ onClick: () => actions.add("x") }, "Add"));
  },
});

// Naming the route in load's event types the params everywhere.
Page({
  load: ({ params }: LoadEvent<"/blog/[slug]">) => ({ title: params.slug }),
  head: ({ data, params }) => ({ title: `${data.title} ${params.slug}` }),
  render: ({ data, params }) => {
    assert<Equal<typeof params, { slug: string }>>(true);
    assert<Equal<Equal<typeof params, { id: string }>, false>>(true);
    return article(h1(data.title));
  },
});

// Without load, data is undefined; without actions, there are none.
Page({
  render: ({ data, actions }) => {
    assert<Equal<typeof data, undefined>>(true);
    assert<Equal<typeof actions, {}>>(true);
    return div();
  },
});
// @ts-expect-error render is required
Page({ load: () => 1 });
// @ts-expect-error render returns an element
Page({ render: () => "text" });

// Layouts: data from their own load, children is the outlet.
Layout({
  load: ({ params }) => ({ user: "ana", org: params.org }),
  render: ({ data, children }) => {
    assert<Equal<typeof data, { user: string; org: string }>>(true);
    return div(span(data.user), main(children));
  },
});
// @ts-expect-error layouts have no actions
Layout({ actions: {}, render: ({ children }) => div(children) });
assert<Equal<LayoutProps["data"], undefined>>(true);

ErrorPage({
  head: ({ status, url }) => ({ title: `${status} ${url.pathname}` }),
  render: ({ status, message }: ErrorProps) => h1(`${status} ${message}`),
});

// Views can be written apart from their definition.
const TodoList = ({ data, actions }: PageProps<Todo[], Record<string, string>, { clear: () => void }>) =>
  ul(...data.map((todo) => li(todo.text)), button({ onClick: () => actions.clear() }, "Clear"));
const _view: (props: PageProps<Todo[], Record<string, string>, { clear: () => void }>) => NodeModFn<"ul"> = TodoList;
const _layoutView = ({ children }: LayoutProps) => main(children);
const _head: Head = { title: "x", meta: { description: "d", "og:title": "t" }, link: [{ rel: "canonical", href: "/" }] };
const _headProps = ({ data }: HeadProps<Todo[]>) => ({ title: String(data.length) });
void [_view, _layoutView, _head, _headProps];

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
