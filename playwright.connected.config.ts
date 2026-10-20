import { defineConfig } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const database =
  process.env.DCB_CONNECTED_DATABASE ||
  join(mkdtempSync(join(tmpdir(), "dcb-connected-")), "review.sqlite");
process.env.DCB_CONNECTED_DATABASE = database;
export default defineConfig({
  testDir: "./tests",
  testMatch: "connected.spec.ts",
  outputDir: "test-results/connected",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4175",
    headless: true,
    launchOptions:
      process.platform === "darwin"
        ? {
            executablePath:
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          }
        : {},
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4175 --strictPort",
    url: "http://127.0.0.1:4175/api/health",
    reuseExistingServer: false,
    env: { DCB_API_PORT: "8791", DCB_DATABASE_PATH: database },
  },
});
