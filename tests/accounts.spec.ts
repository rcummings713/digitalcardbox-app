import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes } from "node:crypto";

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

test("stale destination edits preserve the form through password confirmation, cancellation and one authorized retry", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // Ordinary sign-in has separate coverage. Give this test its own opaque
  // stale session in the isolated fixture database, keeping real password
  // confirmation and the deployment's authentication throttle unchanged.
  const token = randomBytes(32).toString("base64url");
  const db = new DatabaseSync(process.env.DCB_CONNECTED_DATABASE!);
  try {
    db.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
    const host = db.prepare("SELECT id FROM hosts WHERE email=?").get("host@digitalcardbox.test") as { id: string };
    db.prepare("INSERT INTO host_sessions(token_hash,host_id,csrf_token,expires_at,authenticated_at) VALUES(?,?,?,?,?)").run(
      createHash("sha256").update(token).digest("hex"),
      host.id,
      randomBytes(32).toString("base64url"),
      new Date(Date.now() + 8 * 3600000).toISOString(),
      "2000-01-01T00:00:00Z",
    );
  } finally { db.close(); }
  await context.addCookies([{
    name: "dcb_host",
    value: token,
    domain: "127.0.0.1",
    path: "/api",
    expires: Math.floor(Date.now() / 1000) + 8 * 3600,
    httpOnly: true,
    secure: false,
    sameSite: "Strict",
  }]);
  await page.goto("/workspace");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("A little hello");
  await page.goto("/workspace/events/test-baby-shower/settings");
  const form = page.locator(".destination-form").filter({
    has: page.getByRole("heading", { name: "PayPal", exact: true }),
  });
  await form.getByLabel("Recipient shown in the service", { exact: true }).fill("Synthetic reauthentication host");
  await form.getByLabel("PayPal.Me handle (letters and numbers only)", { exact: true }).fill("SyntheticReauth42");
  await form.getByLabel("Enter it again", { exact: true }).fill("SyntheticReauth42");
  await form.getByLabel(/I checked this exact recipient/).check();
  const originalCookie = (await context.cookies()).find((cookie) => cookie.name === "dcb_host")!;
  expect(originalCookie).toBeTruthy();
  const save = form.getByRole("button", { name: "Save & confirm service", exact: true });
  await save.click();
  const dialog = page.getByRole("dialog", { name: "Confirm it’s you." });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("host@digitalcardbox.test");
  await dialog.getByLabel("Current password", { exact: true }).fill("Incorrect password");
  await dialog.getByRole("button", { name: "Confirm password", exact: true }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(dialog.getByLabel("Current password", { exact: true })).toHaveValue("");
  await expect(form.getByLabel("Recipient shown in the service", { exact: true })).toHaveValue("Synthetic reauthentication host");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(save).toBeEnabled();
  await save.click();
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Current password", { exact: true }).fill("CardBoxReview!2026");
  await dialog.getByRole("button", { name: "Confirm password", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(form).toContainText("Host confirmed");
  expect((await context.cookies()).find((cookie) => cookie.name === "dcb_host")!.value).toBe(originalCookie.value);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain("Incorrect password");
});
