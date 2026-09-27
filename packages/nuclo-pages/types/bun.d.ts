/**
 * Type declarations for `nuclo-pages/bun`. Keep in sync with src/adapters/bun.ts.
 */
import type { Handler } from "./server";

export interface ServeOptions {
  /** Default: `PORT` env var, else 3000. */
  port?: number;
  /** Default: `HOST` env var, else all interfaces. */
  host?: string;
  /** Built client assets, served before the handler. */
  clientDir?: string | URL;
}

/** Starts `Bun.serve` and returns its server. */
export declare function serve(handler: Handler, options?: ServeOptions): unknown;
