/**
 * "A tree is being built for renderToString()" flag.
 *
 * True while renderToString() runs. Text children must keep their
 * `<!-- text-N -->` markers in this mode so the emitted HTML stays hydratable
 * — even when `isBrowser` is true (SSR under jsdom/happy-dom globals, or an
 * isomorphic worker that provides a DOM) — and nothing built for a throwaway
 * server tree may register itself anywhere (lifecycle hooks, reactive nodes,
 * list/when runtimes, scope roots). A pure client render leaves this false.
 *
 * Kept on globalThis under a Symbol.for key (like style/engine.ts's registry)
 * rather than in a module-level `let`: `nuclo` and `nuclo/ssr` ship as
 * separate bundles, each with its own module scope. renderToString() (in
 * nuclo/ssr) sets the flag and the tag builders (in nuclo) read it — as a
 * module variable those would be two unrelated booleans.
 */
const SERIALIZING_KEY = Symbol.for("nuclo.serializing.v1");
interface SerializingState { on: boolean; scratch: Map<string, unknown> }
const globalScope = globalThis as unknown as Record<symbol, SerializingState | undefined>;
const shared = globalScope[SERIALIZING_KEY]
  ?? (globalScope[SERIALIZING_KEY] = { on: false, scratch: new Map<string, unknown>() });

export function isSerializing() {
  return shared.on;
}

/**
 * Scratch space for the current renderToString() call, emptied when that call
 * ends.
 *
 * A server renders every request from one process, so any registry a feature
 * keeps in module scope is shared by every request and every user at once.
 * Anything a server tree needs to look up mid-build goes here instead: it is
 * reachable for exactly as long as the tree is being built, and nothing from
 * one request is reachable from the next. Keys are namespaced by the feature
 * that owns them.
 */
export function serializingScratch(): Map<string, unknown> {
  return shared.scratch;
}

/**
 * Runs `fn` with serialization mode enabled, restoring the previous state
 * afterwards (so nested/re-entrant renderToString calls behave correctly).
 */
export function runSerializing<T>(fn: () => T): T {
  const previous = shared.on;
  shared.on = true;
  try {
    return fn();
  } finally {
    shared.on = previous;
    // Only the outermost call clears: a nested renderToString() is still part
    // of the same request and the tree around it is still being built.
    if (!shared.on) shared.scratch.clear();
  }
}
