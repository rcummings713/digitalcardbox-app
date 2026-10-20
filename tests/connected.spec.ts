import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function login(page: Page, email = "host@digitalcardbox.test") {
  await page.goto("/workspace");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("CardBoxReview!2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A little hello",
  );
}
async function sendCard(
  page: Page,
  url: string,
  name: string,
  note: string,
  consent: boolean,
) {
  await page.goto(url);
  await page
    .getByRole("link", { name: "Choose a card & leave a note" })
    .click();
  await page.getByLabel("A Little Star", { exact: true }).check();
  await expect(page.locator('.live-card img[src^="/gifs/"]')).toHaveCount(0);
  await page.getByLabel("Your name", { exact: true }).fill(name);
  await page.getByLabel("Your note", { exact: true }).fill(note);
  await page.getByRole("button", { name: "Add a GIF" }).click();
  await page.getByLabel("Find a little feeling").fill("universe");
  await expect(page.locator(".gif-grid>button")).toHaveCount(1);
  await page
    .getByRole("button", { name: "A universe of little stars", exact: true })
    .click();
  if (consent) await page.getByRole("checkbox", { name: /event book/ }).check();
  await page.getByRole("button", { name: "Review my card" }).click();
  await page.getByRole("button", { name: "Send my card" }).click();
  await expect(
    page
      .getByRole("heading", { name: "Your words have a home." })
      .or(page.getByRole("link", { name: "Skip gift and finish" })),
  ).toBeVisible();
  if (
    await page.getByRole("link", { name: "Skip gift and finish" }).isVisible()
  )
    await page.getByRole("link", { name: "Skip gift and finish" }).click();
  await expect(
    page.getByRole("heading", { name: "Your words have a home." }),
  ).toBeVisible();
}
test("host creates and publishes, separate guests send real cards, and the host curates both book styles", async ({
  page,
  browser,
}) => {
  await login(page);
  await page
    .getByRole("link", { name: "Create a card box +", exact: true })
    .click();
  await page
    .getByLabel("Occasion", { exact: true })
    .selectOption("Baby shower");
  await page.getByLabel("Card box title").fill("Our end-to-end little star");
  await page.getByLabel("Host name or names").fill("Jamie & Riley");
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 7);
  await page
    .getByLabel("Event date", { exact: true })
    .fill(date.toISOString().slice(0, 10));
  await page
    .getByRole("button", { name: "Create card box", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Our end-to-end little star",
  );
  const eventBase = page.url().replace(/\/overview$/, "");
  await page.getByRole("link", { name: "Invite & share", exact: true }).click();
  await page.getByRole("button", { name: "Publish guest link" }).click();
  const invitation = await page
    .getByLabel("Guest invitation link")
    .inputValue();
  await expect(
    page.getByAltText("QR code for this event’s guest link"),
  ).toBeVisible();
  const guestContext = await browser.newContext({
    baseURL: "http://127.0.0.1:4175",
    viewport: { width: 375, height: 812 },
    reducedMotion: "reduce",
  });
  const privateContext = await browser.newContext({
    baseURL: "http://127.0.0.1:4175",
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  try {
    const guest = await guestContext.newPage();
    await sendCard(
      guest,
      invitation,
      "Guest Across Browsers",
      "The little moments will become your biggest memories.",
      true,
    );
    expect((await guest.request.get("/api/host/workspace")).status()).toBe(401);
    await guest.reload();
    await expect(
      guest.getByRole("heading", { name: "Your words have a home." }),
    ).toBeVisible();
    const privateGuest = await privateContext.newPage();
    await sendCard(
      privateGuest,
      invitation,
      "Private Guest Only",
      "For the host’s eyes alone.",
      false,
    );
    await page.goto(eventBase + "/cards");
    await page.getByLabel("Find a card").fill("Guest Across Browsers");
    await expect(
      page.getByRole("heading", { name: "Guest Across Browsers", exact: true }),
    ).toBeVisible();
    await page.goto(eventBase + "/book");
    await page.getByRole("button", { name: "Read as text" }).click();
    await expect(page.locator(".book-transcript")).toContainText(
      "Guest Across Browsers",
    );
    await expect(page.locator(".book-transcript")).not.toContainText(
      "Private Guest Only",
    );
    await page
      .getByRole("button", { name: "The Collage", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "The Collage", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(
      page.getByRole("button", { name: "The Collage", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("button", { name: "The Editorial", exact: true })
      .click();
    await page.goto(eventBase + "/cards");
    await page.getByLabel("Find a card").fill("Guest Across Browsers");
    await page.getByRole("button", { name: "Read & manage card" }).click();
    await page.getByRole("button", { name: "Hide from book" }).click();
    await expect(
      page.locator(".inbox-item .badge").filter({ hasText: /^Hidden$/ }),
    ).toBeVisible();
    await page.goto(eventBase + "/book");
    await expect(
      page.getByRole("heading", { name: "Your story is still gathering" }),
    ).toBeVisible();
    await page.goto(eventBase + "/settings");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Rotate guest link" }).click();
    await expect(page.locator(".toast-region")).toContainText(
      "Your previous guest link has been replaced",
    );
    await guest.goto(invitation);
    await expect(
      guest.getByRole("heading", { name: "Your invitation is not available." }),
    ).toBeVisible();
  } finally {
    await guestContext.close();
    await privateContext.close();
  }
});
test("host and operator access are distinct; gift controls never enable money movement", async ({
  page,
  browser,
}) => {
  await login(page);
  await page.goto("/admin/features");
  await expect(
    page.getByRole("heading", { name: "Site administrator access required." }),
  ).toBeVisible();
  const operatorContext = await browser.newContext();
  try {
    const operator = await operatorContext.newPage();
    await operator.goto("http://127.0.0.1:4175/workspace");
    await operator
      .getByLabel("Email address", { exact: true })
      .fill("operator@digitalcardbox.test");
    await operator
      .getByLabel("Password", { exact: true })
      .fill("CardBoxReview!2026");
    await operator
      .getByRole("button", { name: "Sign in", exact: true })
      .click();
    await expect(operator.getByRole("heading", { level: 1 })).toContainText(
      "A little hello",
    );
    await operator.goto("http://127.0.0.1:4175/admin/features");
    await expect(
      operator.getByRole("switch", { name: "External gift choices" }),
    ).toBeEnabled();
    await operator
      .getByRole("switch", { name: "GIF library", exact: true })
      .click();
    await expect(
      operator.getByRole("switch", { name: "GIF library", exact: true }),
    ).toHaveAttribute("aria-checked", "false");
    await operator
      .getByRole("switch", { name: "GIF library", exact: true })
      .click();
    await expect(
      operator.getByRole("switch", { name: "GIF library", exact: true }),
    ).toHaveAttribute("aria-checked", "true");
    await operator.goto("http://127.0.0.1:4175/admin/overview");
    await expect(operator.locator("body")).not.toContainText(
      "The little moments will become your biggest memories.",
    );
    const audit = await new AxeBuilder({ page: operator })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
  } finally {
    await operatorContext.close();
  }
});
test("public pages fit a phone, keep exact About copy and Instagram, and preserve keyboard and reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const height of [667, 812]) {
    await page.setViewportSize({ width: 375, height });
    for (const route of [
      "/",
      "/how-it-works",
      "/cards",
      "/pricing",
      "/about",
      "/contact",
      "/privacy",
      "/terms",
      "/accessibility",
      "/start",
    ]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const size = await page.evaluate(() => ({
        width: innerWidth,
        height: innerHeight,
        pageWidth: document.documentElement.scrollWidth,
        pageHeight: document.documentElement.scrollHeight,
      }));
      expect(size.pageWidth, route).toBeLessThanOrEqual(size.width);
      expect(size.pageHeight, route).toBeLessThanOrEqual(size.height);
      await expect(
        page.locator(
          'footer a[href="https://www.instagram.com/thedigitalcardbox/"]',
        ),
      ).toBeVisible();
      const report = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(report.violations, route).toEqual([]);
    }
  }
  await page.goto("/about");
  const exact =
    "The Digital Card box is a comprehensive digital event solutions platform that modernizes social celebrations by seamlessly integrating digital invitations, sentimental e-cards, and frictionless cash gifting into a unified web and mobile ecosystem. The platform empowers event hosts to design elegant e-invites and deploy venue-specific, custom QR codes that replace physical envelope boxes at weddings, baby showers, and milestone parties. Simultaneously, it provides guests with a secure, all-in-one portal to compose meaningful, permanently archived digital notes and directly execute secure monetary gifts. By bridging the emotional value of traditional greeting cards with the convenience of instant mobile payments, the company eliminates the logistical friction of ATMs, physical card shopping, and venue storage, offering a sustainable, highly secure, and digitally preserved gifting experience for the modern era";
  await expect(page.locator(".about-verbatim")).toHaveText(exact);
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Open the card", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Play GIF", exact: true }),
  ).toBeDisabled();
  await expect(page.locator('img[src$=".gif"]')).toHaveCount(0);
  await expect(page.getByText("Hugs + Kisses,")).toBeVisible();
});

test("a failed server send keeps the draft and never claims delivery", async ({
  page,
  browser,
}) => {
  await login(page);
  await page.goto("/workspace/events/test-baby-shower/share");
  const invitation = await page
    .getByLabel("Guest invitation link")
    .inputValue();
  const guestContext = await browser.newContext({
    baseURL: "http://127.0.0.1:4175",
    reducedMotion: "reduce",
  });
  try {
    const guest = await guestContext.newPage();
    await guest.goto(invitation + "/card");
    await guest
      .getByLabel("Your name", { exact: true })
      .fill("Retry Without False Success");
    await guest
      .getByLabel("Your note", { exact: true })
      .fill("One little note, delivered only after confirmation.");
    await guest.getByRole("button", { name: "Review my card" }).click();
    await guest.route("**/api/invitations/*/cards", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "test_unavailable",
            message: "The test server is unavailable. Please try again.",
          },
        }),
      }),
    );
    await guest.getByRole("button", { name: "Send my card" }).click();
    await expect(guest.getByRole("alert")).toContainText(
      "The test server is unavailable",
    );
    await expect(guest).toHaveURL(/\/review$/);
    await expect(
      guest.getByRole("heading", { name: "Your words have a home." }),
    ).toHaveCount(0);
    await guest.unroute("**/api/invitations/*/cards");
    await guest.getByRole("button", { name: "Send my card" }).click();
    await expect(
      guest.getByRole("link", { name: "Skip gift and finish" }),
    ).toBeVisible();
    await guest.getByRole("link", { name: "Skip gift and finish" }).click();
    await expect(
      guest.getByRole("heading", { name: "Your words have a home." }),
    ).toBeVisible();
    const workspace = await page.request.get("/api/host/workspace");
    const value = await workspace.json();
    expect(
      value.entries.filter(
        (entry: { name: string }) =>
          entry.name === "Retry Without False Success",
      ),
    ).toHaveLength(1);
  } finally {
    await guestContext.close();
  }
});

test("the home card opens once, pauses its GIF, and keeps manual controls available", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const control = page.getByRole("button", {
    name: "Close the card",
    exact: true,
  });
  await expect(control).toBeVisible();
  await expect(page.locator('img[src="/gifs/cosmic.gif"]')).toBeVisible();
  await expect(page.locator('img[src="/gifs/cosmic.gif"]')).toHaveCount(0, {
    timeout: 6000,
  });
  await control.click();
  await expect(
    page.getByRole("button", { name: "Open the card", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open the baby card", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Close the card", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Play GIF", exact: true }).click();
  await expect(page.locator('img[src="/gifs/cosmic.gif"]')).toBeVisible();
  await page.getByRole("button", { name: "Pause GIF", exact: true }).click();
  await expect(page.locator('img[src="/gifs/cosmic.gif"]')).toHaveCount(0);
});

test("the development server never serves database files, keys or backend source", async ({
  page,
}) => {
  const database = process.env.DCB_CONNECTED_DATABASE!;
  const key = database.replace(/[^/]+$/, "review-link.key");
  for (const path of [
    "/server/index.mjs",
    "/server/index.mjs?raw",
    "/@fs" + database,
    "/@fs" + key,
  ]) {
    const response = await page.request.get(path);
    expect(response.status(), path).toBe(403);
  }
  const gif = await page.request.get("/gifs/cosmic.gif");
  expect(gif.status()).toBe(200);
  expect(gif.headers()["content-type"]).toContain("image/gif");
  expect((await page.request.get("/api/health")).status()).toBe(200);
});

test("all three seeded gift handoffs stay private previews and appear unconfirmed in the host inbox", async ({
  page,
  browser,
}) => {
  await login(page);
  const workspace = await (
    await page.request.get("/api/host/workspace")
  ).json();
  const event = workspace.events.find(
    (e: { id: string }) => e.id === "test-baby-shower",
  );
  for (const service of ["Cash App", "Venmo", "Zelle"]) {
    const context = await browser.newContext({
      baseURL: "http://127.0.0.1:4175",
      viewport: { width: 375, height: 667 },
      reducedMotion: "reduce",
    });
    try {
      const guest = await context.newPage();
      const external: string[] = [];
      guest.on("request", (request) => {
        if (!request.url().startsWith("http://127.0.0.1:4175"))
          external.push(request.url());
      });
      await guest.goto("/g/" + event.token + "/gift");
      await guest
        .getByLabel("The name your host knows you by")
        .fill("Provider review " + service);
      await guest
        .getByLabel("Your name in the payment app")
        .fill("Known nickname");
      await guest.getByLabel("Intended gift amount").fill("25.50");
      await guest.getByRole("button", { name: service, exact: true }).click();
      await guest
        .getByRole("checkbox", { name: /I will check the exact recipient/ })
        .check();
      await guest.getByRole("button", { name: "Save gift details" }).click();
      await expect(
        guest.getByRole("heading", {
          name: "Continue with " + service,
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        guest.getByText("Test recipient · Preview only.", { exact: false }),
      ).toBeVisible();
      const axe = await new AxeBuilder({ page: guest }).analyze();
      expect(axe.violations).toEqual([]);
      expect(
        await guest.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await guest
        .getByRole("button", {
          name:
            service === "Zelle"
              ? "Preview bank handoff"
              : "Preview " + service + " handoff",
        })
        .click();
      await guest
        .getByRole("button", { name: "Finish without sending money" })
        .click();
      await expect(guest.getByText(/Your gift is unconfirmed/)).toBeVisible();
      expect(external).toEqual([]);
      const current = await (
        await page.request.get("/api/host/workspace")
      ).json();
      const gifts = current.gifts.filter(
        (g: { name: string }) => g.name === "Provider review " + service,
      );
      expect(gifts).toHaveLength(1);
      expect(gifts[0]).toMatchObject({
        status: "unconfirmed",
        service,
        amount: "25.50",
        alias: "Known nickname",
        previewOnly: true,
      });
      await page.goto("/workspace/events/" + event.id + "/gifts");
      await page.getByLabel("Find a gift").fill("Provider review " + service);
      await expect(page.locator(".gift-item")).toContainText("Unconfirmed");
      await expect(page.locator(".gift-item")).toContainText("Known nickname");
    } finally {
      await context.close();
    }
  }
});
