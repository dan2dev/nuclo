/**
 * Style-engine bundle-size delta — run with: bun bench/bundle-size/build-and-diff.ts
 *
 * No such check existed before this: tsdown.config.ts has one main entry, and
 * nothing measures what src/style/ costs a consumer who never calls
 * css()/cx()/variants() (src/bootstrap.ts imports and registers it
 * unconditionally, so today's dist/nuclo.mjs always includes it). Builds the
 * real entry (src/index.ts) and the style-free entry (./no-style-entry.ts)
 * with matching tsdown options, into a scratch dir outside the repo, and
 * reports raw + gzip byte deltas.
 */
import { execFileSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("../../", import.meta.url).pathname;

function build(entry: string, outDir: string): void {
	execFileSync(
		"npx",
		["tsdown", entry, "--format", "esm", "--minify", "--no-dts", "--out-dir", outDir, "--no-config", "-l", "silent"],
		{ cwd: root, stdio: "inherit" },
	);
}

function findOutputFile(outDir: string): string {
	const file = readdirSync(outDir).find((name) => name.endsWith(".mjs"));
	if (!file) throw new Error(`no .mjs output found in ${outDir}`);
	return join(outDir, file);
}

function report(label: string, filePath: string): number {
	const raw = readFileSync(filePath);
	const gzip = gzipSync(raw).length;
	console.log(`${label}: ${raw.length} B (${gzip} B gzip) — ${filePath}`);
	return raw.length;
}

const scratch = mkdtempSync(join(tmpdir(), "nuclo-bundle-size-"));
const mainOut = join(scratch, "main");
const noStyleOut = join(scratch, "no-style");

build("src/index.ts", mainOut);
build("bench/bundle-size/no-style-entry.ts", noStyleOut);

const mainBytes = report("nuclo (src/index.ts)", findOutputFile(mainOut));
const noStyleBytes = report("no-style-entry", findOutputFile(noStyleOut));

console.log(`style engine contributes: ${mainBytes - noStyleBytes} B raw (see gzip figures above for the compressed delta)`);
console.log(`scratch build output kept at: ${scratch}`);
