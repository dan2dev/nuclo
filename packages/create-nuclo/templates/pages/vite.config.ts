import { defineConfig } from "vite";
import { nucloPages } from "nuclo-pages/vite";

// adapter: "node" (default), "bun", or "cloudflare" (see README.md).
export default defineConfig({
  plugins: [nucloPages({ adapter: "node" })],
});
