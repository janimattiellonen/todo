import { defineConfig } from "@playwright/test";

const PORT = 5172;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 2 : 0,
  reporter: "list",
  use: {
    // biome-ignore lint/style/useNamingConvention: Playwright API key
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: BASE_URL,
    reuseExistingServer: !process.env["CI"],
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
