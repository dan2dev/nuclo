import { defineConfig } from "vite";
import { BASE } from "./src/base.ts";

// The app is served under a non-root path to exercise the router's `base`
// setting end to end. Vite's own `base` must match so the emitted asset URLs
// (and the dynamic-import chunk URLs) are prefixed the same way.
export default defineConfig({
  base: `${BASE}/`,
  build: {
    outDir: "dist",
    // Stable entry name so the server's HTML template can reference it
    // without reading Vite's manifest.
    rollupOptions: {
      input: "src/entry-client.ts",
      output: {
        entryFileNames: "client.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
