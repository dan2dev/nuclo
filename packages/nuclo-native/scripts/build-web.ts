// Builds the web app (SPA + PWA) into dist-web: bundle, shell, assets, service worker.
import { Glob } from "bun";
import { cp, rm } from "node:fs/promises";

const out = "dist-web";
await rm(out, { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: ["example/app.ts"],
  outdir: out,
  naming: "app.js",
  target: "browser",
  conditions: ["web"],
  minify: true,
});
if (!result.success) throw new AggregateError(result.logs, "Web build failed");

await cp("hosts/web", out, { recursive: true });
await cp("example/assets", `${out}/assets`, { recursive: true });

// The service worker precaches every file; its cache name changes with their contents.
const files = (await Array.fromAsync(new Glob("**/*").scan(out))).filter((file) => file !== "sw.js").sort();
const hasher = new Bun.CryptoHasher("sha1");
for (const file of files) hasher.update(await Bun.file(`${out}/${file}`).arrayBuffer());
const sw = (await Bun.file(`${out}/sw.js`).text())
  .replace("__FILES__", JSON.stringify(["./", ...files]))
  .replace("__VERSION__", hasher.digest("hex").slice(0, 8));
await Bun.write(`${out}/sw.js`, sw);

console.log(`Built ${files.length + 1} files into ${out}`);
