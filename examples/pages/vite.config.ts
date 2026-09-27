import { defineConfig } from "vite";
import { nucloPages } from "nuclo-pages/vite";

// ADAPTER=node (default) | bun | cloudflare
const adapter = (process.env.ADAPTER ?? "node") as "node" | "bun" | "cloudflare";

export default defineConfig(async () => ({
  plugins: [
    nucloPages({ adapter }),
    // On Cloudflare the server environment runs in workerd, configured by wrangler.jsonc.
    adapter === "cloudflare" && (await import("@cloudflare/vite-plugin")).cloudflare({ viteEnvironment: { name: "ssr" } }),
  ],
}));
