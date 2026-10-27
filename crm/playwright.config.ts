import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against a production build: `npm run build && npm run test:e2e`.
// Every spec re-seeds the database first, so run them against a throwaway/dev database only.
export default defineConfig({
  testDir: "./e2e",
  workers: 1, // specs share one SQLite database
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3100", viewport: { width: 1300, height: 900 }, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1300, height: 900 } } }],
  webServer: { command: "npx next start -p 3100", url: "http://localhost:3100/login", reuseExistingServer: true, timeout: 60_000 },
});
