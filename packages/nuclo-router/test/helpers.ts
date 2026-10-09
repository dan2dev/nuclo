import { afterEach, beforeEach, vi } from "vitest";
import "nuclo";
import type { Route } from "../src/index";

/**
 * jsdom leaves scrolling unimplemented and tries to really navigate on a
 * link click. Stub the first and cancel the second *after* the router's own
 * document listener has run, so handlers see an untouched event.
 */
function installDomStubs(): () => void {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  Element.prototype.scrollIntoView = vi.fn();
  const suppress = (event: Event): void => event.preventDefault();
  window.addEventListener("click", suppress);
  window.history.replaceState(null, "", "/");
  return () => {
    window.removeEventListener("click", suppress);
    window.history.replaceState(null, "", "/");
  };
}

/**
 * The per-test scaffold shared by the jsdom suites: DOM stubs, an empty body,
 * and every Route pushed onto the returned array is stopped afterwards. Call it
 * once at file top level; the array is cleared in place between tests.
 */
export function useRouterEnv(): Route[] {
  const routes: Route[] = [];
  let teardown: () => void;
  beforeEach(() => {
    teardown = installDomStubs();
    document.body.innerHTML = "";
    routes.length = 0;
  });
  afterEach(() => {
    for (const route of routes) route.stop();
    teardown();
    vi.restoreAllMocks();
  });
  return routes;
}

/** Dispatches a click and reports whether anything called preventDefault(). */
export function click(target: Element, init: MouseEventInit = {}): boolean {
  let prevented = false;
  // Registered after the router's handler, so it observes the final verdict.
  const probe = (event: Event): void => {
    prevented = event.defaultPrevented;
  };
  document.addEventListener("click", probe);
  try {
    target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...init }));
  } finally {
    document.removeEventListener("click", probe);
  }
  return prevented;
}

export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Lets every already-queued microtask run. */
export function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * The app the jsdom suites render: one "stack" region, so every layer's
 * `into("main", …)` lands in it bottom first and the rows beneath a pushed
 * layer are never rebuilt.
 */
export const App = () => div(region({ id: "main", type: "stack" }));

export function mount(): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  return container;
}

/**
 * jsdom defines `location.assign` as a non-configurable own property, so it
 * cannot be spied on. Swap in a snapshot of the current location whose
 * assign() just records the URL. Static — do not navigate while it is up.
 */
export function stubAssign(): { calls: string[]; restore: () => void } {
  const real = window.location;
  const calls: string[] = [];
  const fake: Record<string, unknown> = {
    assign: (url: string) => void calls.push(url),
    replace: (url: string) => void calls.push(url),
    reload: () => {},
    toString: () => real.href,
  };
  for (const key of ["href", "origin", "protocol", "host", "hostname", "port", "pathname", "search", "hash"]) {
    fake[key] = (real as unknown as Record<string, string>)[key];
  }
  const define = (value: unknown): void => {
    Object.defineProperty(window, "location", { value, configurable: true, writable: true });
  };
  define(fake);
  return { calls, restore: () => define(real) };
}

/**
 * Waits for a condition, polling a macrotask at a time.
 *
 * History traversal (back/forward/go) is asynchronous — the browser and jsdom
 * both queue popstate — so a fixed one-tick wait is a flake waiting to happen
 * under load. Tests that move through history should wait for the effect.
 */
export async function waitFor(predicate: () => boolean, timeoutMs = 1000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error("waitFor: timed out");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

/**
 * history.length, counted from the top of the history: an earlier test's Back
 * can leave forward entries that the next push truncates, which would skew a
 * before/after comparison. Pushing the current URL drops them first.
 */
export function historyLength(): number {
  window.history.pushState(null, "", window.location.href);
  return window.history.length;
}
