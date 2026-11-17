/**
 * The compiler's contract: TypeScript that would not build, or would behave differently, natively
 * is rejected with a diagnostic; everything else compiles. `bun test`.
 *
 * test/fixtures/reject/*.ts each start with `// expect: <part of the diagnostic>` and `// code: <its code>` (NUCLO1004…).
 * test/fixtures/accept.ts and the examples must compile; `bun run check:android` also builds their Kotlin.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { emitKotlin } from "../src/compiler/emitKotlin.ts";
import { emitRust } from "../src/compiler/emitRust.ts";
import { emitSwift } from "../src/compiler/emitSwift.ts";
import { emitWasmNative } from "../src/compiler/wasmNative.ts";
import { CompileError, type Diagnostic, transpile } from "../src/compiler/transpile.ts";

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
    const text = readFileSync(file, "utf8");
    const expected = /^\/\/ expect: (.+)$/m.exec(text)?.[1];
    // `// code: NUCLO1004` (README "Diagnostic codes"; TS2322 for TypeScript's own): the code of the expected diagnostic.
    const code = /^\/\/ code: (\S+)$/m.exec(text)?.[1];
    test(name.replace(/\.ts$/, ""), () => {
      expect(expected).toBeDefined();
      let all: Diagnostic[] = [];
      try {
        transpile(file);
      } catch (error) {
        if (!(error instanceof CompileError)) throw error;
        all = error.diagnostics;
      }
      expect(all.length).toBeGreaterThan(0);
      const found = all.find((d) => `${d.line}:${d.column} ${d.message}`.includes(expected!));
      expect(all.map((d) => `${d.line}:${d.column} ${d.message}`).join("\n")).toContain(expected!);
      // At the app's code: never in TypeScript's lib, the API, or another file.
      expect(all.map((d) => path.resolve(d.file)).filter((f) => f !== file)).toEqual([]);
      expect(found!.line).toBeGreaterThan(0);
      expect(code ? found!.id : `add "// code: ${found!.id}" under the expect line`).toBe(code ?? "");
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
    // An example with platform code builds only for the targets it has code for (as scripts/examples.ts does).
    const phoneOnly = existsSync(path.join(examples, example.name, "native")) && !existsSync(path.join(examples, example.name, "native/linux"));
    test.skipIf(phoneOnly)(`examples/${example.name} on linux`, () => {
      const warnings: string[] = [];
      const native = existsSync(path.join(examples, example.name, "native/linux"));
      const rust = emitRust(transpile(path.join(examples, example.name, "App.ts")), { native, warn: (message) => warnings.push(message) });
      expect(rust).toContain("pub fn nuclo_main()");
      expect(warnings).toEqual([]);
      // examples/language is the whole check corpus: compiling it takes several seconds.
    }, 60_000);
  }
});

describe("style shorthands", () => {
  test("nuclo-core's short keys build what the long keys build", () => {
    const short = transpile(path.join(fixtures, "shorthand/short.ts"));
    const long = transpile(path.join(fixtures, "shorthand/long.ts"));
    for (const emit of [emitKotlin, emitSwift, emitRust]) expect(emit(short).replace(/short\.ts/, "long.ts")).toBe(emit(long));
  });
});

describe("progress and meter", () => {
  const source = emitKotlin(transpile(path.join(fixtures, "gauge/meter.ts")));
  test("are a track with a fill whose width follows the value", () => {
    expect(source).toContain('"progress",');
    expect(source).toContain("widthPct = kotlin.comparisons.maxOf(0.0, kotlin.comparisons.minOf(100.0, (gaugeValue - 0.0) / 100.0 * 100.0))");
  });
  test("a meter picks its color as HTML does", () => {
    expect(source).toContain('if (gaugeValue < 33.0) "#22c55e" else if (gaugeValue > 66.0) "#ef4444" else "#eab308"');
    expect(source).toContain('if (gaugeValue > 66.0) "#22c55e" else if (gaugeValue < 33.0) "#ef4444" else "#eab308"');
    expect(source).toContain('if (gaugeValue >= 33.0 && gaugeValue <= 66.0) "#22c55e" else "#eab308"');
  });
});

describe("wasm target", () => {
  const installed = Bun.spawnSync(["rustup", "target", "list", "--installed"]).stdout.toString().includes("wasm32-unknown-unknown");
  // The module is built from the generated Rust and the page's half bundled beside it: every call the module
  // imports must be one the page provides, or the page fails to start.
  test.skipIf(!installed)("builds, and host.js provides what app.wasm imports", async () => {
    const out = mkdtempSync(path.join(tmpdir(), "nuclo-wasm-"));
    const built = Bun.spawnSync(["bun", path.join(import.meta.dir, "../src/compiler/cli.ts"), "build", path.join(import.meta.dir, "../examples/percent/App.ts"), "--out", out, "--target", "wasm"], { stderr: "pipe" });
    expect(built.stderr.toString()).toBe("");
    const dir = path.join(out, "wasm");
    for (const file of ["index.html", "host.js", "app.wasm"]) expect(existsSync(path.join(dir, file))).toBe(true);
    const host = readFileSync(path.join(dir, "host.js"), "utf8");
    const module = new WebAssembly.Module(readFileSync(path.join(dir, "app.wasm")));
    const imports = WebAssembly.Module.imports(module);
    expect(imports.length).toBeGreaterThan(20);
    for (const { module: from, name } of imports) {
      expect(from).toBe("nuclo");
      expect(host).toContain(`${name}`);
    }
    expect(WebAssembly.Module.exports(module).map((e) => e.name)).toContain("nuclo_start");
    rmSync(out, { recursive: true, force: true });
  }, 180_000);

  // The app's platform code is the web target's TypeScript: the Rust glue to it is generated from the app's types.
  test("the glue to native components and functions is generated from the app's types", () => {
    const glue = emitWasmNative(transpile(path.join(import.meta.dir, "../examples/native-components/App.ts")));
    expect(glue).toContain("impl NativeComponent<SliderProps> for Slider");
    expect(glue).toContain('json.set("tint", match props.tint.get() { Some(x) => Json::from(x), None => Json::Null });');
    expect(glue).toContain('json.callback(0, "onChange"');
    expect(glue).toContain("json::double(args.get(0).unwrap_or(&Json::Null))?");
    expect(glue).toContain("pub fn platformName() -> String");
    expect(glue).toContain("pub async fn batteryLevel() -> f64");
    expect(glue).toContain('host_call("batteryLevel", vec![])');
  });

  test("a prop the page can't be given as JSON is an error", () => {
    expect(() => emitWasmNative(transpile(path.join(fixtures, "wasm-native/object-prop.ts")))).toThrow("can't be sent to the page as JSON");
  });
});

describe("select", () => {
  const kotlin = emitKotlin(transpile(path.join(import.meta.dir, "../examples/select/App.ts")));
  test("is a closure that holds what is open and chosen, and builds a box", () => {
    expect(kotlin).toContain("var selectOpen0: Boolean = false");
    expect(kotlin).toContain('var selectChosen0: String = "s"');
    expect(kotlin).toContain('"select",');
    expect(kotlin).toContain("`when`({ selectOpen0 })");
  });
  test("an option sets what is chosen, closes the select and reports the value", () => {
    expect(kotlin).toContain('selectChosen0 = "m"');
    expect(kotlin).toContain("selectOpen0 = false");
    expect(kotlin).toContain('selectChange0(selectEvent("m"))');
  });
  test("the chosen text is the text of the option whose value is chosen", () => {
    expect(kotlin).toContain('if (size == "l") "${"Large"}" else ""');
    // Uncontrolled: what the select holds.
    expect(kotlin).toContain('if (selectChosen1 == "lemon")');
  });
  test("the options of a list add a piece for every item", () => {
    expect(kotlin).toMatch(/cities\.mapTo\(ArrayList\(\)\) \{ c ->[\s\S]*joinToString\(""\)/);
  });
});

describe("diagnostics", () => {
  const cli = path.join(import.meta.dir, "../src/compiler/cli.ts");
  const cascade = path.join(fixtures, "diagnostics/cascade.ts");
  const check = (...args: string[]) => Bun.spawnSync(["bun", cli, "check", ...args], { env: { ...process.env, NO_COLOR: "1" }, stdout: "pipe", stderr: "pipe" });

  test("one error per cause, at the app's code, each with its code, frame, fix and docs", () => {
    const r = check(cascade);
    expect(r.exitCode).toBe(1);
    const out = r.stderr.toString();
    expect(out).toContain("test/fixtures/diagnostics/cascade.ts:9:13 - error NUCLO6002: `eval` cannot be compiled ahead of time.");
    expect(out).toContain('9   const z = eval("1");\n              ~~~~');
    expect(out).toContain("fix: write `(x) => !!x`");
    expect(out).toContain("README.md#nuclo3001");
    expect(out).not.toContain(".d.ts");
    expect(out).toEndWith("Found 3 errors.\n");
  }, 60_000);

  test("--json is what tools read", () => {
    const found = JSON.parse(check(cascade, "--json").stdout.toString());
    expect(found.map((d: Diagnostic) => [d.line, d.column, d.id, d.fix])).toEqual([
      [9, 13, "NUCLO6002", undefined],
      [13, 20, "NUCLO6001", "(x) => !!x"],
      [15, 31, "NUCLO3001", "Math.fround(0.1)"],
    ]);
    expect(found[0].file).toBe(cascade);
  }, 60_000);

  test("a clean entry exits 0, a usage error 2", () => {
    expect(check(path.join(fixtures, "diagnostics/clean.ts")).exitCode).toBe(0);
    expect(check().exitCode).toBe(2);
  }, 60_000);

  test("the editor plugin shows the same codes at the same ranges, with the fixes as quick fixes", async () => {
    const ts = (await import("typescript")).default;
    const { appCompilerOptions } = await import("../src/compiler/transpile.ts");
    const host = {
      getScriptFileNames: () => [cascade],
      getScriptVersion: () => "1",
      getScriptSnapshot: (f: string) => (existsSync(f) ? ts.ScriptSnapshot.fromString(readFileSync(f, "utf8")) : undefined),
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => appCompilerOptions(),
      getDefaultLibFileName: ts.getDefaultLibFilePath,
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
    };
    let refreshed!: () => void;
    const done = new Promise<void>((resolve) => (refreshed = resolve));
    const info = { languageService: ts.createLanguageService(host), config: {}, project: { projectService: { logger: { info() {} } }, refreshDiagnostics: () => refreshed() } };
    const proxy = require("../plugin/index.js")({ typescript: ts }).create(info);
    proxy.getSemanticDiagnostics(cascade);
    await done;
    const ours = proxy.getSemanticDiagnostics(cascade).filter((d: { source?: string }) => d.source === "nuclo-native-ts");
    const text = readFileSync(cascade, "utf8");
    expect(ours.map((d: { code: number; start: number; length: number }) => [d.code, text.slice(d.start, d.start + d.length)])).toEqual([
      [96002, "eval"],
      [96001, "(x) => x"],
      [93001, "0.1"],
    ]);
    expect(ours[0].messageText).toBe("NUCLO6002: `eval` cannot be compiled ahead of time.");
    expect(proxy.getSupportedCodeFixes(cascade)).toContain("93001");
    const fix = proxy.getCodeFixesAtPosition(cascade, ours[2].start, ours[2].start, [93001], {}, {});
    expect(fix.map((f: { changes: { textChanges: unknown[] }[] }) => f.changes[0]!.textChanges)).toEqual([[{ span: { start: ours[2].start, length: 3 }, newText: "Math.fround(0.1)" }]]);
  }, 120_000);
});
