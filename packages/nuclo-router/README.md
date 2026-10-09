# nuclo-router

Routing for [nuclo](https://nuclo.dev/) — SSR, hydration, code-split routes and
idle preloading. **5.5 kB gzipped** (4.9 kB brotli), no dependencies beyond nuclo
itself, and no side effects — it tree-shakes away when unused.

The router owns no DOM of its own and decides only *what* to load. The layer
stack is one `list()` — one row per layer, so an ordinary page is a single row
— mounted beside the app, and each page says *where* it goes by returning a
nuclo `view()` into one of the layout's `region()`s. The server
and the client build the *same* tree, so `hydrate()` claims the server's nodes
instead of replacing them. Everything else is `history`, one delegated `click`
listener, and `requestIdleCallback`.

```bash
npm install nuclo nuclo-router
```

## One import

```ts
export const router = createRouter(routes);   // define once, import anywhere
await router.start();                          // resolve the current URL
render(App, document.getElementById("app")!);  // App reads router.path, router.go(), …
```

`start()` resolves the matching route's module **before** it returns, so the
first tree is complete on both the server and the client. After that the
router reads through to the route it started: `router.path`, `router.pending`,
`router.go()`. Nothing is handed down to the app, and nothing of the router's
is in its tree.

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
      region({ id: "main" }),   // where the pages land
    ),
    footer("© nuclo"),
  );
```

```ts
// pages/Post.ts — a page says where it goes
export default function Post(ctx: RouteContext) {
  return view("main", article(h1(ctx.params.slug)));
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
makes that Route the one the router reads for the length of the render. In
the browser there is one Route per page load and `start()` makes it the
router's own — no `run()` needed.

A page receives its [`RouteContext`](#routecontext); pages that don't need it
take no argument:

```ts
// pages/Post.ts
import type { RouteContext } from "nuclo-router";

export default function Post(ctx: RouteContext) {
  return article(h1(ctx.params.slug), p(ctx.search.get("preview") ? "draft" : ""));
}
```

## Placing the pages

The router decides only *what* to load; a page decides *where* it goes, with
a nuclo **view** into one of the layout's **regions**:

```ts
// Layout.ts — never sees the router
export const Layout = () =>
  div(
    aside(Filters()),
    main(region({ id: "main", type: "stack", empty: p("Nothing open.") })),
  );

// pages/Post.ts
export default function Post(ctx: RouteContext) {
  return view("main", article(h1(ctx.params.slug)));
}

// App.ts — nothing of the router's in here
export const App = () => div(Header(), Layout(), Footer());
```

The pages mount themselves beside the app, with the first `render()` or
`hydrate()` after `start()`: in the browser as comments on the document root —
nothing visible — placed before the app's own tree is built, so each page's
`view()` is already waiting when the layout's region arrives and claims the
server's nodes on hydration; on the server inside each `renderToString()` that
`route.run()` wraps, on a host that is never serialized, so the HTML carries
the page in the region and nothing else of the router's. `stop()` unmounts
them. A page may fill several regions at once with
`view({ main: …, sidebar: … })`, and a parent page can be a view while its
children render inside its `outlet()`. `region()` and `view()` are nuclo
globals, not router API — see the
[nuclo README](../nuclo-core/README.md#regionoptions-and-viewid-content).

A region shows a pushed layer over the page beneath it: a `"stack"` region
renders both, a `"simple"` one (the default) renders the layer alone and
brings the page back, rebuilt, when the layer closes.

To render pages **where they are written** instead, place `router.pages()` in
the tree — once — and have pages return plain content:

```ts
export const App = () => div(Header(), main(router.pages()), Footer());
```

A page that returns a `view()` still lands in its region from there. Once
`pages()` is placed, nothing is mounted automatically.

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
percent-encoding are normalized; param values arrive decoded.

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
// Record.ts — a parent page takes (ctx, layer, data, outlet)
export default function Record(ctx: RouteContext, _layer: Layer, _data: unknown, outlet: Outlet) {
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
would swallow it silently, so the router warns once if that happens.

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
  and with JavaScript disabled. A hand-written `./` href is resolved by the
  router on click, but the browser would resolve it differently without JS.

Matching is compiled once into a Map lookup for static routes and a
segment comparison for dynamic ones — no regexes are built or run, so a static
match is one Map lookup.

### What is kept, and what is rebuilt

| | |
|---|---|
| a parent whose pattern and path are unchanged | **kept** — same node, and its `load()` is not re-run |
| the matched page | rebuilt, unless its component, path, query *and* data are all unchanged (a route with a `load()` therefore refreshes on every visit) |
| a parent whose path changed | rebuilt, along with everything under it |
| a pushed layer | renders the matched page **alone** — its parents are already mounted in the row beneath it, so re-rendering them would show the layout twice |

A kept parent keeps the `ctx` it was built with, which is the documented
meaning of `ctx` everywhere: read `router.*` for live values. So a parent that
survives a child navigation may hold a `search` or `hash` from the URL it was
first built with.

## Route loaders

A page module may export a `load` function. It runs **before the page is
built**, on every navigation to that route, and whatever it returns is handed
to the page as its third argument:

```ts
// pages/Post.ts
import type { DataLoader, Layer, PageComponent, RouteContext } from "nuclo-router";

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug);

export default function Post(_ctx: RouteContext, _layer: Layer, post: Post) {
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
| re-navigating to the same URL | the loader runs again and the row rebuilds, because the data is new. A route *without* a loader still reuses its row. |

To **revalidate**, navigate to where you already are without adding a history
entry:

```ts
await router.go(router.url, { replace: true });   // runs load() again
```

Two things it deliberately does not do: there is no serialization of server
data into the HTML (the client's `load` runs again on hydration — have it read
from a `window.__DATA__` your server emits if that matters), and a loader
cannot redirect. Throw, catch it on `router.error`, and navigate.

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

The payoff: a preloaded or eager route commits **in the same task** — no
pending flag, no spinner frame, no layout shift. `router.pending` is only ever
true for a route whose module genuinely has to be fetched, and the outgoing
page stays on screen while it is. A chunk that fails to load surfaces as
`router.error` (never an unhandled rejection) and can simply be retried.

## API

### `createRouter(table, options?)`

`table` maps a pattern to a loader. Options:

| Option | Default | |
| --- | --- | --- |
| `history` | `"browser"` | Where the route is kept: `"browser"` (the pathname, via the History API), `"hash"` (everything after `#`), or `"memory"` (an array in this process). See [History modes](#history-modes). |
| `base` | `"/"` | URL prefix the app is served under, e.g. `"/docs"`. It only matches at a segment boundary — `/docs/intro` is inside `"/docs"`, `/docsearch` is not. URLs outside it match nothing, so `start()` rejects (your server-side 404) and links to them are left to the browser. |
| `preload` | `true` | Load the remaining routes' modules when the page goes idle. |
| `onNavigate` | — | `(ctx) => void` after every resolved navigation in the browser, including the initial one. The hook for `document.title`, meta tags and analytics. Never called during SSR. |

Returns the router: `start()`, `match()`, and every [`Route`](#route) member
except `run()`, read through to the active Route — the one the last `start()`
returned in the browser (stopped or not), or the one whose `run()` is executing
on the server. Reading a member with neither throws. The route table, the
compiled matcher and the module cache live here, so they are shared across
requests on a server.

### `router.start(url?)` → `Promise<Route>`

Resolves `url` (default: `location.href` in the browser) to its page module and
returns the `Route`. Rejects when nothing matches and the table has no `"*"`
route — on a server, that is your 404. In the browser it also makes the Route
the router's active one, mounts its pages with the next `render()` or
`hydrate()`, attaches the `popstate` and delegated `click` listeners and
schedules preloading; a second `start()` retires the previous `Route` — and
its pages — for you. On the server it touches nothing shared — render inside
`route.run()`.

### `router.match(url?)` → `RouteContext | null`

Resolves a URL against the table **without loading anything** — no import, no
history, no listeners, no `Route`. Returns `null` when the URL is outside
`base` or matches no pattern. Works on the server and in the browser, where it
defaults to `location.href`.

It takes absolute URLs only: `./` resolution needs an active route to resolve
*against*, so it lives on the Route (`href`, `go`, `push`), not here.

```ts
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 });

// "is this link ours?" — for a custom link component or a prefetch rule
const owned = router.match(href) !== null;
```

### `Route`

Every member but `run()` is also on the router, which is where an app reads it.

| | |
| --- | --- |
| `path` `pattern` `params` `search` `hash` `url` | the active match. `search` is a `URLSearchParams`. |
| `pending` | a navigation is waiting for its page module |
| `error` | the last failed load, cleared by the next navigation |
| `depth` | how many layers are on the stack (1 for an ordinary page) |
| `pages()` | the alternative to the automatic mount: the layer stack placed by the app itself, bottom layer first, where pages that return plain content render. **Place it once**, before the render that shows it — a second live placement duplicates the page (the router warns if it finds two in the document). |
| `go(href, { replace })` | navigate, loading the module if needed. Never rejects — a module that fails, by rejecting *or* by throwing outright, lands on `error`. |
| `push(href)` | open a route as a **new layer** on top, resolving with what it closes with. Accepts `./`. Rejects on no-match or a failed module. |
| `back(delta?)` | go back, as the Back button would. The only way to traverse in `"memory"` mode. Asynchronous. |
| `href(path)` | prefix a path with `base`, for `a({ href })`. Resolves `./` and `../` against the active route. |
| `stop()` | detach every listener, cancel preloading, dismiss open layers, unmount the pages. Idempotent. A stopped Route still answers with its last match; `go()` does nothing. |
| `run(fn)` | call `fn` with this Route as the router's active one, mounting its pages in each `renderToString()` inside, and return its result — `route.run(() => renderToString(App))` on the server. |

### `RouteContext`

A page's **first** argument (of three — the others are its `Layer` and its
loader `data`): `path`, `pattern`, `params`, `search`, `hash`, `url`. It is the
context the page was *built* with — read `router.*` for live values (they differ
only when the hash changed without a rebuild).

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

### `Layer`

A page's **second** argument — where it sits in the stack, and its way out.

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

// the pushed page — `layer` is its second argument
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

There is one stack and no route nesting, so a sub-router is composition.
Two shapes, both in [`examples/router`](../../examples/router):

**Nest the feature's table under the parent.** One router, one outlet, and the
section's chrome in the shell — outside the pages, which is what makes it
survive navigation within the section:

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

## History modes

The router's internal model is the same string in every mode — an app-relative
href like `/blog/x?a=1#top` — so only two things differ: where that string is
read from and where a navigation writes it. Everything else, including layers
and relative routes, works identically.

```ts
createRouter(routes, { history: "hash" });
```

| | the route lives in | use it when | the cost |
|---|---|---|---|
| `"browser"` *(default)* | the pathname, via the History API | you control the server | the server must serve every route |
| `"hash"` | everything after `#` | a static host, `file://`, a sub-page you cannot add rewrites to | the route never reaches the server, so there is nothing to server-render and crawlers see one page |
| `"memory"` | an array in this process | tests, a host with no URL bar, an app embedded in a page whose address must not change | no URL to share, bookmark or reload into |

**Hash mode** keeps the document's own pathname and query and only rewrites the
fragment, so `/host/page#/docs/intro` is a route of `/docs/intro`. Writes go
through `pushState`, so a layer's depth still travels in the entry's state, and
it listens for `hashchange` as well as `popstate` so editing the address bar
works. Only the first `#` separates, so an in-page fragment still works:
`#/docs/intro#install` is path `/docs/intro`, hash `#install`. A hash with no
leading slash — what a bare `<a href="#docs">` leaves — reads as `/docs`.

**Memory mode** has no browser location at all: `start(url)` seeds the first
entry and `router.back()` traverses, since there is no Back button. The entry
stack belongs to the **router**, not the Route, so a re-mount resumes where the
last one left off. Pushing discards the forward entries, as a browser does.
Links are still intercepted — they are ordinary anchors in a document — they
just drive the in-memory stack instead of the address bar. An href the router
does not own has nowhere to be handed to, so it is ignored rather than
navigated.

Outside a browser the adapter is always memory-backed, which is what keeps
`start(url)` rendering on a server while navigation stays inert.

`router.url` is the live app-relative href in every mode — `/blog/x?a=1#top`,
base included — rather than the document's full URL, so it means the same thing
whichever mode you picked.

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
- **Scroll restoration on `popstate`** is the browser's (`scrollRestoration`),
  not the router's.
- **Start one router per document.** Each `start()` adds its own delegated
  `click` listener, and a second router's `start()` does not retire the first
  (only a second `start()` on the *same* router does). The first listener to
  run pushes history, the second then sees "same URL" and never navigates —
  while `popstate` reaches both. To resolve a URL against another table, create
  a router and call only `match()`: it attaches nothing.
- **Not included, by design:** named or parallel outlets (two routed regions
  at once), and hover preloading. Prefetch on hover by calling the route's own
  loader from a `mouseenter`.

## Examples

Two runnable examples in this repo, deliberately configured to complement each
other so every setting is observable somewhere:

| | |
|---|---|
| [`examples/router`](../../examples/router) | A client-side tour of the whole API: every pattern form and precedence rule, all fourteen link-handling opt-outs, every `Route` member with live controls, a sub-router, the layer stack three deep, a relative section mounted at two parents, and route loaders with `pending`/`error`. Sets `preload: false` so those states stay visible. |
| [`examples/router-ssr`](../../examples/router-ssr) | `renderToString()` per request, hydration that provably claims the server's nodes, real 404 status codes, a non-root `base`, idle preloading you can watch in the network panel, and a loader whose data is handed from the server to the client so hydration does not refetch. |

```bash
bun run dev   # in either folder
```

## Tests

```bash
bun run test          # typecheck + 309 tests, 100% statements/branches/functions/lines
```

MIT © Danilo Celestino de Castro
