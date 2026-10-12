# nuclo-router — SSR & hydration

A real server-rendered app: Bun renders each request to HTML, the browser
hydrates it **in place**, and every page is a separate code-split chunk.

```bash
bun install          # from the repo root
bun run dev          # vite build --watch + bun --watch src/server.ts
# then open http://localhost:5174/  (it redirects to /app/)
```

`bun run preview` does a one-shot production build and serve.

## What it demonstrates

| Thing | Where | How to see it |
|---|---|---|
| `renderToString()` per request | `src/server.ts` | View source — the HTML arrives fully formed |
| Pages that place themselves | `src/pages/*.ts`, `src/routes.ts` | Every page returns `into("main", …)` and lands in the shell's `region({ id: "main" })`; the shell itself carries nothing of the router's |
| Hydration claims the page in place | `src/entry-client.ts` | The console says `hydration: claimed the server's page node in place` — the page's into() claimed the node the server rendered into the region rather than rebuilding it |
| One `Route` per request | `src/server.ts` | `router.start(request.url)` — concurrent requests never share route state; only the module cache is shared |
| `base` setting | `src/base.ts` | The app is mounted at `/app`. The router strips it, Vite prefixes assets with it, `router.href()` re-adds it |
| URLs outside `base` | `src/server.ts` | `/outside-base` → `start()` rejects → real **404** |
| Router-level 404 | `src/pages/NotFound.ts` | `/app/nope` matches `"*"`, and the server turns that into a real **404** status via `route.pattern === "*"` |
| Code splitting | `vite.config.ts` | `vite build` emits `chunks/Home-*.js`, `chunks/Post-*.js`, … one per page |
| Idle preloading | `src/routes.ts` | Load the home page, then watch the network panel: every other page's chunk arrives on idle. Later navigations show no loading pill |
| Params, decoded | `src/pages/Post.ts` | `/app/blog/caf%C3%A9` renders "café" |
| **Route loaders** | `src/pages/Post.ts` | `export const load` runs **before** the page is built — on the server for the first request, in the browser for every navigation after. View source: the post is already in the HTML |
| Server → client data handoff | `src/ssr-data.ts` | The server serializes `route.data` into a script tag and the browser's loader takes it once, so hydration does not refetch. The page prints **"server"** on a cold load and **"browser"** after a client navigation |
| Named catch-all | `src/pages/Files.ts` | `/app/files/a/b/readme.md` → `params.rest === "a/b/readme.md"` |
| `getCssText()` | `src/server.ts` | The atomic stylesheet is inlined into `<head>`, so there is no unstyled flash |
| Styles survive SSR | `src/ui.ts` | Page modules are imported at boot so their `css()` calls are in the sheet before the first response |
| Works without JavaScript | — | Disable JS and the links still work: the server renders every route |

## How the pieces fit

```
src/base.ts          the mount path, shared by the router, Vite and the server
src/routes.ts        route table + App shell — the only module both sides import
src/pages/*.ts       one code-split page per route
src/entry-client.ts  await router.start() → hydrate()
src/server.ts        Bun.serve: per-request start() → run(renderToString) → HTML
```

The whole client entry is:

```ts
await router.start();
hydrate(App, document.getElementById("app")!);
```

`start()` resolves the active route's module *before* returning, so the tree is
complete when `hydrate()` walks it. That is the entire reason SSR and hydration
line up — there is no separate "routes manifest" to keep in sync.

The router decides only *what* to load. Each page says *where* it goes by
returning an `into()`:

```ts
export default function HomePage(ctx: RouteContext) {
  return into("main", div(…));   // into the shell's region({ id: "main" })
}
```

so the shell hosts the pages through a plain `region()` and never has to know
what the router loaded. The pages mount themselves beside the app — on the
server inside each render `route.run()` wraps, on a host that is never
serialized, so the HTML carries nothing of the router's; in the browser on the
document root, before the shell hydrates. The server serializes the region's
content like any other markup, and in the browser the page's `into()` claims
those nodes.

And the whole server is:

```ts
const route = await router.start(request.url);
const status = route.pattern === "*" ? 404 : 200;
const body = route.run(() => renderToString(App));   // App reads this request's Route
new Response(document_(body, getCssText()), { status });
```

## Route loaders, and the one thing SSR needs from you

`src/pages/Post.ts` exports a loader beside its page:

```ts
export const load: DataLoader<Post> = async (ctx) => {
  const fromServer = takeServerData<Post>();   // first load in the browser
  if (fromServer) return fromServer;
  return fetchPost(ctx.params.slug);           // every navigation after
};

export default function PostPage(ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title));
}
```

The router runs `load` before building the page, on whichever side is
rendering — so the server's HTML already contains the post, with no
fetch-after-hydration and no loading flash.

What the router deliberately leaves to you is the **handoff**: a loader runs on
both sides, so without help the browser would refetch during hydration exactly
what the server just sent. Only the app knows how its data serializes, so
`src/ssr-data.ts` does it in about ten lines — the server writes
`route.data` into a script tag, and the first loader to ask takes it and
empties the slot.

Watch it work: load `/app/blog/anything` cold and the page says **"server"**;
navigate away and back and it says **"browser"**, because the module is cached
and the data never is.

## Notes

- The server has no bundler. `vite build` only produces the **client** bundle;
  `src/server.ts` runs straight off TypeScript under Bun, with
  `nuclo/polyfill` providing a DOM.
- `onNavigate` touches `document` even though this module is imported on the
  server — safe, because the hook only ever fires in the browser.
- Set `BASE = ""` in `src/base.ts` to serve from the root instead. Nothing else
  changes.

See [`examples/router`](../router) for a client-side tour of the full API —
every pattern form, every link-handling rule, pending/error states, and the
`Route` members.
