#!/usr/bin/env -S npx tsx
/**
 * nuclo-native-ts build <entry.ts> --out <dir>
 *
 * Writes <dir>/ios/{App.swift,NucloRuntime.swift} and <dir>/android/{App.kt,NucloRuntime.kt}:
 * each folder is the complete source of a native app (see the README for the host projects).
 */
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { emitKotlin } from "./emitKotlin.ts";
import { emitSwift } from "./emitSwift.ts";
import { CompileError, transpile } from "./transpile.ts";

const RUNTIMES = path.resolve(import.meta.dirname, "../runtimes");

function usage(): never {
  console.error("usage: nuclo-native-ts build <entry.ts> --out <dir>");
  process.exit(2);
}

const [command, entry, ...rest] = process.argv.slice(2);
const outFlag = rest.indexOf("--out");
const out = outFlag >= 0 ? rest[outFlag + 1] : undefined;
if (command !== "build" || !entry || !out) usage();

const name = path.basename(entry, path.extname(entry));
const started = performance.now();
try {
  const program = transpile(entry);
  const ios = path.join(out, "ios");
  const android = path.join(out, "android");
  mkdirSync(ios, { recursive: true });
  mkdirSync(android, { recursive: true });
  writeFileSync(path.join(ios, `${name}.swift`), emitSwift(program));
  writeFileSync(path.join(android, `${name}.kt`), emitKotlin(program));
  copyFileSync(path.join(RUNTIMES, "ios/NucloRuntime.swift"), path.join(ios, "NucloRuntime.swift"));
  copyFileSync(path.join(RUNTIMES, "android/NucloRuntime.kt"), path.join(android, "NucloRuntime.kt"));
  const ms = Math.round(performance.now() - started);
  console.log(`${entry} → ${path.join(ios, `${name}.swift`)}, ${path.join(android, `${name}.kt`)} (${ms} ms)`);
} catch (error) {
  if (error instanceof CompileError) {
    console.error(error.message);
    console.error(`\n${error.diagnostics.length} error${error.diagnostics.length === 1 ? "" : "s"}; nothing was written.`);
    process.exit(1);
  }
  throw error;
}
