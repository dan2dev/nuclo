/// <reference types="nuclo" />
/**
 * nuclo-router: routing for nuclo. The active route's pages are one list()
 * over the layer stack, placed by the app with `router.outlet()`. See README.md.
 */
import { list, update } from "nuclo";
import {
  createMatcher,
  decode,
  joinSegments,
  normalizeBase,
  normalizePath,
  splitPath,
  stripBase,
  type RouteParams,
} from "./match";

export type { Match, RouteParams } from "./match";

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
/** Only the path, search and hash of a parsed URL are used; off-browser the origin is a placeholder. */
const ORIGIN = isBrowser ? window.location.origin : "http://nuclo.local";
/** The browser's app-relative href: pathname + search + hash. */
const here = (): string => window.location.pathname + window.location.search + window.location.hash;

/** The params a pattern yields, as a type: `Params<"/blog/:slug">` is `{ readonly slug: string }`. */
export type Params<TPattern extends string> = Flatten<ParamsOf<TPattern>>;
type ParamsOf<T extends string> = T extends `${infer Head}/${infer Tail}`
  ? SegmentParam<Head> & ParamsOf<Tail>
  : SegmentParam<T>;
type SegmentParam<S extends string> = S extends `:${infer Name}`
  ? { readonly [K in Name]: string }
  : S extends `*${infer Rest}`
    ? { readonly [K in Rest extends "" ? "*" : Rest]: string }
    : {};
type Flatten<T> = { readonly [K in keyof T]: T[K] };

/** What the matched route resolved to; a page's first argument. */
export interface RouteContext<TParams extends RouteParams = RouteParams> {
  /** Canonical decoded path, base stripped: "/blog/hello". */
  readonly path: string;
  /** The table key that matched: "/blog/:slug". */
  readonly pattern: string;
  readonly params: TParams;
  readonly search: URLSearchParams;
  /** With the leading "#", or "". */
  readonly hash: string;
  /** The href this context was resolved from. */
  readonly url: string;
}

/** A page's place in the layer stack, and its way out. */
export interface Layer {
  /** 0 for the base page; 1 and up for pages opened with push(). */
  readonly depth: number;
  /** Opens another layer on top and resolves with what it closes with. */
  push<T = unknown>(href: string): Promise<T | undefined>;
  /** Closes this layer and every one above it, resolving the push() that opened it. No-op at depth 0. */
  close(result?: unknown): void;
}

/** Where a parent page renders its child route: its own one-item list(), so a child swap leaves the parent's DOM alone. */
export type Outlet = () => ListModifier;

/** A page's second argument. */
export interface PageProps<TData = unknown> {
  readonly layer: Layer;
  /** What the route's load() returned, or undefined. */
  readonly data: TData;
  readonly outlet: Outlet;
}

/** A page. Returns anything list() accepts. */
export type PageComponent<TData = unknown, TParams extends RouteParams = RouteParams> = (
  ctx: RouteContext<TParams>,
  props: PageProps<TData>,
) => ListRenderResult;

/** Runs before the page on every navigation, server included; its result is the page's `data`. Never cached. */
export type DataLoader<TData = unknown, TParams extends RouteParams = RouteParams> = (
  ctx: RouteContext<TParams>,
) => TData | Promise<TData>;

/** A page module: the component itself, or `{ default, load? }` as import() yields. Params are `any` so a page typed with its own pattern still fits. */
export type RouteModule<TData = unknown> =
  | PageComponent<TData, any>
  | { readonly default: PageComponent<TData, any>; readonly load?: DataLoader<TData, any> };

/** Produces a page module lazily: `() => import("./Home.ts")`, `() => import("./Home.ts").then(m => m.Home)` or `() => Home`. */
export type RouteLoader<TData = unknown> = () => RouteModule<TData> | Promise<RouteModule<TData>>;

/** Pattern -> loader, or -> a nested table whose keys are relative to it ("/" is the parent's own page). */
export type RouteTable = Readonly<{ [pattern: string]: RouteLoader<any> | RouteTable }>;

export interface RouterOptions {
  /** URL prefix the app is served under, e.g. "/docs". */
  base?: string;
  /** Load the other routes' modules once the page is idle. Default true. */
  preload?: boolean;
  /** Called in the browser after every navigation, the initial one included. Never during SSR. */
  onNavigate?: (ctx: RouteContext) => void;
}

export interface NavigateOptions {
  /** Replace the current history entry instead of pushing one. */
  replace?: boolean;
}

/** The active route: one per page load in the browser, one per request on the server. */
export interface Route extends RouteContext {
  /** True while a navigation waits for a module or a loader. */
  readonly pending: boolean;
  /** Set when a module or loader failed; cleared by the next navigation. */
  readonly error: Error | null;
  /** The matched page's load() result, for a server to serialize. A parent's is not on it. */
  readonly data: unknown;
  /** Layers on the stack: 1 for an ordinary page. */
  readonly depth: number;
  /** Runs fn with this Route active: `route.run(() => renderToString(App))` on the server. Synchronous scope only. */
  run<T>(fn: () => T): T;
  /** Navigates, loading what it needs. Never rejects: failures land on `error`. */
  go(href: string, options?: NavigateOptions): Promise<void>;
  /** Opens a route as a new layer over the current page and resolves with what it closes with. Rejects on no match or a failed module. Browser only. */
  push<T = unknown>(href: string): Promise<T | undefined>;
  /** Prefixes a path with the base, resolving "./" and "../" against the active route, for `a({ href })`. */
  href(path: string): string;
  /** Detaches every listener, cancels preloading, dismisses open layers. Idempotent. */
  stop(): void;
}

/** The route table plus the active Route's members read through it: `router.path`, `router.go()`. */
export interface Router extends Omit<Route, "run"> {
  /** Resolves url (default: the browser location) to its modules and returns the Route; in the browser it becomes the active one. Rejects when nothing matches. */
  start(url?: string): Promise<Route>;
  /** Resolves a URL against the table without loading anything, or null when it is outside the base, unmatched or on another origin. */
  match(url?: string): RouteContext | null;
  /** The active route's pages as a list(). Place it once, where the pages go. */
  outlet(): ListModifier;
}

/** A loaded page module. */
interface Shape {
  readonly component: PageComponent;
  readonly load?: DataLoader;
}
/** One page of a matched route. */
interface RouteNode {
  readonly pattern: string;
  readonly loader: RouteLoader;
  /** Segment count, to slice a leaf path down to this parent. */
  readonly segments: number;
}
/** A matched route: its parents outermost first, then the page itself. */
type Chain = readonly RouteNode[];
/** One level of a navigation with the context it renders with. */
interface Planned {
  readonly node: RouteNode;
  readonly ctx: RouteContext;
}
/** A level with its module and data resolved. */
interface Level extends Planned {
  readonly component: PageComponent;
  readonly data: unknown;
}
/** A mounted level. `children` holds 0 or 1 entries and is what its outlet renders. */
interface Instance {
  readonly level: Level;
  readonly children: Instance[];
}
/** One row of the layer stack. */
interface Entry {
  readonly root: Instance;
  readonly layer: Layer;
  /** Resolves the push() that opened this layer; cleared once run. */
  settle?: (result: unknown) => void;
  /** What close() asked to resolve with, held until the layer is popped. */
  result?: unknown;
}

/** history.state key for the top layer's index, so Back, Forward and a reload agree with the stack. */
const DEPTH_KEY = "nucloRouterDepth";
/** The rows the router's outlet renders for a Route. */
const rowsOf = new WeakMap<Route, () => readonly Entry[]>();

const isPromise = (value: unknown): value is Promise<unknown> =>
  typeof (value as { then?: unknown } | null)?.then === "function";

const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)));

function depthOf(state: unknown): number {
  const depth = (state as Record<string, unknown> | null)?.[DEPTH_KEY];
  return typeof depth === "number" && depth > 0 ? depth : 0;
}

function node(pattern: string, loader: RouteLoader): RouteNode {
  return { pattern, loader, segments: splitPath(pattern).length };
}

/** Resolves nesting into absolute patterns. A section object reused under two parents shares its loaders, so one module cache entry. */
function flatten(
  table: RouteTable,
  prefix: string | null = null,
  parents: Chain = [],
  out: Record<string, Chain> = {},
): Record<string, Chain> {
  const own = prefix === null ? undefined : (table["/"] ?? table["./"]);
  const chain = typeof own === "function" ? [...parents, node(prefix || "/", own)] : parents;
  for (const [key, value] of Object.entries(table)) {
    // Top-level keys are used verbatim, so "*" stays "*" and a stray "./x" is rejected by the matcher.
    const pattern = prefix === null ? key : normalizePath(`${prefix}/${key.replace(/^\.\//, "")}`);
    // The table's own page sits beside its parents, not under itself.
    const isSelf = prefix !== null && (key === "/" || key === "./");
    if (typeof value === "function") out[pattern] = [...(isSelf ? parents : chain), node(pattern, value)];
    else flatten(value, normalizeBase(pattern), chain, out);
  }
  return out;
}

function levels(entry: Entry): Instance[] {
  const out: Instance[] = [];
  for (let at: Instance | undefined = entry.root; at; at = at.children[0]) out.push(at);
  return out;
}

const leaf = (entry: Entry): Level => levels(entry).at(-1)!.level;

function build(lv: readonly Level[]): Instance | undefined {
  let child: Instance | undefined;
  for (let i = lv.length - 1; i >= 0; i--) child = { level: lv[i], children: child ? [child] : [] };
  return child;
}

/** Renders one level with an outlet over its own children, so a child swap touches only that subtree. */
function renderLevel(instance: Instance, layer: Layer): ListRenderResult {
  const outlet: Outlet = () => list(() => instance.children, (child: Instance) => renderLevel(child, layer));
  return instance.level.component(instance.level.ctx, { layer, data: instance.level.data, outlet });
}

function pick(mod: RouteModule, pattern: string): Shape {
  if (typeof mod === "function") return { component: mod };
  if (typeof mod?.default !== "function") {
    throw new Error(
      `nuclo-router: the module for "${pattern}" has no default export — use () => import("…").then(m => m.YourPage) to pick a named one`,
    );
  }
  return { component: mod.default, load: mod.load };
}

export function createRouter(table: RouteTable, options: RouterOptions = {}): Router {
  const routes = flatten(table);
  const match = createMatcher(routes);
  const base = normalizeBase(options.base);
  const { onNavigate } = options;
  /** Modules by loader, an in-flight promise under the same key, so concurrent navigations share one import(). A failed load is evicted so it can be retried. */
  const cache = new Map<RouteLoader, Shape | Promise<Shape>>();
  /** The Route the router reads through: the last start() in the browser, the running run() on the server. */
  let active: Route | null = null;

  function activeRoute(): Route {
    if (!active) {
      throw new Error("nuclo-router: no active route — await router.start() first (on the server, render inside route.run())");
    }
    return active;
  }

  function load(at: RouteNode): Shape | Promise<Shape> {
    let hit = cache.get(at.loader);
    if (hit) return hit;
    const result = at.loader();
    hit = isPromise(result)
      ? result.then(
          (mod) => {
            const shape = pick(mod as RouteModule, at.pattern);
            cache.set(at.loader, shape);
            return shape;
          },
          (error: unknown) => {
            cache.delete(at.loader);
            throw error;
          },
        )
      : pick(result, at.pattern);
    cache.set(at.loader, hit);
    return hit;
  }

  function withData(shape: Shape, p: Planned): Level | Promise<Level> {
    const data = shape.load?.(p.ctx);
    return isPromise(data)
      ? data.then((value) => ({ ...p, component: shape.component, data: value }))
      : { ...p, component: shape.component, data };
  }

  /** Each level's module (cached) and data (never cached). `onWait` runs when something actually has to be waited for, so a loaded route never flips `pending`. */
  async function resolve(planned: readonly Planned[], onWait?: () => void): Promise<Level[]> {
    const parts = planned.map((p) => {
      const shape = load(p.node);
      return isPromise(shape) ? shape.then((loaded) => withData(loaded, p)) : withData(shape, p);
    });
    if (parts.some(isPromise)) onWait?.();
    return Promise.all(parts);
  }

  /** The levels a match renders, outermost first. Parents share the leaf's params, search and hash, with their own pattern and slice of the path. */
  function plan(chain: Chain, ctx: RouteContext): Planned[] {
    const segs = splitPath(ctx.path);
    return chain.map((at, i) =>
      i === chain.length - 1
        ? { node: at, ctx }
        : { node: at, ctx: { ...ctx, pattern: at.pattern, path: joinSegments(segs.slice(0, at.segments)) } },
    );
  }

  const withBase = (path: string): string => (path === "/" ? base || "/" : base + path);

  /** The canonical app-relative href: base + path + ?search + #hash. */
  function hrefOf(ctx: RouteContext): string {
    const search = ctx.search.toString();
    return withBase(ctx.path) + (search ? `?${search}` : "") + ctx.hash;
  }

  function parse(href: string): { chain: Chain; ctx: RouteContext } | null {
    let url: URL;
    try {
      url = new URL(href, ORIGIN + (isBrowser ? here() : "/"));
    } catch {
      return null;
    }
    // Another site is never ours. Only a browser has an origin to compare; a server matches whatever it is handed.
    if (isBrowser && url.origin !== ORIGIN) return null;
    const inner = stripBase(url.pathname, base);
    const found = inner === null ? null : match(inner);
    return (
      found && {
        chain: found.value,
        ctx: { path: found.path, pattern: found.pattern, params: found.params, search: url.searchParams, hash: url.hash, url: href },
      }
    );
  }

  async function start(url?: string): Promise<Route> {
    const href = url ?? (isBrowser ? here() : "/");
    const parsed = parse(href);
    if (!parsed) throw new Error(`nuclo-router: no route matches "${href}" — add a "*" route to handle unknown paths`);
    // The whole chain: a deep link renders its layouts too, and on a server they must be in the first HTML.
    const resolved = await resolve(plan(parsed.chain, parsed.ctx));

    /** The layer stack: index 0 is the base page, push() appends. A reload always starts at depth 1. */
    const slot: Entry[] = [];
    let current: Entry = pushEntry(resolved);
    let pendingPath: string | null = null;
    let error: Error | null = null;
    let stopped = false;
    /** Inside run(): a retired Route still renders there. */
    let running = 0;
    /** The last history event handled, as depth + href: Safari fires popstate on load, and two layers can sit on one href. */
    let handled: string | null = null;
    /** Bumped by every navigation and by stop(): a module resolving under a stale generation is dropped. */
    let generation = 0;

    function makeEntry(lv: readonly Level[], depth: number): Entry {
      return {
        root: build(lv)!,
        layer: {
          depth,
          push: <T,>(href: string) => pushLayer(href) as Promise<T | undefined>,
          close: (result?: unknown) => closeLayer(depth, result),
        },
      };
    }

    function pushEntry(lv: readonly Level[]): Entry {
      const entry = makeEntry(lv, slot.length);
      slot.push(entry);
      return entry;
    }

    /** Resolves each discarded layer's push(), topmost first, with what close() left on it. */
    function settleAll(discarded: readonly Entry[]): void {
      for (const entry of [...discarded].reverse()) {
        const settle = entry.settle;
        entry.settle = undefined;
        settle?.(entry.result);
      }
    }

    /** Pops the stack down to `length`; settled after the DOM has caught up. */
    function trimTo(length: number): void {
      const discarded = slot.splice(length);
      current = slot[slot.length - 1];
      pendingPath = null;
      update();
      settleAll(discarded);
    }

    /** "./x", "../x", "." and ".." resolve against the active route's path as a directory; anything else passes through. */
    function abs(href: string): string {
      if (!/^\.\.?(?:\/|$)/.test(href)) return href;
      const url = new URL(href, `http://x${leaf(current).ctx.path}/`);
      return withBase(normalizePath(url.pathname)) + url.search + url.hash;
    }

    /** The leading planned levels already mounted and unchanged: parents by pattern and path; the page itself also by query, and only without a load() (one with a loader refreshes on every visit). */
    function reusable(planned: readonly Planned[]): Level[] {
      if (current.layer.depth !== 0 || slot.length !== 1) return [];
      const kept: Level[] = [];
      for (const [i, have] of levels(current).map((at) => at.level).entries()) {
        const want = planned[i];
        if (!want || have.node.pattern !== want.node.pattern || have.ctx.path !== want.ctx.path) break;
        if (i === planned.length - 1) {
          const shape = cache.get(want.node.loader);
          if (!shape || isPromise(shape) || shape.load || shape.component !== have.component) break;
          if (have.ctx.search.toString() !== want.ctx.search.toString()) break;
        }
        kept.push(have);
      }
      return kept;
    }

    /** Lands a navigation: `kept` leading levels stay mounted, `fresh` replace what was under them. An ordinary navigation is not a layer: open layers are dismissed. */
    function commit(kept: readonly Level[], fresh: readonly Level[], scroll: boolean): void {
      const ctx = (fresh.at(-1) ?? kept.at(-1))!.ctx;
      if (kept.length === 0) {
        const entry = makeEntry(fresh, 0);
        settleAll(slot.splice(0, slot.length, entry));
        current = entry;
      } else {
        const mounted = levels(current);
        // Graft onto the deepest kept level; nothing changed at all leaves the DOM alone.
        if (fresh.length > 0 || mounted.length > kept.length) {
          const branch = build(fresh);
          mounted[kept.length - 1].children.splice(0, Infinity, ...(branch ? [branch] : []));
        }
      }
      pendingPath = null;
      error = null;
      update();
      if (scroll && ctx.hash.length > 1) document.getElementById(decode(ctx.hash.slice(1)))?.scrollIntoView();
      // After the DOM caught up, so the hook can read the new page (focus its heading, say).
      onNavigate?.(ctx);
    }

    async function navigate(raw: string, mode: "push" | "replace" | "pop"): Promise<void> {
      if (!isBrowser || stopped) return;
      const href = abs(raw);
      const parsed = parse(href);
      if (!parsed) {
        // Not ours: go() to it is a request to leave the app; a popstate onto it is an entry the router cannot render.
        if (mode !== "pop") return window.location.assign(href);
        generation++;
        pendingPath = null;
        error = new Error(`nuclo-router: no route matches "${href}"`);
        update();
        return;
      }
      const mine = ++generation;
      const planned = plan(parsed.chain, parsed.ctx);
      const kept = reusable(planned);
      const wait = (): void => {
        pendingPath = parsed.ctx.path;
        error = null;
        update();
      };
      let fresh: Level[];
      try {
        fresh = await resolve(planned.slice(kept.length), wait);
      } catch (cause) {
        if (generation !== mine) return;
        pendingPath = null;
        error = toError(cause);
        // Logged so the failure is never silent, even if nothing renders `error`.
        console.error(`nuclo-router: failed to load "${parsed.ctx.path}"`, cause);
        update();
        return;
      }
      if (generation !== mine) return;
      // History is written when the page lands, so the address bar never names a page that is not on screen.
      if (mode === "push") window.history.pushState(null, "", href);
      else if (mode === "replace") window.history.replaceState(null, "", href);
      if (mode !== "pop") handled = null;
      commit(kept, fresh, mode !== "pop");
    }

    async function pushLayer(raw: string): Promise<unknown> {
      if (!isBrowser || stopped) return undefined;
      const href = abs(raw);
      const parsed = parse(href);
      if (!parsed) throw new Error(`nuclo-router: push("${raw}") — no route matches it`);
      const mine = ++generation;
      // A layer renders the matched page alone: its layouts are already in the row beneath.
      const wait = (): void => {
        pendingPath = parsed.ctx.path;
        error = null;
        update();
      };
      let resolved: Level[];
      try {
        resolved = await resolve(plan(parsed.chain, parsed.ctx).slice(-1), wait);
      } catch (cause) {
        if (generation === mine) {
          pendingPath = null;
          update();
        }
        // Rejected rather than surfaced: nothing opened, and the caller is awaiting.
        throw toError(cause);
      }
      // Overtaken by a navigation, or retired: open nothing.
      if (stopped || generation !== mine) return undefined;
      pendingPath = null;
      // History once the module is in hand, so a failed push leaves the URL alone. Back now closes this layer.
      window.history.pushState({ [DEPTH_KEY]: slot.length }, "", href);
      handled = null;
      const entry = pushEntry(resolved);
      current = entry;
      error = null;
      update();
      onNavigate?.(parsed.ctx);
      return new Promise((settle) => {
        entry.settle = settle;
      });
    }

    /** close() records the result and walks history back, so Back and close() are one code path. */
    function closeLayer(depth: number, result: unknown): void {
      if (!isBrowser || stopped || depth < 1 || depth >= slot.length) return;
      slot[depth].result = result;
      window.history.go(depth - slot.length);
    }

    const locationKey = (): string => `${depthOf(window.history.state)} ${here()}`;

    function onLocationChange(): void {
      const key = locationKey();
      if (key === handled) return;
      handled = key;
      // Back out of open layers: the depth in history.state is the authority, however many entries were jumped.
      const target = depthOf(window.history.state) + 1;
      if (target < slot.length) {
        trimTo(target);
        onNavigate?.(leaf(current).ctx);
        return;
      }
      // Anything else replaces the stack, Forward into a layer the router no longer holds included.
      void navigate(here(), "pop");
    }

    function onClick(event: MouseEvent): void {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      // The attribute, not anchor.href: an SVG <a> has no string href.
      const attr = anchor?.getAttribute("href");
      if (!anchor || !attr || attr[0] === "#" || anchor.hasAttribute("download") || anchor.getAttribute("data-nuclo-router") === "off") return;
      const target = anchor.getAttribute("target");
      if ((target && target !== "_self") || anchor.relList?.contains("external")) return;
      let url: URL;
      try {
        url = new URL(abs(attr), ORIGIN + here());
      } catch {
        return;
      }
      if (url.origin !== ORIGIN) return;
      const href = url.pathname + url.search + url.hash;
      // Not ours (outside base, or unmatched): a real navigation, which keeps a server-rendered 404 reachable.
      const to = parse(href);
      if (!to) return;
      const from = parse(here());
      if (from && from.ctx.path === to.ctx.path && from.ctx.search.toString() === to.ctx.search.toString()) {
        // A fragment to scroll to is the browser's job. The same URL would only reload: swallow it, unless it drops a fragment.
        if (url.hash) return;
        event.preventDefault();
        if (from.ctx.hash) void navigate(href, "push");
        return;
      }
      event.preventDefault();
      void navigate(href, "push");
    }

    const idle = (): Promise<void> =>
      new Promise((done) =>
        typeof requestIdleCallback === "function" ? requestIdleCallback(() => done()) : setTimeout(done, 200),
      );

    /** Warms every route's module, one per idle slice, yielding to a navigation the user is waiting for. Modules only: a data loader has no context here. */
    async function preload(): Promise<void> {
      const seen = new Set<RouteLoader>();
      for (const at of Object.values(routes).flat()) {
        if (seen.has(at.loader) || cache.has(at.loader)) continue;
        seen.add(at.loader);
        // ponytail: one idle wait may outlive stop(); it exits on `stopped` without loading anything.
        do await idle();
        while (!stopped && pendingPath !== null);
        if (stopped) return;
        try {
          await load(at);
        } catch {
          // A preload failure is not the user's problem.
        }
      }
    }

    const route: Route = {
      get path() {
        return leaf(current).ctx.path;
      },
      get pattern() {
        return leaf(current).ctx.pattern;
      },
      get params() {
        return leaf(current).ctx.params;
      },
      get search() {
        return leaf(current).ctx.search;
      },
      /** Live, like `url`: an in-page anchor changes the fragment without a navigation. */
      get hash() {
        if (!isBrowser || stopped) return leaf(current).ctx.hash;
        const at = here().indexOf("#");
        return at === -1 ? "" : here().slice(at);
      },
      /** The live app-relative href, base included. */
      get url() {
        return isBrowser && !stopped ? here() : hrefOf(leaf(current).ctx);
      },
      get pending() {
        return pendingPath !== null;
      },
      get error() {
        return error;
      },
      get data() {
        return leaf(current).data;
      },
      get depth() {
        return slot.length;
      },
      run: (fn) => {
        const previous = active;
        active = route;
        running++;
        try {
          return fn();
        } finally {
          running--;
          active = previous;
        }
      },
      go: (href, navOptions) => navigate(href, navOptions?.replace ? "replace" : "push"),
      push: <T,>(href: string) => pushLayer(href) as Promise<T | undefined>,
      // Resolved at render time, so the markup that ships is absolute and correct without JavaScript.
      href: (path) => {
        const resolved = abs(path);
        return resolved !== path ? resolved : withBase(normalizePath(path));
      },
      stop: () => {
        if (stopped) return;
        stopped = true;
        // Nothing can commit after stop(), and no push() is left awaiting.
        generation++;
        settleAll(slot.splice(1));
        current = slot[0];
        pendingPath = null;
        if (isBrowser) {
          window.removeEventListener("popstate", onLocationChange);
          document.removeEventListener("click", onClick);
          // The rows are [] now: the outlet empties.
          update();
        }
      },
    };

    rowsOf.set(route, () => (stopped && !running ? [] : slot));

    if (isBrowser) {
      // One page, one Route: a second start() (HMR, a re-mount) retires the previous one.
      active?.stop();
      active = route;
      // Seeded with the current location: a popstate some browsers fire on load changes nothing.
      handled = locationKey();
      window.addEventListener("popstate", onLocationChange);
      document.addEventListener("click", onClick);
      onNavigate?.(leaf(current).ctx);
      // An app rendered before start() resolved has an empty outlet until now.
      update();
      if (options.preload !== false) void preload();
    }
    return route;
  }

  const router = {
    start,
    match: (url?: string) => parse(url ?? (isBrowser ? here() : "/"))?.ctx ?? null,
    stop: () => active?.stop(),
    outlet: () =>
      list(
        () => (active && rowsOf.get(active)?.()) || [],
        (entry: Entry) => renderLevel(entry.root, entry.layer),
      ),
  } as Router;
  for (const key of DELEGATED) {
    Object.defineProperty(router, key, { get: () => activeRoute()[key], enumerable: true });
  }
  return router;
}

/** The Route members the router reads through to its active Route. */
const DELEGATED = [
  "path", "pattern", "params", "search", "hash", "url", "pending", "error", "data", "depth", "go", "push", "href",
] as const satisfies ReadonlyArray<Exclude<keyof Route, "run" | "stop">>;
