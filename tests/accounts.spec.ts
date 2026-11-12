import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Presentation fixtures only. auth.test.mjs verifies the real backend's managed
// credentials, cookies, identity scope, PKCE, recovery and revocation handling.
test("mobile account creation, confirmed login, provider cancellation and recovery have usable customer screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let signedIn = false,
    submitted: Record<string, string> | undefined;
  await page.route("**/api/session", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const response = await route.fetch(),
      value = await response.json();
    await route.fulfill({
      json: {
        ...value,
        account: signedIn
          ? {
              id: "customer-fixture",
              name: "Alex",
              email: "alex@example.invalid",
              role: "host",
              registered: true,
            }
          : null,
        csrfToken: signedIn ? "browser-fixture-csrf" : null,
        configuration: {
          ...value.configuration,
          hosted: true,
          auth: { configured: true, email: true, google: true, apple: false },
        },
      },
    });
  });
  await page.route("**/api/host/workspace", (route) =>
    route.fulfill({
      json: {
        version: 1,
        events: [],
        entries: [],
        gifts: [],
        audit: [],
        flags: {
          gifts: true,
          gifs: true,
          assistance: true,
          books: true,
          newEvents: true,
        },
        profile: {
          name: "Alex",
          email: "alex@example.invalid",
          reducedMotion: false,
        },
      },
    }),
  );
  await page.route("**/api/auth/register", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      json: {
        message: "Check your email to confirm your account, then sign in.",
      },
    });
  });
  await page.route("**/api/auth/login", async (route) => {
    signedIn = true;
    await route.fulfill({ json: { account: { id: "customer-fixture" } } });
  });
  await page.goto("/auth/register");
  await expect(
    page.getByRole("button", { name: "Continue with Apple", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Your name", { exact: true }).fill("Alex");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("alex@example.invalid");
  await page.getByLabel(/^Password/).fill("Browser fixture password!");
  await page
    .getByRole("button", { name: "Create my account", exact: true })
    .click();
  await expect(
    page.locator(".managed-account-panel").getByRole("status"),
  ).toContainText("Check your email");
  expect(submitted?.name).toBe("Alex");
  expect(
    await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    ),
  ).not.toContain("Browser fixture password!");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page
    .getByRole("button", { name: "I already have an account", exact: true })
    .click();
  await page
    .getByLabel("Password", { exact: true })
    .fill("Browser fixture password!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await expect(page.locator("main")).toContainText("Alex");
  await page.goto("/auth/callback?error=access_denied");
  await expect(page.getByRole("alert")).toContainText("cancelled");
  expect(new URL(page.url()).search).toBe("");
  await page.goto("/auth/recover?token_hash=" + "a".repeat(40));
  await expect(page.getByLabel("New password", { exact: true })).toBeVisible();
  expect(new URL(page.url()).search).toBe("");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
