/**
 * The compiler's contract: TypeScript that would not build, or would behave differently, natively
 * is rejected with a diagnostic; everything else compiles. `bun test`.
 *
 * test/fixtures/reject/*.ts each start with `// expect: <part of the diagnostic>`.
 * test/fixtures/accept.ts and the examples must compile; `bun run check:android` also builds their Kotlin.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import * as path from "node:path";
import { emitKotlin } from "../src/compiler/emitKotlin.ts";
import { emitRust } from "../src/compiler/emitRust.ts";
import { emitSwift } from "../src/compiler/emitSwift.ts";
import { CompileError, transpile } from "../src/compiler/transpile.ts";

const fixtures = path.join(import.meta.dir, "fixtures");

function diagnostics(file: string): string[] {
  try {
    transpile(file);
    return [];
  } catch (error) {
    if (error instanceof CompileError) return error.diagnostics.map((d) => `${d.line}:${d.column} ${d.message}`);
    throw error;
  }
}

describe("rejects what can't be native", () => {
  for (const name of readdirSync(path.join(fixtures, "reject")).sort()) {
    const file = path.join(fixtures, "reject", name);
    const expected = /^\/\/ expect: (.+)$/m.exec(readFileSync(file, "utf8"))?.[1];
    test(name.replace(/\.ts$/, ""), () => {
      expect(expected).toBeDefined();
      const found = diagnostics(file);
      expect(found.length).toBeGreaterThan(0);
      expect(found.join("\n")).toContain(expected!);
    });
  }
});

describe("compiles valid apps", () => {
  for (const file of [path.join(fixtures, "accept.ts"), ...["full-showcase", "bench"].map((a) => path.join(import.meta.dir, "../examples", a, "App.ts"))]) {
    test(path.relative(path.join(import.meta.dir, ".."), file), () => {
      expect(diagnostics(file)).toEqual([]);
      const program = transpile(file);
      expect(emitSwift(program)).toContain("func nucloMain()");
      expect(emitKotlin(program)).toContain("fun nucloMain()");
      expect(emitRust(program)).toContain("pub fn nuclo_main()");
    });
  }

  // The Rust printer reports what an app uses that the Linux runtime lacks: no example may need any of it.
  const examples = path.join(import.meta.dir, "../examples");
  for (const example of readdirSync(examples, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
    test(`examples/${example.name} on linux`, () => {
      const warnings: string[] = [];
      const native = existsSync(path.join(examples, example.name, "native/linux"));
      const rust = emitRust(transpile(path.join(examples, example.name, "App.ts")), { native, warn: (message) => warnings.push(message) });
      expect(rust).toContain("pub fn nuclo_main()");
      expect(warnings).toEqual([]);
    });
  }
});
