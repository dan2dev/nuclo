import { createReadStream } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { Handler } from "../server/index";
import { resolveStatic, toPath } from "./static";

export interface ServeOptions {
  port?: number;
  host?: string;
  clientDir?: string | URL;
}

/** Converts a Node request into a Fetch `Request`. */
export function toRequest(req: IncomingMessage): Request {
  const protocol = (req.socket as { encrypted?: boolean }).encrypted ? "https" : "http";
  // Connect (Vite) may rewrite req.url; originalUrl keeps what the client asked for.
  const path = (req as { originalUrl?: string }).originalUrl ?? req.url ?? "/";
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined || name.startsWith(":")) continue;
    if (Array.isArray(value)) for (const item of value) headers.append(name, item);
    else headers.set(name, value);
  }
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  return new Request(new URL(path, `${protocol}://${req.headers.host ?? "localhost"}`), {
    method: req.method,
    headers,
    body: hasBody ? (Readable.toWeb(req) as ReadableStream) : undefined,
    duplex: "half",
  } as RequestInit);
}

/** Writes a Fetch `Response` to a Node response: streams the body and keeps every Set-Cookie. */
export async function sendResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  if (response.statusText) res.statusMessage = response.statusText;
  for (const [name, value] of response.headers) if (name !== "set-cookie") res.setHeader(name, value);
  const cookies = response.headers.getSetCookie();
  if (cookies.length) res.setHeader("set-cookie", cookies);
  if (!response.body) {
    res.end();
    return;
  }
  await pipeline(Readable.fromWeb(response.body as never), res);
}

export function serve(handler: Handler, options: ServeOptions = {}): Server {
  const clientDir = options.clientDir && toPath(options.clientDir);
  const port = options.port ?? Number(process.env.PORT ?? 3000);
  const host = options.host ?? process.env.HOST;
  const server = createServer(async (req, res) => {
    try {
      const method = req.method ?? "GET";
      const file = clientDir && (method === "GET" || method === "HEAD") ? resolveStatic(clientDir, new URL(req.url ?? "/", "http://x").pathname) : null;
      if (file) {
        res.writeHead(200, file.headers);
        if (method === "HEAD") res.end();
        else await pipeline(createReadStream(file.path), res);
        return;
      }
      await sendResponse(res, await handler(toRequest(req), { req, res }));
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.statusCode = 500;
      res.end();
    }
  });
  server.listen(port, host, () => console.log(`nuclo-pages listening on http://${host ?? "localhost"}:${port}`));
  return server;
}
