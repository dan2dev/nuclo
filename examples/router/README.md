# nuclo-router — feature showcase

A live, runnable tour of **every feature and setting** in
[`nuclo-router`](../../packages/nuclo-router). Each route in the app
demonstrates one part of the surface, and a panel below the nav is a direct
readout of the `Route`'s state so you can watch it change as you click.

```bash
bun install      # from the repo root (npm/pnpm also work — it's a workspace)
bun run dev      # in this folder, then open the printed URL
```

`bun run dev` builds `nuclo` and `nuclo-router` first (they resolve from their
`dist/`), then starts Vite.

For **server rendering, hydration, idle preloading and a non-root `base`**, see
the companion example: [`examples/router-ssr`](../router-ssr).

## What each page covers

| Page | Features |
|---|---|
| `src/routes.ts` | the whole route table — every pattern form, all four loader shapes, and the `createRouter` options |
| `src/app.ts` | the shell: a `Layout` that hosts the pages through a nuclo `region()` and never sees the router, `router.href()` links, `pending`/`error` blocks, `go()` buttons, and the live router readout |
| `pages/Overview.ts` | what the router is, and the two-line integration |
| `pages/Patterns.ts` | static · `:param` · `*catch-all` · `"*"` · full precedence · slash and percent-encoding normalization · the edge cases (`%2F`, `+`, case sensitivity, dot segments, duplicate param names, `*` as a literal) · the two `createRouter`-time pattern errors |
| `pages/Deep.ts` | a multi-segment static route is still one Map lookup |
| `pages/BlogNew.ts` | static beats `:param` — table order never has to protect a static route |
| `pages/Post.ts` | one param, decoded, typed from the pattern with `Params<"/blog/:slug">`; query and hash; rebuild-vs-reuse; one page filling two regions with `view({ main, sidebar })` |
| `pages/Comment.ts` | two params, both typed by `Params<…>`; segment count disambiguates |
| `pages/Files.ts` | named catch-all, including the bare-prefix empty tail |
| `pages/Links.ts` | the delegated click listener: every case it navigates, and all fourteen it steps aside for |
| `docs/Shell.ts` + `docs/routes.ts` | **a nested layout**: `/docs` is the section's layout and the rest of its table are its children, so the router keeps the layout mounted while they change. Type in its filter box, then click around |
| `pages/Stack.ts` + `stack/*` | **the layer stack**: `push()` opens a route as a modal on top without closing the page underneath, and resolves with what that layer closes with. Three layers deep, with a nested `layer.push()` |
| `pages/Record.ts` + `preview/*` | **relative routes**: one section written with `./` keys, declared under two parents, and opened from either with the same `push("./preview")` |
| `pages/Data.ts` | **route loaders**: `export const load` runs before the page is built, with `?slow=1` and `?fail=1` to watch `pending` and `error`, and revalidation by navigating |
| `pages/Api.ts` | every `Route` member, with live controls: `path` `pattern` `params` `search` `hash` `url` `pending` `error` `pages()` `go()` `go(…, { replace })` `href()` `stop()` |
| `pages/Settings.ts` | `base`, `preload`, `onNavigate` — defaults, effects and ordering |
| `pages/Slow.ts` | `pending`, the outgoing page staying visible, and the cache making the second visit instant |
| `pages/Broken.ts` | `error`, cache eviction and retry — `go()` never rejects |
| `pages/NotFound.ts` | the `"*"` route, and how a server turns it into a real 404 |
| `pages/Eager` (in `routes.ts`) | a non-split route: `() => Component`, always synchronous |

## Two settings, split across the two examples

Both examples are deliberately configured differently so that every setting is
*observable* somewhere:

| Setting | here | in `router-ssr` |
|---|---|---|
| `preload` | **`false`** — so the `/slow` and `/broken` demos actually show their `pending` and `error` states | `true` (the default) — watch every chunk arrive on idle in the network panel |
| `base` | `"/"` (the default) | **`/app`** — the router strips it, Vite prefixes assets with it, `router.href()` re-adds it |
| `onNavigate` | sets `document.title` and appends to the visible log | sets `document.title`; it never fires during SSR, so the routes module still imports cleanly on the server |

## Things worth clicking

- **`/blog/new` vs `/blog/anything`** — the same shape, two different routes.
  Static wins; you never have to order your table to protect it.
- **`/blog/a%2Fb`** — one param whose value contains a slash.
- **`/files`** — a catch-all also matches its bare prefix, with an empty tail.
- **Cmd/Ctrl-click any nav link** — the router steps aside and the browser
  opens a new tab.
- **`/slow`, then away, then back** — 1.2 s the first time, instant after.
- **`/broken`, then retry** — a failed chunk is evicted from the cache, so the
  second attempt can succeed.
- **`/docs`, type in the filter, then click its nav** — the layout, your text
  and your focus all survive every child navigation, 404 included.
- **Back and Forward** — `popstate` renders the entry and leaves scrolling to
  the browser, which is what makes native scroll restoration work. Regular
  route navigation also preserves the current scroll position; matching hash
  targets still scroll into view.
- **`/stack`** — type a note, then stack two modals on top of it and watch the
  note, the form and the dropdown survive the whole round trip.
- **`/invoices/42` vs `/customers/7`** — press the same button on each and
  watch `push("./preview")` resolve to a different URL, through one shared
  module.

## Nested layouts

`/docs` is one line in the app's table:

```ts
"/docs": docsSection,
```

and the section declares its layout and its children together:

```ts
// docs/routes.ts
export const docsSection = {
  "/":        () => import("./Shell.ts"),        // the layout
  "./intro":  () => import("./pages/Intro.ts"),
  "./:topic": () => import("./pages/Topic.ts"),
  "./*rest":  () => import("./pages/NotFound.ts"),   // the section's own 404
};
```

The layout takes `outlet` from its second argument and places its child wherever it belongs:

```ts
export default function DocsShell(ctx, { outlet }: PageProps) {
  return div(Filter(), Nav(), div({ id: "docs-outlet" }, outlet()));
}
```

**Type into the filter box, then click every link in the section's nav.** The
text stays, the focus stays, and the "built N× this session" counter never
moves — the layout is literally the same DOM node throughout. Only the dashed
block changes.

That includes the section's own 404: `/docs/a/deep/one` matches `./*rest`
inside the section, so the app's `"*"` page never sees it and the layout stays
mounted even then.

One thing nesting does not give you is an **index route**. `"/"` *is* the
layout, so `/docs` renders it with an empty outlet rather than a separate
index page inside it. Put the landing content in the layout, or give it a real
child path.

## The layer stack

`/stack` is the feature in full: a form whose dropdown is missing the option
the user wants.

```ts
// the form, at the bottom of the stack
const created = await layer.push<Option>("/stack/new-option");
if (created) { selected = created.id; update(); }

// the pushed page — (ctx, { layer })
layer.close(created);   // resolves the push() above
layer.close();          // dismissed: resolves undefined
```

Try it in this order, because each step proves something:

1. **Type into Notes first.** It is still there afterwards — the page
   underneath is never rebuilt, because the stack is one `list()` and opening a
   layer is an append.
2. **"+ New option"** opens layer 1. The form is still mounted and
   interactive beneath it.
3. **"+ New" next to Category** opens layer 2 from inside layer 1, with
   `layer.push()` — a layer opening a layer, no `Route` involved. Layer 1 keeps
   the label you typed.
4. **Create the category.** Layer 2 closes, layer 1 stays open and selects the
   new category.
5. **Create the option.** Layer 1 closes, and the form folds the result in:
   the new option is in the dropdown, selected, and your note is untouched.

Then try the edges:

- **Back**, or the ✕, or clicking the shade — all dismiss, resolving the
  `push()` with `undefined`. The log says "dismissed".
- **A nav link** while a layer is open clears the whole stack.
- **Reload `/stack/new-option` directly** — it renders as a standalone page at
  depth 1. There is nothing underneath to resolve to, so the dialog swaps its
  Cancel button for a real link out. A pushed route has to make sense on its
  own.

## Relative routes

`/invoices/42` and `/customers/7` are the **same page module** under two
patterns, and the preview under each is the **same section** declared twice:

```ts
// preview/routes.ts — relative keys, no idea where they live
export const recordSection = {
  "/": () => import("../pages/Record.ts"),       // the layout
  "./preview": {
    "/": () => import("./Preview.ts"),           // a child of the layout
    "./raw": () => import("./Raw.ts"),           // and a child of that
  },
};

// routes.ts — the same object under two parents
"/invoices/:id":  recordSection,
"/customers/:id": recordSection,
```

The record page is a **layout**: it renders whichever child is active in its
`outlet()`, and the router keeps it mounted when that child changes.

```ts
export default function Record(ctx, { outlet }: PageProps) {
  return div(…, input({ id: "scratch" }), div({ id: "record-outlet" }, outlet()));
}
```

So one call does the right thing from either parent:

```ts
await layer.push("./preview");
// from /invoices/42  → /invoices/42/preview   (/invoices/:id/preview)
// from /customers/7  → /customers/7/preview   (/customers/:id/preview)
```

What to try on `/invoices/42`:

1. **Type into Scratch**, then `push("./preview")`. The preview opens as a
   layer and your text is still there behind it.
2. **`push("./raw")` inside the preview** — relative again, from the
   fragment's own route, so it stacks one deeper at `/invoices/42/preview/raw`.
3. **Switch to `/customers/7`** and press the same button. Identical code,
   a different URL, and `ctx.params.id` comes from whichever parent matched.
4. **Type into Scratch, then click "or navigate to it".** The preview appears
   *inside* the record's outlet and the record is never rebuilt — same node,
   your text still there, still focused. Go one deeper to `./raw` and both the
   record and the preview stay mounted.
5. **Open `/invoices/42/preview` directly.** Same page, rendered standalone
   with a link back to the record.

The preview is reachable two ways on purpose: navigated to, it is a panel in
its parent's outlet; `push()`ed, it is a modal over an untouched page. One
module, two presentations — `layer.depth` is what tells it which.

`./x` is relative to the **active route**, not the URL's directory: from
`/invoices/42` it is `/invoices/42/preview`, where a browser would have said
`/invoices/preview`. A trailing slash changes nothing. Only `./` and `../`
are route-relative — a bare `preview` is left to ordinary browser rules.

## Route loaders

`/data` exports a loader beside its page:

```ts
export const load: DataLoader<Report> = async (ctx) => fetchReport(ctx.search);
export default function DataPage(ctx, { data: report }: PageProps<Report>) { … }
```

The page is not built until `load` settles, so it never renders without its
data. The counter on the page is the proof: it climbs on every visit while the
module behind it is imported once.

Three links on the page cover the behaviour:

- **revalidate** — a navigation to where you already are. The loader runs
  again and the row rebuilds. (`router.go(router.url, { replace: true })` does
  the same without a history entry.)
- **`?slow=1`** — `router.pending` goes true for 1.2 s and *this page stays on
  screen* while the next one loads.
- **`?fail=1`** — the loader rejects, `router.error` is set, the page you were
  on is untouched, and the next successful navigation clears it.

The loader also runs on the server — see [`examples/router-ssr`](../router-ssr),
where the post arrives in the first HTML and the server hands its data to the
client so hydration does not refetch it.

## Notes

- Every link on these pages is a plain `<a href>`. The router adds **one**
  delegated `click` listener to `document`; nothing is wired per link.
- The shell reads the router it imports — `router.path`, `router.go()` — so
  `src/main.ts` is just `await router.start()` then `render(App, container)`.
  Nothing of the router's is in the app tree: the pages mount themselves
  beside it with that render.
- Every page returns `view("main", …)`, so it lands in the `region({ id: "main" })`
  the `Layout` declares. That is what lets the layout's filter box keep its
  text and its focus while the page inside it changes — type in it, then
  navigate.
- Pages receive a `RouteContext` (the match they were built with). For live
  values — and for `go()`/`stop()` — import the router, as `pages/Api.ts`
  does; `src/main.ts` also puts it on `window` for your devtools console.
