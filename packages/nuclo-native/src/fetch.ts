/**
 * fetch() for the hosts whose engine has none (Hermes is the language alone). The host has one call,
 * __nuclo_fetch(id, method, url, headers, body), and answers once with __nuclo_event(id, "fetch", json):
 * {status, statusText, url, headers, body}, or {error} when the request did not get an answer.
 *
 * ponytail: text bodies both ways, no streaming, no AbortSignal (the engines have no AbortController either).
 * ArrayBuffer and FormData bodies when an app needs them: the body would cross as base64.
 */
import "./host";

type Answer = { status: number; statusText: string; url: string; headers: Record<string, string>; body: string; error?: string };
const waiting = new Map<number, [resolve: (response: Response) => void, reject: (error: Error) => void]>();
let last = 0;

/** A request's headers as the host takes them: one object, whatever shape the app gave (an object or pairs). */
function fields(headers: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  const pairs = Array.isArray(headers) ? headers : Object.entries((headers as Record<string, unknown> | undefined) ?? {});
  for (const [name, value] of pairs as [string, unknown][]) out[name] = String(value);
  return out;
}

function response(answer: Answer): Response {
  const headers = new Map(Object.entries(answer.headers));
  const text = () => Promise.resolve(answer.body);
  return {
    ok: answer.status >= 200 && answer.status < 300,
    status: answer.status,
    statusText: answer.statusText,
    url: answer.url,
    headers: {
      get: (name: string) => headers.get(name.toLowerCase()) ?? null,
      has: (name: string) => headers.has(name.toLowerCase()),
      forEach: (each: (value: string, name: string) => void) => headers.forEach(each),
    },
    text,
    json: () => text().then(JSON.parse),
    clone: () => response(answer),
  } as unknown as Response;
}

/** fetch(), on the host's request. */
export function hostFetch(input: string | { url: string }, init: { method?: string; headers?: unknown; body?: unknown } = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    waiting.set(++last, [resolve, reject]);
    const body = init.body == null ? undefined : String(init.body);
    globalThis.__nuclo_fetch!(last, (init.method ?? "GET").toUpperCase(), typeof input === "string" ? input : input.url, JSON.stringify(fields(init.headers)), body);
  });
}

/** The host's answer (dom.ts routes it here): settles the request's promise. */
export function settle(id: number, json: string) {
  const request = waiting.get(id);
  if (!request) return;
  waiting.delete(id);
  const answer: Answer = JSON.parse(json);
  // As in the browser: an HTTP error status is an answer; only a request that got none rejects.
  if (answer.error !== undefined) request[1](new TypeError(answer.error));
  else request[0](response(answer));
}

const g = globalThis as unknown as Record<string, unknown>;
if (typeof g.fetch !== "function" && typeof globalThis.__nuclo_fetch === "function") g.fetch = hostFetch;
