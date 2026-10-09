/**
 * Callbacks run by every root pass — render(), hydrate(), forceUpdate() and
 * renderToString() — once the root's component has been called and before
 * its tree is built. For libraries that keep content beside the app rather
 * than in it: nuclo-router mounts its pages here, so they are waiting when
 * the app's regions are built or hydrated, and are built inside the same
 * server render.
 *
 * On globalThis for the same reason as ./serializing: renderToString() runs
 * them from the nuclo/ssr bundle, the router registers them through nuclo.
 */
type RootHook = (serializing: boolean) => void;

const HOOKS_KEY = Symbol.for("nuclo.rootHooks.v1");
const globalScope = globalThis as unknown as Record<symbol, Set<RootHook> | undefined>;
const hooks = globalScope[HOOKS_KEY] ?? (globalScope[HOOKS_KEY] = new Set<RootHook>());

/** Registers `hook` for every root pass from now on; returns its unregister. */
export function onRootBuild(hook: RootHook): () => void {
  hooks.add(hook);
  return () => void hooks.delete(hook);
}

export function runRootHooks(serializing: boolean) {
  for (const hook of hooks) hook(serializing);
}
