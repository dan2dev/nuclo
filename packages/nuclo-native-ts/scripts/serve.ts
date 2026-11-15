/** Serves built web targets: `bun scripts/serve.ts <dir> [port]`. A folder without an index.html lists its subfolders. */
import { existsSync, readdirSync } from "node:fs";
import * as path from "node:path";

const dir = path.resolve(process.argv[2] ?? ".");
const port = Number(process.argv[3] ?? process.env.PORT ?? 4173);
Bun.serve({
  port,
  async fetch(request) {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    const target = path.join(dir, pathname);
    if (!target.startsWith(dir)) return new Response("Not found", { status: 404 });
    const index = path.join(target, "index.html");
    if (pathname.endsWith("/") && !existsSync(index) && existsSync(target)) {
      const links = readdirSync(target, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => `<li><a href="${entry.name}/">${entry.name}</a></li>`);
      return new Response(`<!doctype html><meta name="viewport" content="width=device-width"><ul>${links.join("")}</ul>`, { headers: { "content-type": "text/html" } });
    }
    const file = Bun.file(pathname.endsWith("/") ? index : target);
    return (await file.exists()) ? new Response(file) : new Response("Not found", { status: 404 });
  },
});
console.log(`${dir} → http://localhost:${port}`);
