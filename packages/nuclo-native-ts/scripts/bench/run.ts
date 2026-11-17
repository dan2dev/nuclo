/**
 * CPU benchmark of generated code: `bun scripts/bench/run.ts [bun,swift,rust,kotlin] [--runs n] [--save out.json] [--base base.json]`.
 * Compiles scripts/bench/bench-core.ts per target, optimized (swiftc -O -wmo, cargo --release, Kotlin on the JVM),
 * runs each under /usr/bin/time -l (peak memory), and prints ms per case (best of 3) next to bun's. A checksum that
 * differs from bun's is marked `!` (a wrong result, not a timing). `--base` adds the saved run's ms as `old→new`.
 * `--runs n` runs each program n times and keeps each case's fastest (the machine's load varies between runs).
 * NUCLO_BENCH=<file.ts> benchmarks another module exporting `checks` (for profiling one case). Builds go to
 * $TMPDIR/nuclo-bench. Not part of `bun test`.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import * as path from "node:path";
import { emitKotlin } from "../../src/compiler/emitKotlin.ts";
import { emitRust } from "../../src/compiler/emitRust.ts";
import { emitSwift } from "../../src/compiler/emitSwift.ts";
import { transpile } from "../../src/compiler/transpile.ts";

const ROOT = path.resolve(import.meta.dir, "../..");
const BENCH = path.resolve(process.env.NUCLO_BENCH ?? path.join(import.meta.dir, "bench-core.ts"));
const RUNTIMES = path.join(ROOT, "src/runtimes");
const OUT = path.join(tmpdir(), "nuclo-bench");
const GRADLE_LOCK = process.env.NUCLO_GRADLE_LOCK ?? path.join(tmpdir(), "nuclo-gradle.lock");
const JAVA_HOME = process.env.JAVA_HOME ?? [path.join(homedir(), ".sdkman/candidates/java/current")].find(existsSync);

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const save = flag("--save");
const runs = Number(flag("--runs") ?? 1);
const base = flag("--base");
const targets = (args[0] ?? "bun,swift,rust,kotlin").split(",");

function sh(cmd: string[], what: string, opts: { cwd?: string; env?: Record<string, string> } = {}): string {
  const r = Bun.spawnSync(cmd, { cwd: opts.cwd, env: { ...process.env, ...opts.env }, stdout: "pipe", stderr: "pipe" });
  if (r.exitCode !== 0) throw new Error(`${what} failed:\n${(r.stderr.toString() || r.stdout.toString()).split("\n").filter((l) => !/^w: /.test(l)).slice(0, 30).join("\n")}`);
  return r.stdout.toString();
}

/** Runs the built program under /usr/bin/time -l: its lines and its peak resident memory (MB). */
function measure(cmd: string[], env: Record<string, string> = {}): { lines: string[]; mb: number } {
  const r = Bun.spawnSync(["/usr/bin/time", "-l", ...cmd], { env: { ...process.env, ...env }, stdout: "pipe", stderr: "pipe" });
  const err = r.stderr.toString();
  if (r.exitCode !== 0) throw new Error(`run failed:\n${err.slice(0, 2000)}`);
  const rss = Number(/(\d+)\s+maximum resident set size/.exec(err)?.[1] ?? 0);
  return { lines: r.stdout.toString().trim().split("\n"), mb: Math.round(rss / 1048576) };
}

const program = transpile(BENCH);

const build: Record<string, (dir: string) => string[]> = {
  bun: () => [process.execPath, "-e", `for (const c of (await import(${JSON.stringify(BENCH)})).checks) console.log(c.lines.join("\\n"))`],
  swift(dir) {
    writeFileSync(path.join(dir, "bench.swift"), emitSwift(program).replace(/^@main$/m, ""));
    cpSync(path.join(RUNTIMES, "ios/NucloRuntime.swift"), path.join(dir, "NucloRuntime.swift"));
    cpSync(path.join(RUNTIMES, "macos/UIKitShim.swift"), path.join(dir, "UIKitShim.swift"));
    // The cycle collector runs only after the cases (threshold off), timed: the incremental pass over what the cases
    // left (its longest slice and all slices together, ms; then the objects it freed), then a full collection of the
    // live heap (one blocking step: what every collection was before the collector was incremental).
    writeFileSync(
      path.join(dir, "Harness.swift"),
      `import Dispatch\n@main struct Harness {\n    @MainActor static func main() {\n        JsGc.threshold = Int.max\n        nucloMain()\n        for c in checks { for l in c.lines { print(l) } }\n        let ms = { (t: UInt64) in Double((DispatchTime.now().uptimeNanoseconds - t) / 10_000) / 100 }\n        jsGcStartPass()\n        var longest: UInt64 = 0, total: UInt64 = 0\n        while JsGc.passActive {\n            let t = DispatchTime.now().uptimeNanoseconds\n            jsGcStep()\n            let d = DispatchTime.now().uptimeNanoseconds - t\n            longest = max(longest, d)\n            total += d\n        }\n        let ns = { (d: UInt64) in Double(d / 10_000) / 100 }\n        print("gcPassMaxSlice \\(ns(longest)) \\(JsGc.passFreed)")\n        print("gcPassTotal \\(ns(total)) \\(JsGc.passFreed)")\n        var t = DispatchTime.now().uptimeNanoseconds\n        t = DispatchTime.now().uptimeNanoseconds\n        let live = JsGc.liveCount\n        jsGcCollect()\n        print("gcScanLive \\(ms(t)) \\(live)")\n    }\n}\n`,
    );
    const arch = process.arch === "arm64" ? "arm64" : "x86_64";
    const sources = ["bench", "NucloRuntime", "UIKitShim", "Harness"].map((f) => path.join(dir, `${f}.swift`));
    sh(["xcrun", "swiftc", "-O", "-wmo", "-target", `${arch}-apple-macos13.0`, "-swift-version", "5", "-parse-as-library", "-suppress-warnings", "-o", path.join(dir, "bench"), ...sources], "swiftc");
    return [path.join(dir, "bench")];
  },
  rust(dir) {
    mkdirSync(path.join(dir, "src/native"), { recursive: true });
    cpSync(path.join(RUNTIMES, "rust/src/nuclo"), path.join(dir, "src/nuclo"), { recursive: true });
    writeFileSync(path.join(dir, "src/native/mod.rs"), "");
    // The parity test's headless backend; main runs on a big stack (dropping a long Rc list recurses).
    const headless = readFileSync(path.join(ROOT, "test/parity/headless.rs"), "utf8").replace("fn main() {", "fn bench_main() {");
    const gc = `nuclo::prelude::gc_set_threshold(usize::MAX);\n        bench_main();\n        nuclo::prelude::gc_start_pass();\n        let (mut longest, mut total) = (0u128, 0u128);\n        while nuclo::prelude::gc_pass_active() {\n            let t = Instant::now();\n            nuclo::prelude::gc_step();\n            let d = t.elapsed().as_micros();\n            longest = longest.max(d);\n            total += d;\n        }\n        let freed = nuclo::prelude::gc_stats().pass_freed;\n        println!("gcPassMaxSlice {} {freed}", (longest / 10) as f64 / 100.0);\n        println!("gcPassTotal {} {freed}", (total / 10) as f64 / 100.0);\n        let t = Instant::now();\n        let live = nuclo::prelude::gc_live();\n        nuclo::prelude::gc_collect();\n        println!("gcScanLive {} {live}", (t.elapsed().as_micros() / 10) as f64 / 100.0);`;
    writeFileSync(path.join(dir, "src/main.rs"), `${headless}\nfn main() {\n    std::thread::Builder::new().stack_size(1 << 30).spawn(|| {\n        ${gc}\n    }).unwrap().join().unwrap();\n}\n`);
    writeFileSync(
      path.join(dir, "src/app.rs"),
      `${emitRust(program, { native: true })}\npub fn parity_done() -> bool { true }\npub fn parity_checks() -> Vec<(String, Vec<String>)> {\n    g::checks.get().to_vec().into_iter().map(|c| (c.name.get(), c.lines.get().to_vec())).collect()\n}\n`,
    );
    writeFileSync(
      path.join(dir, "Cargo.toml"),
      '[package]\nname = "bench"\nversion = "0.0.0"\nedition = "2021"\n\n[dependencies]\nserde_json = "1"\nureq = "3.5"\nunicode-normalization = "0.1"\n\n[profile.release]\nopt-level = 3\n',
    );
    const target = path.join(OUT, "cargo");
    sh(["cargo", "build", "--release", "--offline", "--quiet"], "cargo build", { cwd: dir, env: { CARGO_TARGET_DIR: target } });
    return [path.join(target, "release/bench")];
  },
  kotlin(dir) {
    writeFileSync(path.join(dir, "bench.kt"), emitKotlin(program).replace(/^class MainActivity\b.*$/m, ""));
    cpSync(path.join(RUNTIMES, "android/NucloJs.kt"), path.join(dir, "NucloJs.kt"));
    writeFileSync(path.join(dir, "Main.kt"), `package dev.nuclo.app\n\nfun main() {\n    nucloMain()\n    for (c in checks) for (l in c.lines) println(l)\n}\n`);
    const out = path.join(OUT, "jvm");
    while (true) {
      try {
        mkdirSync(GRADLE_LOCK);
        break;
      } catch {
        Bun.sleepSync(1000);
      }
    }
    try {
      sh([path.join(ROOT, "hosts/android/gradlew"), "-p", path.join(ROOT, "hosts/jvm"), "installDist", "--offline", "-q", `-PnucloSources=${dir}`, `-PnucloBuildDir=${out}`], "gradle", { env: JAVA_HOME ? { JAVA_HOME } : {} });
    } finally {
      rmSync(GRADLE_LOCK, { recursive: true, force: true });
    }
    return [path.join(out, "install/nuclo-jvm/bin/nuclo-jvm")];
  },
};

type Result = { ms: Record<string, number>; check: Record<string, string>; mb: number };
const results: Record<string, Result> = {};
for (const t of targets) {
  const dir = path.join(OUT, t);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  try {
    const cmd = build[t]!(dir);
    const r: Result = { ms: {}, check: {}, mb: 0 };
    for (let k = 0; k < runs; k++) {
      const { lines, mb } = measure(cmd, t === "kotlin" && JAVA_HOME ? { JAVA_HOME } : {});
      r.mb = Math.max(r.mb, mb);
      for (const l of lines) {
        const [name, ms, check] = l.split(" ");
        if (name && check !== undefined) {
          r.ms[name] = Math.min(r.ms[name] ?? Infinity, Number(ms));
          r.check[name] = check;
        }
      }
    }
    results[t] = r;
  } catch (e) {
    console.error(`${t}: ${(e as Error).message}`);
  }
}

const old: Record<string, Result> = base ? JSON.parse(readFileSync(base, "utf8")) : {};
const shown = Object.keys(results);
const names = [...new Set(shown.flatMap((t) => Object.keys(results[t]!.ms)))];
const ref = results.bun;
const cell = (t: string, n: string) => {
  const r = results[t]!;
  // gcCollect / gcScanLive: native only (bun has no such step).
  const wrong = ref && t !== "bun" && n in ref.check && r.check[n] !== ref.check[n] ? "!" : "";
  const was = old[t]?.ms[n];
  return `${was !== undefined ? `${was}→` : ""}${r.ms[n] ?? "-"}${wrong}`;
};
const rows = [["case", ...shown], ...names.map((n) => [n, ...shown.map((t) => cell(t, n))])];
rows.push(["peak MB", ...shown.map((t) => `${old[t] ? `${old[t]!.mb}→` : ""}${results[t]!.mb}`)]);
rows.push(["total ms", ...shown.map((t) => `${old[t] ? `${Object.values(old[t]!.ms).reduce((a, b) => a + b, 0)}→` : ""}${Object.values(results[t]!.ms).reduce((a, b) => a + b, 0)}`)]);
console.log(rows.map((r) => `| ${r.join(" | ")} |`).join("\n").replace(/^(\|[^\n]*\n)/, `$1|${" --- |".repeat(rows[0]!.length)}\n`));
for (const t of shown) for (const n of names) if (ref && t !== "bun" && n in ref.check && results[t]!.check[n] !== ref.check[n]) console.log(`! ${t} ${n}: ${results[t]!.check[n]} (bun ${ref.check[n]})`);
if (save) writeFileSync(save, JSON.stringify(results, null, 1));
