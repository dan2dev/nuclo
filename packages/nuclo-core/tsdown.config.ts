import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: { nuclo: "src/index.ts" },
    format: ["esm", "cjs", "umd"],
    outDir: "dist",
    clean: true,
    dts: false,
    minify: true,
    sourcemap: true,
    globalName: "Nuclo",
  },
  {
    entry: { "ssr/nuclo.ssr": "src/ssr/index.ts" },
    format: ["esm", "cjs"],
    outDir: "dist",
    dts: false,
    minify: true,
    sourcemap: true,
  },
  {
    entry: { "styled/nuclo.styled": "src/styled/index.ts" },
    format: ["esm", "cjs"],
    outDir: "dist",
    dts: false,
    minify: true,
    sourcemap: true,
  },
]);
