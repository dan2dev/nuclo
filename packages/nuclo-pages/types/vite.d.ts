/**
 * Type declarations for `nuclo-pages/vite`. Keep in sync with src/vite/index.ts.
 */
import type { Plugin } from "vite";

export interface NucloPagesOptions {
  /**
   * Where the built server runs. `cloudflare` also needs `@cloudflare/vite-plugin`
   * with `cloudflare({ viteEnvironment: { name: "ssr" } })`. Default: `"node"`.
   */
  adapter?: "node" | "bun" | "cloudflare";
}

export declare function nucloPages(options?: NucloPagesOptions): Plugin[];
