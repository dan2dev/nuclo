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
// Pages, layouts and error views
// ---------------------------------------------------------------------------

/**
 * What a page's `load()` receives. Name the route to type its params:
 * `load: ({ params }: LoadEvent<"/blog/[slug]">) => …`.
 */
export interface LoadEvent<R extends RouteId = RouteId> {
  params: RouteParams<R>;
  url: URL;
}

/** What a layout's `load()` receives: only the params its own folder consumes. */
export interface LayoutLoadEvent {
  params: Record<string, string>;
}

/** The load event of a page that doesn't name its route. */
interface AnyLoadEvent {
  params: Record<string, string>;
  url: URL;
}

type ActionMap = Record<string, (...args: any[]) => unknown>;

type ParamsOf<E> = E extends { params: infer P } ? P : Record<string, string>;

/** Actions as a view calls them: async, and the page's data reloads after each one. */
export type BoundActions<A> = {
  [K in keyof A]: A[K] extends (...args: infer P) => infer R ? (...args: P) => Promise<Awaited<R>> : never;
};

/** What a page's `render` receives. */
export interface PageProps<D = undefined, P = Record<string, string>, A = {}> {
  data: D;
  params: P;
  url: URL;
  actions: BoundActions<A>;
}

/** What a layout's `render` receives. `children` is the outlet: place it exactly once, e.g. `main(children)`. */
export interface LayoutProps<D = undefined> {
  data: D;
  params: Record<string, string>;
  children: ListModifier;
}

/** What `head` receives. */
export interface HeadProps<D = undefined, P = Record<string, string>> {
  data: D;
  params: P;
  url: URL;
}

/** What the `_error` view receives (it also renders 404s). */
export interface ErrorProps {
  status: number;
  message: string;
}

export interface PageDefinition<D = undefined, E = AnyLoadEvent, A = {}> {
  /** Render to HTML at build time. */
  prerender?: boolean;
  /**
   * Loads the page's data. Server only: it runs for the first request and, over
   * RPC, on client navigation and after actions — so it can use the database directly.
   */
  load?: (event: E) => D | Promise<D>;
  /** The document head. Runs on the server and in the browser. */
  head?: (props: HeadProps<D, ParamsOf<E>>) => Head | undefined;
  /**
   * Server-only functions the view calls as `actions.name(...args)`. The page's
   * data reloads afterwards, and what changed re-renders.
   */
  actions?: A;
  /** The view. Runs on the server and in the browser. */
  render: (props: PageProps<D, ParamsOf<E>, A>) => NodeModFn<any>;
}

export interface LayoutDefinition<D = undefined> {
  /** Prerender every page below this layout (a page can opt out with `prerender: false`). */
  prerender?: boolean;
  /** Server only, like a page's; it re-runs only when the params its folder consumes change. */
  load?: (event: LayoutLoadEvent) => D | Promise<D>;
  head?: (props: HeadProps<D>) => Head | undefined;
  render: (props: LayoutProps<D>) => NodeModFn<any>;
}

export interface ErrorDefinition {
  head?: (props: ErrorProps & { url: URL }) => Head | undefined;
  render: (props: ErrorProps) => NodeModFn<any>;
}

/**
 * Defines a page: `export default Page({ load, head, actions, render })` in a
 * `src/pages` file. `render` gets `data` typed from `load` and `actions` as async calls.
 */
export declare function Page<D = undefined, E = AnyLoadEvent, A extends ActionMap = {}>(
  definition: PageDefinition<D, E, A>,
): PageDefinition<D, E, A>;

/** Defines a layout: `export default Layout({ render: ({ children }) => main(children) })` in `_layout.ts`. */
export declare function Layout<D = undefined>(definition: LayoutDefinition<D>): LayoutDefinition<D>;

/** Defines the error view: `export default ErrorPage({ render: ({ status, message }) => … })` in `_error.ts`. */
export declare function ErrorPage(definition: ErrorDefinition): ErrorDefinition;

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
