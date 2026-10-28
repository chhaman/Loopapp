import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
/** Set to run the suite against an already running server (e.g. `wrangler dev` or a preview deploy). */
const EXTERNAL_URL = process.env.PLAYWRIGHT_BASE_URL;

/**
 * E2E suite (docs/testing.md). Runs against a production build in CI
 * (E2E_PROD=1) and against `next dev` locally. Supabase is not required:
 * the anonymous flows and the sandbox checks run in catalog-only mode.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: EXTERNAL_URL ?? `http://localhost:${PORT}`,
    // Spanish is the default product language; tests that need English toggle it.
    locale: "es-AR",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: EXTERNAL_URL
    ? undefined
    : {
        command: process.env.E2E_PROD ? `npm run start -- -p ${PORT}` : `npm run dev -- -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: { NEXT_PUBLIC_ENABLE_TEST_HARNESS: "1" },
      },
});
