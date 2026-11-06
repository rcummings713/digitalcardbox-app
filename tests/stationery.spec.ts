import { test, expect } from "@playwright/test";
import type { Page, BrowserContext } from "@playwright/test";
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import jsQR from "jsqr";
let hostCookies: Awaited<ReturnType<BrowserContext["cookies"]>> | undefined;
async function login(page: Page) {
  if (hostCookies) {
    await page.context().addCookies(hostCookies);
    await page.goto("/workspace");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "A little hello",
    );
    return;
  }
  await page.goto("/workspace");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("host@digitalcardbox.test");
  await page.getByLabel("Password", { exact: true }).fill("CardBoxReview!2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A little hello",
  );
  hostCookies = await page.context().cookies();
}
async function typeOnDesign(page: Page, label: string, text: string) {
  await page
    .getByRole("button", { name: "Edit " + label, exact: true })
    .dblclick();
  const field = page.getByRole("textbox", {
    name: "Type " + label + " on design",
    exact: true,
  });
  await field.fill(text);
  await field.press("Control+Enter");
  await expect(field).toHaveCount(0);
}

test("mobile creators type directly on a design, format, resize, undo, and reopen an editable file", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/cards");
  await page.getByRole("button", { name: /Generic cards/ }).click();
  await page.getByLabel("Filter designs").selectOption("All designs");
  expect(
    await page.locator(".studio-template-grid>button").count(),
  ).toBeGreaterThanOrEqual(100);
  await page.getByLabel("Search templates", { exact: true }).fill("Porcelain");
  await expect(page.locator(".studio-template-grid>button")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Porcelain Blue · Arch", exact: true })
    .click();
  await typeOnDesign(page, "Heading", "A beautiful reason to celebrate");
  await expect(page.getByLabel("Heading", { exact: true })).toHaveValue(
    "A beautiful reason to celebrate",
  );
  await page.getByRole("button", { name: "Bold text", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Bold text", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "↶ Undo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Bold text", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "↷ Redo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit Heading", exact: true }),
  ).toHaveCSS("font-weight", "700");
  const heading = page.getByRole("button", {
      name: "Edit Heading",
      exact: true,
    }),
    before = await heading.evaluate((el) => parseFloat(el.style.width));
  await page
    .getByRole("button", { name: "Resize Heading", exact: true })
    .focus();
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() => heading.evaluate((el) => parseFloat(el.style.width)))
    .toBe(before + 1);
  await page.getByLabel("Text layer", { exact: true }).selectOption("message");
  await typeOnDesign(
    page,
    "Your message",
    "Words typed directly on the card.\nA second line to keep.",
  );
  await page
    .getByLabel("Layer typography", { exact: true })
    .selectOption("sans");
  await page
    .getByText("Save or open an editable design file", { exact: true })
    .click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page
      .getByRole("button", { name: "Export editable design", exact: true })
      .click(),
  ]);
  const path = test.info().outputPath("review.dcb.json");
  await download.saveAs(path);
  const file = JSON.parse(readFileSync(path, "utf8"));
  expect(
    file.design.blocks.find((b: { id: string }) => b.id === "message").text,
  ).toContain("Words typed directly");
  await page
    .getByLabel("Your message", { exact: true })
    .fill("An unsaved replacement");
  await page
    .getByLabel("Import editable design (.dcb.json)", { exact: true })
    .setInputFiles(path);
  await expect(page.getByLabel("Your message", { exact: true })).toContainText(
    "Words typed directly",
  );
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Reset layout", exact: true }).click();
  await expect(page.getByLabel("Your message", { exact: true })).toContainText(
    "Words typed directly",
  );
  await page.reload();
  await expect(page.locator(".editor-stage")).toContainText(
    "Words typed directly",
  );
  expect(
    (await (await page.request.get("/api/session")).json()).account,
  ).toBeNull();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("save-the-date carries through setup, publishes its exact QR, and stays useful before contributions open", async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/save-the-dates");
  await page.getByRole("button", { name: /Save-the-date templates/ }).click();
  await typeOnDesign(page, "Event title", "A date worth keeping");
  expect(
    (await (await page.request.get("/api/session")).json()).account,
  ).toBeNull();
  await expect(
    page.getByRole("button", { name: "Share save-the-date", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("link", { name: "Create an event & card box ↗", exact: true })
    .click();
  await page.getByRole("button", { name: /Continue with test host/ }).click();
  await page
    .getByLabel("Card box title", { exact: true })
    .fill("Our early save-the-date");
  await page.getByLabel("Host name or names").fill("Alex & Taylor");
  const future = new Date();
  future.setUTCDate(future.getUTCDate() + 240);
  await page
    .getByLabel("Event date", { exact: true })
    .fill(future.toISOString().slice(0, 10));
  await page.getByLabel("Location", { exact: false }).fill("The Garden Room");
  await page
    .getByRole("button", { name: "Create card box", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Design your save-the-date.",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Invite & share", exact: true }).click();
  await page
    .getByRole("button", { name: "Publish guest link", exact: true })
    .click();
  const url = await page
    .getByLabel("Save-the-date link", { exact: true })
    .inputValue();
  expect(url).toMatch(/\/save-the-date$/);
  const qr = page.getByAltText("QR code for this event’s save-the-date", {
    exact: true,
  });
  await expect(qr).toBeVisible();
  const pixels = await qr.evaluate(async (image) => {
    await (image as HTMLImageElement).decode();
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image as HTMLImageElement, 0, 0, 640, 640);
    return Array.from(ctx.getImageData(0, 0, 640, 640).data);
  });
  expect(jsQR(new Uint8ClampedArray(pixels), 640, 640)?.data).toBe(url);
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    reducedMotion: "reduce",
  });
  try {
    const guest = await context.newPage();
    await guest.goto(url);
    await expect(
      guest.getByRole("group", {
        name: "Your host’s save-the-date",
        exact: true,
      }),
    ).toContainText("Our early save-the-date");
    await expect(
      guest.getByText("Cards and gifts aren’t open yet.", { exact: false }),
    ).toBeVisible();
    await expect(guest.getByRole("link", { name: /Leave a card/ })).toHaveCount(
      0,
    );
    expect(
      (
        await guest.request.get("http://127.0.0.1:4175/api/host/workspace")
      ).status(),
    ).toBe(401);
    expect(
      (
        await new AxeBuilder({ page: guest })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  } finally {
    await context.close();
  }
});

test("page, artwork and text motion can be previewed, stopped and disabled by reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/invitations");
  await page
    .getByRole("button", { name: "Edit Opening line", exact: true })
    .click();
  await page
    .getByLabel("Page animation", { exact: true })
    .selectOption("stagger");
  await page
    .getByLabel("Artwork animation", { exact: true })
    .selectOption("drift");
  await page.getByLabel("Text layer", { exact: true }).selectOption("details");
  await page.getByLabel("Text animation", { exact: true }).selectOption("fade");
  await page
    .getByRole("button", { name: "Preview design", exact: true })
    .click();
  const layer = page.locator(".editor-stage .design-text-layer").first();
  await expect(layer).toHaveCSS("animation-name", "dcb-motion-rise");
  await expect(page.locator(".editor-stage .design-artwork-layer")).toHaveCSS(
    "animation-name",
    "dcb-motion-drift",
  );
  await page
    .getByRole("button", { name: "Show still design", exact: true })
    .click();
  await expect(layer).toHaveCSS("animation-name", "none");
  await expect(layer).toHaveCSS("opacity", "1");
  await page
    .getByRole("button", { name: "Replay animation", exact: true })
    .click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByRole("button", {
      name: "Animations off · reduced motion",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(layer).toHaveCSS("animation-name", "none");
  await expect(layer).toHaveCSS("opacity", "1");
});

test("guest edits the selected template on the card and the host receives its exact words and effects", async ({
  page,
  browser,
}) => {
  await login(page);
  await page.goto("/workspace/events/test-baby-shower/share");
  const url = await page.getByLabel("Guest invitation link").inputValue();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  try {
    const guest = await context.newPage();
    await guest.goto(url + "/card");
    await guest
      .getByRole("button", { name: "Edit text on this card", exact: true })
      .click();
    await guest.getByText("Make the layout yours", { exact: true }).click();
    await typeOnDesign(
      guest,
      "Your message",
      "  A card written directly in the design.\nWith a second line.  ",
    );
    await guest.getByRole("button", { name: "Bold text", exact: true }).click();
    await guest
      .getByLabel("Page animation", { exact: true })
      .selectOption("fade");
    await guest
      .getByLabel("Your name", { exact: true })
      .fill("Inline Editor Guest");
    await guest.getByRole("button", { name: /^Review my card/ }).click();
    await guest.getByRole("button", { name: /^Send my card/ }).click();
    await expect(
      guest.getByRole("heading", {
        name: /A little extra, if you’d like.|Your words have a home./,
      }),
    ).toBeVisible();
    const data = await (await page.request.get("/api/host/workspace")).json();
    const entry = data.entries.find(
      (e: { name: string }) => e.name === "Inline Editor Guest",
    );
    expect(entry.note).toBe(
      "A card written directly in the design.\nWith a second line.",
    );
    expect(
      entry.design.blocks.find((b: { id: string }) => b.id === "message").text,
    ).toBe(entry.note);
    expect(
      entry.design.blocks.find((b: { id: string }) => b.id === "message").bold,
    ).toBe(true);
    expect(entry.design.motion).toBe("fade");
  } finally {
    await context.close();
  }
});

test("host configures PayPal and guest sees an unconfirmed profile handoff with no payment parameters", async ({
  page,
}) => {
  await login(page);
  await page.goto("/workspace/events/test-baby-shower/settings");
  const form = page.locator(".destination-form").filter({
    has: page.getByRole("heading", { name: "PayPal", exact: true }),
  });
  await form
    .getByLabel("Recipient shown in the service", { exact: true })
    .fill("Owner-reviewed PayPal");
  await form
    .getByLabel("PayPal.Me handle (letters and numbers only)", { exact: true })
    .fill("OwnerReviewed42");
  await form
    .getByLabel("Enter it again", { exact: true })
    .fill("OwnerReviewed42");
  await form.getByLabel(/Preview only:/).uncheck();
  await form.getByLabel(/I checked this exact recipient/).check();
  await form
    .getByRole("button", { name: "Save & confirm service", exact: true })
    .click();
  await expect(form).toContainText("Host confirmed");
  await page.goto("/workspace/events/test-baby-shower/share");
  const url = await page.getByLabel("Guest invitation link").inputValue();
  await page.goto(url + "/gift");
  await page.getByRole("button", { name: "PayPal", exact: true }).click();
  await page
    .getByLabel("The name your host knows you by")
    .fill("PayPal route review");
  await page
    .getByRole("checkbox", { name: /I will check the exact recipient/ })
    .check();
  await page
    .getByRole("button", { name: "Save gift details", exact: true })
    .click();
  await expect(page.locator(".route-address")).toHaveText(
    "Destination: https://paypal.me/OwnerReviewed42",
  );
  const outbound: string[] = [];
  await page.route("https://paypal.me/**", async (route) => {
    outbound.push(route.request().url());
    await route.fulfill({
      contentType: "text/html",
      body: "<h1>Intercepted PayPal review</h1>",
    });
  });
  await page.getByRole("button", { name: /^Open PayPal/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Intercepted PayPal review",
      exact: true,
    }),
  ).toBeVisible();
  expect(outbound).toEqual(["https://paypal.me/OwnerReviewed42"]);
  const workspace = await (
    await page.request.get("http://127.0.0.1:4175/api/host/workspace")
  ).json();
  expect(
    workspace.gifts.find(
      (g: { name: string }) => g.name === "PayPal route review",
    ).status,
  ).toBe("unconfirmed");
});
