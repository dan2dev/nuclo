import type { Handler } from "../server/index";
import { resolveStatic, toPath } from "./static";

// The few Bun APIs used here, typed locally to avoid a bun-types dependency.
declare const Bun: {
  serve(options: {
    port?: number;
    hostname?: string;
    fetch(request: Request, server: unknown): Response | Promise<Response>;
  }): { hostname: string; port: number };
  file(path: string): Blob;
};

export interface ServeOptions {
  port?: number;
  host?: string;
  clientDir?: string | URL;
}

export function serve(handler: Handler, options: ServeOptions = {}) {
  const clientDir = options.clientDir && toPath(options.clientDir);
  const server = Bun.serve({
    port: options.port ?? Number(process.env.PORT ?? 3000),
    hostname: options.host ?? process.env.HOST,
    fetch(request, server) {
      if (clientDir && (request.method === "GET" || request.method === "HEAD")) {
        const file = resolveStatic(clientDir, new URL(request.url).pathname);
        if (file) return new Response(request.method === "HEAD" ? null : Bun.file(file.path), { headers: file.headers });
      }
      return handler(request, { server });
    },
  });
  console.log(`nuclo-pages listening on http://${server.hostname}:${server.port}`);
  return server;
}
