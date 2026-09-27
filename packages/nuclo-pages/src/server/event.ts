import { AsyncLocalStorage } from "node:async_hooks";
import type { CookieOptions, RequestEvent, RouteState } from "../../types/index";
import { setRouteSource } from "../shared/route-state";

export interface EventState {
  event: RequestEvent;
  /** Response headers set through `setHeaders()`. */
  headers: Headers;
  /** Serialized Set-Cookie values. */
  cookies: string[];
  /** Route snapshot `route` reads while this request renders. */
  route?: RouteState;
}

const storage = new AsyncLocalStorage<EventState>();

setRouteSource(() => storage.getStore()?.route);

export function runWithEvent<T>(state: EventState, fn: () => T): T {
  return storage.run(state, fn);
}

export function getRequestEvent(): RequestEvent {
  const state = storage.getStore();
  if (!state) throw new Error("getRequestEvent() was called outside of a request");
  return state.event;
}

export function createEventState(request: Request, platform: object): EventState {
  const url = new URL(request.url);
  const headers = new Headers();
  const cookies: string[] = [];
  const secure = url.protocol === "https:";
  let jar: Map<string, string> | undefined;
  const read = () => (jar ??= parseCookies(request.headers.get("cookie")));
  const event: RequestEvent = {
    request,
    url,
    params: {},
    locals: {},
    platform,
    cookies: {
      get: (name) => read().get(name),
      set(name, value, options) {
        read().set(name, value);
        cookies.push(serializeCookie(name, value, { secure, ...options }));
      },
      delete(name, options) {
        read().delete(name);
        cookies.push(serializeCookie(name, "", { secure, ...options, maxAge: 0 }));
      },
    },
    setHeaders(values) {
      for (const [name, value] of Object.entries(values)) headers.set(name, value);
    },
  };
  return { event, headers, cookies };
}

function parseCookies(header: string | null): Map<string, string> {
  const jar = new Map<string, string>();
  for (const pair of header?.split(";") ?? []) {
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    const name = pair.slice(0, eq).trim();
    if (!name || jar.has(name)) continue;
    const raw = pair.slice(eq + 1).trim().replace(/^"(.*)"$/, "$1");
    try {
      jar.set(name, decodeURIComponent(raw));
    } catch {
      jar.set(name, raw);
    }
  }
  return jar;
}

function serializeCookie(name: string, value: string, options: CookieOptions): string {
  let cookie = `${name}=${encodeURIComponent(value)}; Path=${options.path ?? "/"}`;
  if (options.domain) cookie += `; Domain=${options.domain}`;
  if (options.maxAge !== undefined) cookie += `; Max-Age=${Math.floor(options.maxAge)}`;
  if (options.expires) cookie += `; Expires=${options.expires.toUTCString()}`;
  if (options.httpOnly ?? true) cookie += "; HttpOnly";
  if (options.secure) cookie += "; Secure";
  const sameSite = options.sameSite ?? "lax";
  return `${cookie}; SameSite=${sameSite[0].toUpperCase()}${sameSite.slice(1)}`;
}
