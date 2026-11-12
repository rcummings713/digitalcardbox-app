import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
let preservedHostCookies:
  | Awaited<ReturnType<import("@playwright/test").BrowserContext["cookies"]>>
  | undefined;

test("visitors design a card without an account; text tools, undo, GIF and saved draft survive refresh", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/cards");
  expect(
    (await (await page.request.get("/api/session")).json()).account,
  ).toBeNull();
  const options = page.locator(".studio-start-options>button");
  await expect(options.nth(0)).toContainText("Create your own card");
  await expect(options.nth(1)).toContainText("Generic cards");
  await options.nth(1).click();
  await page.getByLabel("Filter designs").selectOption("All designs");
  expect(await page.locator(".studio-template-grid>button").count()).toBe(12);
  await page.getByRole("button", { name: /Show more templates/ }).click();
  await expect(page.locator(".studio-template-grid>button")).toHaveCount(24);
  await page
    .getByLabel("Search templates", { exact: true })
    .fill("Pressed Peony");
  await page
    .getByRole("button", { name: "Pressed Peony", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit Heading", exact: true }).click();
  await page.getByLabel("Text layer", { exact: true }).selectOption("message");
  await page
    .getByLabel("Your message", { exact: true })
    .fill("A little note that will stay with you.");
  await page.getByLabel("Colors", { exact: true }).selectOption("sage");
  await page.getByRole("button", { name: "↶ Undo", exact: true }).click();
  await expect(page.getByLabel("Colors", { exact: true })).toHaveValue("ivory");
  await page.getByRole("button", { name: "↷ Redo", exact: true }).click();
  await page.getByRole("button", { name: "Add a GIF", exact: true }).click();
  await page.getByLabel("Find a little feeling").fill("heart face");
  await page.getByRole("button", { name: "Heart Face", exact: true }).click();
  await page
    .getByRole("button", { name: "Save card draft", exact: true })
    .click();
  await page.reload();
  await expect(page.locator(".editor-stage")).toContainText(
    "A little note that will stay with you.",
  );
  await expect(
    page.locator('.editor-stage img[src="/gifs/noto/1f970.png"]'),
  ).toBeVisible();
  expect(
    (await (await page.request.get("/api/session")).json()).account,
  ).toBeNull();
  await expect(
    page.getByRole("button", { name: "Share invitation", exact: true }),
  ).toHaveCount(0);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
});

test("invitation preview carries through host setup, saves to its event and appears only through the published private link", async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/invitations?occasion=Engagement%20party");
  await page.getByRole("button", { name: /Invitation templates/ }).click();
  await page
    .getByRole("button", { name: "Edit Opening line", exact: true })
    .click();
  await page.getByLabel("Text layer", { exact: true }).selectOption("title");
  await page
    .getByLabel("Event title", { exact: true })
    .fill("An evening for our favorite people");
  await expect(
    page.getByRole("button", { name: "Publish guest link", exact: true }),
  ).toHaveCount(0);
  expect(
    (await (await page.request.get("/api/session")).json()).account,
  ).toBeNull();
  await page
    .getByRole("link", { name: "Create an event & card box ↗", exact: true })
    .click();
  await page.getByRole("button", { name: /Continue with test host/ }).click();
  await expect(page.getByLabel("Occasion", { exact: true })).toHaveValue(
    "Engagement party",
  );
  await page
    .getByLabel("Card box title", { exact: true })
    .fill("An evening for our favorite people");
  await page.getByLabel("Host name or names").fill("Riley & Jordan");
  await page.getByLabel("Event date", { exact: true }).fill("2026-11-21");
  await page.getByLabel("Location", { exact: false }).fill("The Garden Room");
  await page
    .getByRole("button", { name: "Create card box", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Design your invitation.", exact: true }),
  ).toBeVisible();
  const workspace = await (
    await page.request.get("/api/host/workspace")
  ).json();
  const event = workspace.events.find(
    (event: { title: string }) =>
      event.title === "An evening for our favorite people",
  );
  expect(
    event.invitation.blocks.find(
      (block: { id: string }) => block.id === "title",
    ).text,
  ).toBe(event.title);
  expect(
    event.invitation.blocks.find(
      (block: { id: string }) => block.id === "details",
    ).text,
  ).toContain("The Garden Room");
  const context = await browser.newContext();
  try {
    const guest = await context.newPage();
    await guest.goto("http://127.0.0.1:4175/g/" + event.token);
    await expect(
      guest.getByRole("heading", { name: "Your invitation is not available." }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Invite & share", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Publish guest link", exact: true })
      .click();
    const invitation = await page
      .getByLabel("Guest invitation link")
      .inputValue();
    await guest.goto(invitation);
    await expect(
      guest.getByRole("group", { name: "Your host’s invitation", exact: true }),
    ).toContainText("An evening for our favorite people");
    expect((await guest.request.get("/api/host/workspace")).status()).toBe(401);
    await expect(
      page.getByRole("button", { name: "Share invitation", exact: true }),
    ).toBeEnabled();
  } finally {
    await context.close();
  }
});

test("a saved editable card reaches the host with its typography, animation and note intact", async ({
  page,
}) => {
  await page.goto("/cards");
  await page.getByRole("button", { name: "Edit Heading", exact: true }).click();
  await page.getByLabel("Text layer", { exact: true }).selectOption("message");
  await page
    .getByLabel("Your message", { exact: true })
    .fill("A card made with care in the design studio.");
  await page.getByLabel("Colors", { exact: true }).selectOption("ocean");
  await page.getByRole("button", { name: "Add a GIF", exact: true }).click();
  await page.getByLabel("Find a little feeling").fill("heart face");
  await page.getByRole("button", { name: "Heart Face", exact: true }).click();
  await page
    .getByRole("button", { name: "Save card draft", exact: true })
    .click();
  await page.goto("/workspace");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("host@digitalcardbox.test");
  await page.getByLabel("Password", { exact: true }).fill("CardBoxReview!2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A little hello",
  );
  preservedHostCookies = await page.context().cookies();
  await page.goto("/workspace/events/test-baby-shower/share");
  const invitation = await page
    .getByLabel("Guest invitation link")
    .inputValue();
  await page.goto(invitation + "/card");
  await page
    .getByRole("button", { name: "Use my saved card design", exact: true })
    .click();
  await page.getByLabel("Your name", { exact: true }).fill("Studio Guest");
  await expect(page.getByLabel("Your note", { exact: true })).toHaveValue(
    "A card made with care in the design studio.",
  );
  await page.getByRole("button", { name: /^Review my card/ }).click();
  await page.getByRole("button", { name: /^Send my card/ }).click();
  await expect(
    page.getByRole("heading", {
      name: /A little extra, if you’d like.|Your words have a home./,
    }),
  ).toBeVisible();
  await page.goto("/workspace/events/test-baby-shower/cards");
  const data = await (await page.request.get("/api/host/workspace")).json();
  const card = data.entries.find(
    (entry: { name: string }) => entry.name === "Studio Guest",
  );
  expect(card.design.palette).toBe("ocean");
  expect(card.gif).toBe("noto-1f970");
  expect(card.design.gif).toBe(card.gif);
  expect(
    card.design.blocks.find((block: { id: string }) => block.id === "message")
      .text,
  ).toBe(card.note);
});

test("AI completion preserves words edited while waiting and applies artwork only when chosen", async ({
  page,
}) => {
  await page.route("**/api/session", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.configuration.ai.available = true;
    await route.fulfill({ response, json: body });
  });
  let complete!: () => void;
  const pending = new Promise<void>((resolve) => {
    complete = resolve;
  });
  let started!: () => void;
  const begun = new Promise<void>((resolve) => {
    started = resolve;
  });
  await page.route("**/api/studio/art", async (route) => {
    started();
    await pending;
    await route.fulfill({
      status: 201,
      json: { artId: "12345678-1234-1234-1234-123456789abc", repeated: false },
    });
  });
  await page.route("**/api/studio/art/*", async (route) => {
    const response = await page.request.get("/gifs/cosmic-poster.png");
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      body: await response.body(),
    });
  });
  await page.goto("/cards");
  await page.getByRole("button", { name: /Create your own card/ }).click();
  await page
    .getByRole("button", { name: "Generate card artwork", exact: true })
    .click();
  await begun;
  await page.getByRole("button", { name: "Edit Heading", exact: true }).click();
  await page.getByLabel("Text layer", { exact: true }).selectOption("message");
  await page
    .getByLabel("Your message", { exact: true })
    .fill("These words were written while my artwork was being made.");
  complete();
  await expect(
    page.getByRole("button", { name: "Use this artwork", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".editor-stage .design-ai-art")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Use this artwork", exact: true })
    .click();
  await expect(page.locator(".editor-stage .design-ai-art")).toBeVisible();
  await expect(page.getByLabel("Your message", { exact: true })).toHaveValue(
    "These words were written while my artwork was being made.",
  );
});

test("phone invitation gallery shows whole templates and uses page scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/invitations");
  await page.getByRole("button", { name: /Invitation templates/ }).click();
  await expect(
    page.locator(".studio-template-grid>button").first(),
  ).toBeVisible();
  const geometry = await page
    .locator(".studio-template-grid")
    .evaluate((grid) => {
      const tile = grid.querySelector("button")!,
        canvas = tile.querySelector(".design-canvas")!;
      return {
        overflow: getComputedStyle(grid).overflowY,
        tileWidth: tile.getBoundingClientRect().width,
        canvasHeight: canvas.getBoundingClientRect().height,
        scrollingLayers: [
          ...grid.querySelectorAll(".design-text-layer"),
        ].filter((el) =>
          ["auto", "scroll"].includes(getComputedStyle(el).overflowY),
        ).length,
      };
    });
  expect(geometry.overflow).toBe("visible");
  expect(geometry.tileWidth).toBeGreaterThan(250);
  expect(geometry.canvasHeight).toBeGreaterThan(300);
  expect(geometry.scrollingLayers).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("premium editions are chosen before sending and unpaid drafts never appear in the host inbox", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const origin = new URL(
    page.url() === "about:blank" ? "http://127.0.0.1:4175" : page.url(),
  ).origin;
  if (preservedHostCookies)
    await page.context().addCookies(preservedHostCookies);
  else {
    const login = await page.request.post("/api/session", {
      headers: { Origin: origin, "X-DCB-Request": "1" },
      data: {
        email: "host@digitalcardbox.test",
        password: "CardBoxReview!2026",
      },
    });
    expect(login.ok()).toBe(true);
  }
  const before = await (await page.request.get("/api/host/workspace")).json();
  const event = before.events.find(
    (e: { status: string }) => e.status === "published",
  );
  await page.goto("/cards");
  await page.getByRole("button", { name: /Premium cards/ }).click();
  await expect(page.locator(".premium-choice")).toHaveCount(6);
  await page.getByRole("button", { name: /Written in the Stars/ }).click();
  await page
    .getByRole("button", { name: "Save card draft", exact: true })
    .click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto("/g/" + event.token + "/card");
  await page.getByRole("button", { name: /Use my saved card design/ }).click();
  await expect(
    page.getByRole("button", { name: /Written in the Stars/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByLabel("Your name", { exact: true })
    .fill("Private premium review");
  await page
    .getByLabel("Your note", { exact: true })
    .fill("These words stay private until the card is paid and sent.");
  const save = page.waitForResponse(
    (r) => r.url().endsWith("/card-drafts") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: /^Review my card/ }).click();
  const saved = await (await save).json();
  expect(saved.entry.id).toBeTruthy();
  await expect(
    page.getByRole("heading", {
      name: "Your Signature card, made for them.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Your card is already delivered.", { exact: false }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^Send my card/ }),
  ).toBeDisabled();
  const current = await (await page.request.get("/api/host/workspace")).json();
  expect(
    current.entries.some((e: { id: string }) => e.id === saved.entry.id),
  ).toBe(false);
  await page.getByRole("link", { name: "Keep editing", exact: true }).click();
  await page
    .getByRole("button", { name: "Free collection · $0", exact: true })
    .click();
  await page.getByRole("button", { name: /^Review my card/ }).click();
  await expect(
    page.getByRole("button", { name: /^Send my card/ }),
  ).toBeEnabled();
});
