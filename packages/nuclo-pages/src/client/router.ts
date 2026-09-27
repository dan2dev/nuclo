import * as devalue from "devalue";
import { hydrate, render, update } from "nuclo";
import type { NavigateOptions } from "../../types/index";
import { bindActions, compose, errorLevel, firstFailure, layoutLevel, pageLevel, pick, runLoad, type Level, type Outlet } from "../shared/compose";
import { errorInfo, isHttpError, isRedirect } from "../shared/errors";
import { applyHead, mergeHead } from "../shared/head";
import { setNavigator, setRoute } from "../shared/route-state";
import { matchRoute, type Match } from "../shared/routes";
import type { Action, Loader, Payload, RootDef, RouteDef, RouteModule } from "../shared/types";
import { setBase } from "./rpc";

/** What the generated client entry passes in. */
export interface StartOptions {
  modules: (Loader | null)[];
  routes: RouteDef[];
  root: RootDef;
  base?: string;
  dev?: boolean;
}

interface NavOptions extends NavigateOptions {
  /** Navigation triggered by back/forward. */
  pop?: boolean;
  /** Same page, fresh data (after an action): no history entry, no scrolling. */
  refresh?: boolean;
  redirects?: number;
}

interface Resolved {
  match: Match;
  levels: Level[];
  /** First level that changed; the levels above it (and their DOM) are kept. */
  from: number;
  redirect?: string;
}

const PREFETCH_TTL = 10_000;

let ctx: StartOptions;
let current: { url: URL; levels: Level[]; outlets: Outlet[] };
let navId = 0;
let refreshId = 0;
/** History index of the current entry, for scroll restoration. */
let index = 0;
const scrolls = new Map<number, [number, number]>();
const loaded = new Map<number, Promise<RouteModule>>();
const prefetched = new Map<string, { at: number; data: Promise<unknown> }>();

function importModule(module: number): Promise<RouteModule> {
  const loader = module < 0 ? null : ctx.modules[module];
  if (!loader) return Promise.resolve({});
  let promise = loaded.get(module);
  if (!promise) {
    promise = loader();
    loaded.set(module, promise);
    promise.catch(() => loaded.delete(module)); // retry a failed chunk next time
  }
  return promise;
}

const chainOf = (route: RouteDef) => [...route.layouts.map(([module]) => module), route.page];

/** Hydrates the server-rendered page, then takes over navigation. */
export async function start(options: StartOptions): Promise<void> {
  ctx = options;
  setBase(options.base ?? "/");
  const app = document.getElementById("app");
  const script = document.getElementById("nuclo-data");
  if (!app || !script) return;

  const payload = devalue.parse(script.textContent ?? "") as Payload;
  const url = new URL(location.href);
  const route = payload.r >= 0 ? ctx.routes[payload.r] : null;
  const layouts = route ? route.layouts : [[ctx.root.layout, []] as [number, string[]]];
  const keep = payload.e ? payload.e.b[1] : layouts.length;
  const last = payload.e ? payload.e.b[0] : route!.page;
  const mods = await Promise.all([...layouts.slice(0, keep).map(([module]) => module), last].map(importModule));
  const levels = layouts.slice(0, keep).map(([module, names], i) => layoutLevel(module, mods[i], names, payload.p, payload.d[i]));
  levels.push(
    payload.e
      ? errorLevel(mods[keep], payload.e.s, payload.e.m)
      : pageLevel(last, mods[keep], payload.p, url, payload.d[keep], bindActions(mods[keep], runAction)),
  );

  setRoute({ id: route?.id ?? "", url, params: payload.p, pending: false });
  const outlets: Outlet[] = [];
  hydrate(compose(levels, outlets).create(), app);
  current = { url, levels, outlets };

  index = (history.state as { nuclo?: number } | null)?.nuclo ?? 0;
  history.replaceState({ nuclo: index }, "");
  history.scrollRestoration = "manual";
  setNavigator(navigate);
  document.addEventListener("click", onClick);
  document.addEventListener("pointerover", onIntent);
  document.addEventListener("focusin", onIntent);
  window.addEventListener("popstate", onPopState);
  window.addEventListener("unhandledrejection", (event) => {
    // A redirect thrown by a server function called from an event handler.
    if (isRedirect(event.reason)) {
      event.preventDefault();
      void navigate(event.reason.location);
    }
  });
  preloadVisibleLinks();
}

async function navigate(href: string, options: NavOptions = {}): Promise<void> {
  const url = new URL(href, location.href);
  const match = url.origin === location.origin ? matchRoute(ctx.routes, url.pathname) : null;
  // Unknown URLs and API routes belong to the server.
  if (!match || match.route.api) return hardNavigate(url, options);

  const id = ++navId;
  if (!options.pop) scrolls.set(index, [window.scrollX, window.scrollY]);
  setRoute({ pending: true });
  update();
  let next: Resolved;
  try {
    next = await resolve(url, match);
  } catch (e) {
    // Most likely a route chunk failed to load (e.g. after a deploy): let the server render it.
    console.error(e);
    if (id === navId) hardNavigate(url, options);
    return;
  }
  if (id !== navId) return;
  if (next.redirect !== undefined) {
    const redirects = (options.redirects ?? 0) + 1;
    if (redirects > 10) {
      setRoute({ pending: false });
      update();
      throw new Error(`Too many redirects navigating to ${url.href}`);
    }
    // The redirecting URL never got an entry: keep the original push/replace (a popped entry is replaced).
    return navigate(next.redirect, { replace: options.replace || options.pop, redirects });
  }
  commit(next, url, options);
}

function hardNavigate(url: URL, options: NavOptions): void {
  if (options.pop) location.reload();
  else if (options.replace) location.replace(url.href);
  else location.assign(url.href);
}

/**
 * Loads what changed between the current page and `url`, reusing unchanged
 * layouts. A refresh reloads every level and keeps those whose data is the same.
 */
async function resolve(url: URL, match: Match, refresh = false): Promise<Resolved> {
  const { route, params } = match;
  const mods = await Promise.all(chainOf(route).map(importModule));
  const page = route.layouts.length;
  const levels = chainOf(route).map((module, i) =>
    i < page
      ? layoutLevel(module, mods[i], route.layouts[i][1], params, undefined)
      : pageLevel(module, mods[i], params, url, undefined, bindActions(mods[i], runAction)),
  );
  let from = 0;
  while (from < levels.length && levels[from].key === current.levels[from]?.key) from++;
  const reload = refresh ? 0 : from;

  const prefetch = refresh ? undefined : takePrefetched(url);
  const results = await Promise.allSettled(
    levels.map((_, i) => {
      if (i < reload) return undefined;
      if (i === page && prefetch) return prefetch;
      return runLoad(mods[i], i < page ? { params: pick(params, route.layouts[i][1]) } : { params, url });
    }),
  );
  const failure = firstFailure(results);
  if (failure && isRedirect(failure.reason)) return { match, levels, from, redirect: failure.reason.location };

  for (let i = 0; i < levels.length; i++) {
    const result = results[i];
    if (i < reload) levels[i] = current.levels[i];
    else levels[i].props.data = result.status === "fulfilled" ? result.value : undefined;
  }
  if (refresh) {
    // Levels whose data didn't change keep their DOM and state.
    from = 0;
    while (from < levels.length && levels[from].key === current.levels[from]?.key && sameData(levels[from], current.levels[from])) {
      levels[from] = current.levels[from];
      from++;
    }
  }
  if (!failure) return { match, levels, from };

  const [module, keep] = route.errors[failure.index];
  if (!isHttpError(failure.reason)) console.error(failure.reason);
  const { status, message } = errorInfo(failure.reason, ctx.dev ?? false);
  const error = errorLevel(await importModule(module), status, message);
  return { match, levels: [...levels.slice(0, keep), error], from: Math.min(from, keep) };
}

function commit({ match, levels, from }: Resolved, url: URL, options: NavOptions): void {
  if (!options.pop && !options.refresh) {
    if (!options.replace) index++;
    history[options.replace ? "replaceState" : "pushState"]({ nuclo: index }, "", url.href);
  }
  setRoute({ id: match.route.id, url, params: match.params, pending: false });

  if (from === 0) {
    const app = document.getElementById("app")!;
    app.replaceChildren();
    current.outlets = [];
    render(compose(levels, current.outlets).create(), app);
  } else if (from < levels.length) {
    // Swap the outlet of the deepest kept layout; update() renders the new subtree.
    current.outlets[from - 1].items = [compose(levels, current.outlets, from)];
  }
  current.outlets.length = levels.length - 1;
  current.levels = levels;
  current.url = url;
  applyHead(mergeHead(levels.map((level) => level.head?.({ ...level.props, url } as never))));
  update();

  if (options.refresh) {
    // Same page: leave the scroll position alone.
  } else if (options.pop) {
    const [x, y] = scrolls.get(index) ?? [0, 0];
    window.scrollTo(x, y);
  } else {
    const target = url.hash ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }
  preloadVisibleLinks();
}

/** Runs an action on the server, then reloads the page's data and re-renders what changed. */
async function runAction(action: Action, args: unknown[]): Promise<unknown> {
  let result: unknown;
  try {
    result = await action(...args);
  } catch (e) {
    // An action that redirects navigates there; the call then resolves with nothing.
    if (!isRedirect(e)) throw e;
    await navigate(e.location);
    return undefined;
  }
  await revalidate();
  return result;
}

/** Re-runs the current page's loads and re-renders from the first level whose data changed. */
async function revalidate(): Promise<void> {
  const nav = navId;
  const id = ++refreshId;
  const url = current.url;
  const match = matchRoute(ctx.routes, url.pathname);
  if (!match || match.route.api) return;
  const next = await resolve(url, match, true);
  // A navigation, or a newer refresh, started meanwhile: it wins.
  if (nav !== navId || id !== refreshId) return;
  if (next.redirect !== undefined) return navigate(next.redirect, { replace: true });
  commit(next, url, { refresh: true });
}

function sameData(a: Level, b: Level): boolean {
  try {
    return devalue.stringify(a.props.data) === devalue.stringify(b.props.data);
  } catch {
    return false;
  }
}

function onPopState(event: PopStateEvent): void {
  scrolls.set(index, [window.scrollX, window.scrollY]);
  index = (event.state as { nuclo?: number } | null)?.nuclo ?? index;
  const url = new URL(location.href);
  if (url.pathname === current.url.pathname && url.search === current.url.search) {
    // A same-page #hash entry: nothing to load.
    current.url = url;
    setRoute({ url });
    update();
    return;
  }
  void navigate(url.href, { pop: true });
}

/** The same-origin URL of a link the router handles, or null. */
function linkOf(target: EventTarget | null): URL | null {
  const link = target instanceof Element ? target.closest("a[href]") : null;
  if (!link) return null;
  const rel = ` ${link.getAttribute("rel") ?? ""} `;
  if ((link.getAttribute("target") || "_self") !== "_self" || link.hasAttribute("download") || link.hasAttribute("data-reload") || /\sexternal\s/.test(rel)) {
    return null;
  }
  const url = new URL(link.getAttribute("href")!, document.baseURI);
  return url.origin === location.origin ? url : null;
}

function onClick(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const url = linkOf(event.target);
  if (!url) return;
  // Same-page anchors keep the browser's native behaviour.
  if (url.hash && url.pathname === location.pathname && url.search === location.search) return;
  event.preventDefault();
  void navigate(url.href);
}

function routeOf(url: URL | null): Match | null {
  const match = url && matchRoute(ctx.routes, url.pathname);
  return match && !match.route.api ? match : null;
}

/** Hover/focus: preload the route's modules and its page data for an imminent click. */
function onIntent(event: Event): void {
  const url = linkOf(event.target);
  if (!url || (url.pathname === location.pathname && url.search === location.search)) return;
  const match = routeOf(url);
  if (!match) return;
  chainOf(match.route).forEach((module) => void importModule(module));
  const now = Date.now();
  for (const [key, entry] of prefetched) if (now - entry.at > PREFETCH_TTL) prefetched.delete(key);
  if (prefetched.has(url.href)) return;
  const data = importModule(match.route.page).then((mod) => runLoad(mod, { params: match.params, url }));
  data.catch(() => {});
  prefetched.set(url.href, { at: now, data });
}

function takePrefetched(url: URL): Promise<unknown> | undefined {
  const entry = prefetched.get(url.href);
  prefetched.delete(url.href);
  return entry && Date.now() - entry.at <= PREFETCH_TTL ? entry.data : undefined;
}

let observer: IntersectionObserver | undefined;
const observed = new WeakSet<Element>();

/** Once idle, preload the modules of links as they scroll into view. */
function preloadVisibleLinks(): void {
  if (typeof IntersectionObserver === "undefined") return;
  const idle = window.requestIdleCallback ?? ((callback: () => void) => setTimeout(callback, 200));
  idle(() => {
    observer ??= new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer!.unobserve(entry.target);
        const match = routeOf(linkOf(entry.target));
        if (match) chainOf(match.route).forEach((module) => void importModule(module));
      }
    });
    for (const link of document.querySelectorAll("a[href]")) {
      if (observed.has(link)) continue;
      observed.add(link);
      observer.observe(link);
    }
  });
}
