/**
 * Type declarations for `nuclo-pages/server`. Keep in sync with src/server/index.ts.
 */
import type { Middleware, RequestEvent } from "./index";

export type { Middleware, RequestEvent };

/** The request handler exported by the generated `virtual:nuclo-pages/handler` module. */
export type Handler = (request: Request, platform?: object) => Promise<Response>;

/** The current request, inside server functions, API routes, middleware and SSR loads. */
export declare function getRequestEvent(): RequestEvent;

/** @internal Called by the generated handler module. */
export declare function createHandler(options: object): Handler;

/** @internal Target of the `$server()` server-environment transform. */
export declare function __serverFn<A extends unknown[], R>(
  id: string,
  fn: (...args: A) => R,
): (...args: A) => Promise<Awaited<R>>;
