#!/usr/bin/env bun
/**
 * nuclo-native-ts build <entry.ts> --out <dir> [--target ios,android,web,…]
 *
 * Writes one folder per target under <dir>, each the complete source of that platform's app
 * (see the README for the host projects). Without --target every target is built.
 */
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { emitKotlin } from "./emitKotlin.ts";
import { emitRust } from "./emitRust.ts";
import { emitSwift } from "./emitSwift.ts";
import type { Program } from "./ir.ts";
import { CompileError, transpile } from "./transpile.ts";
import { buildWeb } from "./web.ts";

const RUNTIMES = path.resolve(import.meta.dirname, "../runtimes");

interface TargetInput {
  program: Program;
  /** The app's entry file, absolute. */
  entry: string;
  /** The entry's base name: generated sources are named after it. */
  name: string;
  /** This target's folder, created. */
  dir: string;
}

/**
 * The app's platform code — its native components and `declare function`s — lives in
 * native/<target>/ beside the entry file, and is compiled with the generated sources.
 */
export function copyNative(entry: string, target: string, dir: string) {
  const native = path.join(path.dirname(entry), "native", target);
  if (!existsSync(native)) return;
  for (const file of readdirSync(native)) copyFileSync(path.join(native, file), path.join(dir, file));
}

/** A target writes its sources into `dir` and returns the main file it wrote. */
const TARGETS: Record<string, (input: TargetInput) => string | Promise<string>> = {
  ios({ program, entry, name, dir }) {
    writeFileSync(path.join(dir, `${name}.swift`), emitSwift(program));
    copyFileSync(path.join(RUNTIMES, "ios/NucloRuntime.swift"), path.join(dir, "NucloRuntime.swift"));
    copyNative(entry, "ios", dir);
    return path.join(dir, `${name}.swift`);
  },
  android({ program, entry, name, dir }) {
    writeFileSync(path.join(dir, `${name}.kt`), emitKotlin(program));
    copyFileSync(path.join(RUNTIMES, "android/NucloRuntime.kt"), path.join(dir, "NucloRuntime.kt"));
    copyNative(entry, "android", dir);
    return path.join(dir, `${name}.kt`);
  },
  web: ({ entry, dir }) => buildWeb(entry, dir),
  // A Cargo project: the Rust runtime (core + GTK 4 backend), the generated src/app.rs, and the
  // app's own native/linux/ as the `native` module. `cargo build --offline --release` builds it.
  linux({ program, entry, dir }) {
    cpSync(path.join(RUNTIMES, "rust"), dir, { recursive: true });
    const native = path.join(path.dirname(entry), "native/linux");
    if (existsSync(native)) cpSync(native, path.join(dir, "src/native"), { recursive: true });
    // The package (and the binary) is named after the app's folder: projects that share a
    // CARGO_TARGET_DIR then never take each other's build for their own.
    const crate = path.basename(path.dirname(entry)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "app";
    const manifest = path.join(dir, "Cargo.toml");
    writeFileSync(manifest, readFileSync(manifest, "utf8").replace('name = "nuclo-app"', `name = "nuclo-${crate}"`));
    writeFileSync(path.join(dir, "src/app.rs"), emitRust(program, { native: existsSync(native), warn: (message) => console.warn(message) }));
    return path.join(dir, "src/app.rs");
  },
  // The same Cargo project drawn by GPUI: the Rust runtime's core (runtimes/rust/src/nuclo) with
  // the GPUI backend and manifest of runtimes/rust-gpui, and the app's own native/linux-gpui/.
  "linux-gpui"({ program, entry, dir }) {
    cpSync(path.join(RUNTIMES, "rust-gpui"), dir, { recursive: true });
    cpSync(path.join(RUNTIMES, "rust/src/nuclo"), path.join(dir, "src/nuclo"), { recursive: true });
    const native = path.join(path.dirname(entry), "native/linux-gpui");
    if (existsSync(native)) cpSync(native, path.join(dir, "src/native"), { recursive: true });
    const crate = path.basename(path.dirname(entry)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "app";
    const manifest = path.join(dir, "Cargo.toml");
    writeFileSync(manifest, readFileSync(manifest, "utf8").replace('name = "nuclo-app"', `name = "nuclo-${crate}"`));
    // The Rust printer names the GTK target's folder in its warning.
    const warn = (message: string) => console.warn(message.replaceAll("linux", "linux-gpui"));
    writeFileSync(path.join(dir, "src/app.rs"), emitRust(program, { native: existsSync(native), warn }));
    return path.join(dir, "src/app.rs");
  },
};

function usage(): never {
  console.error(`usage: nuclo-native-ts build <entry.ts> --out <dir> [--target ${Object.keys(TARGETS).join(",")}]`);
  process.exit(2);
}

const [command, entry, ...rest] = process.argv.slice(2);
const flag = (name: string) => {
  const at = rest.indexOf(name);
  return at >= 0 ? rest[at + 1] : undefined;
};
const out = flag("--out");
if (command !== "build" || !entry || !out) usage();
const targets = flag("--target")?.split(",") ?? Object.keys(TARGETS);
for (const target of targets) if (!TARGETS[target]) usage();

const name = path.basename(entry, path.extname(entry));
const started = performance.now();
try {
  // Every target is checked by the same front-end, so an app that builds for one builds for all.
  const program = transpile(entry);
  const written: string[] = [];
  for (const target of targets) {
    const dir = path.join(out, target);
    mkdirSync(dir, { recursive: true });
    written.push(await TARGETS[target]!({ program, entry: path.resolve(entry), name, dir }));
  }
  console.log(`${entry} → ${written.join(", ")} (${Math.round(performance.now() - started)} ms)`);
} catch (error) {
  if (error instanceof CompileError) {
    console.error(error.message);
    console.error(`\n${error.diagnostics.length} error${error.diagnostics.length === 1 ? "" : "s"}; nothing was written.`);
    process.exit(1);
  }
  throw error;
}
