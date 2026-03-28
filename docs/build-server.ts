import type { BunPlugin } from "bun";
import { resolve } from "path";

const targets = [
  "bun-darwin-x64",
  "bun-darwin-arm64",
  "bun-linux-x64",
  "bun-linux-arm64",
  "bun-linux-x64-musl",
  "bun-linux-arm64-musl",
  "bun-windows-x64",
  "bun-windows-arm64",
] satisfies Bun.Build.Target[];

const nucloSrc = resolve(import.meta.dir, "../packages/v0.1/src");

const nucloPlugin: BunPlugin = {
  name: "nuclo-paths",
  setup(build) {
    build.onResolve({ filter: /^nuclo$/ }, () => ({ path: `${nucloSrc}/index.ts` }));
    build.onResolve({ filter: /^nuclo\/ssr$/ }, () => ({ path: `${nucloSrc}/ssr/index.ts` }));
    build.onResolve({ filter: /^nuclo\/polyfill$/ }, () => ({ path: `${nucloSrc}/polyfill/index.ts` }));
  },
};

for (const target of targets) {
  process.stdout.write(`→ Compiling ${target}... `);
  const result = await Bun.build({
    entrypoints: ["./src/server.ts"],
    compile: {
      target,
      outfile: `./dist-server/server-${target}`,
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    external: ["vite"],
    plugins: [nucloPlugin],
  });
  if (result.success) {
    console.log("✓");
  } else {
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }
}
