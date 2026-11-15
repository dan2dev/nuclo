/**
 * The wasm target's build: the Cargo project (runtime core, wasm backend, the app's generated
 * Rust) is compiled to WebAssembly, and host.ts, the half of the backend that touches the DOM, is
 * bundled beside it. The folder serves as it is: index.html, host.js, app.wasm.
 */
import { copyFileSync, rmSync, writeFileSync } from "node:fs";
import * as path from "node:path";

const HOST = path.resolve(import.meta.dirname, "../runtimes/rust-wasm/host.ts");
const NATIVE_API = path.resolve(import.meta.dirname, "../runtimes/rust-wasm/native.ts");
const WEB_RUNTIME = path.resolve(import.meta.dirname, "../runtimes/web/index.ts");
const PACKAGE = path.resolve(import.meta.dirname, "../..");

const html = (title: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title>
</head>
<body>
<script type="module" src="./host.js"></script>
</body>
</html>
`;

/**
 * Builds `dir`, a Cargo project written by the wasm target; `crate` is its package name. `native` is the
 * app's platform code, TypeScript for the DOM: it is bundled with the host, and what it imports from the
 * web runtime (`registerNative`, `NativeComponent`) is the host's own.
 */
export async function buildWasm(dir: string, crate: string, title: string, native?: string): Promise<string> {
  const main = path.join(dir, ".main.ts");
  writeFileSync(main, `import ${JSON.stringify(HOST)};\n${native ? `import * as native from ${JSON.stringify(native)};\nimport { provideNatives } from ${JSON.stringify(NATIVE_API)};\nprovideNatives(native);\n` : ""}`);
  const host = await Bun.build({
    entrypoints: [main],
    target: "browser",
    minify: true,
    plugins: [
      {
        name: "nuclo-wasm-native",
        setup(build) {
          build.onResolve({ filter: /index\.ts$/ }, (args) => {
            const resolved = args.path.startsWith(".") ? path.resolve(path.dirname(args.importer), args.path) : args.path;
            return resolved === WEB_RUNTIME ? { path: NATIVE_API } : undefined;
          });
        },
      },
    ],
  });
  rmSync(main);
  if (!host.success) throw new Error(host.logs.map(String).join("\n"));
  writeFileSync(path.join(dir, "host.js"), await host.outputs[0]!.text());
  writeFileSync(path.join(dir, "index.html"), html(title));
  // One target folder for every app: the dependencies are built once.
  const target = process.env.CARGO_TARGET_DIR ?? path.join(PACKAGE, "build/.cargo/wasm");
  const cargo = Bun.spawnSync(["cargo", "build", "--release", "--offline", "--target", "wasm32-unknown-unknown", "--quiet"], {
    cwd: dir,
    env: { ...process.env, CARGO_TARGET_DIR: target },
    stdout: "inherit",
    stderr: "inherit",
  });
  if (cargo.exitCode !== 0) throw new Error(`cargo build failed in ${dir} (is the target installed? rustup target add wasm32-unknown-unknown)`);
  copyFileSync(path.join(target, "wasm32-unknown-unknown/release", `${crate.replaceAll("-", "_")}.wasm`), path.join(dir, "app.wasm"));
  return path.join(dir, "index.html");
}
