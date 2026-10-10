import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.ts"],
    // Expose global.gc so the memory tests can assert real collectability.
    execArgv: ["--expose-gc"],
  },
});
