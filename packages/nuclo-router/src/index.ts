/// <reference types="nuclo" />
/**
 * nuclo-router — routing for nuclo, built on list() and update().
 *
 * The router owns no DOM of its own: the pages are a `list()` over the
 * layer stack — one row per layer, so an ordinary page is a single row and a
 * pushed layer is an appended sibling. That is what makes SSR and hydration
 * work for free: the server and the client build the same tree, so hydrate()
 * claims the server's nodes instead of replacing them.
 *
 * ```ts
 * // routes.ts — isomorphic
 * export const router = createRouter({
 *   "/":           () => import("./pages/Home.ts"),
 *   "/blog/:slug": () => import("./pages/Post.ts"),
 *   "*":           () => import("./pages/NotFound.ts"),
 * });
 *
 * export const App = () => div(Header(), main(region({ id: "main" })), Footer());
 *
 * // pages/Post.ts — a page says where it goes
 * export default (ctx) => view("main", article(h1(ctx.params.slug)));
 *
 * // main.ts — the browser
 * await router.start();
 * hydrate(App, document.getElementById("app")!);
 *
 * // server.ts — one Route per request, no shared mutable state
 * const route = await router.start(req.url);
 * const html = route.run(() => renderToString(App));
 * ```
 *
 * `start()` resolves the active route's module *before* returning, so the
 * first tree is complete on both sides. Everything after that — link clicks,
 * popstate, idle preloading — is handled by the Route it returned, which the
 * router itself reads through: `router.path`, `router.go()`.
 *
 * The router decides what to load, not where it goes. The pages mount
 * themselves beside the app with its first render — on the document root in
 * the browser, inside the render on a host nothing serializes on the server —
 * and each page lands in a region through its own `view()`. The app's tree
 * carries nothing of the router's. For pages that render where they are
 * written instead, the app places `pages()`.
 */
import { list, onRootBuild, update, viewWaiting } from "nuclo";
import {
  browserHistory,
  hashHistory,
  memoryHistory,
  type HistoryKind,
  type LocationAdapter,
} from "./history";
import {
  createMatcher,
  joinSegments,
  normalizeBase,
  normalizePath,
  splitPath,
  stripBase,
  type Match,
  type RouteParams,
} from "./match";

export type { Match, RouteParams } from "./match";
export type { HistoryKind, LocationAdapter } from "./history";

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
/**
 * URL parsing needs an origin, but the router only ever uses the path, search
 * and hash it gets back. In a browser this is the real origin so that a
 * cross-origin href is still recognisable as one; elsewhere it is a
 * placeholder.
 */
const ORIGIN = isBrowser ? window.location.origin : "http://nuclo.local";

/**
 * The params a pattern yields, as a type: `Params<"/blog/:slug">` is
 * `{ readonly slug: string }`, a `"*rest"` catch-all adds `rest`, and the bare
 * `"*"` route adds `"*"`. A page that wants its params typed names its own
 * pattern:
 *
 * ```ts
 * export default function Post(ctx: RouteContext<Params<"/blog/:slug">>) {
 *   return article(h1(ctx.params.slug));   // slug: string, nothing else
 * }
 * ```
 */
export type Params<TPattern extends string> = Flatten<ParamsOf<TPattern>>;

type ParamsOf<TPattern extends string> = TPattern extends `${infer Head}/${infer Tail}`
  ? SegmentParam<Head> & ParamsOf<Tail>
  : SegmentParam<TPattern>;

type SegmentParam<TSegment extends string> = TSegment extends `:${infer Name}`
  ? { readonly [K in Name]: string }
  : TSegment extends `*${infer Rest}`
    ? { readonly [K in Rest extends "" ? "*" : Rest]: string }
    : {};

/** One object type instead of an intersection, for readable hovers. */
type Flatten<T> = { readonly [K in keyof T]: T[K] };

/** What the matched route resolved to. Handed to the page component. */
export interface RouteContext<TParams extends RouteParams = RouteParams> {
  /** Canonical decoded path, base stripped: "/blog/hello". */
  readonly path: string;
  /** The table key that matched: "/blog/:slug". */
  readonly pattern: string;
  readonly params: TParams;
  readonly search: URLSearchParams;
  /** Including the leading "#", or "" when there is none. */
  readonly hash: string;
  /** The href this context was resolved from. */
  readonly url: string;
}

/**
 * Control over the stack layer a page is rendered in.
 *
 * Handed to every page as `layer` in its {@link PageProps}; pages that are
 * never stacked can ignore it. See `Route.push()` for the stack itself.
 */
export interface Layer {
  /** 0 for the base page; 1 and up for pages opened with `push()`. */
  readonly depth: number;
  /**
   * Opens another layer on top of the stack and resolves with what it closes
   * with — the same thing as `Route.push()`, reachable from inside a page.
   *
   * This is how a layer opens a layer of its own: a "new option" dialog that
   * needs a "new category" dialog just calls `layer.push()` and awaits it,
   * with no reference to the Route.
   */
  push<T = unknown>(href: string): Promise<T | undefined>;
  /**
   * Closes this layer and every layer above it, resolving the `push()` that
   * opened it with `result`. Call it with no argument to dismiss — that
   * resolves `push()` with `undefined`, which is how a caller tells "saved"
   * from "cancelled".
   *
   * A no-op on the base page (depth 0), which nothing opened.
   */
  close(result?: unknown): void;
}

/**
 * Where a parent page renders its child route.
 *
 * Call it once, wherever the child belongs. It is its own one-item `list()`,
 * which is what makes a child navigation swap only that subtree — the parent's
 * DOM, its focus and its scroll position are untouched.
 *
 * A page with no child route renders nothing from it, so a layout can call it
 * unconditionally.
 */
export type Outlet = () => ListModifier;

/** A page's second argument. Destructure what it needs: `(ctx, { data, outlet })`. */
export interface PageProps<TData = unknown> {
  /** Where the page sits in the layer stack, and its way out. */
  readonly layer: Layer;
  /** Whatever the route's `load()` returned, or `undefined` when it has none. */
  readonly data: TData;
  /** Where a parent page renders its child route. */
  readonly outlet: Outlet;
}

/**
 * A page. Returns anything list() accepts — a built element, a tag builder
 * call, or a NodeModFn. Pages that need neither argument take none.
 */
export type PageComponent<TData = unknown, TParams extends RouteParams = RouteParams> = (
  ctx: RouteContext<TParams>,
  props: PageProps<TData>,
) => ListRenderResult;

/**
 * A route's data loader. Runs on **every** navigation to the route — before
 * its page is built — and whatever it returns is handed to the page as
 * `data`.
 *
 * It runs on the server too, so a server-rendered page has its data in the
 * first HTML it emits rather than fetching after hydration.
 *
 * ```ts
 * // pages/Post.ts
 * export async function load(ctx: RouteContext): Promise<Post> {
 *   return fetchPost(ctx.params.slug);
 * }
 * export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
 *   return article(h1(post.title));
 * }
 * ```
 *
 * Unlike the module, the data is never cached: the module is fetched once and
 * reused, the loader runs again every time. A loader that throws (or rejects)
 * lands on `route.error`, exactly like a module that fails to load.
 */
export type DataLoader<TData = unknown, TParams extends RouteParams = RouteParams> = (
  ctx: RouteContext<TParams>,
) => TData | Promise<TData>;

/**
 * A page module. Its params are `any` here on purpose: the table cannot know
 * which pattern a page typed itself with (see {@link Params}), and a page
 * typed for `"/blog/:slug"` must still be a valid module.
 */
export type RouteModule<TData = unknown> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | PageComponent<TData, any>
  | {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      readonly default: PageComponent<TData, any>;
      /** Optional per-navigation data loader — see {@link DataLoader}. */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      readonly load?: DataLoader<TData, any>;
    };

/**
 * Produces a route's page component. Always a function, so the component is
 * reached lazily:
 *
 *   () => import("./pages/Home.ts")   // code-split, default export
 *   () => import("./pages/Home.ts").then(m => m.HomePage)
 *   () => HomePage                    // eager, no split
 */
export type RouteLoader<TData = unknown> = () =>
  | RouteModule<TData>
  | Promise<RouteModule<TData>>;

/**
 * Thrown from a route's `load()` — or from its loader in the table — to send
 * the navigation somewhere else:
 *
 * ```ts
 * export const load: DataLoader = (ctx) => {
 *   if (!session()) throw new Redirect(`/login?next=${encodeURIComponent(ctx.url)}`);
 * };
 *
 * createRouter({ "/old": () => { throw new Redirect("/new"); }, … });
 * ```
 *
 * `href` is what `go()` takes; a relative one resolves against the URL being
 * navigated to. The browser follows it, and the redirected-from URL never
 * reaches history. On the server `start()` rejects with it — `href` resolved —
 * for the app to answer with a 3xx.
 */
export class Redirect extends Error {
  readonly href: string;
  constructor(href: string) {
    super(`nuclo-router: redirect to "${href}"`);
    this.href = href;
  }
}

/** A Redirect that leads to another, and so on, gives up after this many. */
const MAX_REDIRECTS = 10;

/**
 * A route table maps a pattern to a loader — or to another table, whose keys
 * are relative to it.
 *
 * ```ts
 * // a section, written once and reusable because it is just an object
 * const recordSection: RouteTable = {
 *   "/":             () => import("./Record.ts"),   // the parent path itself
 *   "./preview":     () => import("./Preview.ts"),
 *   "./preview/raw": () => import("./Raw.ts"),
 * };
 *
 * createRouter({
 *   "/": () => import("./pages/Home.ts"),
 *   "/invoices/:id":  recordSection,   // /invoices/:id, …/preview, …/preview/raw
 *   "/customers/:id": recordSection,   // and the same three under here
 *   "*": () => import("./pages/NotFound.ts"),
 * });
 * ```
 *
 * Nesting composes **layouts as well as paths**: `"/"` is the parent's page,
 * and a child renders inside it, wherever the parent calls `outlet()`. A
 * navigation between children keeps the parent mounted.
 *
 * Each entry may carry its own data type, which a single record type cannot
 * preserve — hence the `any`. A `RouteLoader<Post>` is assignable here, and
 * the page behind it keeps its own typed `data` parameter.
 */
export type RouteTable = Readonly<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [pattern: string]: RouteLoader<any> | RouteTable;
}>;

/** One page in a matched route: its own pattern and loader. */
interface RouteNode {
  readonly pattern: string;
  readonly loader: RouteLoader;
  /** Segment count of `pattern`, for slicing a leaf path down to this level. */
  readonly segments: number;
}

/**
 * What the matcher stores for a pattern: the page that matched, plus the
 * pages declared above it. Those parents are what make a child navigation
 * keep its parent's DOM instead of replacing it.
 */
interface RouteChain {
  readonly leaf: RouteNode;
  /** Ancestors that declare their own page, outermost first. */
  readonly parents: readonly RouteNode[];
}

/** A table with the nesting resolved into one chain per absolute pattern. */
type FlatTable = Readonly<Record<string, RouteChain>>;

function routeNode(pattern: string, loader: RouteLoader): RouteNode {
  return { pattern, loader, segments: splitPath(pattern, false).length };
}

/** A child key with its "./" stripped, so "./x" and "/x" compare equal. */
function childKey(pattern: string): string {
  return pattern.startsWith("./") ? pattern.slice(1) : pattern;
}

/**
 * Resolves a nested table into absolute patterns.
 *
 * A child key is joined onto its parent: `"./x"`, `"/x"` and `"x"` all mean
 * the same thing there, and `"/"` means the parent path itself. Reusing one
 * section object under several parents therefore yields the *same loader
 * objects* under each, so they share one module cache and one `import()`.
 */
function flatten(
  table: RouteTable,
  prefix: string | null = null,
  parents: readonly RouteNode[] = [],
  into: Record<string, RouteChain> = {},
): FlatTable {
  // This table's own page, if it declares one. Found in a first pass, so the
  // order of the object's keys cannot decide whether children see their
  // parent. Only a *nested* table has a self — top-level keys are siblings.
  let self: RouteNode | undefined;
  if (prefix !== null) {
    for (const [key, value] of Object.entries(table)) {
      if (childKey(key) === "/" && typeof value === "function") {
        self = routeNode(prefix || "/", value as RouteLoader);
      }
    }
  }
  const inherited = self ? [...parents, self] : parents;

  for (const [key, value] of Object.entries(table)) {
    // A top-level key is the author's pattern, used verbatim — so `"*"` stays
    // `"*"` (route.pattern reports what was written), and a stray `"./x"` with
    // no parent still reaches compile() and is rejected there.
    const pattern = prefix === null ? key : joinChild(prefix, key);

    if (typeof value === "function") {
      // The table's own page sits beside its parents, not under itself.
      const isSelf = prefix !== null && childKey(key) === "/";
      into[pattern] = {
        leaf: routeNode(pattern, value as RouteLoader),
        parents: isSelf ? parents : inherited,
      };
    } else {
      // A nested table hangs off this key. normalizeBase trims it so "/a/" and
      // "a" compose the same way.
      flatten(value, normalizeBase(pattern), inherited, into);
    }
  }
  return into;
}

/** Joins a child key onto its parent prefix. "./x", "/x" and "x" are all the same here. */
function joinChild(prefix: string, pattern: string): string {
  const relative = pattern.startsWith("./") ? pattern.slice(1) : pattern;
  // "/" is the parent path itself.
  if (relative === "/") return prefix || "/";
  return prefix + (relative.charCodeAt(0) === 47 /* / */ ? relative : "/" + relative);
}

export interface RouterOptions {
  /**
   * Where the route is kept.
   *
   * - `"browser"` (default) — the pathname, via the History API. The route is
   *   a real URL, so it can be server-rendered and crawled, and the server
   *   must serve every route.
   * - `"hash"` — everything after `#`. No server rewrites needed and it works
   *   from `file://` or a static host, but the route never reaches the server,
   *   so there is nothing to server-render.
   * - `"memory"` — an array in this process, with no browser location. For
   *   tests, for a host with no URL bar, and for an app embedded in a page
   *   whose address must not change. `start(url)` seeds the first entry.
   */
  history?: HistoryKind;
  /** URL prefix the app is served under, e.g. "/docs". Default "/". */
  base?: string;
  /**
   * Load the remaining routes' modules once the page goes idle, so later
   * navigations are synchronous. Default true.
   */
  preload?: boolean;
  /**
   * Called in the browser after every resolved navigation, including the
   * initial one — the hook for `document.title`, meta tags and analytics.
   * Never called during SSR.
   */
  onNavigate?: (ctx: RouteContext) => void;
}

export interface NavigateOptions {
  /** Replace the current history entry instead of pushing a new one. */
  replace?: boolean;
}

/** The active route. One per page load in the browser, one per SSR request. */
export interface Route {
  readonly path: string;
  readonly pattern: string;
  readonly params: RouteParams;
  readonly search: URLSearchParams;
  readonly hash: string;
  readonly url: string;
  /** True while a navigation is waiting for its page module. */
  readonly pending: boolean;
  /** Set when a page module failed to load; cleared by the next navigation. */
  readonly error: Error | null;
  /**
   * Whatever the active route's `load()` returned, or `undefined` when it has
   * none. Only the matched page's: a parent's `load()` result is not on it.
   *
   * Mainly for SSR: a server can serialize this into the HTML so the client's
   * loader can take it instead of fetching the same thing again during
   * hydration.
   *
   * ```ts
   * // server
   * `<script>window.__DATA__ = ${JSON.stringify(route.data)}</script>`
   *
   * // the page's loader, in the browser
   * export const load = (ctx) => takeServerData() ?? fetchIt(ctx.params.id);
   * ```
   */
  readonly data: unknown;
  /**
   * How many layers are on the stack: 1 for an ordinary page, 2 while one
   * `push()`ed layer is open, and so on.
   */
  readonly depth: number;
  /**
   * The alternative to the automatic mount: the slot the layer stack renders
   * into — every layer, bottom first — placed by the app, once, before the
   * render that shows it. A page that returns plain content renders here; one
   * that returns a `view()` still lands in its region. Once placed, nothing is
   * mounted automatically.
   */
  pages(): ListModifier;
  /**
   * Runs `fn` with this Route as the router's active one, and returns what it
   * returns. For the server, where every request has its own Route and the
   * app reads the shared router:
   *
   * ```ts
   * const route = await router.start(request.url);
   * const html = route.run(() => renderToString(App));
   * ```
   *
   * Each `renderToString()` inside `fn` mounts this Route's pages within that
   * render. The browser never needs it: `start()` makes its Route the active
   * one.
   *
   * The scope ends when `fn` returns, so only a synchronous render sees it —
   * which `renderToString()` is. An async or streaming render would need it
   * carried across `await`s (AsyncLocalStorage, say), which this does not do.
   */
  run<T>(fn: () => T): T;
  /** Navigates, loading the target's module if needed. Never rejects. */
  go(href: string, options?: NavigateOptions): Promise<void>;
  /**
   * Opens a route as a **new layer on top of the current one**, instead of
   * replacing it, and resolves with whatever that layer closes with.
   *
   * The page underneath is not re-rendered or rebuilt — the stack is one
   * `list()`, so opening a layer is an append. Its DOM, its focus and its
   * form state are all still there when the layer closes.
   *
   * ```ts
   * // in the page underneath
   * const created = await route.push<Option>("/options/new");
   * if (created) { options.push(created); selected = created.id; update(); }
   *
   * // in the pushed page — `(ctx, { layer })`
   * layer.close(created);   // resolves the push() above with the new option
   * layer.close();          // dismissed: resolves with undefined
   * ```
   *
   * Browser-side only (it resolves to `undefined` with no window). Back
   * closes the top layer, because `push()` adds a history entry.
   *
   * Unlike `go()`, this **rejects** when the href matches no route or its
   * module fails to load: the caller is already awaiting a result, so the
   * failure belongs there rather than on `route.error`. A loader's
   * `Redirect` opens its target as the layer instead.
   */
  push<T = unknown>(href: string): Promise<T | undefined>;
  /**
   * Goes back `delta` entries, as the browser's Back button would.
   *
   * Mostly for `history: "memory"`, which has no Back button — there the
   * entries live in the router and this is the only way to traverse them.
   * Asynchronous in a browser, like any history traversal: the route has not
   * changed when this returns.
   */
  back(delta?: number): void;
  /** Prefixes a path with the router's base, for `a({ href })`. */
  href(path: string): string;
  /** Detaches every listener and cancels idle preloading. Idempotent. */
  stop(): void;
}

/**
 * The route table, plus every member of the active Route read through it —
 * `router.path`, `router.go()`, `router.href()` — so an app imports the
 * router instead of being handed a Route. The active Route is the one the
 * last `start()` returned in the browser (stopped or not), or the one whose
 * `run()` is executing on the server; reading a member with neither throws.
 */
export interface Router extends Omit<Route, "run"> {
  /**
   * Resolves a URL to its page module and returns the Route for it.
   * Defaults to `location.href` in the browser; pass the request URL on the
   * server. Rejects when nothing matches and the table has no "*" route.
   * A loader's `Redirect` is followed in the browser; on the server `start()`
   * rejects with it, `href` resolved, for the app to answer with a 3xx.
   *
   * In the browser the Route becomes the router's active one and its pages
   * mount with the next `render()` or `hydrate()`; `stop()` unmounts them.
   */
  start(url?: string): Promise<Route>;
  /**
   * Resolves a URL against the table **without loading anything**, and
   * returns the context it would produce — or null when the URL is outside
   * `base`, matches no pattern, or — in the browser — is on another origin.
   *
   * Pure and side-effect free on both sides: no import, no history, no
   * listeners, no Route. Defaults to `location.href` in the browser.
   *
   * ```ts
   * // 404 on the server before importing a single chunk
   * if (!router.match(request.url)) return new Response(null, { status: 404 });
   *
   * // "is this link ours?" for a custom link component or a prefetch rule
   * const owned = router.match(href) !== null;
   * ```
   */
  match(url?: string): RouteContext | null;
}

interface Entry {
  /** The outermost level. Its children chain down to the matched page. */
  readonly root: LevelInstance;
  readonly layer: Layer;
  /** Resolves the push() that opened this layer. Cleared once it has run. */
  settle?: (result: unknown) => void;
  /** What close() asked to resolve with, held until the layer is popped. */
  result?: unknown;
}

/**
 * Where the top layer's index is recorded, so Back, Forward and a reload all
 * agree with the stack. `history.state` survives a reload, which is how a
 * reloaded layer is recognised as one the app can no longer reconstruct.
 */
const DEPTH_KEY = "nucloRouterDepth";

/** Every level of an entry, outermost first. */
function levelsOf(entry: Entry): LevelInstance[] {
  const out: LevelInstance[] = [];
  for (let node: LevelInstance | undefined = entry.root; node; node = node.children[0]) out.push(node);
  return out;
}

/** The matched page's level — the deepest one. */
function leafOf(entry: Entry): ResolvedLevel {
  let node = entry.root;
  while (node.children[0]) node = node.children[0];
  return node.level;
}

/** Builds instances for a slice of levels, returning the outermost. */
function buildLevels(levels: readonly ResolvedLevel[]): LevelInstance | undefined {
  let child: LevelInstance | undefined;
  for (let i = levels.length - 1; i >= 0; i--) child = { level: levels[i], children: child ? [child] : [] };
  return child;
}

function depthFromState(state: unknown): number {
  const depth = (state as Record<string, unknown> | null)?.[DEPTH_KEY];
  return typeof depth === "number" && depth > 0 ? depth : 0;
}

function isPromise<T>(value: unknown): value is Promise<T> {
  return typeof (value as { then?: unknown } | null)?.then === "function";
}

/** A route's module, once resolved: its page plus its optional data loader. */
interface RouteModuleShape {
  readonly component: PageComponent;
  readonly load?: DataLoader;
}

/** A route resolved for one navigation: the cached module plus fresh data. */
interface ResolvedRoute {
  readonly component: PageComponent;
  readonly data: unknown;
}

/** One level of the matched chain, planned but not yet loaded. */
interface PlannedLevel {
  readonly node: RouteNode;
  readonly ctx: RouteContext;
}

/** One level, resolved: its module, its data and the context it was built with. */
interface ResolvedLevel extends PlannedLevel {
  readonly component: PageComponent;
  readonly data: unknown;
}

/**
 * A level as mounted. `children` holds 0 or 1 entries and is the array the
 * level's outlet renders, so replacing a child never disturbs this level.
 */
interface LevelInstance {
  readonly level: ResolvedLevel;
  readonly children: LevelInstance[];
}

function pickModule(mod: RouteModule, pattern: string): RouteModuleShape {
  if (typeof mod === "function") return { component: mod };
  const component = mod?.default;
  if (typeof component !== "function") {
    throw new Error(
      `nuclo-router: the module for "${pattern}" has no default export — ` +
        `use () => import("…").then(m => m.YourPage) to pick a named one`,
    );
  }
  return { component, load: mod.load };
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

export function createRouter(table: RouteTable, options: RouterOptions = {}): Router {
  // Nesting is resolved once, here: everything downstream sees absolute
  // patterns, so the matcher, the cache and the preloader are unchanged.
  const routes = flatten(table);
  const match = createMatcher<RouteChain>(routes);
  const historyKind: HistoryKind = options.history ?? "browser";
  /**
   * Built once per router. The browser adapters need a window; without one
   * (SSR) everything routes through memory, which keeps `start(url)` working
   * while navigation stays inert.
   */
  const location: LocationAdapter =
    historyKind === "memory" || !isBrowser
      ? memoryHistory()
      : historyKind === "hash"
        ? hashHistory()
        : browserHistory();
  const base = normalizeBase(options.base);
  const preloadEnabled = options.preload !== false;
  const onNavigate = options.onNavigate;

  /**
   * Page components by loader, with the in-flight promise stored under the
   * same key — so concurrent navigations to one route share a single
   * import() and a cached route resolves synchronously. A rejected load is
   * evicted, so a failed chunk (flaky network) can be retried.
   *
   * Bounded by the number of routes and deliberately never cleared: holding
   * the page functions is the point. Nothing DOM-related is stored here.
   */
  const cache = new Map<RouteLoader, RouteModuleShape | Promise<RouteModuleShape>>();

  /**
   * The Route the router's own members read: in the browser the one from the
   * last start() — kept after its stop(), like any stopped Route it still
   * answers with its last match — until a second start() retires it; on the
   * server the one whose run() is executing.
   */
  let active: Route | null = null;

  function activeRoute(): Route {
    if (active) return active;
    throw new Error(
      "nuclo-router: no active route — await router.start() first (on the server, render inside route.run())",
    );
  }

  function load(loader: RouteLoader, pattern: string): RouteModuleShape | Promise<RouteModuleShape> {
    const hit = cache.get(loader);
    if (hit) return hit;

    const result = loader();
    if (!isPromise<RouteModule>(result)) {
      const shape = pickModule(result, pattern);
      cache.set(loader, shape);
      return shape;
    }
    const promise = result.then(
      (mod) => {
        const shape = pickModule(mod, pattern);
        cache.set(loader, shape);
        return shape;
      },
      (error: unknown) => {
        cache.delete(loader);
        throw error;
      },
    );
    cache.set(loader, promise);
    return promise;
  }

  /**
   * Resolves a route for one navigation: the module (cached, fetched once)
   * plus this navigation's data (never cached, so `/blog/a` and `/blog/b`
   * cannot see each other's).
   *
   * Stays synchronous whenever both halves are, which is what keeps a cached
   * loader-free route committing in the same task.
   */
  function resolveRoute(
    loader: RouteLoader,
    pattern: string,
    ctx: RouteContext,
  ): ResolvedRoute | Promise<ResolvedRoute> {
    const shape = load(loader, pattern);
    if (isPromise<RouteModuleShape>(shape)) return shape.then((m) => withData(m, ctx));
    return withData(shape, ctx);
  }

  /**
   * The levels a match will render, outermost first, without loading
   * anything. Parents share the leaf's params, search and hash — the URL is
   * one URL — but each gets its own pattern and its own slice of the path.
   */
  function planChain(chain: RouteChain, leafCtx: RouteContext): PlannedLevel[] {
    const planned: PlannedLevel[] = [];
    const segments = splitPath(leafCtx.path, false);
    for (const node of chain.parents) {
      planned.push({
        node,
        ctx: { ...leafCtx, pattern: node.pattern, path: joinSegments(segments.slice(0, node.segments)) },
      });
    }
    planned.push({ node: chain.leaf, ctx: leafCtx });
    return planned;
  }

  /** Resolves each planned level's module and data, staying sync when it can. */
  function resolveLevels(
    planned: readonly PlannedLevel[],
  ): ResolvedLevel[] | Promise<ResolvedLevel[]> {
    const parts = planned.map((level) => {
      const resolved = resolveRoute(level.node.loader, level.node.pattern, level.ctx);
      return isPromise<ResolvedRoute>(resolved)
        ? resolved.then((r) => ({ ...level, component: r.component, data: r.data }))
        : { ...level, component: resolved.component, data: resolved.data };
    });
    return parts.some((part) => isPromise<ResolvedLevel>(part))
      ? Promise.all(parts)
      : (parts as ResolvedLevel[]);
  }

  function withData(
    shape: RouteModuleShape,
    ctx: RouteContext,
  ): ResolvedRoute | Promise<ResolvedRoute> {
    if (!shape.load) return { component: shape.component, data: undefined };
    const data = shape.load(ctx);
    if (isPromise<unknown>(data)) return data.then((value) => ({ component: shape.component, data: value }));
    return { component: shape.component, data };
  }

  /**
   * Resolves a route-relative href against the active route's path, returning
   * an absolute, base-prefixed href.
   *
   * This deliberately differs from how a browser resolves a relative URL: the
   * reference point is the current route, not the current URL's "directory".
   * So from /blog/hello, "./preview" is /blog/hello/preview — not
   * /blog/preview — and a trailing slash on the current URL changes nothing.
   * That is what makes a fragment like "./preview" mean the same thing
   * wherever it is mounted.
   */
  function resolveRelative(href: string, fromPath: string): string {
    const cut = href.search(/[?#]/);
    const relative = cut === -1 ? href : href.slice(0, cut);
    const suffix = cut === -1 ? "" : href.slice(cut);

    // Not decoded: parse() decodes once, later.
    const segments = splitPath(fromPath, false);
    for (const segment of splitPath(relative, false)) {
      if (segment === ".") continue;
      if (segment === "..") segments.pop();
      else segments.push(segment);
    }

    const path = joinSegments(segments);
    return (path === "/" ? base || "/" : base + path) + suffix;
  }

  /** Resolves a route-relative href ("./x", "../x", "." or "..") against `fromPath`; anything else comes back unchanged. */
  function resolveFrom(href: string, fromPath: string): string {
    const relative = href === "." || href === ".." || href.startsWith("./") || href.startsWith("../");
    return relative ? resolveRelative(href, fromPath) : href;
  }

  /**
   * Where a failed navigation to `fromPath` goes instead: a Redirect's href,
   * resolved — or, for anything else and for a redirect chain past
   * MAX_REDIRECTS, the Error to fail with.
   */
  function redirectOf(cause: unknown, fromPath: string, hops: number): string | Error {
    if (!(cause instanceof Redirect)) return toError(cause);
    if (hops >= MAX_REDIRECTS) {
      return new Error(`nuclo-router: more than ${MAX_REDIRECTS} redirects in a row, the last to "${cause.href}"`);
    }
    return resolveFrom(cause.href, fromPath);
  }

  /** The canonical app-relative href for a context: base + path + ?search + #hash. */
  function appHref(ctx: RouteContext): string {
    const path = ctx.path === "/" ? base || "/" : base + ctx.path;
    const search = ctx.search.toString();
    return path + (search ? `?${search}` : "") + ctx.hash;
  }

  function parse(href: string): { match: Match<RouteChain>; ctx: RouteContext } | null {
    let url: URL;
    try {
      // Resolved against the app's own location, which in hash and memory
      // mode is not the document's. In browser mode the two are the same.
      url = new URL(href, ORIGIN + location.read());
    } catch {
      return null;
    }
    // Another site is never ours, whatever its path. Only a browser has an
    // origin to compare: a server matches the request URLs it is handed.
    if (isBrowser && url.origin !== ORIGIN) return null;
    const inner = stripBase(url.pathname, base);
    if (inner === null) return null;
    const found = match(inner);
    if (!found) return null;
    return {
      match: found,
      ctx: {
        path: found.path,
        pattern: found.pattern,
        params: found.params,
        search: url.searchParams,
        hash: url.hash,
        url: href,
      },
    };
  }

  async function start(url?: string, hops = 0): Promise<Route> {
    const href = url ?? location.read();
    const parsed = parse(href);
    if (!parsed) {
      throw new Error(
        `nuclo-router: no route matches "${href}" — add a "*" route to handle unknown paths`,
      );
    }
    // A memory adapter starts at "/" and only start() knows better. Browser
    // adapters already read the real location, so they are left alone.
    if (location.kind === "memory") location.replace(appHref(parsed.ctx), null);

    // The whole chain, parents included: a deep link must render its layouts
    // too, and on a server they have to be in the first HTML.
    let resolved: ResolvedLevel[];
    try {
      resolved = await resolveLevels(planChain(parsed.match.value, parsed.ctx));
    } catch (cause) {
      if (!(cause instanceof Redirect)) throw cause;
      const to = redirectOf(cause, parsed.ctx.path, hops);
      if (typeof to !== "string") throw to;
      // A server answers with a 3xx itself, and needs the href resolved.
      if (!isBrowser) throw new Redirect(to);
      // Not one of ours: the browser leaves for it, and there is no Route.
      if (!parse(to)) {
        location.leave(to);
        throw new Redirect(to);
      }
      location.replace(to, null);
      return start(to, hops + 1);
    }

    // ── per-Route state ──────────────────────────────────────────────────
    /**
     * The layer stack, and list()'s items array. Index 0 is the base page;
     * push() appends. Because pages() is one list() over this array, appending
     * a layer is a pure insertion — the rows below are never rebuilt, so the
     * page underneath keeps its DOM, its focus and its form state.
     *
     * A reload always starts at depth 1: the URL names the top layer but not
     * the stack beneath it, so a pushed route has to stand on its own when it
     * is opened cold.
     */
    const slot: Entry[] = [];
    let current: Entry = pushEntry(resolved);

    /**
     * Builds an entry for a given stack position. The Layer handle closes
     * over its own depth, so a page can only ever close its own layer.
     */
    function makeEntry(levels: readonly ResolvedLevel[], depth: number): Entry {
      return {
        root: buildLevels(levels)!,
        layer: {
          depth,
          push: <T,>(href: string) => pushLayer(href) as Promise<T | undefined>,
          close: (result?: unknown) => closeLayer(depth, result),
        },
      };
    }

    function pushEntry(levels: readonly ResolvedLevel[]): Entry {
      const entry = makeEntry(levels, slot.length);
      slot.push(entry);
      return entry;
    }

    /**
     * How many of this entry's leading levels the next route can keep.
     *
     * Only *parents* are candidates: the matched page itself is always
     * rebuilt, so its loader runs on every navigation and re-visiting a URL
     * still refreshes it. A parent is kept when its pattern and its slice of
     * the path are unchanged — which is also why its loader is not re-run.
     */
    function sharedParents(entry: Entry, planned: readonly PlannedLevel[]): number {
      // Reuse is a base-page concern; a layer is its own row.
      if (entry.layer.depth !== 0 || slot.length !== 1) return 0;
      const have = levelsOf(entry);
      const wanted = planned.length - 1;
      let shared = 0;
      while (shared < have.length && shared < wanted) {
        const mine = have[shared].level;
        const theirs = planned[shared];
        if (mine.node.pattern !== theirs.node.pattern || mine.ctx.path !== theirs.ctx.path) break;
        shared++;
      }
      return shared;
    }

    /**
     * Renders one level, giving it an outlet over its own children array.
     *
     * The outlet is a nested `list()`, so swapping a child replaces only that
     * subtree. A parent that never calls it swallows its children, which is
     * silent enough to warrant the warning below.
     */
    function renderLevel(instance: LevelInstance, layer: Layer): ListRenderResult {
      let used = false;
      const outlet: Outlet = () => {
        used = true;
        return list(() => instance.children, (child: LevelInstance) => renderLevel(child, layer));
      };
      const built = instance.level.component(instance.level.ctx, { layer, data: instance.level.data, outlet });
      if (!used && instance.children.length > 0 && !warnedOutlet) {
        warnedOutlet = true;
        console.warn(
          `nuclo-router: "${instance.level.node.pattern}" has a child route but never called its ` +
            `outlet(), so "${instance.children[0].level.node.pattern}" cannot render. A parent page ` +
            `takes (ctx, { outlet }) and must place outlet() where its child belongs.`,
        );
      }
      return built;
    }

    /** Resolves each discarded layer's push(), topmost first, with what close() left on it. */
    function settleAll(discarded: readonly Entry[]): void {
      for (let i = discarded.length - 1; i >= 0; i--) {
        const entry = discarded[i];
        const settle = entry.settle;
        entry.settle = undefined;
        settle?.(entry.result);
      }
    }

    /**
     * Resolves a route-relative href ("./x", "../x", "." or "..") against the
     * active route; anything else comes back unchanged.
     */
    function abs(href: string): string {
      return resolveFrom(href, leafOf(current).ctx.path);
    }

    /**
     * Pops the stack down to `length`, resolving each discarded layer's
     * push() with whatever close() left on it (undefined when it was
     * dismissed, or when a plain navigation threw the stack away).
     */
    function trimTo(length: number): void {
      const discarded = slot.splice(length);
      current = slot[slot.length - 1];
      pendingPath = null;
      update();
      // Settled after the DOM has caught up, so an awaiting caller resumes
      // with the layer already gone from the page.
      settleAll(discarded);
    }
    let pendingPath: string | null = null;
    let error: Error | null = null;
    let stopped = false;
    /** The marker of the last pages() placed in a tree, to catch a second live one. */
    let outlet: WeakRef<Comment> | null = null;
    let warnedOutlets = false;
    /** The automatic mount on the document root, in the browser, until stop(). */
    let mounted: { start: Node; end: Node } | null = null;
    /** True once the app placed pages() itself: nothing is mounted automatically. */
    let placed = false;
    /** True once the pages were mounted automatically, on either side: pages() then warns. */
    let mountedOnce = false;
    let warnedPlain = false;
    let warnedNowhere = false;
    /** Unregisters the browser's root-build hook; set by start(). */
    let unhookRoot: (() => void) | undefined;
    /**
     * The location the last history event delivered, as layer depth plus
     * href — one Back can arrive as both a popstate and a hashchange (hash
     * mode), and the second must not navigate, or call onNavigate, again.
     * Depth is part of it because two layers can sit on one href. Cleared by
     * every navigation the router makes itself, so the next event is always
     * taken on its own terms.
     */
    let handled: string | null = null;
    /** One warning per Route about a parent that never rendered its outlet. */
    let warnedOutlet = false;
    /** Detaches the history subscription; set when the Route starts listening. */
    let unsubscribe: (() => void) | undefined;
    /**
     * Bumped by every navigation and by stop(). A module that resolves under
     * a stale generation is dropped: out-of-order navigations cannot show the
     * wrong page, and a stopped Route never touches the DOM again.
     */
    let generation = 0;
    let idleId: number | undefined;

    const hasIdle = isBrowser && typeof requestIdleCallback === "function";

    function queueIdle(step: () => void): void {
      idleId = hasIdle
        ? requestIdleCallback(step)
        : (setTimeout(step, 200) as unknown as number);
    }

    function cancelIdle(): void {
      if (idleId === undefined) return;
      if (hasIdle) cancelIdleCallback(idleId);
      else clearTimeout(idleId);
      idleId = undefined;
    }

    /**
     * The stack as a list(): the rows are the pages' outputs. `mount` names
     * the automatic mount it is for, or null for a pages() the app placed.
     */
    function rowsOf(mount: "browser" | "server" | null): ListModifier {
      // An automatically mounted page has nowhere to go but a region — in the
      // browser it would sit after </body>, on a server on a host nothing
      // serializes — so say so when it does not land there: content that is
      // not a view(), or a view() whose region is not in the tree.
      const render = (entry: Entry): ListRenderResult => {
        const built = renderLevel(entry.root, entry.layer);
        if (!mount) return built;
        return ((host: ExpandedElement, index: number): Node | null => {
          const node = typeof built === "function" ? (built as NodeModFn)(host, index) : built;
          const pattern = leafOf(entry).ctx.pattern;
          if (node && (node as Node).nodeType !== 8 && !warnedPlain) {
            warnedPlain = true;
            console.warn(
              `nuclo-router: "${pattern}" returned content without a view(), ` +
                "so it renders nowhere visible. Return view(\"<region id>\", …) from the page, " +
                "or place router.pages() in the tree to render pages where it sits.",
            );
          } else if (node && !warnedNowhere) {
            // Judged once the render is over: the pages are built before the
            // app's tree, so a region arrives after the view waiting for it.
            queueMicrotask(() => {
              if (warnedNowhere || !viewWaiting(node as Node)) return;
              warnedNowhere = true;
              console.warn(
                `nuclo-router: "${pattern}" returned a view() whose region is not in the tree, ` +
                  "so it renders nowhere visible. Check its id against the layout's region({ id }).",
              );
            });
          }
          return node as Node | null;
        }) as unknown as ListRenderResult;
      };
      // The browser's mount empties itself on stop(), so every page leaves
      // its region through nuclo.
      return list(() => (mount === "browser" && stopped ? [] : slot), render);
    }

    /**
     * Mounts the stack beside the app, from nuclo's root-build hook: after the
     * app's component has run — so a pages() it placed is known — and before
     * its tree is built, so each page's view() is waiting when its region
     * arrives. In the browser that is once per Route, as comments on the
     * document root, outside any hydration pass. In a server render it is
     * inside that render, on a host nothing serializes, so the views reach
     * this render's regions and no other's.
     */
    function mountPages(serializing: boolean): void {
      if (placed) return;
      if (serializing) {
        rowsOf("server")(document.createElement("div") as unknown as ExpandedElement, 0);
      } else if (!mounted) {
        const html = document.documentElement as unknown as ExpandedElement;
        const start = rowsOf("browser")(html, 0) as unknown as Node;
        mounted = { start, end: (html as unknown as Node).lastChild! };
      }
      mountedOnce = true;
    }

    /** Takes the automatic mount down: rows through nuclo, then the markers. */
    function unmountPages(): void {
      if (!mounted) return;
      const { start, end } = mounted;
      mounted = null;
      // stopped: the list now holds no rows, so each page's view leaves its region.
      update();
      for (let node: Node | null = start; node; ) {
        const next: Node | null = node === end ? null : node.nextSibling;
        node.parentNode?.removeChild(node);
        node = next;
      }
    }

    function locationKey(): string {
      return depthFromState(location.state()) + " " + location.read();
    }

    function restoreScroll(hash: string): void {
      if (hash.length < 2) return;
      let id = hash.slice(1);
      // The URL carries it encoded; the element's id is the decoded text.
      try {
        id = decodeURIComponent(id);
      } catch {
        // Not valid encoding: look it up as written.
      }
      document.getElementById(id)?.scrollIntoView();
    }

    /**
     * Lands an ordinary navigation. A navigation is not a layer: it replaces
     * the whole stack, so any open layers are dismissed and their push()
     * callers resolve with undefined.
     *
     * `shared` leading levels of the current entry are kept: their DOM is left
     * alone and only the subtree below them is replaced. That is what makes a
     * child navigation leave its parent mounted.
     */
    function commit(levels: readonly ResolvedLevel[], scroll: boolean): void {
      const leafCtx = levels[levels.length - 1].ctx;
      // Reuse is a base-page concern. A row that is currently a layer holds a
      // Layer handle for a depth the new stack will not have — its close()
      // would silently do nothing — so it is rebuilt at depth 0 instead.
      const reusable = current.layer.depth === 0 && slot.length === 1;
      const mounted = reusable ? levelsOf(current) : [];
      const keep = reusable ? matchingPrefix(mounted, levels) : 0;

      if (keep === levels.length && keep === mounted.length) {
        // Nothing about the route changed — same levels, same data. Leave the
        // DOM completely alone, which is what keeps a redundant navigation (or
        // a popstate onto the current URL) from flashing the page.
      } else if (keep > 0) {
        // Graft onto the deepest kept level. Its own row is never touched, so
        // a parent keeps its DOM, its focus and its scroll position while its
        // children change.
        const branch = buildLevels(levels.slice(keep));
        const attach = mounted[keep - 1].children;
        attach.splice(0, attach.length, ...(branch ? [branch] : []));
      } else {
        const entry = makeEntry(levels, 0);
        const discarded = slot.splice(0, slot.length, entry);
        current = entry;
        settleAll(discarded);
      }

      pendingPath = null;
      error = null;
      update();
      if (scroll) restoreScroll(leafCtx.hash);
      onNavigate?.(leafCtx);
    }

    /**
     * How many leading levels are mounted already and unchanged.
     *
     * Shared parents compare equal trivially — navigate() does not re-resolve
     * them, so they are the very same objects. The matched page is compared on
     * its data too: a route with a `load()` yields a fresh value every
     * navigation, so it rebuilds, while one without has `undefined` on both
     * sides and keeps its DOM.
     */
    function matchingPrefix(mounted: readonly LevelInstance[], levels: readonly ResolvedLevel[]): number {
      let shared = 0;
      while (shared < mounted.length && shared < levels.length) {
        const mine = mounted[shared].level;
        const theirs = levels[shared];
        if (
          mine.component !== theirs.component ||
          mine.data !== theirs.data ||
          mine.ctx.path !== theirs.ctx.path ||
          mine.ctx.search.toString() !== theirs.ctx.search.toString()
        ) {
          break;
        }
        shared++;
      }
      return shared;
    }

    /** Opens `href` as a new layer. See Route.push(). */
    async function pushLayer(rawHref: string, hops = 0): Promise<unknown> {
      if (!isBrowser || stopped) return undefined;

      // A pushed layer is usually a child of the page pushing it, which is
      // exactly what a relative href says: push("./preview").
      const href = abs(rawHref);
      const parsed = parse(href);
      if (!parsed) {
        throw new Error(`nuclo-router: push("${rawHref}") — no route matches it`);
      }

      const mine = ++generation;
      let resolved: ResolvedLevel[];
      try {
        // A layer renders the matched page alone, not its layout chain: its
        // parents are already mounted in the row beneath it, and rendering them
        // again would show the same layout twice.
        const loaded = resolveLevels(planChain(parsed.match.value, parsed.ctx).slice(-1));
        if (isPromise<ResolvedLevel[]>(loaded)) {
          // The caller is awaiting, but the app's own pending UI should still
          // show — a layer that has to fetch its chunk is a navigation too.
          pendingPath = parsed.ctx.path;
          error = null;
          update();
          resolved = await loaded;
        } else {
          resolved = loaded;
        }
      } catch (cause) {
        const live = generation === mine;
        if (live) {
          pendingPath = null;
          update();
        }
        const to = redirectOf(cause, parsed.ctx.path, hops);
        // A loader's Redirect opens its target instead — unless something
        // overtook this push while it loaded.
        if (typeof to === "string") return live ? pushLayer(to, hops + 1) : undefined;
        // Rejected rather than surfaced: nothing opened, and the caller is
        // the only one who knows what to do about it.
        throw to;
      }
      // Overtaken by a navigation, or the Route was retired: open nothing.
      if (stopped || generation !== mine) return undefined;
      // The layer supersedes any navigation still in flight, whose own
      // completion is now stale and will never clear the flag.
      pendingPath = null;

      const depth = slot.length;
      // History after the module is in hand, so a failed push leaves the URL
      // alone. Back now closes this layer.
      location.push(href, { [DEPTH_KEY]: depth });
      handled = null;
      const entry = pushEntry(resolved);
      current = entry;
      error = null;
      update();
      onNavigate?.(parsed.ctx);

      return new Promise((resolve) => {
        entry.settle = resolve;
      });
    }

    /**
     * close() does not pop the stack itself — it records the result and walks
     * history back, so Back and close() end up in exactly the same place.
     */
    function closeLayer(depth: number, result: unknown): void {
      if (!isBrowser || stopped) return;
      // Layer 0 is the base page: nothing opened it, so there is nothing to
      // close. A depth past the top has already been popped.
      if (depth < 1 || depth >= slot.length) return;
      slot[depth].result = result;
      location.go(depth - slot.length);
    }

    function navigate(rawHref: string, mode: "push" | "replace" | "pop", hops = 0): Promise<void> {
      if (!isBrowser || stopped) return Promise.resolve();

      // "./x" and "../x" are relative to the active route, so they resolve to
      // an absolute href before the URL — and the history entry — is built.
      const href = abs(rawHref);
      const parsed = parse(href);
      if (!parsed) {
        // Outside the app's routes. A click never reaches here (the handler
        // leaves those to the browser); go() to one is an explicit request to
        // leave the SPA, and a popstate to one means the history entry is not
        // ours to render.
        if (mode === "pop") {
          // Invalidate any in-flight load too: committing it would render a
          // page for a URL the history no longer sits on.
          generation++;
          pendingPath = null;
          error = new Error(`nuclo-router: no route matches "${href}"`);
          update();
        } else {
          location.leave(href);
        }
        return Promise.resolve();
      }

      const { ctx, match: found } = parsed;
      const mine = ++generation;
      const scroll = mode !== "pop";

      // History is written when the page lands, not when the navigation
      // starts — as push() does — so the address bar never names a page that
      // is not on screen: not while it loads, not after it fails, and not for
      // a navigation something else overtook.
      const land = (levels: readonly ResolvedLevel[]): void => {
        if (mode !== "pop") {
          if (mode === "push") location.push(href, null);
          else location.replace(href, null);
          handled = null;
        }
        commit(levels, scroll);
      };

      // A loader's Redirect is followed as a navigation of its own. This one
      // wrote no history, so a push stays a push; a pop already sits on its
      // entry, which the target replaces.
      const failed = (cause: unknown): Promise<void> => {
        const to = redirectOf(cause, ctx.path, hops);
        if (typeof to === "string") return navigate(to, mode === "pop" ? "replace" : mode, hops + 1);
        fail(ctx, to);
        return Promise.resolve();
      };

      // A loader can fail two ways: by rejecting, or by throwing before it
      // ever returns a promise. Both land on `fail` below, so go() keeps its
      // promise — a stray link click can never produce an unhandled error.
      const planned = planChain(found.value, ctx);
      const shared = sharedParents(current, planned);
      const kept = levelsOf(current).slice(0, shared).map((instance) => instance.level);

      let loaded: ResolvedLevel[] | Promise<ResolvedLevel[]>;
      try {
        // Only the levels not being kept are resolved, so a parent's loader
        // does not re-run just because one of its children changed.
        loaded = resolveLevels(planned.slice(shared));
      } catch (cause) {
        return failed(cause);
      }

      // Already loaded (eager route, cache hit, or preloaded): swap in the
      // same task. No pending flag, no spinner frame, no layout shift.
      if (!isPromise<ResolvedLevel[]>(loaded)) {
        land([...kept, ...loaded]);
        return Promise.resolve();
      }

      pendingPath = ctx.path;
      error = null;
      update();

      return loaded.then(
        (resolved) => {
          if (generation !== mine) return;
          land([...kept, ...resolved]);
        },
        (cause: unknown) => {
          if (generation !== mine) return;
          return failed(cause);
        },
      );
    }

    /**
     * The one failure path for a page module that never arrived, whether it
     * rejected or threw outright. go() still resolves: an unhandled rejection
     * from a stray link click is worse than a surfaced route.error.
     */
    function fail(ctx: RouteContext, cause: unknown): void {
      pendingPath = null;
      error = toError(cause);
      // Logged so the failure is never silent even if nothing renders error.
      console.error(`nuclo-router: failed to load "${ctx.path}"`, cause);
      update();
    }

    function onLocationChange(): void {
      const key = locationKey();
      if (key === handled) return;
      handled = key;
      // Back out of one or more open layers. The depth recorded in
      // history.state is the authority, so this is right however many entries
      // the user jumped and whether they got here via Back or close().
      const target = depthFromState(location.state()) + 1;
      if (target < slot.length) {
        trimTo(target);
        onNavigate?.(leafOf(current).ctx);
        return;
      }
      // Anything else is an ordinary navigation, which replaces the stack.
      // That includes Forward into a layer we no longer hold: it renders as a
      // standalone page, exactly as a reload of that URL would.
      void navigate(location.read(), "pop");
    }

    function onClick(event: MouseEvent): void {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;

      const attr = anchor.getAttribute("href");
      // No href, in-page anchor, or explicitly opted out.
      if (!attr || attr.charCodeAt(0) === 35 /* # */) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.getAttribute("data-nuclo-router") === "off") return;
      const linkTarget = anchor.getAttribute("target");
      if (linkTarget && linkTarget !== "_self") return;
      const rel = anchor.getAttribute("rel");
      if (rel && rel.split(/\s+/).includes("external")) return;

      let url: URL;
      try {
        // The attribute, not anchor.href: SVG <a> has no string href. A
        // route-relative href is resolved against the active route first —
        // write them with route.href() so the markup itself is absolute and
        // still correct with JavaScript disabled.
        url = new URL(abs(attr), ORIGIN + location.read());
      } catch {
        return;
      }
      if (url.origin !== ORIGIN) return;

      const href = url.pathname + url.search + url.hash;
      // Not one of ours (outside base, or no matching pattern): a real
      // navigation, which also makes a server-rendered 404 reachable.
      const destination = parse(href);
      if (!destination) return;

      // Same route and query, so only the fragment can differ. Resolved
      // contexts are compared rather than raw locations, because in hash mode
      // the document's own pathname never changes.
      const here = parse(location.read());
      if (
        here &&
        here.ctx.path === destination.ctx.path &&
        here.ctx.search.toString() === destination.ctx.search.toString()
      ) {
        // A fragment to scroll to is the browser's job and it does it better.
        if (url.hash) return;
        // Otherwise this is the URL we are already on, where the browser's
        // only remaining default is a full page reload. Swallow the click —
        // but still navigate if it drops a fragment, so the URL follows.
        event.preventDefault();
        if (here.ctx.hash) void navigate(href, "push");
        return;
      }

      event.preventDefault();
      void navigate(href, "push");
    }

    function startPreload(): void {
      if (!preloadEnabled) return;
      // Every level of every chain, de-duplicated: a layout is needed by each
      // of its children, and warming it once makes a deep link instant too.
      const seen = new Set<RouteLoader>();
      const entries: Array<[string, RouteNode]> = [];
      for (const chain of Object.values(routes)) {
        for (const node of [...chain.parents, chain.leaf]) {
          if (seen.has(node.loader)) continue;
          seen.add(node.loader);
          entries.push([node.pattern, node]);
        }
      }
      let i = 0;
      const step = (): void => {
        idleId = undefined;
        if (stopped) return;
        // Don't compete for bandwidth with the page the user is waiting for.
        if (pendingPath !== null) {
          queueIdle(step);
          return;
        }
        while (i < entries.length && cache.has(entries[i][1].loader)) i++;
        if (i >= entries.length) return;
        const [pattern, node] = entries[i++];
        const loader = node.loader;
        let next: RouteModuleShape | Promise<RouteModuleShape>;
        try {
          // Modules only. A data loader needs a RouteContext — there is no
          // navigation here — and running one speculatively would fetch data
          // for a route the user may never open.
          next = load(loader, pattern);
        } catch {
          queueIdle(step);
          return;
        }
        // A preload failure is not the user's problem: move on to the next.
        if (isPromise<RouteModuleShape>(next)) next.then(() => queueIdle(step), () => queueIdle(step));
        else queueIdle(step);
      };
      queueIdle(step);
    }

    const route: Route = {
      get path() {
        return leafOf(current).ctx.path;
      },
      get pattern() {
        return leafOf(current).ctx.pattern;
      },
      get params() {
        return leafOf(current).ctx.params;
      },
      get search() {
        return leafOf(current).ctx.search;
      },
      get hash() {
        // Live, like `url`: an in-page anchor changes the fragment without a
        // navigation. The adapters keep the route's own fragment after the
        // first "#" in every mode, so no parsing is needed to find it.
        if (stopped) return leafOf(current).ctx.hash;
        const href = location.read();
        const at = href.indexOf("#");
        return at === -1 ? "" : href.slice(at);
      },
      /**
       * The live app-relative href — "/blog/x?a=1#top", base included. The
       * same shape in all three history modes, which is why it is not the
       * document's full URL. `ctx.url` is what the active page was built
       * with; this is where the app is now.
       */
      get url() {
        return !stopped ? location.read() : appHref(leafOf(current).ctx);
      },
      get pending() {
        return pendingPath !== null;
      },
      get data() {
        return leafOf(current).data;
      },
      get error() {
        return error;
      },
      get depth() {
        return slot.length;
      },
      pages: () => {
        placed = true;
        if (mountedOnce) {
          console.warn(
            "nuclo-router: pages() was placed after the pages were mounted automatically — " +
              "place it before the render that shows it, or leave it out.",
          );
        }
        const rows = rowsOf(null);
        return function (host: ExpandedElement, index: number): Comment {
          const marker = rows(host, index);
          const previous = outlet?.deref();
          outlet = new WeakRef(marker);
          // Two outlets would render the stack twice — duplicate ids, duplicate
          // form controls, every page component invoked twice — and hydration
          // claims both copies happily, so there is no other symptom to notice.
          // Judged a microtask later, once the tree is attached: a pass that
          // re-runs the app (forceUpdate(), a re-hydrate) claims the same marker
          // again, and a tree thrown away and rendered anew leaves a detached one.
          if (isBrowser && previous && previous !== marker) {
            queueMicrotask(() => {
              if (warnedOutlets || !previous.isConnected || !marker.isConnected) return;
              warnedOutlets = true;
              console.warn(
                "nuclo-router: route.pages() is placed twice. Every call renders the whole " +
                  "layer stack, so the active page is in the tree twice. Place pages() once " +
                  "and switch the surrounding chrome instead.",
              );
            });
          }
          return marker;
        } as unknown as ListModifier;
      },
      run: (fn) => {
        const previous = active;
        active = route;
        // Server renders inside fn mount this Route's pages; browser renders
        // are the browser hook's.
        const unhook = onRootBuild((serializing) => {
          if (serializing) mountPages(true);
        });
        try {
          return fn();
        } finally {
          unhook();
          active = previous;
        }
      },
      push: <T,>(href: string) => pushLayer(href) as Promise<T | undefined>,
      go: (href, navOptions) => navigate(href, navOptions?.replace ? "replace" : "push"),
      back: (delta = 1) => {
        if (!stopped) location.go(-Math.abs(delta));
      },
      href: (path) => {
        // Resolved here rather than at click time, so the HTML that ships —
        // and that a crawler or a JavaScript-less browser sees — carries an
        // absolute path.
        const resolved = abs(path);
        // A relative href always changes (it resolves to a "/…" path); the
        // rest comes back as given and is normalized below.
        if (resolved !== path) return resolved;
        const normalized = normalizePath(path);
        return normalized === "/" ? base || "/" : base + normalized;
      },
      stop: () => {
        if (stopped) return;
        stopped = true;
        // Invalidates every in-flight load: nothing can commit after stop().
        generation++;
        // Dismiss every open layer so no push() caller is left awaiting a
        // promise that can never settle.
        settleAll(slot.splice(1));
        current = slot[0];
        // A retired Route is not loading anything. Without this, a Route
        // stopped mid-navigation would report pending forever and leave an
        // app's `when(() => route.pending, Spinner())` on screen for good.
        pendingPath = null;
        cancelIdle();
        unmountPages();
        if (isBrowser) {
          unhookRoot?.();
          unhookRoot = undefined;
          unsubscribe?.();
          unsubscribe = undefined;
          document.removeEventListener("click", onClick);
        }
      },
    };

    if (isBrowser) {
      // One page, one Route: a second start() (HMR, a re-mount) retires the
      // previous one instead of stacking a second set of listeners on it.
      active?.stop();
      active = route;
      // Seeded with the current location: a popstate some browsers fire on
      // load, for the entry already shown, changes nothing.
      handled = locationKey();
      // Whatever the history mode is subscribed to: popstate for browser
      // history, popstate + hashchange for hash, the adapter's own listener
      // set for memory.
      unsubscribe = location.subscribe(onLocationChange);
      document.addEventListener("click", onClick);
      // The pages mount with the first render() or hydrate() of the app.
      unhookRoot = onRootBuild((serializing) => {
        if (!serializing) mountPages(false);
      });
      onNavigate?.(leafOf(current).ctx);
      startPreload();
    }

    return route;
  }

  const router = {
    start,
    match: (url?: string) => parse(url ?? location.read())?.ctx ?? null,
    // Idempotent like Route.stop(), so it cannot throw once nothing is active.
    stop: () => active?.stop(),
  } as Router;
  for (const key of DELEGATED) {
    Object.defineProperty(router, key, { get: () => activeRoute()[key], enumerable: true });
  }
  return router;
}

/** The Route members the router reads through to its active Route. */
const DELEGATED = [
  "path", "pattern", "params", "search", "hash", "url", "pending", "error", "data", "depth",
  "pages", "go", "push", "back", "href",
] as const satisfies ReadonlyArray<Exclude<keyof Route, "run" | "stop">>;
