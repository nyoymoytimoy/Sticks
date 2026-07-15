import { defineConfig, devices } from "@playwright/test";

// If PLAYWRIGHT_BASE_URL is set, tests run against whatever's already
// running there (e.g. a dev server the user started themselves to browse
// the app) instead of spawning a new one -- Next.js 16's lockfile mechanism
// blocks a second `next dev` on the same project regardless of port, so
// trying to spawn our own while one is already running always fails.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3210";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev --workspace frontend -- --port 3210",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
});
