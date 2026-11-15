/** Builds every example for the given targets: `bun scripts/examples.ts web,android` → build/<target>/<example>/. */
import { cpSync, readdirSync, rmSync } from "node:fs";
import * as path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const targets = (process.argv[2] ?? "web").split(",");
for (const example of readdirSync(path.join(root, "examples"), { withFileTypes: true })) {
  if (!example.isDirectory()) continue;
  const out = path.join(root, "build/check", example.name);
  const built = Bun.spawnSync(["bun", path.join(root, "src/compiler/cli.ts"), "build", path.join(root, "examples", example.name, "App.ts"), "--out", out, "--target", targets.join(",")], { stdout: "inherit", stderr: "inherit" });
  if (built.exitCode !== 0) process.exit(built.exitCode ?? 1);
  for (const target of targets) {
    const dir = path.join(root, "build", target, example.name);
    rmSync(dir, { recursive: true, force: true });
    cpSync(path.join(out, target), dir, { recursive: true });
  }
}
