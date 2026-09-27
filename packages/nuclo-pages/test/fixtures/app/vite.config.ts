import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { nucloPages } from "../../../src/vite/index";

// Run against the sources of nuclo-pages and nuclo-core: no build needed.
const pkg = (path: string) => fileURLToPath(new URL(`../../../${path}`, import.meta.url));
const core = (path: string) => fileURLToPath(new URL(`../../../../nuclo-core/src/${path}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^nuclo-pages\/server$/, replacement: pkg("src/server/index.ts") },
      { find: /^nuclo-pages\/client$/, replacement: pkg("src/client/index.ts") },
      { find: /^nuclo-pages\/node$/, replacement: pkg("src/adapters/node.ts") },
      { find: /^nuclo-pages$/, replacement: pkg("src/index.ts") },
      { find: /^nuclo\/ssr$/, replacement: core("ssr/index.ts") },
      { find: /^nuclo\/polyfill$/, replacement: core("polyfill/index.ts") },
      { find: /^nuclo$/, replacement: core("index.ts") },
    ],
  },
  plugins: [nucloPages()],
});
