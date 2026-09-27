/**
 * Type declarations for `nuclo-pages/client` (internal: used by generated code).
 * Keep in sync with src/client/index.ts.
 */

/** @internal Hydrates the server-rendered page and starts the router. */
export declare function start(options: object): Promise<void>;

/** @internal Target of the `$server()` client-environment transform. */
export declare function __rpc(id: string, name?: string): (...args: unknown[]) => Promise<unknown>;
