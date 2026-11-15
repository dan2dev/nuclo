/**
 * The web target: no translation, the app is TypeScript already. It is bundled with
 * src/runtimes/web in place of the API module, into <dir>/{index.html,app.js}.
 */
import { existsSync, writeFileSync } from "node:fs";
import * as path from "node:path";

const API_FILE = path.resolve(import.meta.dirname, "../index.ts");
const WEB_RUNTIME = path.resolve(import.meta.dirname, "../runtimes/web/index.ts");

const html = (title: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title>
</head>
<body>
<script type="module" src="./app.js"></script>
</body>
</html>
`;

export async function buildWeb(entry: string, dir: string): Promise<string> {
  // native/web/index.ts beside the entry: the app's native components (it registers them) and
  // native functions (its exports become the globals `declare function` promised).
  const native = path.join(path.dirname(entry), "native/web/index.ts");
  dir = path.resolve(dir);
  const globals = path.join(dir, ".globals.ts");
  const main = path.join(dir, ".main.ts");
  const hasNative = existsSync(native);
  if (hasNative) writeFileSync(globals, `import * as native from ${JSON.stringify(native)};\nObject.assign(globalThis, native);\n`);
  writeFileSync(main, `${hasNative ? `import ${JSON.stringify(globals)};\n` : ""}import ${JSON.stringify(entry)};\n`);
  const result = await Bun.build({
    entrypoints: [main],
    target: "browser",
    minify: true,
    plugins: [
      {
        name: "nuclo-web-runtime",
        setup(build) {
          build.onResolve({ filter: /index\.ts$|native-ts$/ }, (args) => {
            const resolved = args.path.startsWith(".") ? path.resolve(path.dirname(args.importer), args.path) : args.path;
            return resolved === API_FILE || args.path === "@nuclo/native-ts" ? { path: WEB_RUNTIME } : undefined;
          });
        },
      },
    ],
  });
  if (!result.success) throw new Error(result.logs.map(String).join("\n"));
  const out = path.join(dir, "app.js");
  writeFileSync(out, await result.outputs[0]!.text());
  writeFileSync(path.join(dir, "index.html"), html(path.basename(path.dirname(entry))));
  return path.join(dir, "index.html");
}
