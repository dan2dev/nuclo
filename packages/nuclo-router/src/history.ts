/**
 * Where the route comes from, and where it goes back to.
 *
 * The router's internal model is one string either way: an app-relative href
 * like `/blog/hello?draft=1#notes`, base included. The three adapters below
 * differ only in where that string is kept —
 *
 *   browser  the pathname, via the History API            (the default)
 *   hash     everything after "#", so no server rewrites are needed
 *   memory   an array in this process, with no DOM at all
 *
 * — so every other part of the router is written against one interface and
 * does not know which it has.
 */

/** Opaque per-entry state. The router stores its layer depth here. */
export type HistoryState = unknown;

export interface LocationAdapter {
  /** The current app-relative href: "/path?search#hash". Never empty. */
  read(): string;
  /** The state stored with the current entry. */
  state(): HistoryState;
  /** Adds a new entry. */
  push(href: string, state: HistoryState): void;
  /** Overwrites the current entry. */
  replace(href: string, state: HistoryState): void;
  /** Moves by `delta` entries; negative goes back. Fires the subscriber. */
  go(delta: number): void;
  /** Watches for entries the app did not navigate to itself (Back, Forward). */
  subscribe(onChange: () => void): () => void;
  /**
   * Hands an href the router does not own back to the host — a full page
   * navigation in a browser, a no-op where there is nowhere to hand it to.
   */
  leave(href: string): void;
  /** Only "browser" keeps the route in the pathname, where a crawler sees it. */
  readonly kind: HistoryKind;
}

export type HistoryKind = "browser" | "hash" | "memory";

/** The default: the route lives in the pathname and the server must serve it. */
export function browserHistory(): LocationAdapter {
  return {
    kind: "browser",
    read: () => {
      const { pathname, search, hash } = window.location;
      return pathname + search + hash;
    },
    state: () => window.history.state,
    push: (href, state) => window.history.pushState(state, "", href),
    replace: (href, state) => window.history.replaceState(state, "", href),
    go: (delta) => window.history.go(delta),
    subscribe: (onChange) => {
      window.addEventListener("popstate", onChange);
      return () => window.removeEventListener("popstate", onChange);
    },
    leave: (href) => window.location.assign(href),
  };
}

/**
 * The route lives after the "#", so every URL is the same document and no
 * server rewrite is needed — the trade is that the route is invisible to the
 * server, so there is nothing to server-render and crawlers see one page.
 *
 * Writes go through pushState rather than `location.hash = …` so the layer
 * depth can travel in the entry's state. An in-page fragment still works:
 * "#/docs/intro#install" parses as path "/docs/intro" with hash "#install",
 * because only the first "#" is the separator.
 */
export function hashHistory(): LocationAdapter {
  const read = (): string => {
    const raw = window.location.hash;
    // "" (no hash yet) and "#" both mean the root.
    const href = raw.length > 1 ? raw.slice(1) : "/";
    return href.charCodeAt(0) === 47 /* / */ ? href : "/" + href;
  };
  const write = (href: string, state: HistoryState, replace: boolean): void => {
    // Keep the pathname and query of the page itself; only the hash is ours.
    const { pathname, search } = window.location;
    const next = `${pathname}${search}#${href}`;
    if (replace) window.history.replaceState(state, "", next);
    else window.history.pushState(state, "", next);
  };
  return {
    kind: "hash",
    read,
    state: () => window.history.state,
    push: (href, state) => write(href, state, false),
    replace: (href, state) => write(href, state, true),
    go: (delta) => window.history.go(delta),
    subscribe: (onChange) => {
      // popstate covers Back/Forward; hashchange covers someone editing the
      // address bar or following a bare "#..." anchor. Either may fire for one
      // change, so the router compares the resolved location before acting.
      window.addEventListener("popstate", onChange);
      window.addEventListener("hashchange", onChange);
      return () => {
        window.removeEventListener("popstate", onChange);
        window.removeEventListener("hashchange", onChange);
      };
    },
    leave: (href) => window.location.assign(href),
  };
}

/**
 * No browser location at all: the entries live in this adapter. For tests, for
 * a host without a URL bar, and for an app embedded in a page whose address
 * must not change.
 *
 * `start(url)` seeds the first entry.
 */
export function memoryHistory(initial = "/"): LocationAdapter {
  const entries: Array<{ href: string; state: HistoryState }> = [{ href: initial, state: null }];
  let index = 0;
  const listeners = new Set<() => void>();
  const notify = (): void => {
    // Copied: a listener may unsubscribe while being called.
    for (const listener of [...listeners]) listener();
  };
  return {
    kind: "memory",
    read: () => entries[index].href,
    state: () => entries[index].state,
    push: (href, state) => {
      // Pushing discards anything ahead, exactly as a browser does.
      entries.length = index + 1;
      entries.push({ href, state });
      index++;
    },
    replace: (href, state) => {
      entries[index] = { href, state };
    },
    go: (delta) => {
      const target = index + delta;
      if (target < 0 || target >= entries.length) return;
      index = target;
      notify();
    },
    subscribe: (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    // Nowhere to hand it to: there is no document to navigate.
    leave: () => {},
  };
}
