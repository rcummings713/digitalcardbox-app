import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SqliteReviewRepository } from "../adapters/sqlite.mjs";
import { setup, invitation, card } from "./helpers.mjs";
import { templates } from "../../src/modules/media/catalog.ts";
import {
  createDesign,
  validateDesign,
  withDesignGif,
  invitationTemplates,
} from "../../src/modules/design/contracts.ts";
import {
  providerRoute,
  validIdentifier,
} from "../../src/modules/gifts/routing.ts";
const liveInput = {
  service: "PayPal",
  identifier: "OwnerVerified42",
  repeatIdentifier: "OwnerVerified42",
  recipient: "Host-reviewed PayPal account",
  checked: true,
  previewOnly: false,
  enabled: true,
  version: 0,
};
const gift = {
  requestKey: "paypal-review-001",
  service: "PayPal",
  version: 1,
  name: "PayPal Guest",
  alias: "A nickname",
  amount: "25.00",
  reference: "DCB-1234ABCD",
  entryId: null,
  acknowledged: true,
};
test("all original stationery compositions have valid card, invitation, save-the-date and GIF layouts", () => {
  assert.ok(templates.length >= 100);
  assert.ok(invitationTemplates.length >= 95);
  assert.equal(new Set(templates.map((t) => t.id)).size, templates.length);
  for (const item of templates)
    for (const kind of ["card", "invitation"])
      for (const variant of kind === "invitation"
        ? [undefined, "save-the-date"]
        : [undefined]) {
        const doc = createDesign(kind, "Wedding", item.id, variant);
        assert.equal(validateDesign(doc, kind).template, item.id);
        assert.equal(
          validateDesign(withDesignGif(doc, "noto-1f970"), kind).gif,
          "noto-1f970",
        );
      }
});
test("text formatting and finite motion remain bounded data, never HTML, URLs or arbitrary styles", () => {
  const doc = createDesign("card");
  doc.motion = "stagger";
  doc.artworkMotion = "drift";
  doc.blocks[0] = {
    ...doc.blocks[0],
    font: "script",
    bold: true,
    italic: true,
    underline: true,
    motion: "fade",
  };
  assert.deepEqual(validateDesign(doc), JSON.parse(JSON.stringify(doc)));
  for (const patch of [
    { motion: "url(https://evil.invalid)" },
    { artworkMotion: "infinite" },
    { variant: "save-the-date" },
    { blocks: [{ ...doc.blocks[0], font: "remote-font" }] },
    { blocks: [{ ...doc.blocks[0], bold: "true" }] },
    { blocks: [{ ...doc.blocks[0], motion: "flash" }] },
    {
      blocks: [
        { ...doc.blocks[0], style: "background:url(https://evil.invalid)" },
      ],
    },
  ])
    assert.throws(() => validateDesign({ ...doc, ...patch }));
});
test("save-the-dates persist separately, keep event ownership and revision checks and cannot open contributions early", async (t) => {
  const f = await setup(t);
  await f.host.login();
  await f.other.login("other@digitalcardbox.test");
  const invitation = createDesign("invitation"),
    saveTheDate = createDesign(
      "invitation",
      "Wedding",
      "atelier-garden-poetry-arch",
      "save-the-date",
    );
  saveTheDate.motion = "rise";
  const created = await f.host.call("/api/host/events", "POST", {
    title: "A future wedding",
    hosts: "Host One & Host Two",
    type: "Wedding",
    date: "2027-08-15",
    timezone: "America/New_York",
    location: "The Garden Room",
    welcome: "Keep the date.",
    cover: "flowers",
    status: "draft",
    invitation,
    saveTheDate,
  });
  assert.equal(created.status, 201);
  let event = created.data.event;
  const path = "/api/invitations/" + event.token;
  assert.equal((await f.guest.call(path)).status, 404);
  assert.equal(
    (
      await f.other.call(
        "/api/host/events/" + event.id,
        "PATCH",
        { saveTheDate },
        { "if-match": String(event.revision) },
      )
    ).status,
    404,
  );
  const published = await f.host.call(
    "/api/host/events/" + event.id,
    "PATCH",
    { status: "published" },
    { "if-match": String(event.revision) },
  );
  assert.equal(published.status, 200);
  event = published.data.event;
  const opened = await f.guest.call(path);
  assert.equal(opened.status, 200);
  assert.equal(opened.data.window, "scheduled");
  assert.equal(opened.data.event.saveTheDate.variant, "save-the-date");
  assert.deepEqual(
    opened.data.event.invitation,
    JSON.parse(JSON.stringify(invitation)),
  );
  assert.equal(
    (await f.guest.call(path + "/cards", "POST", card())).status,
    409,
  );
  assert.equal(
    (
      await f.host.call(
        "/api/host/events/" + event.id,
        "PATCH",
        { saveTheDate },
        { "if-match": "1" },
      )
    ).status,
    409,
  );
  const update = await f.host.call(
    "/api/host/events/" + event.id,
    "PATCH",
    { welcome: "Updated welcome." },
    { "if-match": String(event.revision) },
  );
  assert.equal(update.status, 200);
  assert.deepEqual(
    update.data.event.saveTheDate,
    JSON.parse(JSON.stringify(saveTheDate)),
  );
  const reopened = new SqliteReviewRepository(f.path);
  try {
    const row = reopened.event(
      reopened.one("SELECT * FROM events WHERE id=?", event.id),
    );
    assert.deepEqual(row.saveTheDate, JSON.parse(JSON.stringify(saveTheDate)));
    assert.deepEqual(row.invitation, JSON.parse(JSON.stringify(invitation)));
  } finally {
    reopened.close();
  }
  assert.equal(
    (
      await f.host.call(
        "/api/host/events/" + event.id,
        "PATCH",
        { invitation: saveTheDate },
        { "if-match": String(update.data.event.revision) },
      )
    ).status,
    422,
  );
  const rotated = await f.host.call(
    "/api/host/events/" + event.id + "/rotate-link",
    "POST",
    {},
    { "if-match": String(update.data.event.revision) },
  );
  assert.equal(rotated.status, 200);
  assert.equal((await f.guest.call(path)).status, 404);
});
test("inline card typography and entrance effects persist with one authoritative note and idempotent receipt", async (t) => {
  const f = await setup(t);
  const { path, event } = await invitation(f);
  const design = createDesign(
    "card",
    "Baby shower",
    "atelier-moonlit-welcome-editorial",
  );
  design.motion = "stagger";
  design.artworkMotion = "fade";
  design.blocks = design.blocks.map((b) =>
    b.id === "message"
      ? {
          ...b,
          text: "The exact words typed on the card.",
          font: "sans",
          bold: true,
          motion: "rise",
        }
      : b,
  );
  const input = {
    ...card("inline-style-0001"),
    note: "The exact words typed on the card.",
    style: design.template,
    gif: null,
    design,
  };
  const sent = await f.guest.call(path + "/cards", "POST", input);
  assert.equal(sent.status, 201);
  assert.equal(
    (await f.guest.call(path + "/cards", "POST", input)).status,
    200,
  );
  assert.equal(
    (
      await f.guest.call(path + "/cards", "POST", {
        ...input,
        design: { ...design, motion: "zoom" },
      })
    ).status,
    409,
  );
  const row = f.repo.one("SELECT * FROM cards WHERE id=?", sent.data.entry.id);
  assert.equal(
    JSON.parse(row.design_json).blocks.find((b) => b.id === "message").text,
    "",
  );
  assert.equal(row.note, input.note);
  const received = f.repo
    .workspace(f.repo.findHost("host@digitalcardbox.test"))
    .entries.find((e) => e.id === row.id);
  assert.equal(
    received.design.blocks.find((b) => b.id === "message").bold,
    true,
  );
  assert.equal(received.design.motion, "stagger");
  assert.equal(received.eventId, event.id);
});
test("PayPal.Me is an encrypted, versioned external profile handoff with no arbitrary URLs or payment claim", async (t) => {
  const f = await setup(t);
  const { event, path } = await invitation(f);
  const target = "/api/host/events/" + event.id + "/destinations",
    headers = { "if-match": String(event.revision) };
  for (const identifier of [
    "https://paypal.me/Someone",
    "name/25",
    "name?amount=20",
    "name@paypal.com",
    "name-with-dashes",
    "a".repeat(21),
    "名字",
  ]) {
    assert.equal(validIdentifier("PayPal", identifier), false);
    assert.equal(
      (
        await f.host.call(
          target,
          "PATCH",
          { ...liveInput, identifier, repeatIdentifier: identifier },
          headers,
        )
      ).status,
      422,
    );
  }
  assert.equal(
    (
      await f.host.call(
        target,
        "PATCH",
        {
          ...liveInput,
          identifier: "CardBoxPreview",
          repeatIdentifier: "CardBoxPreview",
        },
        headers,
      )
    ).status,
    422,
  );
  assert.equal(
    (
      await f.host.call(target, "PATCH", liveInput, {
        "if-match": String(event.revision),
        "x-csrf-token": "wrong",
      })
    ).status,
    403,
  );
  const saved = await f.host.call(target, "PATCH", liveInput, headers);
  assert.equal(saved.status, 200);
  const raw = f.repo.one(
    "SELECT * FROM gift_destinations WHERE event_id=? AND service='PayPal'",
    event.id,
  );
  assert.notEqual(raw.identifier, liveInput.identifier);
  assert.equal(raw.version, 1);
  const refreshed = await f.guest.call(path);
  assert.equal(
    refreshed.data.event.destinations.find((d) => d.service === "PayPal")
      .identifier,
    liveInput.identifier,
  );
  assert.equal(
    (
      await f.guest.call(path + "/gift-intents", "POST", {
        ...gift,
        acknowledged: false,
      })
    ).status,
    422,
  );
  const sent = await f.guest.call(path + "/gift-intents", "POST", gift);
  assert.equal(sent.status, 201);
  assert.equal(sent.data.gift.status, "unconfirmed");
  assert.equal(
    providerRoute(sent.data.handoff),
    "https://paypal.me/OwnerVerified42",
  );
  assert.equal(new URL(providerRoute(sent.data.handoff)).search, "");
  assert.equal(
    (await f.guest.call(path + "/gift-intents", "POST", gift)).status,
    200,
  );
  const current = (await f.host.call("/api/host/events/" + event.id)).data
    .event;
  const changed = await f.host.call(
    target,
    "PATCH",
    {
      ...liveInput,
      identifier: "OwnerVerified43",
      repeatIdentifier: "OwnerVerified43",
      version: 1,
    },
    { "if-match": String(current.revision) },
  );
  assert.equal(changed.status, 200);
  assert.equal(
    (await f.guest.call(path + "/gift-intents", "POST", gift)).status,
    409,
  );
  assert.equal((await f.guest.call("/api/payments", "POST", {})).status, 404);
});
test("migration 005 preserves all v4 destination ciphertext, versions, notes, intents and the encryption key", async (t) => {
  const f = await setup(t);
  const before = f.repo.all(
      "SELECT * FROM gift_destinations ORDER BY event_id,service",
    ),
    notes = f.repo.all("SELECT id,note FROM cards ORDER BY id"),
    key = readFileSync(
      new URL("file://" + f.path.replace(/review.sqlite$/, "review-link.key")),
    );
  f.repo.transaction(() => {
    f.repo.db.exec(
      `ALTER TABLE events DROP COLUMN save_the_date_json; CREATE TABLE old_destinations(event_id TEXT NOT NULL REFERENCES events(id),service TEXT NOT NULL CHECK(service IN ('Cash App','Venmo','Zelle')),recipient TEXT NOT NULL,identifier TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,enabled INTEGER NOT NULL CHECK(enabled IN(0,1)),confirmed INTEGER NOT NULL CHECK(confirmed IN(0,1)),preview_only INTEGER NOT NULL DEFAULT 1 CHECK(preview_only IN(0,1)),PRIMARY KEY(event_id,service)) STRICT; INSERT INTO old_destinations SELECT * FROM gift_destinations; DROP TABLE gift_destinations; ALTER TABLE old_destinations RENAME TO gift_destinations; DELETE FROM review_schema_versions WHERE version=5;`,
    );
  });
  for (let i = 0; i < 2; i++) {
    const reopened = new SqliteReviewRepository(f.path);
    try {
      assert.deepEqual(
        reopened.all(
          "SELECT * FROM gift_destinations ORDER BY event_id,service",
        ),
        before,
      );
      assert.deepEqual(
        reopened.all("SELECT id,note FROM cards ORDER BY id"),
        notes,
      );
      assert.equal(
        reopened.one("SELECT max(version) AS n FROM review_schema_versions").n,
        7,
      );
      assert.deepEqual(reopened.all("PRAGMA foreign_key_check"), []);
      assert.equal(reopened.one("PRAGMA quick_check").quick_check, "ok");
      assert.deepEqual(reopened.key, key);
    } finally {
      reopened.close();
    }
  }
});

test("legacy plaintext identifiers are encrypted once while route versions, key and accepted gift replays survive", async (t) => {
  const f = await setup(t);
  const { event, path } = await invitation(f);
  const input = {
    ...gift,
    service: "Venmo",
    requestKey: "legacy-plain-intent-001",
  };
  const sent = await f.guest.call(path + "/gift-intents", "POST", input);
  assert.equal(sent.status, 201);
  const destinations = f.repo.destinations(event.id),
    beforeRevision = f.repo.one(
      "SELECT revision FROM events WHERE id=?",
      event.id,
    ).revision;
  for (const row of destinations)
    if (row.service !== "Cash App")
      f.repo.run(
        "UPDATE gift_destinations SET identifier=? WHERE event_id=? AND service=?",
        row.identifier,
        event.id,
        row.service,
      );
  const encrypted = f.repo.one(
    "SELECT identifier FROM gift_destinations WHERE event_id=? AND service='Cash App'",
    event.id,
  ).identifier;
  f.repo.run(
    "UPDATE gift_intents SET identifier=? WHERE id=?",
    destinations.find((d) => d.service === "Venmo").identifier,
    sent.data.gift.id,
  );
  const key = Buffer.from(f.repo.key);
  const reopened = new SqliteReviewRepository(f.path);
  try {
    assert.deepEqual(reopened.destinations(event.id), destinations);
    assert.deepEqual(reopened.key, key);
    assert.equal(
      reopened.one("SELECT revision FROM events WHERE id=?", event.id).revision,
      beforeRevision,
    );
    assert.equal(
      reopened.one(
        "SELECT identifier FROM gift_destinations WHERE event_id=? AND service='Cash App'",
        event.id,
      ).identifier,
      encrypted,
    );
    assert(
      reopened
        .all("SELECT identifier FROM gift_destinations")
        .every((r) => r.identifier.startsWith("\u0001DCB1:")),
    );
    assert(
      reopened
        .one(
          "SELECT identifier FROM gift_intents WHERE id=?",
          sent.data.gift.id,
        )
        .identifier.startsWith("\u0001DCB1:"),
    );
    assert.equal(
      (await f.guest.call(path + "/gift-intents", "POST", input)).status,
      200,
    );
  } finally {
    reopened.close();
  }
});
