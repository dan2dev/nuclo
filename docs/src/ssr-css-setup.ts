/**
 * SSR CSS collection bootstrap.
 *
 * MUST be the very first import in server.ts so that setSSRCollector() runs
 * before any module with module-level cn() calls is evaluated (e.g. styles.ts,
 * content/*.ts).  ESM evaluates this module — and its dependencies — before
 * any subsequent import in server.ts, which guarantees the collector is wired
 * in before those cn() calls fire.
 *
 * Architecture:
 *  - globalSSRRules  — permanent Set, filled once during warm-up.  Captures
 *    module-level cn() calls that only execute on first import.  Bounded by
 *    the finite number of unique CSS rules in the app; never grows after
 *    warm-up is complete.
 *  - ssrStylesALS    — AsyncLocalStorage<Set<string>> for per-request
 *    isolation.  Each request gets a fresh Set; rules generated during that
 *    render are collected there independently of other concurrent requests.
 *  - The dispatcher passed to setSSRCollector writes to BOTH targets so that
 *    globalSSRRules stays complete and each request's Set captures its own
 *    render-time rules.
 */

import { setSSRCollector } from 'nuclo/ssr';
import { AsyncLocalStorage } from 'node:async_hooks';

export const globalSSRRules = new Set<string>();
export const ssrStylesALS = new AsyncLocalStorage<Set<string>>();

// Installed once, never changes. Stateless dispatcher — request isolation
// comes entirely from ssrStylesALS.getStore() returning the calling
// async-context's own Set.
setSSRCollector((rule: string) => {
  globalSSRRules.add(rule);
  ssrStylesALS.getStore()?.add(rule);
});

export async function withSSRStyles<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; rules: Set<string> }> {
  const requestRules = new Set<string>();
  const result = await ssrStylesALS.run(requestRules, fn);
  return { result, rules: requestRules };
}
