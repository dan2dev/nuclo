import { statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".map": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".pdf": "application/pdf",
};

export interface StaticFile {
  path: string;
  headers: Record<string, string>;
}

export const toPath = (dir: string | URL): string => resolve(typeof dir === "string" ? dir : fileURLToPath(dir));

/**
 * Resolves a request path to a built client file: the file itself, then
 * `<path>.html` and `<path>/index.html` (prerendered pages). Hashed files under
 * /assets/ are cached forever.
 */
export function resolveStatic(dir: string, pathname: string): StaticFile | null {
  let path: string;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (path.includes("\0") || path.startsWith("/.vite/")) return null;
  const base = join(dir, path);
  if (base !== dir && !base.startsWith(dir + sep)) return null;
  const candidates = path.endsWith("/") ? [join(base, "index.html")] : [base, `${base}.html`, join(base, "index.html")];
  for (const file of candidates) {
    const stat = statSync(file, { throwIfNoEntry: false });
    if (!stat?.isFile()) continue;
    return {
      path: file,
      headers: {
        "content-type": TYPES[extname(file)] ?? "application/octet-stream",
        "content-length": String(stat.size),
        "cache-control": path.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate",
      },
    };
  }
  return null;
}
