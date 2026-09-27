import type { Middleware, RequestHandler } from "../../types/index";
import { errorInfo, isHttpError, isRedirect } from "../shared/errors";
import { matchRoute, type Match } from "../shared/routes";
import type { Loader, RootDef, RouteDef } from "../shared/types";
import { createEventState, runWithEvent, type EventState } from "./event";
import { importModule, parseTemplate, renderPage, type Assets, type ServerContext } from "./render";
import { handleRpc } from "./rpc";

export { getRequestEvent } from "./event";
export { __serverFn } from "./rpc";

export type Handler = (request: Request, platform?: object) => Promise<Response>;

/** What the generated `virtual:nuclo-pages/handler` module passes in. */
export interface HandlerOptions {
  modules: (Loader | null)[];
  routes: RouteDef[];
  root: RootDef;
  serverFns: Record<string, Loader>;
  template: string;
  assets: Assets;
  middleware?: Middleware;
  dev?: boolean;
  base?: string;
}

const METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

export function createHandler(options: HandlerOptions): Handler {
  const ctx: ServerContext = {
    ...options,
    template: parseTemplate(options.template),
    dev: options.dev ?? false,
    base: options.base ?? "/",
  };
  const { middleware } = options;
  return (request, platform = {}) => {
    const state = createEventState(request, platform);
    return runWithEvent(state, async () => {
      let response: Response;
      try {
        response = middleware ? await middleware(state.event, () => dispatch(ctx, state)) : await dispatch(ctx, state);
      } catch (e) {
        response = failure(e, ctx.dev);
      }
      return withEventHeaders(response, state);
    });
  };
}

async function dispatch(ctx: ServerContext, state: EventState): Promise<Response> {
  const { request, url } = state.event;
  const rpc = `${ctx.base}_server/`;
  if (url.pathname.startsWith(rpc)) return handleRpc(ctx, state, url.pathname.slice(rpc.length));

  const match = matchRoute(ctx.routes, url.pathname);
  if (match?.route.api) return api(ctx, state, match);
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, match ? { status: 405, headers: { allow: "GET, HEAD" } } : { status: 404 });
  }
  const response = await renderPage(ctx, state, match);
  return request.method === "HEAD" ? new Response(null, response) : response;
}

async function api(ctx: ServerContext, state: EventState, { route, params }: Match): Promise<Response> {
  const mod = await importModule(ctx, route.page);
  const { method } = state.event.request;
  const handler = (mod[method] ?? (method === "HEAD" ? mod.GET : undefined)) as RequestHandler | undefined;
  if (typeof handler !== "function") {
    const allow = METHODS.filter((name) => typeof mod[name] === "function");
    return new Response(null, { status: 405, headers: { allow: allow.join(", ") } });
  }
  state.event.params = params;
  const response = await handler(state.event);
  if (!(response instanceof Response)) throw new TypeError(`${route.id}: ${method} must return a Response`);
  return method === "HEAD" ? new Response(null, response) : response;
}

/** A redirect or error thrown by middleware or an API route. */
function failure(e: unknown, dev: boolean): Response {
  if (isRedirect(e)) return new Response(null, { status: e.status, headers: { location: e.location } });
  if (!isHttpError(e)) console.error(e);
  const { status, message } = errorInfo(e, dev);
  return new Response(message, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
}

/** Merges `setHeaders()` and cookies into the response. */
function withEventHeaders(response: Response, { headers, cookies }: EventState): Response {
  if (!cookies.length && headers.keys().next().done) return response;
  const merged = new Response(response.body, response);
  headers.forEach((value, name) => merged.headers.set(name, value));
  for (const cookie of cookies) merged.headers.append("set-cookie", cookie);
  return merged;
}
