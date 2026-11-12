import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

// Browser-only status fixtures exercise presentation. The API suite separately
// proves that production endpoints reject forged paid state and provider events.
test("mobile purchase receipt stays pending until server-confirmed access, downloads both editions, and handles refund", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const id = "ed99829c-5795-4d66-b142-a67e1e4e9284";
  let entitled = false,
    status = "pending";
  await page.route("**/api/billing/orders/" + id, async (route) =>
    route.fulfill({
      json: {
        order: {
          id,
          product: "event-book",
          targetId: "private-event",
          eventId: "private-event",
          amountMinor: 1500,
          currency: "usd",
          status,
          entitled,
          refundedMinor: status === "refunded" ? 1500 : 0,
          testMode: true,
          snapshot: {
            included_count: 1,
            revision: 1,
            preview: 1,
            cutoff_at: "2026-11-06T12:00:00Z",
          },
        },
      },
    }),
  );
  await page.route("**/api/billing/orders/" + id + "/book", async (route) =>
    route.fulfill({
      json: {
        event: {
          title: "A keepsake & a promise",
          hosts: "Jamie & Riley",
          date: "2026-11-12",
        },
        entries: [
          {
            id: "note-1",
            name: "A loving guest",
            note: "A full note. <script>never execute</script>",
            style: "little-star",
            gif: "cosmic",
            consent: true,
            premium: true,
          },
        ],
      },
    }),
  );
  await page.goto("/checkout/return?order=" + id + "&paid=true");
  await expect(
    page.locator(".purchase-panel").getByRole("status"),
  ).toContainText("Paid access is not confirmed");
  await expect(
    page.getByRole("button", { name: /Download digital keepsake/ }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  entitled = true;
  status = "paid";
  await page.getByRole("button", { name: "Refresh payment status" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Your keepsake is ready.",
  );
  for (const layout of ["editorial", "collage"]) {
    await page.getByLabel("Edition style").selectOption(layout);
    const event = page.waitForEvent("download");
    await page
      .getByRole("button", { name: /Download digital keepsake/ })
      .click();
    const download = await event;
    expect(download.suggestedFilename()).toContain(layout);
    const html = await readFile((await download.path())!, "utf8");
    expect(html).toContain(
      "A full note. &lt;script&gt;never execute&lt;/script&gt;",
    );
    expect(html).toContain('src="data:image/');
    expect(html).toContain("Content-Security-Policy");
    expect(html).not.toContain("<script>");
    expect(html).toContain('class="' + layout + '"');
  }
  entitled = false;
  status = "refunded";
  await page.getByRole("button", { name: "Refresh payment status" }).click();
  await expect(
    page.locator(".purchase-panel").getByRole("status"),
  ).toContainText("fully refunded");
  await expect(
    page.getByRole("button", {
      name: /Download digital keepsake|Return to Stripe/,
    }),
  ).toHaveCount(0);
});

test("an invalid or inaccessible purchase cannot reveal private content", async ({
  page,
}) => {
  await page.goto("/checkout/return?order=not-an-order&paid=true");
  await expect(page.getByRole("alert")).toContainText("not valid");
  await expect(
    page.getByRole("button", {
      name: /Download digital keepsake|Return to Stripe/,
    }),
  ).toHaveCount(0);
});

test("a paid premium draft returns through the invitation-scoped receipt to review and explicit Send", async ({
  page,
}) => {
  const id = "ad99829c-5795-4d66-b142-a67e1e4e9284",
    token = "public-premium-return-token",
    prefix = "/api/invitations/" + token + "/billing",
    back = "/g/" + token + "/review";
  await page.addInitScript(
    ({ id, prefix, back }) =>
      sessionStorage.setItem(
        "dcb-purchase-" + id,
        JSON.stringify({ prefix, back }),
      ),
    { id, prefix, back },
  );
  let paid = false;
  await page.route("**" + prefix + "/orders/" + id, (route) =>
    route.fulfill({
      json: {
        order: {
          id,
          product: "premium-card",
          targetId: "private-draft",
          eventId: "private-event",
          amountMinor: 499,
          currency: "usd",
          status: paid ? "paid" : "pending",
          entitled: paid,
          refundedMinor: 0,
          testMode: true,
        },
      },
    }),
  );
  await page.goto("/checkout/return?order=" + id + "&paid=true");
  await expect(
    page.locator(".purchase-panel").getByRole("status"),
  ).toContainText("Paid access is not confirmed");
  await expect(
    page.getByRole("link", { name: "Review and send my card ↗", exact: true }),
  ).toHaveCount(0);
  paid = true;
  await page.getByRole("button", { name: "Refresh payment status" }).click();
  await expect(
    page.getByRole("link", { name: "Review and send my card ↗", exact: true }),
  ).toHaveAttribute("href", back);
  await expect(
    page.locator(".purchase-panel").getByRole("status"),
  ).toContainText("purchase is confirmed");
  await expect(
    page.getByText("Your card is already delivered.", { exact: false }),
  ).toHaveCount(0);
});
