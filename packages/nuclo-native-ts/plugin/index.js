/**
 * TypeScript language service plugin: what `nuclo-native-ts check` reports, underlined in the editor.
 * Enabled by `plugins` in tsconfig.app.json.
 *
 * tsserver can't load the compiler (TypeScript sources, run by bun), so the plugin runs
 * `nuclo-native-ts check <entry> --json` in the background, as rust-analyzer runs `cargo check`:
 * the diagnostics follow the files on disk, so they refresh when a file is saved. A file with unsaved
 * edits shows none (their positions would be off) until it is saved.
 *
 * An entry is a file of the project that no other file imports (an example's App.ts): a file is
 * checked as part of every entry that reaches it.
 */
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const CLI = path.join(__dirname, "../src/compiler/cli.ts");

module.exports = ({ typescript: ts }) => ({
  create(info) {
    const log = (message) => info.project.projectService.logger.info(`[nuclo-native-ts] ${message}`);
    // tsserver has the editor's PATH: `"plugins": [{ "name": …, "bun": "/path/to/bun" }]` when bun isn't on it.
    const bun = info.config.bun ?? "bun";

    /** By entry: the last check ({ key, texts, byFile }) and whether one is running. */
    const checks = new Map();
    /** By program: its entries and the files each reaches. */
    const graphs = new WeakMap();

    const local = (sf) => !sf.isDeclarationFile && !sf.fileName.includes("/node_modules/");

    function graph(program) {
      let reach = graphs.get(program);
      if (reach) return reach;
      const files = program.getSourceFiles().filter(local);
      const edges = new Map();
      const imported = new Set();
      for (const sf of files) {
        const to = [];
        for (const statement of sf.statements) {
          const spec = (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier;
          if (!spec || !ts.isStringLiteral(spec) || !spec.text.startsWith(".")) continue;
          const resolved = ts.resolveModuleName(spec.text, sf.fileName, program.getCompilerOptions(), ts.sys).resolvedModule;
          const target = resolved && program.getSourceFile(resolved.resolvedFileName);
          if (target && local(target)) to.push(target.fileName), imported.add(target.fileName);
        }
        edges.set(sf.fileName, to);
      }
      // ponytail: files that only import each other in a cycle have no entry and are never checked.
      reach = new Map();
      for (const sf of files) {
        if (imported.has(sf.fileName)) continue;
        const seen = new Set([sf.fileName]);
        for (const file of seen) for (const next of edges.get(file) ?? []) seen.add(next);
        reach.set(sf.fileName, seen);
      }
      graphs.set(program, reach);
      return reach;
    }

    const mtime = (file) => {
      try {
        return fs.statSync(file).mtimeMs;
      } catch {
        return 0;
      }
    };
    const read = (file) => {
      try {
        return fs.readFileSync(file, "utf8");
      } catch {
        return undefined;
      }
    };

    function run(entry, files, key) {
      const check = checks.get(entry) ?? { byFile: new Map(), texts: new Map() };
      checks.set(entry, check);
      check.running = true;
      const texts = new Map([...files].map((file) => [file, read(file)]));
      const done = (byFile) => {
        if (!check.running) return;
        Object.assign(check, { running: false, key, texts, byFile });
        info.project.refreshDiagnostics();
      };
      const child = spawn(bun, [CLI, "check", entry, "--json"], { stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => (stdout += chunk));
      child.stderr.on("data", (chunk) => (stderr += chunk));
      // The key is kept on a failure too: the check runs again when a file changes, not in a loop.
      child.on("error", (error) => (log(`could not run ${bun}: ${error.message}`), done(new Map())));
      child.on("close", () => {
        const byFile = new Map();
        try {
          for (const d of JSON.parse(stdout)) {
            // TypeScript's own errors: the editor already shows them.
            if (d.code !== undefined) continue;
            byFile.set(d.file, [...(byFile.get(d.file) ?? []), d]);
          }
        } catch {
          log(`check ${entry} failed: ${stderr || stdout}`);
        }
        done(byFile);
      });
    }

    function nativeDiagnostics(fileName) {
      const program = info.languageService.getProgram();
      const sf = program?.getSourceFile(fileName);
      if (!sf || !local(sf)) return [];
      const found = new Map();
      for (const [entry, files] of graph(program)) {
        if (!files.has(sf.fileName)) continue;
        const key = [...files].map(mtime).join();
        const check = checks.get(entry);
        if (!check?.running && check?.key !== key) run(entry, files, key);
        // Shown only while the editor's text is the text that was checked.
        if (check?.texts.get(sf.fileName) !== sf.text) continue;
        for (const d of check.byFile.get(sf.fileName) ?? []) {
          const start = sf.getPositionOfLineAndCharacter(d.line - 1, d.column - 1);
          // One line at most: a rejected class or function is underlined at its head (as the CLI's code frame does).
          const length = Math.max(1, Math.min(d.length ?? Infinity, sf.getLineEndOfPosition(start) - start));
          // The CLI's code and text: "NUCLO3001: …", and as a number for the editor (ts(93001)).
          const code = codeOf(d.id);
          found.set(`${start}:${d.message}`, { file: sf, start, length, messageText: `${d.id ?? "NUCLO6000"}: ${d.message}`, category: ts.DiagnosticCategory.Error, code, source: "nuclo-native-ts", fix: d.fix, fixLength: d.length });
        }
      }
      fixes.set(sf.fileName, [...found.values()].filter((d) => d.fix !== undefined));
      return [...found.values()].map(({ fix, fixLength, ...d }) => d);
    }

    /** By file: the diagnostics last shown that have a mechanical fix. */
    const fixes = new Map();

    const proxy = Object.create(null);
    for (const name of Object.keys(info.languageService)) proxy[name] = (...args) => info.languageService[name](...args);
    proxy.getSemanticDiagnostics = (fileName) => {
      const prior = info.languageService.getSemanticDiagnostics(fileName);
      try {
        return prior.concat(nativeDiagnostics(fileName));
      } catch (error) {
        log(error.stack ?? String(error));
        return prior;
      }
    };
    // Quick fixes: the replacement the compiler computed (`(x) => !!x`, `Math.fround(0.1)`…), for the whole node it reported.
    proxy.getSupportedCodeFixes = (fileName) => [...info.languageService.getSupportedCodeFixes(fileName), ...SUPPORTED];
    proxy.getCodeFixesAtPosition = (fileName, start, end, errorCodes, ...rest) => {
      const prior = info.languageService.getCodeFixesAtPosition(fileName, start, end, errorCodes, ...rest);
      const ours = (fixes.get(fileName) ?? [])
        .filter((d) => errorCodes.includes(d.code) && d.start <= end && start <= d.start + d.length)
        .map((d) => ({
          fixName: "nuclo-native-ts",
          description: `Write \`${d.fix}\``,
          changes: [{ fileName, textChanges: [{ span: { start: d.start, length: d.fixLength ?? d.length }, newText: d.fix }] }],
        }));
      return [...prior, ...ours];
    };
    return proxy;
  },
});

/** NUCLO3001 → 93001; TypeScript's own codes are below 20000. */
const codeOf = (id) => 90000 + (Number(/^NUCLO(\d+)$/.exec(id ?? "")?.[1]) || 6000);
const SUPPORTED = ["NUCLO1001", "NUCLO1002", "NUCLO1003", "NUCLO1004", "NUCLO1005", "NUCLO2001", "NUCLO2002", "NUCLO3001", "NUCLO3002", "NUCLO4001", "NUCLO4002", "NUCLO4003", "NUCLO4004", "NUCLO5001", "NUCLO6000", "NUCLO6001", "NUCLO6002"].map((id) => String(codeOf(id)));
