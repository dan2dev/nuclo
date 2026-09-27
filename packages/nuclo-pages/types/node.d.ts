/**
 * Type declarations for `nuclo-pages/node`. Keep in sync with src/adapters/node.ts.
 */
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { Handler } from "./server";

export interface ServeOptions {
  /** Default: `PORT` env var, else 3000. */
  port?: number;
  /** Default: `HOST` env var, else all interfaces. */
  host?: string;
  /** Built client assets, served before the handler. */
  clientDir?: string | URL;
}

export declare function serve(handler: Handler, options?: ServeOptions): Server;

/** Converts a Node request into a Fetch `Request`. */
export declare function toRequest(req: IncomingMessage): Request;

/** Writes a Fetch `Response` to a Node response, streaming the body and keeping every Set-Cookie. */
export declare function sendResponse(res: ServerResponse, response: Response): Promise<void>;
