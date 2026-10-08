/**
 * The single source of truth for where this app is mounted.
 *
 * Three places have to agree on it, which is the whole point of the demo:
 *  - the router's `base` option (strips it before matching),
 *  - Vite's `base` (prefixes asset and chunk URLs),
 *  - the server's static-file and SSR routing.
 *
 * Set to "" to serve from the root instead; everything else keeps working.
 */
export const BASE = "/app";
