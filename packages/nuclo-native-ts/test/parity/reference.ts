/**
 * The parity reference: `bun reference.ts [module]` runs examples/language/all.ts (or `module`, bundled JavaScript
 * with the same exports) with the web runtime in place of the API module, as the web target does, waits for the
 * promise logs to end with "done", and prints every check: `## name`, then its lines. Every target must print this.
 */
import { plugin } from "bun";
import * as path from "node:path";

const API = path.resolve(import.meta.dir, "../../src/index.ts");
const WEB_RUNTIME = path.resolve(import.meta.dir, "../../src/runtimes/web/index.ts");
plugin({
  name: "nuclo-web-runtime",
  setup(build) {
    build.onResolve({ filter: /index\.ts$/ }, (args) =>
      path.resolve(path.dirname(args.importer), args.path) === API ? { path: WEB_RUNTIME } : undefined,
    );
  },
});

interface Log { lines: string[] }
const m: { checks: { name: string; lines: string[] }[]; asyncChecks: { name: string; log: Log }[] } = await import(
  path.resolve(process.argv[2] ?? path.join(import.meta.dir, "../../examples/language/all.ts"))
);
const start = Date.now();
while (m.asyncChecks.some((c) => c.log.lines.at(-1) !== "done") && Date.now() - start < 3000) await new Promise((r) => setTimeout(r, 2));
const out: string[] = [];
for (const c of m.checks) out.push(`## ${c.name}`, ...c.lines);
for (const c of m.asyncChecks) out.push(`## ${c.name}`, ...c.log.lines);
console.log(out.join("\n"));
