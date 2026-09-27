// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resolveStatic, toPath } from "../../src/adapters/static";

let root: string;
let dir: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "nuclo-static-"));
  dir = join(root, "client");
  const files: Record<string, string> = {
    "client/index.html": "home",
    "client/about.html": "about",
    "client/blog/post.html": "post",
    "client/docs/index.html": "docs",
    "client/assets/app-abc123.js": "console.log(1)",
    "client/favicon.ico": "ico",
    "client/data.unknownext": "?",
    "client/file name.txt": "space",
    "client/.vite/manifest.json": "{}",
    "secret.txt": "outside",
    "client-secret/file.txt": "sibling",
  };
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), content);
  }
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

const found = (pathname: string) => resolveStatic(dir, pathname)?.path.slice(dir.length + 1) ?? null;

describe("resolveStatic", () => {
  it("serves files with type, length and cache headers", () => {
    expect(resolveStatic(dir, "/assets/app-abc123.js")).toEqual({
      path: join(dir, "assets/app-abc123.js"),
      headers: {
        "content-type": "text/javascript; charset=utf-8",
        "content-length": "14",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
    expect(resolveStatic(dir, "/favicon.ico")?.headers).toMatchObject({
      "content-type": "image/x-icon",
      "cache-control": "public, max-age=0, must-revalidate",
    });
  });

  it("finds prerendered pages as <path>.html or <path>/index.html", () => {
    expect(found("/")).toBe("index.html");
    expect(found("/about")).toBe("about.html");
    expect(found("/blog/post")).toBe("blog/post.html");
    expect(found("/docs")).toBe("docs/index.html");
    expect(found("/docs/")).toBe("docs/index.html");
    expect(resolveStatic(dir, "/about")?.headers["content-type"]).toBe("text/html; charset=utf-8");
  });

  it("returns null for missing files and bare directories", () => {
    expect(found("/missing")).toBeNull();
    expect(found("/assets")).toBeNull();
    expect(found("/assets/")).toBeNull();
    expect(found("/about/")).toBeNull();
  });

  it("decodes the path", () => {
    expect(found("/file%20name.txt")).toBe("file name.txt");
  });

  it("falls back to a binary content type", () => {
    expect(resolveStatic(dir, "/data.unknownext")?.headers["content-type"]).toBe("application/octet-stream");
  });

  it("never leaves the directory", () => {
    for (const pathname of [
      "/../secret.txt",
      "/%2e%2e/secret.txt",
      "/..%2Fsecret.txt",
      "/assets/../../secret.txt",
      "/../client-secret/file.txt",
      "/%2e%2e%2fclient-secret%2ffile.txt",
    ]) {
      expect(resolveStatic(dir, pathname), pathname).toBeNull();
    }
  });

  it("rejects null bytes, malformed encoding and the build manifest", () => {
    expect(found("/index.html%00.js")).toBeNull();
    expect(found("/%E0%A4%A")).toBeNull();
    expect(found("/.vite/manifest.json")).toBeNull();
  });
});

describe("toPath", () => {
  it("accepts paths and file URLs", () => {
    expect(toPath(dir)).toBe(dir);
    expect(toPath(pathToFileURL(dir + "/"))).toBe(dir);
  });
});
