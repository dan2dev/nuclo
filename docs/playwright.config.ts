import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.STRESS_BASE_URL ?? "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  globalTimeout: 0,
  timeout: 0,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report/stress" }]],
  use: {
    baseURL,
    headless: true,
    trace: "off",
    video: "off",
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: "stress-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "PORT=4173 bun run start",
    url: baseURL,
    timeout: 120000,
    reuseExistingServer: true,
    stdout: "pipe",
    stderr: "pipe",
  },
});
