# nuclo-router

Routing for [nuclo](https://nuclo.dev/) — SSR, hydration, code-split routes and
idle preloading. No dependencies beyond nuclo itself, and no side effects — it
tree-shakes away when unused.

The router decides *what* to load; the app says *where* with `router.outlet()`:
one `list()` over the layer stack, one row per layer, so an ordinary page is a
single row. The server and the client build the *same* tree, so `hydrate()`
claims the server's nodes instead of replacing them. Everything else is
`history`, one delegated `click` listener, and `requestIdleCallback`.

```bash
npm install nuclo nuclo-router
```

## One import

```ts
export const router = createRouter(routes);   // define once, import anywhere
await router.start();                          // resolve the current URL
render(App, document.getElementById("app")!);  // App places router.outlet() and reads router.path, router.go(), …
```

`start()` resolves the matching route's modules **before** it returns, so the
first tree is complete on both the server and the client. After that the
router reads through to the route it started: `router.path`, `router.pending`,
`router.go()`.

## A whole app

```ts
// routes.ts — isomorphic
import { createRouter } from "nuclo-router";

export const router = createRouter({
  "/":           () => import("./pages/Home.ts"),
  "/docs":       () => import("./pages/Docs.ts"),
  "/blog/:slug": () => import("./pages/Post.ts"),
  "*":           () => import("./pages/NotFound.ts"),
});

export const App = () =>
  div(
    header(a({ href: router.href("/") }, "Home"), a({ href: router.href("/docs") }, "Docs")),
    main(
      when(() => router.pending, Spinner()),
      when(() => router.error !== null, ErrorView()),
      router.outlet(),   // where the pages land
    ),
    footer("© nuclo"),
  );
```

```ts
// pages/Post.ts — a page is plain content
import type { RouteContext } from "nuclo-router";

export default function Post(ctx: RouteContext) {
  return article(h1(ctx.params.slug), p(ctx.search.get("preview") ? "draft" : ""));
}
```

```ts
// main.ts — the browser
import "nuclo";
import { router, App } from "./routes.ts";

await router.start();
hydrate(App, document.getElementById("app")!);   // or render() without SSR
```

```ts
// server.ts — one Route per request
import "nuclo/polyfill";
import "nuclo";
import { renderToString } from "nuclo/ssr";
import { router, App } from "./routes.ts";

const route = await router.start(request.url);
const html = route.run(() => renderToString(App));
```

That is the whole integration. Links work because an `<a href>` is just an
`<a href>` — one delegated listener on `document` intercepts the ones the
router owns and leaves every other link to the browser.

On the server, `start()` returns a `Route` per request and leaves the router
alone, so concurrent requests cannot see each other's route; `route.run()`
makes that Route the one the router — and so the outlet — reads for the length
of the render. In the browser there is one Route per page load and `start()`
makes it the router's own — no `run()` needed.

A page receives its [`RouteContext`](#routecontext) and its
[`PageProps`](#pageprops) — `(ctx, { layer, data, outlet })` — and may take
fewer arguments. It returns anything `list()` accepts. To fill another part of
the layout as well, return a nuclo `into()` from inside the page —
`div(article(…), into("sidebar", nav(…)))` — and that content leaves with the
page. `into()` and `region()` are nuclo globals, not router API: see the
[nuclo README](../nuclo-core/README.md#regionoptions-and-viewid-content).

## Patterns

| Pattern | Matches | `params` |
| --- | --- | --- |
| `/` `/docs/intro` | exactly that path | `{}` |
| `/blog/:slug` | `/blog/hello` | `{ slug: "hello" }` |
| `/u/:id/edit` | `/u/7/edit` | `{ id: "7" }` |
| `/files/*rest` | `/files/a/b.txt` | `{ rest: "a/b.txt" }` |
| `*` | anything unmatched — your 404 | `{ "*": "…" }` |

Precedence is **static → dynamic (declaration order) → catch-all (longest
prefix first)**, so `"*"` only matches what nothing else does and can sit
anywhere in the table. Trailing slashes, duplicate slashes and
percent-encoding are normalized; param values arrive decoded. Matching is a
segment comparison per pattern — no regexes are built or run.

## Relative routes

A pattern written with `./` is **relative to the parent that declares it**,
and an href written with `./` is **relative to the active route**. Together
they make a reusable section: one that means the same thing under every parent.

A table's value is either a loader or **another table**, whose keys are
relative to it:

```ts
// records/routes.ts — a section, with no idea where it lives
export const recordSection: RouteTable = {
  "/":             () => import("./Record.ts"),   // the parent path itself
  "./preview":     () => import("./Preview.ts"),
  "./preview/raw": () => import("./Raw.ts"),
};

// app routes.ts — declare it wherever it belongs
createRouter({
  "/": () => import("./pages/Home.ts"),
  "/invoices/:id":  recordSection,
  "/customers/:id": recordSection,
  "*": () => import("./pages/NotFound.ts"),
});
```

Those two lines produce all six patterns — `/invoices/:id`,
`/invoices/:id/preview`, `/invoices/:id/preview/raw` and the three
`/customers/:id` equivalents — with no path written twice. Reuse is just
reusing the object, so both parents get the *same loader objects* and share one
module cache and one `import()`.

Inside a child table, `"./x"`, `"/x"` and `"x"` all mean the same thing, `"/"`
means the parent path itself, and `"*rest"` gives the section its own
catch-all. Nesting goes as deep as you like. Top-level keys are used verbatim,
so `"*"` stays `"*"`. A child under a `*catch-all` parent is a
`createRouter()` error, since a catch-all has to end its pattern.

A parent and its children are a real hierarchy: the parent renders, and its
child renders **inside it**, wherever it calls `outlet()`.

```ts
// Record.ts — a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: "notes" }), main(outlet()));
}
```

Navigating between children **does not rebuild the parent**. Its DOM node is
the same node, so its focus, its scroll position, its half-typed input and any
state in its closure all survive:

```
/invoices/42           Record
/invoices/42/preview   Record  →  outlet()  →  Preview      Record untouched
/invoices/42/preview/… Record  →  outlet()  →  Preview  →  …  both untouched
```

A page with no child route renders nothing from its outlet, so a layout can
call it unconditionally. A parent that *has* a child and never calls `outlet()`
swallows it.

There are no **index routes**: `"/"` is the layout itself, so the parent path
renders the layout with an empty outlet rather than a separate index page
inside it. Put the landing content in the layout, or give it a real child path.

Then the same call works from either parent, and from a page that does not
know which one it is in:

```ts
router.href("./preview")    // "/invoices/42/preview"  or "/customers/7/preview"
await router.go("./preview")
await layer.push("./preview")   // the usual shape: a child layer
```

`./x`, `../x`, `.` and `..` resolve against the **current route's path**, not
the current URL's "directory". From `/invoices/42`, `./preview` is
`/invoices/42/preview` — a browser would have said `/invoices/preview` — and a
trailing slash on the URL changes nothing. `../` walks up a segment and stops
at the root. A query and hash are carried through, `base` is re-added, and the
**resolved absolute** path is what goes into history.

This is a deliberate deviation from URL resolution, and it is the same one
React Router makes for `<Link to="./x">`. Two consequences worth knowing:

- Only `./` and `../` are route-relative. A bare `preview` in an `href` is
  left to ordinary browser rules.
- Build relative links with `router.href("./preview")` rather than writing
  `href="./preview"` by hand. `href()` resolves at render time, so the markup
  that ships is absolute and still correct for a crawler, for a middle-click,
  and with JavaScript disabled.

### What is kept, and what is rebuilt

| | |
|---|---|
| a parent whose pattern and path are unchanged | **kept** — same node, and its `load()` is not re-run |
| the matched page | rebuilt, unless its pattern, path and query are unchanged *and* it has no `load()` (a route with a loader refreshes on every visit) |
| a parent whose path changed | rebuilt, along with everything under it |
| a pushed layer | renders the matched page **alone** — its parents are already mounted in the row beneath it, so re-rendering them would show the layout twice |

A kept parent keeps the `ctx` it was built with, which is the documented
meaning of `ctx` everywhere: read `router.*` for live values. So a parent that
survives a child navigation may hold a `search` or `hash` from the URL it was
first built with.

## Route loaders

A page module may export a `load` function. It runs **before the page is
built**, on every navigation to that route, and whatever it returns is handed
to the page as `data`:

```ts
// pages/Post.ts
import type { DataLoader, PageProps, RouteContext } from "nuclo-router";

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug);

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body));
}
```

```ts
// routes.ts — unchanged; the loader travels with the page
"/blog/:slug": () => import("./pages/Post.ts"),
```

The loader gets the matched `RouteContext`, so `params`, `search` and `path`
are all available. It may be sync or async, and it runs on the **server** too
— so a server-rendered page ships with its data already in the HTML instead of
fetching after hydration.

**The module is cached; the data is not.** A route's chunk is fetched once and
reused; its loader runs again on every navigation. That is what makes
`/blog/a` and `/blog/b` impossible to confuse, and it is why a failed loader
can simply be retried.

| | |
|---|---|
| while it runs | `router.pending` is true and the page you were on stays up |
| it throws or rejects | lands on `router.error`; `go()` still never rejects; retryable |
| during `start()` | the rejection comes out of `start()` — there is no Route yet to put it on |
| a pushed layer | runs its own loader, with its own data |
| the idle preloader | warms **modules only**. It has no context to pass, and would be fetching data for a route you may never open |
| re-navigating to the same URL | the loader runs again and the row rebuilds. A route *without* a loader keeps its row. |

To **revalidate**, navigate to where you already are without adding a history
entry:

```ts
await router.go(router.url, { replace: true });   // runs load() again
```

There is no serialization of server data into the HTML, by design: the
client's `load` runs again on hydration. If that matters, have the server emit
`route.data` — say as `window.__DATA__` — and the loader take it first.
`route.data` is the **matched page's** data only. A parent's `load()` result
is not on it, so a parent that needs the same treatment stashes what it
fetched for the server to emit itself.

## Code splitting and preloading

A route's value is always a function that *returns* the page component, so the
component is reached lazily:

```ts
"/a": () => import("./A.ts"),                      // default export (+ optional load)
"/b": () => import("./B.ts").then(m => m.BPage),   // named export
"/c": () => CPage,                                 // eager, not split
"/d": () => ({ default: DPage, load: loadD }),     // eager, module-shaped
```

Only the module-shaped forms can carry a `load` export — picking a named
component with `.then(m => m.BPage)` hands the router the function alone.

Each module is imported **once** and cached; concurrent navigations to the same
route share one `import()`. Once the page goes idle the remaining routes are
loaded in the background, one per idle slice, pausing whenever a navigation the
user is actually waiting for is in flight.

The payoff: a preloaded or eager route never flips `router.pending` and lands
before the next paint — no spinner frame, no layout shift. `router.pending` is
only ever true for a module or loader that genuinely has to be waited for, and
the outgoing page stays on screen while it is. A chunk that fails to load
surfaces as `router.error` (never an unhandled rejection) and can simply be
retried.

## API

### `createRouter(table, options?)`

`table` maps a pattern to a loader. Options:

| Option | Default | |
| --- | --- | --- |
| `base` | `"/"` | URL prefix the app is served under, e.g. `"/docs"`. It only matches at a segment boundary — `/docs/intro` is inside `"/docs"`, `/docsearch` is not. URLs outside it match nothing, so `start()` rejects (your server-side 404) and links to them are left to the browser. |
| `preload` | `true` | Load the remaining routes' modules when the page goes idle. |
| `onNavigate` | — | `(ctx) => void` after every resolved navigation in the browser, including the initial one, once the DOM has caught up. The hook for `document.title`, meta tags, focus and analytics. Never called during SSR. |

Returns the router: `start()`, `match()`, `outlet()`, and every
[`Route`](#route) member except `run()`, read through to the active Route — the
one the last `start()` returned in the browser (stopped or not), or the one
whose `run()` is executing on the server. Reading a member with neither throws.
The route table, the compiled matcher and the module cache live here, so they
are shared across requests on a server.

### `router.start(url?)` → `Promise<Route>`

Resolves `url` (default: `location.href` in the browser) to its page modules
and returns the `Route`. Rejects when nothing matches and the table has no
`"*"` route — on a server, that is your 404. In the browser it also makes the
Route the router's active one, attaches the `popstate` and delegated `click`
listeners and schedules preloading; a second `start()` retires the previous
`Route` for you. On the server it touches nothing shared — render inside
`route.run()`.

### `router.match(url?)` → `RouteContext | null`

Resolves a URL against the table **without loading anything** — no import, no
history, no listeners, no `Route`. Returns `null` when the URL is outside
`base`, matches no pattern, or — in the browser — is on another origin. Works
on the server, where a request URL matches whatever its origin, and in the
browser, where it defaults to `location.href`. Absolute URLs only: `./`
resolution needs an active route, so it lives on the Route (`href`, `go`,
`push`).

```ts
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 });

// "is this link ours?" — for a custom link component or a prefetch rule
const owned = router.match(href) !== null;
```

### `router.outlet()` → `ListModifier`

The active route's pages as a `list()`: place it once, wherever the pages go.
A pushed layer is a later row of it. It is empty before `start()` resolves and
after `stop()`. On the server it renders the Route whose `run()` is executing.

### `Route`

Every member but `run()` is also on the router, which is where an app reads it.

| | |
| --- | --- |
| `path` `pattern` `params` `search` `hash` `url` | the active match. `search` is a `URLSearchParams`. `hash` and `url` are live. |
| `pending` | a navigation is waiting for a module or a loader |
| `error` | the last failed load, cleared by the next navigation |
| `data` | what the matched page's `load()` returned, for a server to serialize. A parent's is not on it. |
| `depth` | how many layers are on the stack (1 for an ordinary page) |
| `go(href, { replace })` | navigate, loading the module if needed. Never rejects — a module that fails, by rejecting *or* by throwing outright, lands on `error`. |
| `push(href)` | open a route as a **new layer** on top, resolving with what it closes with. Accepts `./`. Rejects on no-match or a failed module. |
| `href(path)` | prefix a path with `base`, for `a({ href })`. Resolves `./` and `../` against the active route. |
| `stop()` | detach every listener, dismiss open layers, empty the outlet. Idempotent. A stopped Route still answers with its last match; `go()` does nothing. |
| `run(fn)` | call `fn` with this Route as the router's active one and return its result — `route.run(() => renderToString(App))` on the server. Synchronous only: the Route stops being active when `fn` returns. |

### `RouteContext`

A page's **first** argument: `path`, `pattern`, `params`, `search`, `hash`,
`url`. It is the context the page was *built* with — read `router.*` for live
values (they differ only when the hash changed without a rebuild).

`params` is `{ [name]: string }` by default. A page can type it from its own
pattern with `Params`, which turns `"/blog/:slug"` into `{ slug: string }` and
`"/files/*rest"` into `{ rest: string }`:

```ts
import type { Params, RouteContext } from "nuclo-router";

export default function Post(ctx: RouteContext<Params<"/blog/:slug">>) {
  return article(h1(ctx.params.slug));   // slug: string — nothing else exists
}
```

### `DataLoader`

`(ctx: RouteContext) => TData | Promise<TData>` — a page module's optional
`load` export. See [Route loaders](#route-loaders).

### `PageProps`

A page's **second** argument. Destructure what the page needs.

| | |
| --- | --- |
| `layer` | where the page sits in the stack — see [`Layer`](#layer) |
| `data` | what the route's `load()` returned, or `undefined` without one. Typed by `PageProps<TData>`. |
| `outlet` | where a parent page renders its child route — see [Relative routes](#relative-routes) |

### `Layer`

Where a page sits in the stack, and its way out.

| | |
| --- | --- |
| `depth` | 0 for the base page, 1 and up for pushed layers |
| `push(href)` | open another layer from inside a page, same as `Route.push()` |
| `close(result?)` | close this layer and everything above it, resolving the `push()` that opened it. No argument means dismissed. A no-op at depth 0. |

## The layer stack

`push()` opens a route **on top of** the current one instead of replacing it,
and resolves with whatever that layer closes with. Because the pages are a
single `list()` over the stack, opening a layer is an append — the page
underneath is not re-rendered, so its DOM, its focus and its half-filled form
are all still there when the layer closes.

That makes the "I need a record that doesn't exist yet" flow work without
throwing away the form the user was filling in:

```ts
// the page underneath
const created = await layer.push<Option>("/options/new");
if (created) { options.push(created); selected = created.id; update(); }

// the pushed page — (ctx, { layer })
layer.close(created);   // resolves the push() above with the new option
layer.close();          // dismissed: resolves with undefined
```

Layers nest: a dialog that needs its own dialog calls `layer.push()` and
awaits it, with no reference to the `Route`.

- **The URL is the top layer.** `push()` adds a history entry, so a layer is
  linkable and **Back closes it** — resolving its `push()` as dismissed,
  exactly like Cancel. Back and `close()` are one code path: `close()` records
  its result and walks history back, and the depth in `history.state` is the
  authority.
- **An ordinary navigation clears the stack.** A link click or `go()` is not a
  layer: it replaces everything and dismisses every open layer, so no caller
  is left awaiting.
- **A cold load is a standalone page.** The URL names the top layer but not
  the stack beneath it, so opening a layer's URL directly renders it at depth
  1 with `layer.depth === 0` and an inert `close()`. A pushed route has to
  make sense on its own — branch on `layer.depth` to offer a link out instead
  of a dead Cancel button.
- **The promise cannot survive a reload**, because it lives in a closure.
  Treat the result as a shortcut through a flow that also works the long way
  round.
- **Nothing is left awaiting.** `stop()` dismisses every open layer, and a
  layer abandoned by a navigation resolves with `undefined`.

[`examples/router`](../../examples/router) runs the whole flow at `/stack`,
three layers deep.

## Sub-routers

Routes nest, so a sub-router is usually just a nested table. Two shapes, both
in [`examples/router`](../../examples/router):

**Nest the feature's table under the parent.** One router: the section's own
`"/"` page is its chrome, and its children render in that page's `outlet()`,
so the chrome survives navigation within the section:

```ts
createRouter({ "/": …, "/docs": docsRoutes, "*": … });
```

**Or give the feature a router of its own, created but never started.** The
parent owns a single catch-all entry and the child resolves the tail against
its own patterns, params and fallback:

```ts
// parent table
"/docs/*rest": () => import("./docs/Shell.ts"),

// docs/Shell.ts
const docs = createRouter(docsRoutes, { base: "/docs" });
const hit = docs.match();                       // { pattern: "/:topic", … }
const page = await docsRoutes[hit.pattern]();   // the app's own lookup
```

Never starting it is the point — `start()` is what attaches the listeners, and
two started routers conflict (see the last note below). The trade is that the
child owns resolution, so route loaders, which a *started* router runs, are
yours to call.

The second shape rebuilds the shell when the tail changes, because the router
sees one route and the shell resolves the rest itself. The first shape — a
nested table — is what gets you a parent the router keeps mounted, so prefer
it unless the feature really needs its own router, base and fallback.

## Link handling

The delegated listener navigates a left-click on an `<a href>` (including an
SVG `<a>`, and clicks on anything nested inside one) and steps aside for
everything else: modifier-clicks and middle-clicks, `target` other than
`_self`, `download`, `rel="external"`, cross-origin hrefs, hash-only links on
the current page, paths outside `base`, paths no route matches (so a
server-rendered 404 is still reachable), and any event an app handler already
called `preventDefault()` on. Opt a link out explicitly with
`data-nuclo-router="off"`.

A pushed navigation preserves the current scroll position. When the new URL
has a `#hash` matching an element on the page, that element is scrolled into
view. `popstate` leaves scrolling to the browser.

## Notes

- **Nothing is retained.** The `Route` holds the page function and its context
  — never DOM. Navigating away releases the previous page, `stop()` releases
  the listeners and any in-flight load (and clears `pending`, so a retired
  Route never strands a spinner), and a module that resolves after `stop()` is
  dropped silently. Verified against real GC in `test/memory.test.ts`.
- **Concurrency-safe on the server.** `start()` returns per-request state and
  `run()` scopes it to one synchronous render, so interleaved requests cannot
  see each other's route. Only the module cache is shared, which is the point.
  The scope ends when `run()`'s function returns: `renderToString()` is
  synchronous, so that is enough. An async or streaming render would need the
  Route carried across `await`s (AsyncLocalStorage), which `run()` does not do.
- **Scroll restoration on `popstate`** is the browser's (`scrollRestoration`),
  not the router's.
- **Start one router per document.** Each `start()` adds its own delegated
  `click` listener, and a second router's `start()` does not retire the first
  (only a second `start()` on the *same* router does). To resolve a URL against
  another table, create a router and call only `match()`: it attaches nothing.
- **Not included, by design:** hash and memory history — the route lives in
  the pathname, and a server must serve every route; two independently routed
  areas driven by one URL — a page can fill several regions with `into()`, but
  they all belong to the one matched route; and hover preloading — prefetch on
  hover by calling the route's own loader from a `mouseenter`.

## Examples

Two runnable examples in this repo, deliberately configured to complement each
other so every setting is observable somewhere:

| | |
|---|---|
| [`examples/router`](../../examples/router) | A client-side tour of the whole API: every pattern form and precedence rule, the link-handling opt-outs, every `Route` member with live controls, a sub-router, the layer stack three deep, a relative section mounted at two parents, and route loaders with `pending`/`error`. Sets `preload: false` so those states stay visible. |
| [`examples/router-ssr`](../../examples/router-ssr) | `renderToString()` per request, hydration that provably claims the server's nodes, real 404 status codes, a non-root `base`, idle preloading you can watch in the network panel, and a loader whose data is handed from the server to the client so hydration does not refetch. |

```bash
bun run dev   # in either folder
```

## Tests

```bash
bun run test          # typecheck + 282 tests
```

MIT © Danilo Celestino de Castro
