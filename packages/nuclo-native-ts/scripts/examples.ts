/**
 * Builds every example for the given targets: `bun scripts/examples.ts web,android` → build/<target>/<example>/.
 * An example with platform code (a native/ folder) builds only for the targets it has code for.
 */
import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import * as path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const wanted = (process.argv[2] ?? "web").split(",");
for (const example of readdirSync(path.join(root, "examples"), { withFileTypes: true })) {
  if (!example.isDirectory()) continue;
  const native = path.join(root, "examples", example.name, "native");
  // The wasm host runs the web target's platform code (it is TypeScript for the DOM) unless native/wasm replaces it.
  const targets = wanted.filter((target) => !existsSync(native) || existsSync(path.join(native, target)) || (target === "wasm" && existsSync(path.join(native, "web"))));
  for (const skipped of wanted.filter((target) => !targets.includes(target))) console.log(`${example.name}: no native/${skipped}, skipped for ${skipped}`);
  if (!targets.length) continue;
  const out = path.join(root, "build/check", example.name);
  const built = Bun.spawnSync(["bun", path.join(root, "src/compiler/cli.ts"), "build", path.join(root, "examples", example.name, "App.ts"), "--out", out, "--target", targets.join(",")], { stdout: "inherit", stderr: "inherit" });
  if (built.exitCode !== 0) process.exit(built.exitCode ?? 1);
  for (const target of targets) {
    const dir = path.join(root, "build", target, example.name);
    rmSync(dir, { recursive: true, force: true });
    cpSync(path.join(out, target), dir, { recursive: true });
  }
}
