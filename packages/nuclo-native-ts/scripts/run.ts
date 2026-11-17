/**
 * Builds one example for a target and runs it: `bun scripts/run.ts <target> [example]`.
 * Targets: ios, macos (shell scripts, macOS only), android (Gradle; installs and launches when adb sees a device), linux, linux-gpui, macos-gpui (cargo), web, wasm (served).
 * With no target, it lists the ones this machine runs and asks which; with no example, the examples that build for the target.
 */
import { existsSync, readFileSync, readdirSync, watch } from "node:fs";
import * as path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

/** Every target, with what it runs; the ones this machine can run are offered when none is given. */
const targets: Record<string, [string, NodeJS.Platform[]]> = {
  ios: ["iOS simulator (UIKit)", ["darwin"]],
  android: ["Android device or emulator (Kotlin)", ["darwin", "linux", "win32"]],
  macos: ["macOS app (AppKit)", ["darwin"]],
  "macos-gpui": ["macOS app (Rust + GPUI)", ["darwin"]],
  linux: ["Linux app (Rust + GTK 4)", ["linux"]],
  "linux-gpui": ["Linux app (Rust + GPUI)", ["linux"]],
  web: ["browser, every example served", ["darwin", "linux", "win32"]],
  wasm: ["browser, Rust core as WebAssembly, every example served", ["darwin", "linux", "win32"]],
};

/** Lists `rows` and asks for one by number or name; with no terminal to ask, prints `hint` and exits. */
const pick = (title: string, rows: [string, string][], hint: string): string => {
  const width = Math.max(...rows.map(([n]) => n.length));
  console.log(`${title}:\n`);
  rows.forEach(([name, about], i) => console.log(`  ${String(i + 1).padStart(2)}  ${name.padEnd(width)}  ${about}`));
  console.log("");
  if (!process.stdin.isTTY) {
    console.log(hint);
    process.exit(0);
  }
  const answer = (prompt("Pick a number or name:") ?? "").trim();
  const name = rows[Number(answer) - 1]?.[0] ?? rows.find(([n]) => n === answer)?.[0];
  if (!name) {
    console.error(`no "${answer}"`);
    process.exit(1);
  }
  return name;
};

const usage = `usage: bun scripts/run.ts <${Object.keys(targets).join("|")}> [example]`;
const [given = "", picked = ""] = process.argv.slice(2);
if (given && !targets[given]) {
  console.error(usage);
  process.exit(1);
}
const target = given || pick("Targets", Object.entries(targets).filter(([, [, os]]) => os.includes(process.platform)).map(([n, [about]]) => [n, about]), usage);

/** The examples that build for `target`: an example with platform code needs native/<target> (as scripts/examples.ts). */
const available = () => {
  const native = target === "macos-gpui" ? "linux-gpui" : target;
  return readdirSync(path.join(root, "examples"), { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(path.join(root, "examples", e.name, "App.ts")))
    .map((e) => e.name)
    .sort()
    .filter((name) => !existsSync(path.join(root, "examples", name, "native")) || existsSync(path.join(root, "examples", name, "native", native)));
};

/** The first sentence of an example's header comment. */
const summary = (name: string) => {
  const header = readFileSync(path.join(root, "examples", name, "App.ts"), "utf8").match(/\/\*\*([\s\S]*?)\*\//)?.[1] ?? "";
  const line = header.split("\n").map((l) => l.replace(/^\s*\*\s?/, "").trim()).find((l) => l !== "") ?? "";
  const sentence = line.split(/\. /)[0]!.replace(/[.:,]$/, "");
  return sentence.length > 72 ? `${sentence.slice(0, 71)}…` : sentence;
};

const choose = () => pick(`Examples for ${target}`, available().map((n) => [n, summary(n)]), `Run one with: bun run ${target} <example>`);

// The web and wasm targets build and serve every example.
const native = !["web", "wasm"].includes(target);
const example = picked || (native ? choose() : "");
if (picked && !available().includes(picked)) {
  console.error(`"${picked}" doesn't build for ${target}; run \`bun run ${target}\` to see the ones that do.`);
  process.exit(1);
}
const sh = (cmd: string[], cwd = root) => {
  const r = Bun.spawnSync(cmd, { cwd, stdout: "inherit", stderr: "inherit", stdin: "inherit" });
  if (r.exitCode !== 0) process.exit(r.exitCode ?? 1);
};
// macos-gpui is the linux-gpui Cargo project; GPUI picks Metal / Core Text on a Mac.
const cargo = (compile: string, dir = compile) => {
  const out = path.join(root, "build/run", example);
  sh(["bun", "src/compiler/cli.ts", "build", `examples/${example}/App.ts`, "--out", out, "--target", compile]);
  const project = path.join(out, dir);
  sh(["cargo", "build", "--release"], project);
  sh([path.join(project, "target/release", `nuclo-${example}`)], project);
};

// The generated Kotlin folder is the Gradle project's source set; a stale incremental build from another example breaks it.
const android = () => {
  const out = path.join(root, "build/run", example);
  sh(["bun", "src/compiler/cli.ts", "build", `examples/${example}/App.ts`, "--out", out, "--target", "android"]);
  const host = path.join(root, "hosts/android");
  sh(["rm", "-rf", "app/build/kotlin", "app/build/intermediates/built_in_kotlinc", "app/build/tmp/kotlin-classes"], host);
  const device = Bun.spawnSync(["adb", "get-state"], { stderr: "ignore" }).exitCode === 0;
  sh(["./gradlew", device ? "installRelease" : "assembleRelease", "--offline", "-x", "lintVitalRelease", `-PnucloSources=${path.join(out, "android")}`], host);
  if (device) sh(["adb", "shell", "am", "start", "-n", "dev.nuclo.nativets/dev.nuclo.app.MainActivity"]);
  else console.log("No device for adb: built hosts/android/app/build/outputs/apk/release/app-release.apk");
};

// Rebuilds on any change under examples/ or src/ until Ctrl-C; ios-run.sh relaunches only when new Swift transpiled and compiled.
const ios = () => {
  let building = false;
  let again = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const build = async () => {
    if (building) return void (again = true);
    building = true;
    do {
      again = false;
      await Bun.spawn(["sh", "scripts/ios-run.sh", example], { cwd: root, stdout: "inherit", stderr: "inherit" }).exited;
    } while (again);
    building = false;
    console.log("Watching examples/ and src/ (Ctrl-C to stop)");
  };
  for (const dir of ["examples", "src"]) {
    watch(path.join(root, dir), { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(build, 150);
    });
  }
  void build();
};

switch (target) {
  case "android": android(); break;
  case "ios": ios(); break;
  case "macos": sh(["sh", `scripts/${target}-run.sh`, example]); break;
  case "linux": case "linux-gpui": cargo(target); break;
  case "macos-gpui": cargo("linux-gpui"); break;
  case "web": case "wasm": sh(["bun", "scripts/examples.ts", target]); sh(["bun", "scripts/serve.ts", `build/${target}`]); break;
  default: console.error(usage); process.exit(1);
}
