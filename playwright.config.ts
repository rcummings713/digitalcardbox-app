import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "ui.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45000,
  reporter: "list",
  use: {
    baseURL: process.env.UI_BASE_URL || "http://127.0.0.1:4174",
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
  webServer: process.env.UI_BASE_URL
    ? undefined
    : {
        command: "npm run dev:ui -- --host 127.0.0.1 --port 4174 --strictPort",
        url: "http://127.0.0.1:4174",
        reuseExistingServer: !process.env.CI,
      },
});
