# nuclo-pages

The full-stack framework for [Nuclo](https://nuclo.dev): file-based routing, server rendering with hydration, server functions, API routes, middleware and prerendering. Built on Vite; runs on Node, Bun and Cloudflare Workers.

```bash
npm create nuclo@latest my-app -- --template pages
```

```ts
// src/pages/blog/[slug].ts
import type { HeadProps, LoadEvent, PageProps } from "nuclo-pages";
import { getPost } from "../../server/posts";

export const load = ({ params }: LoadEvent<"/blog/[slug]">) => getPost(params.slug);

export const head = ({ data }: HeadProps<typeof load>) => ({ title: data.title });

export default function Post({ data }: PageProps<typeof load>) {
  return article(h1(data.title), p(data.body));
}
```

```ts
// src/server/posts.ts
import { notFound } from "nuclo-pages";

export const getPost = $server(async (slug: string) => (await db.posts.find(slug)) ?? notFound());
```

The page is rendered on the server, hydrated in the browser, and every later navigation to another post runs `load` in the browser — where `getPost` becomes a request to the server, with the same types.

## Contents

- [Setup](#setup)
- [Routing](#routing)
- [Pages and layouts](#pages-and-layouts)
- [Loading data](#loading-data)
- [Server functions](#server-functions)
- [Head](#head)
- [Navigation](#navigation)
- [Errors and redirects](#errors-and-redirects)
- [API routes](#api-routes)
- [Middleware, cookies and headers](#middleware-cookies-and-headers)
- [Prerendering](#prerendering)
- [Deploying](#deploying)
- [How it works](#how-it-works)

## Setup

```bash
npm install nuclo nuclo-pages
npm install -D vite typescript
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { nucloPages } from "nuclo-pages/vite";

export default defineConfig({ plugins: [nucloPages()] });
```

```jsonc
// tsconfig.json
{ "compilerOptions": { "types": ["vite/client", "nuclo/types", "nuclo-pages/types"], "strict": true, "moduleResolution": "bundler" } }
```

| Command | |
|---|---|
| `vite` | Dev server with server rendering and HMR |
| `vite build` | Client and server build into `dist/`, plus prerendered pages |
| `node dist/server/index.mjs` | Run the built server (`PORT`, `HOST`) |
| `vite preview` | Serve the build through Vite |

Optional files: `src/app.html` (the document shell, with `<!--nuclo:head-->` and `<!--nuclo:body-->`) and `src/middleware.ts`.

## Routing

Every file in `src/pages` is a route:

| File | URL |
|---|---|
| `index.ts` | `/` |
| `about.ts` | `/about` |
| `blog/index.ts` | `/blog` |
| `blog/[slug].ts` | `/blog/:slug` — `params.slug` |
| `docs/[...path].ts` | `/docs/*` (one or more segments) — `params.path` is `"a/b/c"` |
| `(marketing)/pricing.ts` | `/pricing` — groups organise files and share layouts without a URL segment |
| `api/users.ts` | an [API route](#api-routes) when it exports `GET`/`POST`/… and no view |
| `_layout.ts` | the [layout](#pages-and-layouts) of its folder |
| `_error.ts` | the [error view](#errors-and-redirects) of its folder |

Anything else starting with `_` or `.` (`_components/…`, `_utils.ts`), `*.test.*`, `*.spec.*` and `*.d.ts` files are ignored, so helpers can live next to pages. Static segments win over `[params]`, which win over `[...catchAlls]`; two files for the same URL are a build error.

**Typed routes.** `src/routes.gen.d.ts` is generated from `src/pages` (commit it): route ids like `"/blog/[slug]"` then type `LoadEvent`, `PageProps`, `RequestEvent` and `href()`, and a typo in a route id is a type error.

```ts
import { href } from "nuclo-pages";

a({ href: href("/blog/[slug]", { slug: post.slug }) }, post.title); // "/blog/hello%20world"
```

## Pages and layouts

A page exports its view as `default`: a function from props to a Nuclo element. It can also export `load`, `head` and `prerender`.

```ts
export default function About({ params, url }: PageProps<"/about">) {
  let clicks = 0;
  return button({ onClick: () => (clicks++, update()) }, () => `Clicked ${clicks} times`);
}
```

View state lives in the view function, like any Nuclo component: it's created per request on the server and per visit in the browser.

A layout wraps its folder and everything below it. `children` is the outlet — place it once:

```ts
// src/pages/_layout.ts
import { isActive, route, type LayoutProps } from "nuclo-pages";

export default function Layout({ children }: LayoutProps) {
  return div(
    nav(
      a({ href: "/", "aria-current": () => (isActive("/") ? "page" : "false") }, "Home"),
      a({ href: "/blog", "aria-current": () => (isActive("/blog") ? "page" : "false") }, "Blog"),
      span(() => (route.pending ? "Loading…" : "")),
    ),
    main(children),
  );
}
```

Layouts nest (`blog/_layout.ts` inside `_layout.ts`) and **stay mounted** while you navigate between their pages: only what changed is replaced, so a sidebar keeps its scroll and state. A layout is re-created only when a param its folder consumes changes — e.g. `orgs/[org]/_layout.ts` when `org` changes. Without a root `_layout.ts`, pages render inside a plain `div`.

## Loading data

`load` returns the data the view receives as `data`:

```ts
export const load = async ({ params, url }: LoadEvent<"/orgs/[org]/projects">) => ({
  projects: await listProjects(params.org, url.searchParams.get("q")),
});

export default function Projects({ data }: PageProps<typeof load>) {
  return ul(list(() => data.projects, (project) => li(project.name)));
}
```

- It runs **on the server** for the first request, and **in the browser** on client navigation. Reach the database, secrets and other server-only things through [server functions](#server-functions), which work from both sides.
- Its result is embedded in the page (serialized with [devalue](https://github.com/Rich-Harris/devalue): `Date`, `Map`, `Set`, `BigInt`, `undefined`, repeated references…), so hydration reuses it instead of loading twice.
- The loads of the layouts and the page run in parallel. A layout's `load` gets only `{ params }` for its own folder; a page's `load` gets `{ params, url }` and re-runs when the path or query changes.
- To refresh after a change, update `data` and call `update()`, as usual in Nuclo:

  ```ts
  button({ onClick: async () => ((data.count = await increment()), update()) }, () => String(data.count));
  ```

## Server functions

`$server()` declares a function whose body only ever runs on the server:

```ts
// src/server/todos.ts
import { error } from "nuclo-pages";
import { getRequestEvent } from "nuclo-pages/server";
import { db } from "./db";

export const addTodo = $server(async (text: string) => {
  if (!text.trim()) error(400, "A todo needs some text");
  const user = getRequestEvent().locals.user;
  return db.todos.insert({ text, owner: user.id });
});
```

```ts
// anywhere: a load, an event handler…
const todo = await addTodo("Write docs"); // typed: (text: string) => Promise<Todo>
```

- During server rendering the call is **in-process**; in the browser it becomes a `POST /_server/<id>` with devalue-encoded arguments and result.
- The browser bundle never contains the body: the call is replaced by a stub, and imports and helpers used only by server bodies are removed. Importing `node:*`, `bun:*`, `cloudflare:*` or `nuclo-pages/server` from browser code is a build error.
- A `$server()` call must initialize a top-level `const` (exported or not) and take one inline function.
- Thrown `error(status, message)` reaches the caller as an `HttpError` with that status and message; other errors become a 500 whose message is hidden in production. A thrown `redirect()` makes the browser navigate.
- Server functions are public endpoints: validate their arguments and check permissions. Requests need the `x-nuclo-rpc` header, which browsers only send cross-origin after a CORS preflight — nuclo-pages grants none, which protects against CSRF.
- Module state is shared between rendering and calls (e.g. an in-memory cache), because it's one module on the server.

## Head

`head` returns the page's `<title>`, meta and link tags. Layouts can export one too; they merge from the root layout to the page (later titles and meta keys win):

```ts
export const head = ({ data, url }: HeadProps<typeof load>) => ({
  title: `${data.title} · My site`,
  meta: { description: data.summary, "og:title": data.title }, // og:* → property=
  link: [{ rel: "canonical", href: `https://example.com${url.pathname}` }],
});
```

The title in `src/app.html` is used when no head sets one.

## Navigation

Links are plain `a({ href })`. Same-origin links to pages are followed without a page load; anything else (other origins, API routes, unknown URLs, `target`, `download`, `rel="external"`, `data-reload`, modifier-key clicks) is left to the browser. Scroll is restored on back and forward.

```ts
import { href, isActive, navigate, route } from "nuclo-pages";

await navigate("/blog", { replace: true }); // programmatic (browser only)
route.url;      // URL
route.params;   // { slug: "hello" }
route.id;       // "/blog/[slug]"
route.pending;  // true while a navigation loads
isActive("/blog"); // /blog or below; isActive("/blog", true) for an exact match
```

`route` is plain mutable state: read it inside resolvers (`() => route.url.pathname`) and they update on navigation. On the server it always reflects the current request.

**Prefetching.** Hovering or focusing a link loads its route code and page data, reused if the click follows within 10 seconds; links scrolled into view get their code preloaded when the browser is idle.

## Errors and redirects

```ts
import { error, notFound, redirect } from "nuclo-pages";

export const load = async ({ params }: LoadEvent<"/admin/[id]">) => {
  const user = await currentUser();
  if (!user) redirect("/login");            // 302; redirect(url, 301 | 303 | 307 | 308)
  if (!user.admin) error(403, "Admins only");
  return (await findItem(params.id)) ?? notFound();
};
```

They work in `load`, server functions, API routes and middleware. Errors render the nearest `_error.ts` — in the page's folder or above it — inside the layouts that wrap it, with the right status code:

```ts
// src/pages/_error.ts
import type { ErrorProps } from "nuclo-pages";

export const head = ({ status }: ErrorProps) => ({ title: String(status) });

export default function ErrorPage({ status, message }: ErrorProps) {
  return section(h1(String(status)), p(message));
}
```

Unknown URLs are a 404 rendered by the root `_error.ts`. When a layout's own `load` fails, an `_error.ts` above that layout is used. Unexpected errors are logged and shown as `500 Internal Error` in production (with their message in dev).

## API routes

A file that exports HTTP methods instead of a view is an API route. It receives the request event and returns a `Response`:

```ts
// src/pages/api/users/[id].ts
import { error, type RequestHandler } from "nuclo-pages";

export const GET: RequestHandler<"/api/users/[id]"> = async ({ params }) => Response.json(await db.users.find(params.id));

export const DELETE: RequestHandler<"/api/users/[id]"> = async ({ params, locals }) => {
  if (!locals.user) error(401);
  await db.users.delete(params.id);
  return new Response(null, { status: 204 });
};
```

`HEAD` falls back to `GET`; other methods get `405` with an `Allow` header.

## Middleware, cookies and headers

`src/middleware.ts` runs before every page, API route and server function:

```ts
import { redirect, type Middleware } from "nuclo-pages";

export default (async (event, next) => {
  event.locals.user = await sessionUser(event.cookies.get("session"));
  if (event.url.pathname.startsWith("/admin") && !event.locals.user) redirect("/login");
  event.setHeaders({ "x-frame-options": "DENY" });
  return next();
}) satisfies Middleware;
```

Type `locals` (and `platform`) by augmenting the module:

```ts
declare module "nuclo-pages" {
  interface Locals { user?: User }
}
```

The request event — the middleware's `event`, an API route's argument, or `getRequestEvent()` from `nuclo-pages/server` inside server functions and server-side loads — has:

| | |
|---|---|
| `request`, `url`, `params` | the request |
| `locals` | per-request values set by middleware |
| `platform` | what the adapter passes: Node `{ req, res }`, Bun `{ server }`, Cloudflare `{ env, ctx }` |
| `cookies.get/set/delete` | defaults: `Path=/`, `HttpOnly`, `SameSite=Lax`, `Secure` on https |
| `setHeaders({...})` | headers for the response |

Cookies and headers set anywhere during a request end up on its response.

## Prerendering

```ts
export const prerender = true;
```

on a page (or a layout, for all its pages) renders it to HTML at build time. Dynamic routes are discovered by following links: if `/blog` is prerendered and links to `/blog/hello`, that page is prerendered too. Files are written to `dist/client` (`/blog/hello` → `blog/hello.html`) and served as static files. Prerendered pages hydrate like any other; client navigation still uses the server for `load`.

## Deploying

The adapter decides what `vite build` produces in `dist/server`:

**Node** (default) — `nucloPages({ adapter: "node" })`, then `node dist/server/index.mjs`. Static files, prerendered pages and immutable `/assets/` caching are included. The server also runs on Bun.

**Bun** — `nucloPages({ adapter: "bun" })`, then `bun dist/server/index.mjs` (uses `Bun.serve`).

**Cloudflare Workers** — with `@cloudflare/vite-plugin`, which runs the server in workerd during `vite dev` and `vite preview`, with your bindings:

```ts
// vite.config.ts
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [nucloPages({ adapter: "cloudflare" }), cloudflare({ viteEnvironment: { name: "ssr" } })],
});
```

```jsonc
// wrangler.jsonc
{ "name": "my-app", "main": "./src/worker.ts", "compatibility_date": "2026-09-01", "compatibility_flags": ["nodejs_als"] }
```

```ts
// src/worker.ts — export Durable Objects from here too
import handler from "virtual:nuclo-pages/handler";

export default { fetch: (request: Request, env: Env, ctx: ExecutionContext) => handler(request, { env, ctx }) };
```

Then `wrangler deploy`. Read bindings in server code through `getRequestEvent().platform.env`.

**Anything else** — `dist/server/handler.mjs` exports a standard `(request: Request, platform?) => Promise<Response>` handler; `nuclo-pages/node` exports `toRequest` and `sendResponse` to mount it in an existing Node server.

## How it works

- **Build.** One Vite plugin, using Vite's environment API: the `client` environment builds the browser entry and a code-split chunk per route; the `ssr` environment builds the server with the same plugins, aliases and virtual modules. `$server()` is compiled differently per environment: an RPC stub in the browser, the original function (registered by id) on the server.
- **Render.** The server matches the route, runs the loads, builds the Nuclo tree and serializes it with `nuclo/ssr`, along with the `css()` rules used, the head, `modulepreload` links for the route's chunks, and the load data as a JSON script.
- **Hydrate.** The browser rebuilds the same tree from the same data and hands it to Nuclo's `hydrate()`, which adopts the server's DOM nodes instead of creating new ones.
- **Navigate.** Each layout's `children` is a single-item Nuclo `list()`. Navigation loads what changed and swaps the item at the first level that differs, then calls `update()`.

## Limits

- No streaming: a page renders once its loads are done.
- Prerendering needs the server at runtime for client-side navigation and server functions (no fully static export).
- Plain `.css` imports flash unstyled in dev only (Nuclo's `css()` doesn't).
- `$server()` can't be used from `node_modules` packages.

## License

MIT
