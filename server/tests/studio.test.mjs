import test from "node:test";
import assert from "node:assert/strict";
import { setup, Agent, invitation, card } from "./helpers.mjs";
import {
  createDesign,
  validateDesign,
} from "../../src/modules/design/contracts.ts";
import { occasionChoices } from "../../src/modules/events/occasions.ts";
import { aiOptions } from "../../src/modules/media/catalog.ts";
import { SqliteReviewRepository } from "../adapters/sqlite.mjs";
const clean = {
  flagged: false,
  categories: {
    sexual: false,
    "sexual/minors": false,
    "violence/graphic": false,
    "hate/threatening": false,
    "self-harm/instructions": false,
  },
  category_scores: {
    sexual: 0,
    "sexual/minors": 0,
    "violence/graphic": 0,
    "hate/threatening": 0,
    "self-harm/instructions": 0,
  },
};
function mock(options = {}) {
  const calls = [];
  return {
    calls,
    fetcher: async (url, init) => {
      const payload = JSON.parse(init.body);
      calls.push({ url, payload });
      if (url.endsWith("/moderations"))
        return Response.json({
          results: [
            options.blocked && payload.input[0].type === "image_url"
              ? { ...clean, flagged: true }
              : options.malformed
                ? {}
                : clean,
          ],
        });
      await options.beforeImage?.();
      return Response.json({
        data: [
          {
            b64_json: Buffer.from(
              "RIFF1234WEBPVP8 fake-reviewed-image",
            ).toString("base64"),
          },
        ],
      });
    },
  };
}
const input = (kind = "invitation", requestKey = "studio-request-00001") => ({
  kind,
  requestKey,
  ...Object.fromEntries(
    Object.entries(aiOptions).map(([key, values]) => [key, values[0]]),
  ),
});
const cookies = (agent) =>
  [...agent.jar.values()].map((c) => c.pair).join("; ");
async function ready(t, options = {}) {
  const provider = mock(options);
  const f = await setup(t, {
    mediaOptions: {
      apiKey: "test-key-only",
      aiEnabled: true,
      fetcher: provider.fetcher,
    },
  });
  await f.guest.call("/api/studio/session");
  return { ...f, ...provider };
}

test("design documents allow every requested occasion and reject arbitrary assets, HTML layout properties and unsafe bounds", () => {
  for (const [occasion] of occasionChoices)
    assert.equal(
      validateDesign(createDesign("invitation", occasion), "invitation")
        .occasion,
      occasion,
    );
  const doc = createDesign("card");
  for (const patch of [
    { template: "not-a-template" },
    { font: "url(https://example.com)" },
    { artId: "https://example.com/image" },
    { gif: "unlicensed" },
    { html: "<script>" },
    { kind: "random" },
    { blocks: [{ ...doc.blocks[0], x: NaN }] },
    { blocks: [{ ...doc.blocks[0], width: 1000 }] },
    { blocks: [doc.blocks[0], doc.blocks[0]] },
  ])
    assert.throws(() => validateDesign({ ...doc, ...patch }));
});
test("studio generation needs its own session/CSRF, accepts only design choices, shares global caps and creates no event", async (t) => {
  const f = await ready(t);
  const before = f.repo.one("SELECT count(*) AS n FROM events").n;
  assert.equal(
    (await f.other.call("/api/studio/art", "POST", input())).status,
    401,
  );
  assert.equal(
    (
      await f.guest.call("/api/studio/art", "POST", input(), {
        "x-csrf-token": "wrong",
      })
    ).status,
    403,
  );
  for (const extra of [
    { prompt: "anything" },
    { model: "other" },
    { size: "2048x2048" },
    { url: "https://example.com" },
    { kind: "portrait" },
  ])
    assert.equal(
      (await f.guest.call("/api/studio/art", "POST", { ...input(), ...extra }))
        .status,
      422,
    );
  assert.equal(f.calls.length, 0);
  const first = await f.guest.call("/api/studio/art", "POST", input());
  assert.equal(first.status, 201);
  assert.equal(
    (await f.guest.call("/api/studio/art", "POST", input())).status,
    200,
  );
  assert.equal(
    f.calls.filter((c) => c.url.endsWith("/images/generations")).length,
    1,
  );
  const payload = f.calls.find((c) =>
    c.url.endsWith("/images/generations"),
  ).payload;
  assert.match(payload.prompt, /event-invitation artwork/);
  assert.match(payload.prompt, /No text/);
  assert.equal(payload.n, 1);
  assert.equal(payload.quality, "low");
  assert.equal(payload.size, "1024x1536");
  assert.equal(
    (
      await f.guest.call(
        "/api/studio/art",
        "POST",
        input("card", "studio-request-00002"),
      )
    ).status,
    201,
  );
  const fresh = new Agent(f.base);
  await fresh.call("/api/studio/session");
  assert.equal(
    (
      await fresh.call(
        "/api/studio/art",
        "POST",
        input("card", "studio-request-00003"),
      )
    ).status,
    429,
  );
  assert.equal(f.repo.one("SELECT count(*) AS n FROM events").n, before);
  assert.equal(
    f.repo.one("SELECT used FROM usage_counters WHERE scope='ai:global'").used,
    2,
  );
});
test("invitation art binds only to an owned event, survives repository reopen and follows private published guest links", async (t) => {
  const f = await ready(t);
  const generated = await f.guest.call("/api/studio/art", "POST", input());
  const doc = { ...createDesign("invitation"), artId: generated.data.artId };
  assert.equal(
    (await f.other.call("/api/studio/art/" + doc.artId)).status,
    401,
  );
  await f.host.login();
  const owned = (await f.host.call("/api/host/workspace")).data.events[0];
  assert.equal(
    (
      await f.host.call(
        "/api/host/events/" + owned.id,
        "PATCH",
        { invitation: doc },
        { "if-match": String(owned.revision) },
      )
    ).status,
    401,
  );
  // The same browser owns its anonymous design cookie and its host account.
  await f.guest.login();
  const event = (await f.guest.call("/api/host/workspace")).data.events[0];
  const saved = await f.guest.call(
    "/api/host/events/" + event.id,
    "PATCH",
    { invitation: doc },
    { "if-match": String(event.revision) },
  );
  assert.equal(saved.status, 200);
  assert.deepEqual(saved.data.event.invitation, doc);
  const image = await fetch(f.base + "/api/host/studio-art/" + doc.artId, {
    headers: { cookie: cookies(f.guest) },
  });
  assert.equal(image.status, 200);
  const visitor = new Agent(f.base);
  const guestPath = "/api/invitations/" + event.token;
  assert.equal((await visitor.call(guestPath)).status, 200);
  assert.equal(
    (
      await fetch(f.base + guestPath + "/studio-art/" + doc.artId, {
        headers: { cookie: cookies(visitor) },
      })
    ).status,
    200,
  );
  await f.other.login("other@digitalcardbox.test");
  assert.equal(
    (
      await f.other.call(
        "/api/host/events/" + event.id,
        "PATCH",
        { invitation: doc },
        { "if-match": String(saved.data.event.revision) },
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await f.guest.call(
        "/api/host/events/" + event.id,
        "PATCH",
        { invitation: doc },
        { "if-match": String(event.revision) },
      )
    ).status,
    409,
  );
  const reopened = new SqliteReviewRepository(f.path, { seed: false });
  try {
    assert.deepEqual(
      reopened.event(reopened.ownedEvent("review-host", event.id)).invitation,
      doc,
    );
  } finally {
    reopened.close();
  }
  assert.equal(
    (
      await f.guest.call(
        "/api/host/events/" + event.id + "/rotate-link",
        "POST",
        {},
        { "if-match": String(saved.data.event.revision) },
      )
    ).status,
    200,
  );
  assert.equal(
    (await visitor.call(guestPath + "/studio-art/" + doc.artId)).status,
    404,
  );
});
test("personalized card layout and studio art are accepted once and remain private to the owning guest and host", async (t) => {
  const f = await ready(t);
  const generated = await f.guest.call(
    "/api/studio/art",
    "POST",
    input("card"),
  );
  const { path, event } = await invitation(f);
  const design = { ...createDesign("card"), artId: generated.data.artId };
  const payload = {
    ...card(),
    style: design.template,
    gif: null,
    note: design.blocks.find((b) => b.id === "message").text,
    design,
  };
  const outsider = new Agent(f.base);
  await outsider.call(path);
  assert.equal(
    (await outsider.call(path + "/cards", "POST", payload)).status,
    401,
  );
  const sent = await f.guest.call(path + "/cards", "POST", payload);
  assert.equal(sent.status, 201);
  assert.equal(
    (await f.guest.call(path + "/cards", "POST", payload)).status,
    200,
  );
  assert.equal(
    (
      await f.guest.call(path + "/cards", "POST", {
        ...payload,
        design: { ...design, palette: "sage" },
      })
    ).status,
    409,
  );
  const workspace = (await f.host.call("/api/host/workspace")).data;
  assert.deepEqual(
    workspace.entries.find((e) => e.id === sent.data.entry.id).design,
    design,
  );
  const stored = f.repo.one(
    "SELECT note,design_json FROM cards WHERE id=?",
    sent.data.entry.id,
  );
  assert.equal(stored.note, payload.note);
  assert.equal(
    JSON.parse(stored.design_json).blocks.find(
      (block) => block.id === "message",
    ).text,
    "",
  );
  assert.equal(
    (
      await fetch(f.base + path + "/studio-art/" + design.artId, {
        headers: { cookie: cookies(f.guest) },
      })
    ).status,
    200,
  );
  assert.equal(
    (await outsider.call(path + "/studio-art/" + design.artId)).status,
    404,
  );
  assert.equal(
    f.repo.one("SELECT event_id FROM studio_jobs WHERE id=?", design.artId)
      .event_id,
    event.id,
  );
  assert.equal(
    (
      await f.guest.call(path + "/cards", "POST", {
        ...payload,
        requestKey: "another-card-00001",
        note: "Different from the layout",
      })
    ).status,
    422,
  );
});
test("blocked or malformed studio safety results fail closed, keep no image and spend no extra automatic attempt", async (t) => {
  for (const options of [{ blocked: true }, { malformed: true }])
    await t.test(JSON.stringify(options), async (t) => {
      const f = await ready(t, options);
      const result = await f.guest.call("/api/studio/art", "POST", input());
      assert.equal(result.status, 422);
      assert.equal(
        f.repo.one(
          "SELECT count(*) AS n FROM studio_jobs WHERE image IS NOT NULL",
        ).n,
        0,
      );
      const repeated = await f.guest.call("/api/studio/art", "POST", input());
      assert.equal(repeated.status, 409);
      assert.equal(
        f.repo.one("SELECT used FROM usage_counters WHERE scope='ai:global'")
          .used,
        1,
      );
    });
});
test("studio reserves shared budget before provider work, rejects concurrent requests and rechecks the operator switch after generation", async (t) => {
  let started, release;
  const waiting = new Promise((resolve) => (release = resolve)),
    begun = new Promise((resolve) => (started = resolve));
  const f = await ready(t, {
    beforeImage: async () => {
      started();
      await waiting;
    },
  });
  const first = f.guest.call("/api/studio/art", "POST", input());
  await begun;
  const second = await f.guest.call(
    "/api/studio/art",
    "POST",
    input("invitation", "parallel-studio-00002"),
  );
  assert.equal(second.status, 409);
  f.repo.run(
    "UPDATE runtime_settings SET value='0' WHERE key='ai_cards_enabled'",
  );
  release();
  assert.equal((await first).status, 409);
  assert.equal(
    f.repo.one("SELECT count(*) AS n FROM studio_jobs WHERE state='approved'")
      .n,
    0,
  );
  assert.equal(
    f.calls.filter((c) => c.url.endsWith("/images/generations")).length,
    1,
  );
});

test("studio honors the existing global guest budget and combined image storage ceiling before any provider charge", async (t) => {
  const f = await ready(t);
  const csrf = f.guest.csrf;
  f.repo.run("INSERT INTO usage_counters VALUES('ai:global','2026-10-18',20)");
  assert.equal(
    (await f.guest.call("/api/studio/art", "POST", input())).status,
    429,
  );
  assert.equal(f.calls.length, 0);
  f.repo.run("UPDATE usage_counters SET used=19 WHERE scope='ai:global'");
  const generated = await f.guest.call("/api/studio/art", "POST", input());
  assert.equal(generated.status, 201);
  assert.equal(f.media.status().usedToday, 20);
  f.repo.run("UPDATE usage_counters SET used=1 WHERE scope='ai:global'");
  f.repo.run(
    "UPDATE studio_jobs SET image=? WHERE id=?",
    Buffer.alloc(33554432),
    generated.data.artId,
  );
  const calls = f.calls.length;
  assert.equal(
    (
      await f.guest.call(
        "/api/studio/art",
        "POST",
        input("invitation", "storage-full-00002"),
        { "x-csrf-token": csrf },
      )
    ).status,
    429,
  );
  assert.equal(f.calls.length, calls);
  assert.equal(f.media.status().usedToday, 1);
});

test("migration 004 upgrades an existing version-3 database and reruns without losing accepted notes or its encryption key", async (t) => {
  const { mkdtemp, readFile, writeFile, rm } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");
  const { randomBytes } = await import("node:crypto");
  const { DatabaseSync } = await import("node:sqlite");
  const directory = await mkdtemp(join(tmpdir(), "dcb-migrate-studio-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, "review.sqlite"),
    key = randomBytes(32);
  await writeFile(join(directory, "review-link.key"), key, { mode: 0o600 });
  const legacy = new DatabaseSync(path);
  try {
    for (const name of [
      "001-local-review.sql",
      "002-gift-routing.sql",
      "003-media-feedback.sql",
    ])
      legacy.exec(
        await readFile(
          new URL("../migrations/" + name, import.meta.url),
          "utf8",
        ),
      );
    legacy.exec(
      "INSERT INTO hosts VALUES('legacy-host','legacy@review.invalid','Legacy host','host','salt','hash',0)",
    );
    legacy.exec(
      "INSERT INTO events(id,owner_id,title,hosts,type,date,timezone,status,cover,created_at) VALUES('legacy-event','legacy-host','Legacy event','Legacy host','Birthday','2026-11-21','America/New_York','draft','flowers','2026-10-18')",
    );
    legacy.exec(
      "INSERT INTO event_guests VALUES('legacy-guest','legacy-event','2026-10-18')",
    );
    legacy.exec(
      "INSERT INTO cards(id,event_id,guest_id,request_key,name,note,style,consent,created_at) VALUES('legacy-card','legacy-event','legacy-guest','legacy-note-key','Original guest','Keep these accepted words.','botanical',1,'2026-10-18')",
    );
  } finally {
    legacy.close();
  }
  for (let run = 0; run < 2; run++) {
    const current = new SqliteReviewRepository(path, { seed: false });
    try {
      assert.deepEqual(
        current
          .all("SELECT version FROM review_schema_versions ORDER BY version")
          .map((row) => row.version),
        [1, 2, 3, 4],
      );
      assert.equal(
        current.card(current.one("SELECT * FROM cards WHERE id='legacy-card'"))
          .note,
        "Keep these accepted words.",
      );
      assert.equal(current.one("SELECT count(*) AS n FROM events").n, 1);
      assert.equal(current.one("PRAGMA quick_check").quick_check, "ok");
    } finally {
      current.close();
    }
  }
  assert.deepEqual(await readFile(join(directory, "review-link.key")), key);
});
