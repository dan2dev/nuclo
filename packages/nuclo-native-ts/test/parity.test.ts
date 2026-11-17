/**
 * Cross-target parity: examples/language/all.ts (every checks*.ts it wires in) is compiled to Swift (macOS, swiftc),
 * Rust (native cargo, debug: integer overflow traps), Kotlin (plain JVM through Gradle, NucloJs.kt without Android)
 * and bundled for the web, each is run, and each must print exactly what bun prints for all.ts
 * (test/parity/reference.ts). A target whose toolchain is missing is skipped with a message.
 * NUCLO_PARITY_TARGETS=swift,rust picks targets. Builds go to the system temp folder.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import * as path from "node:path";
import { emitKotlin } from "../src/compiler/emitKotlin.ts";
import { emitRust } from "../src/compiler/emitRust.ts";
import { emitSwift } from "../src/compiler/emitSwift.ts";
import type { Program } from "../src/compiler/ir.ts";
import { transpile } from "../src/compiler/transpile.ts";
import { differences } from "./parity/differences.ts";

const ROOT = path.resolve(import.meta.dir, "..");
const CORPUS = path.join(ROOT, "examples/language/all.ts");
const REFERENCE = path.join(import.meta.dir, "parity/reference.ts");
const RUNTIMES = path.join(ROOT, "src/runtimes");
/** Kept between runs: cargo's and Gradle's incremental builds. */
const CACHE = path.join(tmpdir(), "nuclo-parity-cache");
/** One Gradle build at a time (mkdir lock); NUCLO_GRADLE_LOCK names the lock other tools take. */
const GRADLE_LOCK = process.env.NUCLO_GRADLE_LOCK ?? path.join(tmpdir(), "nuclo-gradle.lock");
const JAVA_HOME = process.env.JAVA_HOME ?? [path.join(homedir(), ".sdkman/candidates/java/current")].find(existsSync);

async function run(cmd: string[], options: { cwd?: string; env?: Record<string, string> } = {}) {
  const proc = Bun.spawn(cmd, { cwd: options.cwd, env: { ...process.env, ...options.env }, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
  return { stdout, stderr, code };
}

const which = (tool: string) => Bun.spawnSync(["sh", "-c", `command -v ${tool}`]).exitCode === 0;

/** Output of a program, or an Error with what went wrong (a build's errors, a crash's stderr). */
async function program(cmd: string[], what: string, options?: { cwd?: string; env?: Record<string, string> }): Promise<string> {
  const r = await run(cmd, options);
  if (r.code !== 0) throw new Error(`${what} failed (exit ${r.code}):\n${(r.stderr || r.stdout).split("\n").filter((l) => !/^w: /.test(l)).slice(0, 40).join("\n")}`);
  return r.stdout;
}

const swift = {
  missing: process.platform !== "darwin" || Bun.spawnSync(["xcrun", "--find", "swiftc"]).exitCode !== 0 ? "needs macOS with swiftc (xcrun)" : undefined,
  async build(p: Program, dir: string) {
    writeFileSync(path.join(dir, "all.swift"), emitSwift(p).replace(/^@main$/m, ""));
    cpSync(path.join(RUNTIMES, "ios/NucloRuntime.swift"), path.join(dir, "NucloRuntime.swift"));
    cpSync(path.join(RUNTIMES, "macos/UIKitShim.swift"), path.join(dir, "UIKitShim.swift"));
    writeFileSync(
      path.join(dir, "Harness.swift"),
      `import Foundation
@main struct Harness {
    @MainActor static func done() -> Bool {
        for c in asyncChecks { var last: String? = nil; for l in c.log.lines { last = l }; if last != "done" { return false } }
        return true
    }
    @MainActor static func main() {
        nucloMain()
        let end = Date().addingTimeInterval(3)
        while Date() < end && !done() { RunLoop.main.run(until: Date().addingTimeInterval(0.002)) }
        for c in checks { print("## \\(c.name)"); for l in c.lines { print(l) } }
        for c in asyncChecks { print("## \\(c.name)"); for l in c.log.lines { print(l) } }
    }
}
`,
    );
    const sources = readdirSync(dir).filter((f) => f.endsWith(".swift")).map((f) => path.join(dir, f));
    const arch = process.arch === "arm64" ? "arm64" : "x86_64";
    const exe = path.join(dir, "harness");
    await program(["xcrun", "swiftc", "-target", `${arch}-apple-macos13.0`, "-swift-version", "5", "-parse-as-library", "-suppress-warnings", "-o", exe, ...sources], "swiftc");
    return program([exe], "the Swift program");
  },
};

const rust = {
  missing: which("cargo") ? undefined : "needs cargo",
  async build(p: Program, dir: string) {
    mkdirSync(path.join(dir, "src/native"), { recursive: true });
    cpSync(path.join(RUNTIMES, "rust/src/nuclo"), path.join(dir, "src/nuclo"), { recursive: true });
    writeFileSync(path.join(dir, "src/native/mod.rs"), "");
    cpSync(path.join(import.meta.dir, "parity/headless.rs"), path.join(dir, "src/main.rs"));
    writeFileSync(
      path.join(dir, "src/app.rs"),
      `${emitRust(p, { native: true })}
pub fn parity_done() -> bool {
    g::asyncChecks.get().to_vec().iter().all(|c| c.log.get().lines.get().to_vec().last().map_or(false, |l| l == "done"))
}

pub fn parity_checks() -> Vec<(String, Vec<String>)> {
    let mut out: Vec<(String, Vec<String>)> = g::checks.get().to_vec().into_iter().map(|c| (c.name.get(), c.lines.get().to_vec())).collect();
    out.extend(g::asyncChecks.get().to_vec().into_iter().map(|c| (c.name.get(), c.log.get().lines.get().to_vec())));
    out
}
`,
    );
    writeFileSync(path.join(dir, "Cargo.toml"), '[package]\nname = "parity"\nversion = "0.0.0"\nedition = "2021"\n\n[dependencies]\nserde_json = "1"\nureq = "3.5"\nunicode-normalization = "0.1"\n');
    const target = path.join(CACHE, "cargo");
    await program(["cargo", "build", "--offline", "--quiet"], "cargo build", { cwd: dir, env: { CARGO_TARGET_DIR: target } });
    return program([path.join(target, "debug/parity")], "the Rust program");
  },
};

const kotlin = {
  missing: JAVA_HOME || which("java") ? undefined : "needs a JDK 17+ (JAVA_HOME)",
  async build(p: Program, dir: string) {
    writeFileSync(path.join(dir, "all.kt"), emitKotlin(p).replace(/^class MainActivity\b.*$/m, ""));
    cpSync(path.join(RUNTIMES, "android/NucloJs.kt"), path.join(dir, "NucloJs.kt"));
    writeFileSync(
      path.join(dir, "Main.kt"),
      `package dev.nuclo.app

import dev.nuclo.runtime.*

fun main() {
    nucloMain()
    jvmRunLoop(3000) { asyncChecks.all { it.log.lines.lastOrNull() == "done" } }
    for (c in checks) { println("## \${c.name}"); for (l in c.lines) println(l) }
    for (c in asyncChecks) { println("## \${c.name}"); for (l in c.log.lines) println(l) }
}
`,
    );
    const build = path.join(CACHE, "jvm");
    while (true) {
      try {
        mkdirSync(GRADLE_LOCK);
        break;
      } catch {
        await Bun.sleep(1000);
      }
    }
    try {
      await program(
        [path.join(ROOT, "hosts/android/gradlew"), "-p", path.join(ROOT, "hosts/jvm"), "installDist", "--offline", "-q", `-PnucloSources=${dir}`, `-PnucloBuildDir=${build}`],
        "gradle (hosts/jvm)",
        { env: JAVA_HOME ? { JAVA_HOME } : {} },
      );
      return await program([path.join(build, "install/nuclo-jvm/bin/nuclo-jvm")], "the JVM program", { env: JAVA_HOME ? { JAVA_HOME } : {} });
    } finally {
      rmSync(GRADLE_LOCK, { recursive: true, force: true });
    }
  },
};

/** The web target's bundle (the web runtime in place of the API module, minified), run by bun. */
const web = {
  missing: undefined,
  async build(_p: Program, dir: string) {
    const API = path.join(ROOT, "src/index.ts");
    const result = await Bun.build({
      entrypoints: [CORPUS],
      outdir: dir,
      target: "browser",
      minify: true,
      plugins: [
        {
          name: "nuclo-web-runtime",
          setup(b) {
            b.onResolve({ filter: /index\.ts$/ }, (args) =>
              path.resolve(path.dirname(args.importer), args.path) === API ? { path: path.join(RUNTIMES, "web/index.ts") } : undefined,
            );
          },
        },
      ],
    });
    if (!result.success) throw new Error(result.logs.map(String).join("\n"));
    return program(["bun", REFERENCE, result.outputs[0]!.path], "the web bundle");
  },
};

const TARGETS = { swift, rust, kotlin, web };
const chosen = process.env.NUCLO_PARITY_TARGETS?.split(",") ?? Object.keys(TARGETS);

describe("parity with bun", () => {
  let reference: Promise<string>;
  const outputs: Record<string, Promise<string>> = {};
  const dirs: string[] = [];

  beforeAll(() => {
    reference = program(["bun", REFERENCE], "bun all.ts");
    const p = transpile(CORPUS);
    mkdirSync(CACHE, { recursive: true });
    // Every target builds and runs at once; each test waits for its own.
    for (const [name, target] of Object.entries(TARGETS)) {
      if (!chosen.includes(name) || target.missing) continue;
      const dir = mkdtempSync(path.join(tmpdir(), `nuclo-parity-${name}-`));
      dirs.push(dir);
      outputs[name] = target.build(p, dir);
      outputs[name].catch(() => {});
    }
    // Compiling the corpus takes seconds (more than bun's default 5 s hook timeout on a busy machine).
  }, 60_000);
  afterAll(() => {
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  });

  test("bun runs the corpus", async () => {
    expect((await reference).length).toBeGreaterThan(0);
  });

  for (const [name, target] of Object.entries(TARGETS)) {
    const skip = !chosen.includes(name) ? "not in NUCLO_PARITY_TARGETS" : target.missing;
    if (skip) {
      test.skip(`${name} (skipped: ${skip})`, () => {});
      continue;
    }
    test(name, async () => {
      expect(differences(await reference, await outputs[name]!)).toBe("");
    }, 600_000);
  }
});
