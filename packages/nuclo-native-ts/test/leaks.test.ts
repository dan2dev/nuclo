/**
 * Leak test of the cycle collector (README "Memory"): test/leaks/leaks.ts builds cyclic structures every round (lists,
 * trees with parent links, tries, composites, graphs, observers, LRU caches, records, rings) and drops them, while
 * a global structure is rewired so part of it becomes garbage that still points at itself. Swift (macOS, swiftc, with
 * and without -O) and Rust (native cargo) run 60 rounds, collect after each and print the number of live tracked
 * objects: it must stay at its first value (nothing accumulates), each round must free what it dropped, and the
 * checksums must be bun's. Swift also runs under macOS `leaks`, which must find no leaked memory at exit.
 * Builds go to the system temp folder; a missing toolchain skips its target.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { emitRust } from "../src/compiler/emitRust.ts";
import { emitSwift } from "../src/compiler/emitSwift.ts";
import { transpile } from "../src/compiler/transpile.ts";

const ROOT = path.resolve(import.meta.dir, "..");
const PROGRAM = path.join(import.meta.dir, "leaks/leaks.ts");
const RUNTIMES = path.join(ROOT, "src/runtimes");
const CACHE = path.join(tmpdir(), "nuclo-parity-cache");
const ROUNDS = 60;
/** Rounds of the stress test: `stressRound()` rewires a ~20 000-node graph, then the harness runs collector slices. */
const STRESS = 150;
const dirs: string[] = [];

async function run(cmd: string[], what: string, options: { cwd?: string; env?: Record<string, string> } = {}): Promise<string> {
  const proc = Bun.spawn(cmd, { cwd: options.cwd, env: { ...process.env, ...options.env }, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
  if (code !== 0) throw new Error(`${what} failed (exit ${code}):\n${(stderr || stdout).split("\n").slice(0, 40).join("\n")}`);
  return stdout;
}

const hasSwift = process.platform === "darwin" && Bun.spawnSync(["xcrun", "--find", "swiftc"]).exitCode === 0;
const hasCargo = Bun.spawnSync(["sh", "-c", "command -v cargo"]).exitCode === 0;
const program = transpile(PROGRAM);

/** bun's checksums: `leakRound()` run ROUNDS times, then `stressRound()` STRESS times, then the reachable stress nodes. */
async function reference(): Promise<{ sums: string[]; stress: string[]; reachable: number }> {
  const m: { leakRound: () => number; stressRound: () => number; stressReachable: () => number } = await import(PROGRAM);
  const sums = Array.from({ length: ROUNDS }, () => String(m.leakRound()));
  const stress = Array.from({ length: STRESS }, () => String(m.stressRound()));
  return { sums, stress, reachable: m.stressReachable() };
}

interface Round {
  sum: string;
  before: number;
  freed: number;
  live: number;
}

function parse(out: string): Round[] {
  return out
    .trim()
    .split("\n")
    .filter((l) => l.startsWith("round "))
    .map((l) => {
      const [, , sum, before, freed, live] = l.split(" ");
      return { sum: sum!, before: Number(before), freed: Number(freed), live: Number(live) };
    });
}

/**
 * The stress rounds' checksums are bun's (nothing reachable was freed by a slice); after the last pass and a full
 * collection, exactly the world, the kept ring and the reachable stress nodes are alive; passes ran and freed objects.
 */
function checkStress(out: string, ref: { stress: string[]; reachable: number }) {
  const lines = out.trim().split("\n");
  expect(lines.filter((l) => l.startsWith("stress ")).map((l) => l.split(" ")[2])).toEqual(ref.stress);
  const [, live, passes, freed] = lines.find((l) => l.startsWith("stressEnd "))!.split(" ").map(Number);
  if (process.env.NUCLO_LEAKS_VERBOSE) console.log(lines.filter((l) => l.startsWith("stressEnd ") || l.startsWith("pause ")));
  expect(live).toBe(46 + ref.reachable);
  expect(passes).toBeGreaterThan(2);
  expect(freed).toBeGreaterThan(0);
}

/** Every round frees what it dropped, and the live count after collecting never grows. */
function checkRounds(rounds: Round[], sums: string[]) {
  if (process.env.NUCLO_LEAKS_VERBOSE) console.log(rounds.slice(0, 3), rounds.at(-1));
  expect(rounds.length).toBe(ROUNDS);
  expect(rounds.map((r) => r.sum)).toEqual(sums);
  const baseline = rounds[1]!.live;
  for (const r of rounds) expect(r.freed).toBeGreaterThan(0);
  for (const r of rounds.slice(1)) expect(r.live).toBe(baseline);
  // The world (40 hubs), the kept ring (6) and the stress test's ring (its head and 20 000 nodes) stay.
  expect(baseline).toBe(46 + 20001);
}

async function swiftBuild(optimize: boolean): Promise<string> {
  const dir = mkdtempSync(path.join(tmpdir(), "nuclo-leaks-swift-"));
  dirs.push(dir);
  writeFileSync(path.join(dir, "app.swift"), emitSwift(program).replace(/^@main$/m, ""));
  cpSync(path.join(RUNTIMES, "ios/NucloRuntime.swift"), path.join(dir, "NucloRuntime.swift"));
  cpSync(path.join(RUNTIMES, "macos/UIKitShim.swift"), path.join(dir, "UIKitShim.swift"));
  writeFileSync(
    path.join(dir, "Harness.swift"),
    `@main struct Harness {
    @MainActor static func main() {
        nucloMain()
        for r in 0..<${ROUNDS} {
            let sum = leakRound()
            let before = JsGc.liveCount
            let freed = jsGcCollect()
            print("round \\(r) \\(jsNum(Double(sum))) \\(before) \\(freed) \\(JsGc.liveCount)")
        }
        // Stress: short slices of the incremental collector between rounds that rewire a big graph; at round 100 a
        // full collection ends the running pass.
        JsGc.sliceNanos = 100_000
        JsGc.threshold = 300
        JsGc.stepMax = 1_000
        for r in 0..<${STRESS} {
            let sum = stressRound()
            jsGcStartPass()
            for _ in 0..<3 { jsGcStep() }
            if r == 100 { jsGcCollect() }
            print("stress \\(r) \\(jsNum(Double(sum)))")
        }
        while JsGc.passActive { jsGcStep() }
        let freed = JsGc.passFreed
        jsGcCollect()
        print("stressEnd \\(JsGc.liveCount) \\(JsGc.passes) \\(freed)")
    }
}
`,
  );
  const exe = path.join(dir, "leaks");
  const arch = process.arch === "arm64" ? "arm64" : "x86_64";
  const sources = ["app", "NucloRuntime", "UIKitShim", "Harness"].map((f) => path.join(dir, `${f}.swift`));
  await run(["xcrun", "swiftc", ...(optimize ? ["-O", "-wmo"] : []), "-target", `${arch}-apple-macos13.0`, "-swift-version", "5", "-parse-as-library", "-suppress-warnings", "-o", exe, ...sources], "swiftc");
  return exe;
}

async function rustRun(): Promise<string> {
  const dir = mkdtempSync(path.join(tmpdir(), "nuclo-leaks-rust-"));
  dirs.push(dir);
  mkdirSync(path.join(dir, "src/native"), { recursive: true });
  cpSync(path.join(RUNTIMES, "rust/src/nuclo"), path.join(dir, "src/nuclo"), { recursive: true });
  writeFileSync(path.join(dir, "src/native/mod.rs"), "");
  const headless = readFileSync(path.join(import.meta.dir, "parity/headless.rs"), "utf8").replace(/fn main\(\) \{[\s\S]*$/, "");
  writeFileSync(
    path.join(dir, "src/main.rs"),
    `${headless}
fn main() {
    let backend = Rc::new(Headless::default());
    nuclo::start(backend.clone());
    app::nuclo_main();
    for r in 0..${ROUNDS} {
        let sum = app::leak_round();
        let before = nuclo::prelude::gc_live();
        let freed = nuclo::prelude::gc_collect();
        println!("round {r} {sum} {before} {freed} {}", nuclo::prelude::gc_live());
    }
    // Stress (as the Swift harness): short slices between rounds that rewire a big graph.
    use nuclo::prelude::*;
    gc_set_slice(100_000, 1_000);
    gc_set_threshold(300);
    for r in 0..${STRESS} {
        let sum = app::stress_round();
        gc_start_pass();
        for _ in 0..3 {
            gc_step();
        }
        if r == 100 {
            gc_collect();
        }
        println!("stress {r} {sum}");
    }
    while gc_pass_active() {
        gc_step();
    }
    let freed = gc_stats().pass_freed;
    gc_collect();
    println!("stressEnd {} {} {freed}", gc_live(), gc_stats().passes);
}
`,
  );
  writeFileSync(path.join(dir, "src/app.rs"), `${emitRust(program, { native: true })}\npub fn leak_round() -> String { js_num(leakRound() as f64) }\npub fn stress_round() -> String { js_num(stressRound() as f64) }\n`);
  writeFileSync(path.join(dir, "Cargo.toml"), '[package]\nname = "leaks"\nversion = "0.0.0"\nedition = "2021"\n\n[dependencies]\nserde_json = "1"\nureq = "3.5"\nunicode-normalization = "0.1"\n');
  const target = path.join(CACHE, "cargo-leaks");
  await run(["cargo", "build", "--offline", "--quiet"], "cargo build", { cwd: dir, env: { CARGO_TARGET_DIR: target } });
  return run([path.join(target, "debug/leaks")], "the Rust program");
}

describe("cycle collector leaks", () => {
  afterAll(() => {
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  });
  const ref = reference();

  test.skipIf(!hasSwift)("swift", async () => {
    const [debug, optimized] = await Promise.all([swiftBuild(false), swiftBuild(true)]);
    for (const exe of [debug, optimized]) {
      const out = await run([exe], "the Swift program");
      checkRounds(parse(out), (await ref).sums);
      checkStress(out, await ref);
    }
    // macOS leaks: nothing unreachable left at exit.
    const report = Bun.spawnSync(["leaks", "--atExit", "--", optimized], { stdout: "pipe", stderr: "pipe" });
    const text = report.stdout.toString();
    expect(/(\d+) leaks? for (\d+) total leaked bytes/.exec(text)?.[1]).toBe("0");
  }, 600_000);

  test.skipIf(!hasCargo)("rust", async () => {
    const out = await rustRun();
    checkRounds(parse(out), (await ref).sums);
    checkStress(out, await ref);
  }, 600_000);
});
