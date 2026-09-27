/// <reference types="nuclo/types" />
/**
 * Type declarations for `nuclo-pages`, the isomorphic app API.
 *
 * Hand-written and shipped from `types/` (the nuclo-core convention). Keep in
 * sync with src/index.ts.
 */

// ---------------------------------------------------------------------------
// Route registry. The generated `src/routes.gen.d.ts` augments it:
//   declare module "nuclo-pages" {
//     interface Register { routes: { "/blog/[slug]": { slug: string } } }
//   }
// ---------------------------------------------------------------------------

export interface Register {}

type RouteMap = Register extends { routes: infer R } ? R : Record<string, Record<string, string>>;

/** A route id: the URL pattern of a page or API file, e.g. `"/blog/[slug]"`. */
export type RouteId = Extract<keyof RouteMap, string>;

/** The params of a route, e.g. `{ slug: string }` for `"/blog/[slug]"`. */
export type RouteParams<R extends RouteId = RouteId> = RouteMap[R];

// ---------------------------------------------------------------------------
// Pages and layouts
// ---------------------------------------------------------------------------

/**
 * What a page's `load()` receives. It runs on the server for the first request
 * and in the browser on client navigation, where `$server()` calls become RPC.
 */
export interface LoadEvent<R extends RouteId = RouteId> {
  params: RouteParams<R>;
  url: URL;
}

/** What a layout's `load()` receives: only the params its own folder consumes. */
export interface LayoutLoadEvent {
  params: Record<string, string>;
}

type AnyLoad = (event: never) => unknown;
type DataOf<T> = T extends AnyLoad ? Awaited<ReturnType<T>> : undefined;
// Infer the whole event: matching `(event: { params: infer P })` would fail, since
// the real event (e.g. LoadEvent, with `url`) isn't assignable from `{ params }` alone.
type ParamsOf<T> = T extends RouteId
  ? RouteParams<T>
  : T extends (event: infer E) => unknown
    ? E extends { params: infer P }
      ? P
      : Record<string, string>
    : Record<string, string>;

/** Props of a page view: `PageProps<typeof load>`, or `PageProps<"/route/id">` without a load. */
export interface PageProps<T extends RouteId | AnyLoad = RouteId> {
  data: DataOf<T>;
  params: ParamsOf<T>;
  url: URL;
}

/** Props of a layout view. `children` is the outlet: place it exactly once, e.g. `main(children)`. */
export interface LayoutProps<T extends AnyLoad | undefined = undefined> {
  data: DataOf<T>;
  params: Record<string, string>;
  children: ListModifier;
}

/** Props of `head()`, exported by pages and layouts. */
export interface HeadProps<T extends RouteId | AnyLoad = RouteId> {
  data: DataOf<T>;
  params: ParamsOf<T>;
  url: URL;
}

/** Props of the `_error` view, which also renders 404s. */
export interface ErrorProps {
  status: number;
  message: string;
}

/** Document head for a page, merged root layout → page (later wins). */
export interface Head {
  title?: string;
  /** `name` (or `property` for og:*) → content. */
  meta?: Record<string, string>;
  /** Attribute maps for `<link>` tags. */
  link?: Array<Record<string, string>>;
}

// ---------------------------------------------------------------------------
// Server side: request events, middleware, API routes
// ---------------------------------------------------------------------------

/** Per-request values set by middleware. Augment: `declare module "nuclo-pages" { interface Locals { user?: User } }`. */
export interface Locals {}

/** What the adapter passes along: Cloudflare `{ env, ctx }`, Bun `{ server }`, Node `{ req, res }`. Augmentable. */
export interface Platform {}

export interface CookieOptions {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  /** Defaults to true. */
  httpOnly?: boolean;
  /** Defaults to true on https. */
  secure?: boolean;
  /** Defaults to "lax". */
  sameSite?: "lax" | "strict" | "none";
}

export interface Cookies {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: CookieOptions): void;
  delete(name: string, options?: CookieOptions): void;
}

export interface RequestEvent<R extends RouteId = RouteId> {
  request: Request;
  url: URL;
  params: RouteParams<R>;
  locals: Locals;
  platform: Platform;
  cookies: Cookies;
  /** Headers merged into the response (page, API route or server function). */
  setHeaders(headers: Record<string, string>): void;
}

/** `src/middleware.ts` default export: runs before pages, API routes and server functions. */
export type Middleware = (event: RequestEvent, next: () => Promise<Response>) => Response | Promise<Response>;

/** An API route method handler, e.g. `export const GET: RequestHandler = () => Response.json({})`. */
export type RequestHandler<R extends RouteId = RouteId> = (event: RequestEvent<R>) => Response | Promise<Response>;

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

/** The current route. Mutable: views that read it refresh on `update()`. */
export interface RouteState {
  readonly id: string;
  readonly url: URL;
  readonly params: Record<string, string>;
  /** True while a client navigation loads. */
  readonly pending: boolean;
}

export declare const route: RouteState;

export interface NavigateOptions {
  replace?: boolean;
}

/** Client-side navigation (browser only). Unknown and API URLs fall back to a full page load. */
export declare function navigate(href: string, options?: NavigateOptions): Promise<void>;

/**
 * Whether the current URL is `href` or below it (`/blog` matches `/blog/post`, not
 * `/blogger`). `/` and `exact` only match the path itself. Reactive inside resolvers:
 * `a({ href: "/blog", class: () => (isActive("/blog") ? "active" : "") }, "Blog")`.
 */
export declare function isActive(href: string, exact?: boolean): boolean;

/** Builds a URL from a route id: `href("/blog/[slug]", { slug: "hello" })`. */
export declare function href<R extends RouteId>(
  id: R,
  ...params: {} extends RouteParams<R> ? [params?: RouteParams<R>] : [params: RouteParams<R>]
): string;

// ---------------------------------------------------------------------------
// Control flow (throw from load, API routes, middleware or server functions)
// ---------------------------------------------------------------------------

export interface Redirect {
  readonly status: number;
  readonly location: string;
}

export interface HttpError extends Error {
  readonly status: number;
}

export declare function redirect(location: string, status?: 301 | 302 | 303 | 307 | 308): never;
export declare function error(status: number, message?: string): never;
export declare function notFound(message?: string): never;
export declare function isRedirect(value: unknown): value is Redirect;
export declare function isHttpError(value: unknown): value is HttpError;
