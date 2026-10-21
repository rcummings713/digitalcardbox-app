import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const invitation = "/g/7a9c0e78-2da1-4dc8-a13e-68c422b479a0";
const host = "/workspace/events/alex-maya";
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-13T16:00:00Z"));
});
test("public pages offer creation without exposing an event directory", async ({
  page,
}) => {
  for (const route of [
    "/",
    "/cards",
    "/how-it-works",
    "/pricing",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/accessibility",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      /\bsample\b|\bdemo\b|\bprototype\b/i,
    );
    await expect(page.locator('a[href^="/g/"]')).toHaveCount(0);
  }
  await page.goto("/");
  await page.getByRole("link", { name: "Create a wedding card box" }).click();
  await expect(
    page.getByRole("button", { name: "Continue with Apple" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Continue without signing in" }).click();
  await expect(page.getByLabel("Occasion", { exact: true })).toHaveValue(
    "Wedding",
  );
  await page.getByLabel("Card box title").fill("Our favorite people");
  await page.getByLabel("Host name or names").fill("Riley & Jamie");
  await page.getByLabel("Event date", { exact: true }).fill("2026-11-14");
  await page
    .getByRole("button", { name: "Create card box", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Our favorite people", level: 1 }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Our favorite people", level: 1 }),
  ).toBeVisible();
});
test("guest links reject guesses, drafts and rotated links; legacy paths expose no event", async ({
  page,
}) => {
  for (const route of [
    "/guest",
    "/g/not-a-real-invitation",
    "/g/b6e162d9-27f1-45fc-a9d2-a7c8e24eca27",
  ]) {
    await page.goto(route);
    await expect(page.locator("body")).not.toContainText(
      "Our favorite people, all in one place.",
    );
  }
  await page.goto(host + "/settings");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Rotate guest link" }).click();
  await page.goto(invitation);
  await expect(
    page.getByRole("heading", { name: "Your invitation is not available." }),
  ).toBeVisible();
});
test("guest composes a card, searches GIFs and keeps host-only content out of the book", async ({
  page,
}) => {
  await page.goto(invitation);
  await page
    .getByRole("link", { name: "Choose a card & leave a note" })
    .click();
  await page.getByLabel("Your name", { exact: true }).fill("Jordan Review");
  await page
    .getByLabel("Your note", { exact: true })
    .fill("A beautiful next chapter, with all our love.");
  await page.getByLabel("Written in the Stars", { exact: true }).check();
  await page.getByRole("button", { name: "Add a GIF" }).click();
  await page.getByLabel("Find a little feeling").fill("flowers");
  await expect(page.locator(".gif-grid>button")).toHaveCount(1);
  await page.getByRole("button", { name: "A little bouquet" }).click();
  await expect(page.locator('img[src$=".gif"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Pause GIF" }).click();
  await page.getByRole("button", { name: "Review my card" }).click();
  await page.getByRole("button", { name: "Send my card" }).click();
  await page.goto(host + "/cards");
  await page.getByLabel("Find a card").fill("Jordan Review");
  await expect(
    page.getByRole("heading", { name: "Jordan Review" }),
  ).toBeVisible();
  await expect(page.getByText("Host only", { exact: true })).toBeVisible();
  await page.goto(host + "/book");
  await page.getByRole("button", { name: "Read as text" }).click();
  await expect(page.locator(".book-transcript")).not.toContainText(
    "Jordan Review",
  );
});
test("consented cards reach the book once and hidden cards are removed immediately", async ({
  page,
}) => {
  await page.goto(invitation + "/card");
  await page.getByLabel("Your name", { exact: true }).fill("Book Guest");
  await page
    .getByLabel("Your note", { exact: true })
    .fill("For all your wonderful tomorrows.");
  await page.getByRole("checkbox", { name: /Include my card/ }).check();
  await page.getByRole("button", { name: "Review my card" }).click();
  await page.getByRole("button", { name: "Send my card" }).click();
  await page.goto(host + "/book");
  await page.getByRole("button", { name: "Read as text" }).click();
  await expect(
    page.getByRole("heading", { name: "From Book Guest" }),
  ).toHaveCount(1);
  await page.goto(host + "/cards");
  await page.getByLabel("Find a card").fill("Book Guest");
  await page.getByRole("button", { name: "Read & manage card" }).click();
  await page.getByRole("button", { name: "Hide from book" }).click();
  await page.goto(host + "/book");
  await page.getByRole("button", { name: "Read as text" }).click();
  await expect(
    page.getByRole("heading", { name: "From Book Guest" }),
  ).toHaveCount(0);
});
test("gift service changes reset review and a guest report cannot confirm receipt", async ({
  page,
}) => {
  await page.goto(invitation + "/gift");
  await page.getByLabel("The name your host knows you by").fill("Alex Review");
  await page.getByLabel("Your name in the payment app").fill("AR");
  await page.getByLabel("Intended gift amount").fill("25");
  const acknowledgment = page.getByRole("checkbox", {
    name: /I will check the exact recipient/,
  });
  await acknowledgment.check();
  await expect(
    page.getByRole("button", { name: "Save gift details" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Cash App", exact: true }).click();
  await expect(acknowledgment).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Save gift details" }),
  ).toBeDisabled();
  await acknowledgment.check();
  await page.getByRole("button", { name: "Save gift details" }).click();
  await expect(
    page.getByRole("heading", { name: "Continue with Cash App", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Preview Cash App handoff" }).click();
  await page
    .getByRole("button", { name: "Finish without sending money" })
    .click();
  await expect(page.getByText(/Your gift is unconfirmed/)).toBeVisible();
  await page.goto(host + "/gifts");
  await page.getByLabel("Find a gift").fill("Alex Review");
  await expect(page.locator(".gift-item")).toContainText("Unconfirmed");
  await expect(page.locator(".gift-item")).toContainText("AR");
  await page.getByRole("button", { name: "Check receipt" }).click();
  await expect(
    page.getByRole("button", { name: "Mark host confirmed" }),
  ).toBeDisabled();
  await page
    .getByRole("checkbox", { name: /I checked the matching sender/ })
    .check();
  await page.getByRole("button", { name: "Mark host confirmed" }).click();
  await expect(page.locator(".gift-item .badge")).toHaveText("Host confirmed");
});
test("admin flags affect guest choices while preserving existing records", async ({
  page,
}) => {
  await page.goto("/admin/features");
  await page.getByRole("switch", { name: "GIF library" }).click();
  await page.getByRole("switch", { name: "External gift choices" }).click();
  await page.getByRole("switch", { name: "Writing and card assistance" }).click();
  await page.goto(invitation + "/card");
  await expect(page.getByRole("button", { name: "Add a GIF" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Need a little starting point?" }),
  ).toHaveCount(0);
  await page.goto(invitation + "/gift");
  await expect(
    page.getByRole("heading", { name: "Words are more than enough." }),
  ).toBeVisible();
  await page.goto(host + "/gifts");
  await expect(page.locator(".gift-item")).toHaveCount(3);
});
test("paused and closed events do not accept cards; disabled destinations disappear", async ({
  page,
}) => {
  await page.goto(host + "/settings");
  await page.getByRole("button", { name: "Pause service" }).first().click();
  await page.goto(invitation + "/gift");
  await expect(
    page.getByRole("button", { name: "Venmo", exact: true }),
  ).toHaveCount(0);
  await page.goto(host + "/settings");
  await page.getByRole("button", { name: "Pause invitation" }).click();
  await page.goto(invitation + "/card");
  await expect(
    page.getByRole("heading", {
      name: "This invitation is taking a little pause.",
    }),
  ).toBeVisible();
  await page.goto("/g/0f864866-12e8-4c72-a187-a1df64736c91");
  await expect(
    page.getByRole("heading", { name: "A beautiful chapter, now complete." }),
  ).toBeVisible();
});
test("public and application pages have no serious accessibility violations and fit narrow screens", async ({
  page,
}) => {
  const routes = [
    "/",
    "/start",
    "/workspace",
    host + "/edit",
    host + "/cards",
    host + "/gifts",
    host + "/book",
    "/admin/features",
    invitation,
    invitation + "/card",
    invitation + "/gift",
    "/contact",
  ];
  for (const route of routes) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    const report = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(report.violations, route).toEqual([]);
  }
  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/workspace",
      host + "/cards",
      host + "/book",
      "/admin/features",
      invitation + "/card",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        offenders: [...document.querySelectorAll("body *")]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              tag: element.tagName,
              class: element.getAttribute("class"),
              left: rect.left,
              right: rect.right,
            };
          })
          .filter((rect) => rect.right > innerWidth + 0.5 || rect.left < -0.5)
          .slice(0, 12),
      }));
      expect(
        layout.scrollWidth <= layout.width,
        `${route} at ${width}px: ${JSON.stringify(layout)}`,
      ).toBe(true);
    }
  }
});
test("keyboard skip, browser navigation, reduced motion and draft refresh work", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "How it works", exact: true })
    .click();
  await expect(page.locator("main")).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL(/\/(#main-content)?$/);
  await page.goto(invitation + "/card");
  await page.getByLabel("Your name", { exact: true }).fill("Remembered Guest");
  await page
    .getByLabel("Your note", { exact: true })
    .fill("My words survive a refresh.");
  await page.reload();
  await expect(page.getByLabel("Your note", { exact: true })).toHaveValue(
    "My words survive a refresh.",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Add a GIF" }).click();
  await page.getByRole("button", { name: "Sending love", exact: true }).click();
  await expect(page.locator('img[src$=".gif"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Play GIF" })).toHaveCount(0);
});
test("photo handling rejects unsupported files and keeps accepted images local", async ({
  page,
}) => {
  await page.goto(invitation + "/card");
  await page.getByLabel("Add a photo").setInputFiles({
    name: "not-a-photo.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(page.getByRole("alert")).toContainText(
    "Choose a JPG, PNG or WebP photo up to 2 MB.",
  );
  await page
    .getByLabel("Add a photo")
    .setInputFiles("public/images/flowers.jpg");
  await expect(page.locator("img.card-photo")).toHaveAttribute(
    "src",
    /^data:image\/jpeg/,
  );
  await page.getByRole("button", { name: "Remove photo", exact: true }).click();
  await expect(page.locator("img.card-photo")).toHaveCount(0);
});

test("guided writing preserves the supplied memory and remains editable", async ({
  page,
}) => {
  await page.goto(invitation + "/card");
  await page
    .getByRole("button", { name: "Need a little starting point?" })
    .click();
  await page
    .getByLabel("A memory in your own words")
    .fill("Our quiet afternoon in the garden.");
  await page.getByLabel("A little tone").selectOption("Classic");
  await page.getByRole("button", { name: "Prepare three choices" }).click();
  await expect(page.locator(".writing-choice")).toHaveCount(3);
  await page.locator(".writing-choice").first().click();
  await expect(page.getByLabel("Your note", { exact: true })).toContainText(
    "Our quiet afternoon in the garden.",
  );
  await page
    .getByLabel("Your note", { exact: true })
    .fill("My own words are always welcome.");
  await expect(page.getByLabel("Your note", { exact: true })).toHaveValue(
    "My own words are always welcome.",
  );
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(report.violations).toEqual([]);
});
test("scheduled and late-wedding invitation states offer only allowed actions", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-01-10T16:00:00Z"));
  await page.goto(invitation + "/card");
  await expect(
    page.getByRole("heading", { name: "A little early, and so welcome." }),
  ).toBeVisible();
  await page.clock.setFixedTime(new Date("2027-02-10T16:00:00Z"));
  await page.goto(invitation + "/card");
  await expect(
    page.getByRole("heading", {
      name: "The cards are gathered. The love continues.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Leave a gift", exact: true }),
  ).toBeVisible();
  await page.clock.setFixedTime(new Date("2027-11-10T16:00:00Z"));
  await page.goto(invitation + "/gift");
  await expect(
    page.getByRole("heading", { name: "A beautiful chapter, now complete." }),
  ).toBeVisible();
});

test("both book styles preserve the same consented cards and remember the event choice", async ({
  page,
}) => {
  await page.goto(host + "/book");
  await expect(
    page.getByRole("button", { name: "The Editorial", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "The Collage", exact: true }).click();
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(page.locator(".book-collage .keepsake-card")).toHaveCount(2);
  await expect(page.locator(".book-spread")).toContainText("Jordan Lee");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "The Collage", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto(host + "/edit");
  await page.getByRole("button", { name: "Save event details" }).click();
  await page.goto(host + "/book");
  await expect(
    page.getByRole("button", { name: "The Collage", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "The Editorial", exact: true })
    .click();
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(page.locator(".book-editorial .book-spread")).toContainText(
    "Jordan Lee",
  );
  await expect(page.locator(".book-editorial .keepsake-card")).toHaveCount(0);
});

test("a host-confirmed real Venmo recipient opens its exact profile without payment parameters", async ({
  page,
}) => {
  await page.goto(host + "/settings");
  const form = page
    .locator(".destination-form")
    .filter({ has: page.getByRole("heading", { name: "Venmo", exact: true }) });
  await form
    .getByLabel("Exact account identifier", { exact: true })
    .fill("@owner-reviewed");
  await form
    .getByLabel("Enter it again", { exact: true })
    .fill("@owner-reviewed");
  await form.getByLabel(/Preview only:/).uncheck();
  await form.getByLabel(/I checked this exact recipient/).check();
  await form.getByRole("button", { name: "Save & confirm service" }).click();
  await page.goto(invitation + "/gift");
  await page
    .getByLabel("The name your host knows you by")
    .fill("Real route review");
  await page
    .getByRole("checkbox", { name: /I will check the exact recipient/ })
    .check();
  await page.getByRole("button", { name: "Save gift details" }).click();
  await expect(page.locator(".route-address")).toHaveText(
    "Destination: https://venmo.com/u/owner-reviewed",
  );
  const outbound: string[] = [];
  await page.route("https://venmo.com/**", async (route) => {
    outbound.push(route.request().url());
    await route.fulfill({
      contentType: "text/html",
      body: "<h1>Intercepted provider handoff</h1>",
    });
  });
  await page.getByRole("button", { name: "Open Venmo" }).click();
  await expect(
    page.getByRole("heading", { name: "Intercepted provider handoff" }),
  ).toBeVisible();
  expect(outbound).toEqual(["https://venmo.com/u/owner-reviewed"]);
});
