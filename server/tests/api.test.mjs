import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SqliteReviewRepository } from "../adapters/sqlite.mjs";
import { hash } from "../domain/identity.mjs";
import { createApiServer } from "../http.mjs";
import { shiftMonths, windowFor } from "../domain/events.mjs";
const instant = new Date("2026-10-18T16:00:00Z");
const clock = () => instant;
class Agent {
  constructor(base) {
    this.base = base;
    this.jar = new Map();
    this.csrf = null;
  }
  async call(path, method = "GET", value, overrides = {}) {
    const headers = {
      origin: this.base,
      ...(method !== "GET"
        ? {
            "content-type": "application/json",
            "x-dcb-request": "1",
            "x-csrf-token": this.csrf || "",
          }
        : {}),
      ...overrides,
    };
    const cookie = [...this.jar.values()]
      .filter((c) => path.startsWith(c.path))
      .sort((a, b) => b.path.length - a.path.length)
      .map((c) => c.pair)
      .join("; ");
    if (cookie) headers.cookie = cookie;
    const response = await fetch(this.base + path, {
      method,
      headers,
      ...(value === undefined ? {} : { body: JSON.stringify(value) }),
    });
    for (const line of response.headers.getSetCookie()) {
      const pair = line.split(";")[0];
      const name = pair.split("=")[0];
      const scope = line.match(/Path=([^;]+)/i)?.[1] || "/";
      if (/Max-Age=0(?:;|$)/i.test(line)) this.jar.delete(name + scope);
      else this.jar.set(name + scope, { path: scope, pair });
    }
    const data = await response.json();
    if (data.csrfToken) this.csrf = data.csrfToken;
    return { response, data, status: response.status };
  }
  async login(email = "host@digitalcardbox.test") {
    const result = await this.call("/api/session", "POST", {
      email,
      password: "CardBoxReview!2026",
    });
    assert.equal(result.status, 200);
    return result;
  }
}
async function setup(t, options = {}) {
  const directory = await mkdtemp(join(tmpdir(), "dcb-api-"));
  const path = join(directory, "review.sqlite");
  const repo = new SqliteReviewRepository(path, { clock });
  const server = createApiServer(repo, { rateLimit: false, ...options });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    repo.close();
    await rm(directory, { recursive: true, force: true });
  });
  return {
    repo,
    server,
    base,
    path,
    host: new Agent(base),
    guest: new Agent(base),
    other: new Agent(base),
    operator: new Agent(base),
  };
}
const card = (requestKey = "test-request-00001", consent = true) => ({
  requestKey,
  name: "Guest Review",
  note: "All the love in the universe.",
  style: "little-star",
  gif: "cosmic",
  consent,
});
async function invitation(fixture) {
  await fixture.host.login();
  const workspace = await fixture.host.call("/api/host/workspace");
  const event = workspace.data.events[0];
  const path = "/api/invitations/" + event.token;
  const result = await fixture.guest.call(path);
  assert.equal(result.status, 200);
  return { event, path, result };
}
test("unknown endpoints and unauthenticated host reads stay private; money movement has no endpoint", async (t) => {
  const f = await setup(t);
  assert.equal((await f.guest.call("/api/host/workspace")).status, 401);
  assert.equal(
    (await f.guest.call("/api/host/events/test-baby-shower")).status,
    401,
  );
  assert.equal(
    (await f.guest.call("/api/invitations/" + "x".repeat(43))).status,
    404,
  );
  assert.equal((await f.guest.call("/api/not-a-route")).status, 404);
  for (const path of ["/api/payments", "/api/transfers", "/api/gifts"])
    assert.equal((await f.guest.call(path, "POST", {})).status, 404);
  assert.equal((await f.guest.call("/api/health")).data.moneyMovement, false);
});
test("test sign-in issues an HttpOnly session, validates CSRF, and sign-out revokes it", async (t) => {
  const f = await setup(t);
  assert.equal(
    (
      await f.host.call("/api/session", "POST", {
        email: "unknown@digitalcardbox.test",
        password: "incorrect",
      })
    ).status,
    401,
  );
  const login = await f.host.login();
  const cookie = login.response.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Path=\/api/);
  const saved = await f.host.call("/api/host/profile", "PATCH", {
    name: "Jamie Test",
    reducedMotion: true,
  });
  assert.equal(saved.status, 200);
  assert.equal(
    (
      await f.host.call(
        "/api/session",
        "DELETE",
        {},
        { "x-csrf-token": "wrong" },
      )
    ).status,
    403,
  );
  assert.equal((await f.host.call("/api/session", "DELETE", {})).status, 200);
  assert.equal((await f.host.call("/api/host/workspace")).status, 401);
});
test("ownership and operator roles never grant access to another host inbox or private card", async (t) => {
  const f = await setup(t);
  await f.host.login();
  await f.other.login("other@digitalcardbox.test");
  await f.operator.login("operator@digitalcardbox.test");
  const own = (await f.host.call("/api/host/workspace")).data;
  const id = own.events[0].id;
  const entry = own.entries[0];
  assert.equal((await f.other.call("/api/host/events/" + id)).status, 404);
  assert.equal(
    (
      await f.other.call(
        "/api/host/events/" + id,
        "PATCH",
        { title: "Stolen" },
        { "if-match": "1" },
      )
    ).status,
    404,
  );
  assert.equal(
    (await f.other.call("/api/host/cards/" + entry.id, "DELETE", {})).status,
    404,
  );
  assert.equal((await f.operator.call("/api/host/events/" + id)).status, 404);
  assert.equal((await f.host.call("/api/admin/summary")).status, 403);
  const summary = await f.operator.call("/api/admin/summary");
  assert.equal(summary.status, 200);
  assert(!JSON.stringify(summary.data).includes(entry.note));
  assert(!JSON.stringify(summary.data).includes(own.events[0].token));
});
test("an invitation exposes only its public welcome and never a guest directory or inbox", async (t) => {
  const f = await setup(t);
  const { event, path, result } = await invitation(f);
  assert.equal(result.data.event.id, event.id);
  assert(!("entries" in result.data));
  assert(!("owner_id" in result.data.event));
  assert.equal(result.data.event.destinations.length, 3);
  assert(
    result.data.event.destinations.every(
      (d) => d.previewOnly && d.enabled && d.confirmed,
    ),
  );
  assert.equal((await f.guest.call(path + "/cards")).status, 404);
  assert.equal((await f.guest.call("/api/host/workspace")).status, 401);
  const otherGuest = new Agent(f.base);
  assert.equal(
    (await otherGuest.call(path + "/cards", "POST", card())).status,
    401,
  );
});
test("cards persist across fresh browsers and repository reopening; retries add exactly one card", async (t) => {
  const f = await setup(t);
  const { path } = await invitation(f);
  const before = f.repo.one("SELECT count(*) AS n FROM cards").n;
  const first = await f.guest.call(path + "/cards", "POST", card());
  assert.equal(first.status, 201);
  const repeat = await f.guest.call(path + "/cards", "POST", card());
  assert.equal(repeat.status, 200);
  assert.equal(first.data.entry.id, repeat.data.entry.id);
  assert.equal(
    (
      await f.guest.call(path + "/cards", "POST", {
        ...card(),
        note: "changed after sending",
      })
    ).status,
    409,
  );
  assert.equal(f.repo.one("SELECT count(*) AS n FROM cards").n, before + 1);
  const freshHost = new Agent(f.base);
  await freshHost.login();
  assert(
    (await freshHost.call("/api/host/workspace")).data.entries.some(
      (e) => e.id === first.data.entry.id && e.gif === "cosmic",
    ),
  );
  const secondRepo = new SqliteReviewRepository(f.path, { clock });
  assert(
    secondRepo
      .workspace(secondRepo.host("review-host"))
      .entries.some((e) => e.id === first.data.entry.id),
  );
  secondRepo.close();
});
test("consent and host moderation filter book data on the server without deleting private host notes", async (t) => {
  const f = await setup(t);
  const { event, path } = await invitation(f);
  const allowed = await f.guest.call(
    path + "/cards",
    "POST",
    card("allow-book-00001", true),
  );
  const privateCard = await f.guest.call(
    path + "/cards",
    "POST",
    card("host-only-00001", false),
  );
  const book = () => f.host.call(`/api/host/events/${event.id}/book`);
  let result = await book();
  assert(result.data.entries.some((e) => e.id === allowed.data.entry.id));
  assert(!result.data.entries.some((e) => e.id === privateCard.data.entry.id));
  assert.equal(
    (
      await f.host.call("/api/host/cards/" + allowed.data.entry.id, "PATCH", {
        action: "hide",
      })
    ).status,
    200,
  );
  assert(
    !(await book()).data.entries.some((e) => e.id === allowed.data.entry.id),
  );
  await f.host.call("/api/host/cards/" + allowed.data.entry.id, "PATCH", {
    action: "restore",
  });
  assert(
    (await book()).data.entries.some((e) => e.id === allowed.data.entry.id),
  );
  await f.host.call("/api/host/cards/" + allowed.data.entry.id, "DELETE", {});
  assert(
    !(await book()).data.entries.some((e) => e.id === allowed.data.entry.id),
  );
  assert(
    (await f.host.call("/api/host/workspace")).data.entries.some(
      (e) => e.id === privateCard.data.entry.id,
    ),
  );
});
test("date locks survive deletion; stale edits and link rotation are enforced atomically", async (t) => {
  const f = await setup(t);
  const { event, path } = await invitation(f);
  const revision = (await f.host.call("/api/host/events/" + event.id)).data
    .event.revision;
  assert.equal(
    (
      await f.host.call(
        "/api/host/events/" + event.id,
        "PATCH",
        { date: "2027-01-01" },
        { "if-match": String(revision) },
      )
    ).status,
    409,
  );
  const saved = await f.host.call(
    "/api/host/events/" + event.id,
    "PATCH",
    { bookLayout: "collage" },
    { "if-match": String(revision) },
  );
  assert.equal(saved.status, 200);
  assert.equal(
    (
      await f.host.call(
        "/api/host/events/" + event.id,
        "PATCH",
        { title: "stale" },
        { "if-match": String(revision) },
      )
    ).status,
    409,
  );
  const rotation = await f.host.call(
    "/api/host/events/" + event.id + "/rotate-link",
    "POST",
    {},
    { "if-match": String(saved.data.event.revision) },
  );
  assert.equal(rotation.status, 200);
  assert.equal((await f.guest.call(path)).status, 404);
  assert.equal(
    (await f.guest.call(path + "/cards", "POST", card())).status,
    404,
  );
  assert.equal(
    f.repo.one(
      "SELECT count(*) AS n FROM guest_sessions WHERE event_id=?",
      event.id,
    ).n,
    0,
  );
  const raw = f.repo.one(
    "SELECT * FROM share_links WHERE event_id=? AND revoked_at IS NULL",
    event.id,
  );
  assert.notEqual(raw.token_ciphertext, rotation.data.event.token);
  assert.equal(raw.token_hash, hash(rotation.data.event.token));
});
test("drafts, pauses, event windows, feature controls and input validation cannot be bypassed by the client", async (t) => {
  const f = await setup(t);
  const { event, path } = await invitation(f);
  await f.operator.login("operator@digitalcardbox.test");
  assert.equal(
    (
      await f.guest.call(path + "/cards", "POST", {
        ...card(),
        gif: "https://evil.invalid/pixel.gif",
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await f.guest.call(path + "/cards", "POST", {
        ...card(),
        note: "x".repeat(5001),
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await f.guest.call(path + "/cards", "POST", {
        ...card(),
        ownerId: "review-other",
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await f.operator.call("/api/admin/flags/gifs", "PATCH", {
        enabled: false,
      })
    ).status,
    200,
  );
  assert.equal(
    (await f.guest.call(path + "/cards", "POST", card())).status,
    422,
  );
  assert.equal(
    (
      await f.operator.call("/api/admin/flags/gifts", "PATCH", {
        enabled: true,
      })
    ).status,
    200,
  );
  await f.operator.call("/api/admin/flags/newEvents", "PATCH", {
    enabled: false,
  });
  assert.equal((await f.host.call("/api/host/events", "POST", {})).status, 409);
  const current = (await f.host.call("/api/host/events/" + event.id)).data
    .event;
  await f.host.call(
    "/api/host/events/" + event.id,
    "PATCH",
    { status: "paused" },
    { "if-match": String(current.revision) },
  );
  assert.equal(
    (await f.guest.call(path + "/cards", "POST", { ...card(), gif: null }))
      .status,
    409,
  );
});
test("same-origin and CSRF checks reject cross-site writes, and login attempts are bounded", async (t) => {
  const f = await setup(t, { rateLimit: true });
  await f.host.login();
  assert.equal(
    (
      await f.host.call(
        "/api/host/profile",
        "PATCH",
        { name: "Forged", reducedMotion: false },
        { origin: "https://evil.invalid" },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.host.call(
        "/api/host/profile",
        "PATCH",
        { name: "Forged", reducedMotion: false },
        { "x-csrf-token": "" },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.host.call(
        "/api/host/profile",
        "PATCH",
        { name: "Forged", reducedMotion: false },
        { "x-dcb-request": "" },
      )
    ).status,
    403,
  );
  let last;
  for (let n = 0; n < 12; n++)
    last = await f.other.call("/api/session", "POST", {
      email: "unknown@digitalcardbox.test",
      password: "incorrect",
    });
  assert.equal(last.status, 429);
});
test("calendar rules clamp month ends and evaluate dates in the event time zone", () => {
  assert.equal(shiftMonths("2026-08-31", -6), "2026-02-28");
  assert.equal(shiftMonths("2024-02-29", 12), "2025-02-28");
  const event = {
    status: "published",
    type: "Baby shower",
    date: "2026-08-01",
    timezone: "America/Los_Angeles",
  };
  assert.equal(windowFor(event, new Date("2026-10-31T06:59:59Z")), "open");
  assert.equal(windowFor(event, new Date("2026-10-31T07:00:00Z")), "closed");
  assert.equal(windowFor({ ...event, status: "paused" }, instant), "paused");
  assert.equal(windowFor({ ...event, status: "draft" }, instant), "draft");
});

test("guest cookies cannot cross events and scheduled or closed events reject submissions", async (t) => {
  const f = await setup(t);
  const { event, path } = await invitation(f);
  const template = {
    title: "Another private occasion",
    hosts: "Test host",
    type: "Baby shower",
    date: "2030-05-01",
    timezone: "America/New_York",
    location: "",
    welcome: "By invitation only.",
    cover: "flowers",
    status: "published",
  };
  const created = await f.host.call("/api/host/events", "POST", template);
  assert.equal(created.status, 201);
  const secondPath = "/api/invitations/" + created.data.event.token;
  const scopedCookie = [...f.guest.jar.values()].find(
    (value) => value.path === path,
  ).pair;
  const forged = await fetch(f.base + secondPath + "/cards", {
    method: "POST",
    headers: {
      origin: f.base,
      "content-type": "application/json",
      "x-dcb-request": "1",
      "x-csrf-token": f.guest.csrf,
      cookie: scopedCookie,
    },
    body: JSON.stringify(card()),
  });
  assert.equal(forged.status, 401);
  assert.equal((await f.guest.call(secondPath)).data.window, "scheduled");
  assert.equal(
    (await f.guest.call(secondPath + "/cards", "POST", card())).status,
    409,
  );
  const closed = await f.host.call("/api/host/events", "POST", {
    ...template,
    date: "2020-01-01",
  });
  const closedPath = "/api/invitations/" + closed.data.event.token;
  assert.equal((await f.guest.call(closedPath)).data.window, "closed");
  assert.equal(
    (await f.guest.call(closedPath + "/cards", "POST", card())).status,
    409,
  );
  assert.equal(
    (await f.guest.call(`/api/host/events/${event.id}/book`)).status,
    401,
  );
});

test("expired host and guest session hashes cannot authorize writes or private reads", async (t) => {
  const f = await setup(t);
  const { path } = await invitation(f);
  f.repo.run("UPDATE guest_sessions SET expires_at=?", "2000-01-01T00:00:00Z");
  assert.equal(
    (await f.guest.call(path + "/cards", "POST", card())).status,
    401,
  );
  f.repo.run("UPDATE host_sessions SET expires_at=?", "2000-01-01T00:00:00Z");
  assert.equal((await f.host.call("/api/host/workspace")).status, 401);
  assert.equal(
    (
      await f.host.call("/api/host/profile", "PATCH", {
        name: "Expired",
        reducedMotion: false,
      })
    ).status,
    401,
  );
});

const giftInput = (service = "Venmo", version = 1) => ({
  requestKey: "gift-request-00001",
  service,
  version,
  name: "Gift Test Guest",
  alias: "A familiar nickname",
  amount: "25.50",
  reference: "DCB-1234ABCD",
  acknowledged: true,
});
test("gift intents persist, deduplicate, link only the current guest card, and never confirm a transfer", async (t) => {
  const f = await setup(t);
  const { event, path } = await invitation(f);
  const receipt = await f.guest.call(path + "/cards", "POST", card());
  const input = { ...giftInput(), entryId: receipt.data.entry.id };
  const saved = await f.guest.call(path + "/gift-intents", "POST", input);
  assert.equal(saved.status, 201);
  assert.equal(saved.data.gift.status, "unconfirmed");
  assert.equal(saved.data.gift.entryId, receipt.data.entry.id);
  assert.equal(saved.data.handoff.previewOnly, true);
  assert.equal(saved.data.handoff.identifier, "@digitalcardbox-preview");
  assert.equal(
    (await f.guest.call(path + "/gift-intents", "POST", input)).status,
    200,
  );
  const workspace = (await f.host.call("/api/host/workspace")).data;
  assert.equal(workspace.gifts.length, 1);
  assert.equal(workspace.gifts[0].alias, "A familiar nickname");
  const reopened = new SqliteReviewRepository(f.path, { clock });
  assert.equal(
    reopened.workspace(reopened.host("review-host")).gifts[0].id,
    saved.data.gift.id,
  );
  reopened.close();
  await f.other.login("other@digitalcardbox.test");
  assert.equal(
    (
      await f.other.call(
        "/api/host/gift-intents/" + saved.data.gift.id,
        "PATCH",
        { received: true, checked: true },
      )
    ).status,
    404,
  );
  const stranger = new Agent(f.base);
  await stranger.call(path);
  assert.equal(
    (
      await stranger.call(path + "/gift-intents", "POST", {
        ...input,
        requestKey: "other-guest-request",
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await f.host.call(
        "/api/host/gift-intents/" + saved.data.gift.id,
        "PATCH",
        { received: true },
      )
    ).status,
    422,
  );
  assert.equal(
    (
      await f.host.call(
        "/api/host/gift-intents/" + saved.data.gift.id,
        "PATCH",
        { received: true, checked: true },
      )
    ).status,
    200,
  );
  assert.equal(
    (await f.host.call("/api/host/workspace")).data.gifts[0].status,
    "host-confirmed",
  );
  assert.equal(
    (
      await f.guest.call(path + "/gift-intents", "POST", {
        ...input,
        amount: "26",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await f.guest.call(path + "/gift-intents", "POST", {
        ...input,
        requestKey: "invalid-amount",
        amount: "Infinity",
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await f.guest.call(path + "/gift-intents", "POST", input, {
        "x-csrf-token": "wrong",
      })
    ).status,
    403,
  );
  assert.equal((await f.guest.call("/api/health")).data.moneyMovement, false);
  assert.equal(event.id, workspace.gifts[0].eventId);
});
test("handoff retries recheck destination versions, service pauses, feature flags, guest link revocation and deadlines", async (t) => {
  const f = await setup(t);
  const { event, path } = await invitation(f);
  const input = giftInput();
  assert.equal(
    (await f.guest.call(path + "/gift-intents", "POST", input)).status,
    201,
  );
  const current = (await f.host.call("/api/host/events/" + event.id)).data
    .event;
  const changed = await f.host.call(
    "/api/host/events/" + event.id + "/destinations",
    "PATCH",
    { service: "Venmo", version: 1, enabled: false },
    { "if-match": String(current.revision) },
  );
  assert.equal(changed.status, 200);
  assert.equal(
    (await f.guest.call(path + "/gift-intents", "POST", input)).status,
    409,
  );
  assert.equal(
    (await f.guest.call(path)).data.event.destinations.some(
      (d) => d.service === "Venmo",
    ),
    false,
  );
  const cash = giftInput("Cash App");
  assert.equal(
    (
      await f.guest.call(path + "/gift-intents", "POST", {
        ...cash,
        requestKey: "gift-cash-0001",
      })
    ).status,
    201,
  );
  await f.operator.login("operator@digitalcardbox.test");
  await f.operator.call("/api/admin/flags/gifts", "PATCH", { enabled: false });
  assert.equal(
    (await f.guest.call(path + "/gift-intents", "POST", cash)).status,
    409,
  );
  await f.operator.call("/api/admin/flags/gifts", "PATCH", { enabled: true });
  f.repo.run("UPDATE events SET date='2020-01-01' WHERE id=?", event.id);
  assert.equal(
    (await f.guest.call(path + "/gift-intents", "POST", cash)).status,
    409,
  );
  f.repo.run("UPDATE events SET date=? WHERE id=?", event.date, event.id);
  f.repo.rotateLink(event.id);
  assert.equal(
    (await f.guest.call(path + "/gift-intents", "POST", cash)).status,
    404,
  );
});
test("host route changes require ownership, matching identifiers, recipient confirmation and current revisions", async (t) => {
  const f = await setup(t);
  const { event, path } = await invitation(f);
  const target = "/api/host/events/" + event.id + "/destinations";
  const input = {
    service: "Cash App",
    identifier: "$OwnVerifiedAccount",
    repeatIdentifier: "$OwnVerifiedAccount",
    recipient: "My verified account",
    checked: true,
    previewOnly: false,
    enabled: true,
    version: 1,
  };
  assert.equal((await f.host.call(target, "PATCH", input)).status, 428);
  const headers = { "if-match": String(event.revision) };
  assert.equal(
    (
      await f.host.call(
        target,
        "PATCH",
        {
          ...input,
          identifier: "$CardBoxPreview",
          repeatIdentifier: "$CardBoxPreview",
        },
        headers,
      )
    ).status,
    422,
  );
  assert.equal(
    (
      await f.host.call(
        target,
        "PATCH",
        { ...input, repeatIdentifier: "$Different" },
        headers,
      )
    ).status,
    422,
  );
  assert.equal(
    (await f.host.call(target, "PATCH", { ...input, checked: false }, headers))
      .status,
    422,
  );
  assert.equal(
    (
      await f.host.call(
        target,
        "PATCH",
        { ...input, identifier: "https://evil.example" },
        headers,
      )
    ).status,
    422,
  );
  await f.other.login("other@digitalcardbox.test");
  assert.equal(
    (await f.other.call(target, "PATCH", input, headers)).status,
    404,
  );
  assert.equal(
    (await f.host.call(target, "PATCH", input, headers)).status,
    200,
  );
  assert.equal(
    (await f.host.call(target, "PATCH", input, headers)).status,
    409,
  );
  assert.equal(
    (
      await f.guest.call(
        path + "/gift-intents",
        "POST",
        giftInput("Cash App", 1),
      )
    ).status,
    409,
  );
  const ready = await f.guest.call(
    path + "/gift-intents",
    "POST",
    giftInput("Cash App", 2),
  );
  assert.equal(ready.status, 201);
  assert.equal(ready.data.handoff.previewOnly, false);
  const { providerRoute, validIdentifier } = await import(
    "../../src/modules/gifts/routing.ts"
  );
  assert.equal(
    providerRoute(ready.data.handoff),
    "https://cash.app/$OwnVerifiedAccount",
  );
  assert.equal(
    providerRoute({ service: "Venmo", identifier: "@owner-reviewed" }),
    "https://venmo.com/u/owner-reviewed",
  );
  assert.equal(
    providerRoute({ service: "Zelle", identifier: "name@example.invalid" }),
    "https://www.zellepay.com/get-started",
  );
  for (const identifier of [
    "@name?amount=5",
    "@a/../b",
    "@name#evil",
    "@name%2Fevil",
    "javascript:alert(1)",
  ])
    assert.equal(validIdentifier("Venmo", identifier), false);
  assert.equal(validIdentifier("Zelle", "+12125550123"), true);
  assert.equal(validIdentifier("Zelle", "+442071234567"), false);
});
