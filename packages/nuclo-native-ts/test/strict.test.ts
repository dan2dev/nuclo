/**
 * The compiler's contract: TypeScript that would not build, or would behave differently, natively
 * is rejected with a diagnostic; everything else compiles. `bun test`.
 *
 * test/fixtures/reject/*.ts each start with `// expect: <part of the diagnostic>`.
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
    expect(kotlin).toMatch(/cities\.map \{ c ->[\s\S]*joinToString\(""\)/);
  });
});
