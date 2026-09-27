import * as devalue from "devalue";
import { errorInfo, isHttpError, isRedirect } from "../shared/errors";
import type { EventState } from "./event";
import type { ServerContext } from "./render";

type ServerFn = (...args: unknown[]) => unknown;

const registry = new Map<string, ServerFn>();

/** Target of the `$server()` server transform: registers the function and calls it in-process. */
export function __serverFn<A extends unknown[], R>(id: string, fn: (...args: A) => R): (...args: A) => Promise<Awaited<R>> {
  registry.set(id, fn as ServerFn);
  // Always async, like the RPC stub the browser gets: sync throws become rejections.
  return (...args) => new Promise<Awaited<R>>((resolve) => resolve(fn(...args) as Awaited<R>));
}

const reply = (status: number, message: string) => Response.json({ message }, { status });

/** `POST /_server/<id>`: devalue-encoded argument array in, devalue-encoded result out. */
export async function handleRpc(ctx: ServerContext, state: EventState, id: string): Promise<Response> {
  const { request } = state.event;
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { allow: "POST" } });
  // A custom header can't be sent cross-origin without a CORS preflight we never grant.
  if (request.headers.get("x-nuclo-rpc") !== "1") return reply(403, "Forbidden");

  // Importing (again) also re-registers functions whose module was edited in dev.
  await ctx.serverFns[id]?.();
  const fn = registry.get(id);
  if (!fn) return reply(404, "Server function not found");

  let args: unknown;
  try {
    const body = await request.text();
    args = body ? devalue.parse(body) : [];
  } catch {
    return reply(400, "Invalid server function arguments");
  }
  if (!Array.isArray(args)) return reply(400, "Invalid server function arguments");

  try {
    const result = await fn(...args);
    return new Response(devalue.stringify(result), { headers: { "content-type": "application/json" } });
  } catch (e) {
    if (isRedirect(e)) return new Response(null, { status: 204, headers: { "x-nuclo-redirect": e.location } });
    if (!isHttpError(e)) console.error(e);
    const { status, message } = errorInfo(e, ctx.dev);
    return reply(status, message);
  }
}
