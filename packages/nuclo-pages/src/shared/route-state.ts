import type { NavigateOptions, RouteState } from "../../types/index";

interface MutableRouteState {
  id: string;
  url: URL;
  params: Record<string, string>;
  pending: boolean;
}

const state: MutableRouteState = { id: "", url: new URL("http://localhost/"), params: {}, pending: false };

// On the server the source reads the current request's snapshot (installed by
// server/event.ts), so async code can never observe another request's route.
let source: () => RouteState | undefined = () => undefined;

export function setRouteSource(read: () => RouteState | undefined): void {
  source = read;
}

export function setRoute(next: Partial<MutableRouteState>): void {
  Object.assign(state, next);
}

const current = (): RouteState => source() ?? state;

export const route: RouteState = {
  get id() {
    return current().id;
  },
  get url() {
    return current().url;
  },
  get params() {
    return current().params;
  },
  get pending() {
    return current().pending;
  },
};

/**
 * Whether the current URL is `href` or below it (`/blog` matches `/blog/post`,
 * not `/blogger`). `/` and `exact` only match the path itself. Read it inside a
 * resolver, e.g. `class: () => (isActive("/blog") ? "active" : "")`.
 */
export function isActive(href: string, exact = false): boolean {
  const trim = (path: string) => path.replace(/\/+$/, "") || "/";
  const target = trim(new URL(href, route.url).pathname);
  const path = trim(route.url.pathname);
  return path === target || (!exact && target !== "/" && path.startsWith(`${target}/`));
}

type Navigator = (href: string, options?: NavigateOptions) => Promise<void>;

let navigator: Navigator | undefined;

export function setNavigator(fn: Navigator): void {
  navigator = fn;
}

export function navigate(href: string, options?: NavigateOptions): Promise<void> {
  if (!navigator) return Promise.reject(new Error("navigate() only works in the browser, after the page has hydrated"));
  return navigator(href, options);
}
