import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 4174);
const executablePath = process.env.PLAYWRIGHT_CHROME_EXECUTABLE_PATH;

// Builds the app, then runs the production server (Node adapter output).
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://127.0.0.1:${port}` },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...(executablePath ? { launchOptions: { executablePath } } : {}) },
    },
  ],
  webServer: {
    command: `bun run build && PORT=${port} HOST=127.0.0.1 bun dist/server/index.mjs`,
    url: `http://127.0.0.1:${port}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
