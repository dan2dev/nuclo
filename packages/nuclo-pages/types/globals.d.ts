/// <reference types="nuclo/types" />
/**
 * Ambient declarations for apps: add `"nuclo-pages/types"` to tsconfig `types`.
 * A script (no imports/exports), so both declarations below are global.
 */

/**
 * Declares a server function. The body only ever runs on the server: during
 * SSR it is called in-process, in the browser the call becomes a POST to
 * `/_server/<id>`. Must be the initializer of a top-level `const`:
 *
 *   export const getPost = $server(async (slug: string) => db.post(slug));
 */
declare function $server<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => Promise<Awaited<R>>;

/** The platform-agnostic request handler (used by a Cloudflare `src/worker.ts`). */
declare module "virtual:nuclo-pages/handler" {
  const handler: (request: Request, platform?: object) => Promise<Response>;
  export default handler;
}
