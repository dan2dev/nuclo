import { defineConfig } from "vite";

// Nothing router-specific is needed: every route is a plain dynamic import(),
// so Vite code-splits each page into its own chunk on its own.
export default defineConfig({});
