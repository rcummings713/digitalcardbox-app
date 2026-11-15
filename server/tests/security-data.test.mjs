import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SqliteReviewRepository } from "../adapters/sqlite.mjs";
import { ReviewApplication } from "../application.mjs";
import { StudioService } from "../studio-service.mjs";
import { VaultService } from "../vault-service.mjs";
import { hash } from "../domain/identity.mjs";
import { LocalTestIdentity } from "../adapters/test-identity.mjs";
import { setup } from "./helpers.mjs";

function fixture(t) {
  let now = new Date("2026-11-15T17:00:00.000Z");
  const repo = new SqliteReviewRepository(":memory:", { clock: () => now });
  t.after(() => repo.close());
  const app = new ReviewApplication(repo, new LocalTestIdentity(repo));
  const host = repo.host("review-host");
  const login = app.login({ email: host.email, password: "CardBoxReview!2026" });
  return {
    repo, app, host,
    session: app.session(login.token),
    advance(ms) { now = new Date(now.getTime() + ms); },
  };
}
function guest(repo, eventId = "test-baby-shower") {
  const id = randomUUID();
  repo.run("INSERT INTO event_guests VALUES(?,?,?)", id, eventId, repo.now());
  return id;
}
function insertCards(repo, count, eventId = "test-baby-shower") {
  const guestId = guest(repo, eventId);
  const ids = [];
  repo.transaction(() => {
    for (let i = 0; i < count; i++) {
      const id = randomUUID();
      ids.push(id);
      repo.run(
        "INSERT INTO cards (id,event_id,guest_id,request_key,name,note,style,consent,created_at) VALUES(?,?,?,?,?,?,?,0,?)",
        id, eventId, guestId, "synthetic-" + i, "Synthetic guest",
        "Synthetic private note " + i, "little-star", repo.now(),
      );
    }
  });
  return ids;
}

test("expired studio sessions free capacity without erasing referenced artwork", (t) => {
  const { repo, app, session } = fixture(t);
  repo.transaction(() => {
    for (let i = 0; i < 2000; i++)
      repo.run("INSERT INTO studio_sessions VALUES(?,?,?)", hash("expired-" + i), "csrf", "2020-01-01T00:00:00.000Z");
    repo.run(
      "INSERT INTO studio_jobs(id,session_hash,request_key,kind,choices,state,image,event_id,created_at) VALUES(?,?,?,'invitation','{}','approved',?,?,?)",
      "synthetic-retained-art", hash("expired-0"), "retained-art-request",
      Buffer.from("RIFF1234WEBP retained artwork"), "test-baby-shower", repo.now(),
    );
  });
  const studio = new StudioService(repo, {});
  assert.ok(studio.session(null, "192.0.2.1").cookieToken);
  assert.equal(repo.one("SELECT count(*) AS n FROM studio_sessions").n, 2);
  assert.equal(repo.one("SELECT count(*) AS n FROM studio_sessions WHERE expires_at>?", repo.now()).n, 1);
  assert.equal(Buffer.from(studio.hostImage(app, session, "synthetic-retained-art").image).toString(), "RIFF1234WEBP retained artwork");
});

test("studio still bounds concurrent unexpired anonymous sessions", (t) => {
  const { repo } = fixture(t);
  repo.transaction(() => {
    for (let i = 0; i < 2000; i++)
      repo.run("INSERT INTO studio_sessions VALUES(?,?,?)", hash("active-" + i), "csrf", "2026-11-20T00:00:00.000Z");
  });
  assert.throws(() => new StudioService(repo, {}).session(null, "192.0.2.2"), { status: 429 });
});

test("gift-first activity atomically locks lifecycle and replay preserves the lock", (t) => {
  const { repo, app, session } = fixture(t);
  const event = app.createEvent(session, {
    title: "Synthetic gift-only event", hosts: "Synthetic host", type: "Wedding",
    date: "2026-11-20", timezone: "America/New_York", status: "published",
  });
  app.saveDestination(session, event.id, {
    service: "Venmo", identifier: "@synthetic_audit", recipient: "Synthetic host",
    repeatIdentifier: "@synthetic_audit", checked: true,
    previewOnly: true, enabled: true, version: 0,
  }, event.revision);
  const invite = app.invitation(event.token);
  const input = {
    requestKey: "synthetic-gift-lock", service: "Venmo", version: 1,
    name: "Synthetic guest", alias: "", amount: "1",
    reference: "DCB-A1B2C3D4", acknowledged: true,
  };
  const gift = app.prepareGift(event.token, invite.cookieToken, invite.csrfToken, input);
  const locked = repo.ownedEvent(session.host.id, event.id);
  assert.equal(locked.locked_at, repo.now());
  for (const patch of [{ date: "2027-04-15" }, { type: "Baby shower" }, { timezone: "UTC" }])
    assert.throws(() => app.updateEvent(session, event.id, patch, locked.revision), { status: 409 });
  assert.equal(app.prepareGift(event.token, invite.cookieToken, invite.csrfToken, input).gift.id, gift.gift.id);
  assert.equal(repo.ownedEvent(session.host.id, event.id).revision, locked.revision);
  assert.equal(repo.one("SELECT count(*) AS n FROM gift_intents WHERE event_id=?", event.id).n, 1);
});

test("reopening older gift-first records repairs the lock once without replacing content or key", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "dcb-gift-lock-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, "review.sqlite");
  const options = { clock: () => new Date("2026-11-15T17:00:00.000Z") };
  const original = new SqliteReviewRepository(path, options);
  const guestId = guest(original);
  const row = original.insertGift("test-baby-shower", guestId, {
    requestKey: "historical-gift-lock", name: "Synthetic guest", alias: "",
    amount: "1", reference: "DCB-A1B2C3D4",
  }, {
    service: "Venmo", identifier: "@synthetic_audit", recipient: "Synthetic host",
    version: 1, previewOnly: true,
  });
  original.run("UPDATE events SET locked_at=NULL WHERE id='test-baby-shower'");
  const key = Buffer.from(original.key);
  const revision = original.ownedEvent("review-host", "test-baby-shower").revision;
  original.close();
  const upgraded = new SqliteReviewRepository(path, options);
  assert.deepEqual(upgraded.key, key);
  assert.equal(upgraded.ownedEvent("review-host", "test-baby-shower").locked_at, row.created_at);
  assert.equal(upgraded.ownedEvent("review-host", "test-baby-shower").revision, revision + 1);
  assert.equal(upgraded.one("SELECT count(*) AS n FROM cards").n, 3);
  assert.equal(upgraded.one("SELECT id FROM gift_intents WHERE id=?", row.id).id, row.id);
  upgraded.close();
  const repeated = new SqliteReviewRepository(path, options);
  assert.equal(repeated.ownedEvent("review-host", "test-baby-shower").revision, revision + 1);
  assert.deepEqual(repeated.key, key);
  repeated.close();
});

test("workspace pages expose all tied-date records with totals, no duplicates and host scope", (t) => {
  const { repo, host } = fixture(t);
  const ids = insertCards(repo, 1001);
  const seeded = repo.ownedEvent(host.id, "test-baby-shower");
  repo.transaction(() => {
    for (let i = 0; i < 101; i++)
      repo.createEvent(host.id, {
        ...seeded, title: "Synthetic event " + i, bookLayout: "editorial",
        invitation: null, saveTheDate: null,
      });
  });
  const collected = { events: [], entries: [], gifts: [] };
  let cursors = {};
  let expected;
  let requests = 0;
  do {
    const page = repo.workspace(host, cursors);
    expected ??= page.pagination.totals;
    for (const group of ["events", "entries", "gifts"])
      collected[group].push(...page[group]);
    cursors = Object.fromEntries(Object.entries(page.pagination.next).map(([key, cursor]) => [key, cursor || "end"]));
    requests++;
  } while (Object.values(cursors).some((cursor) => cursor !== "end"));
  assert.equal(requests, 2);
  for (const group of ["events", "entries", "gifts"]) {
    assert.equal(collected[group].length, expected[group]);
    assert.equal(new Set(collected[group].map((row) => row.id)).size, expected[group]);
  }
  assert.ok(ids.every((id) => collected.entries.some((entry) => entry.id === id)));
  assert.ok(collected.events.every((event) => repo.ownedEvent(host.id, event.id)));
  assert.ok(collected.entries.every((entry) => repo.ownedEvent(host.id, entry.eventId)));
  assert.throws(() => repo.workspace(host, { entries: "invalid!" }), { status: 422 });
  assert.throws(() => repo.workspace(host, { owner: "review-other" }), { status: 422 });
});

test("complete free exports paginate beyond 1000, include private notes and exclude hidden/removed/drafts", (t) => {
  const { repo, app, session } = fixture(t);
  const ids = insertCards(repo, 1004);
  repo.run("UPDATE cards SET hidden=1 WHERE id=?", ids[0]);
  repo.run("UPDATE cards SET removed_at=? WHERE id=?", repo.now(), ids[1]);
  repo.run("UPDATE cards SET delivery_state='draft' WHERE id=?", ids[2]);
  const vault = new VaultService(repo);
  const entries = [];
  let cursor;
  let total;
  do {
    const page = vault.exportPage(app, session, "test-baby-shower", cursor ? { cursor } : {});
    entries.push(...page.entries);
    total = page.total;
    cursor = page.nextCursor;
  } while (cursor);
  assert.equal(entries.length, total);
  assert.equal(new Set(entries.map((entry) => entry.id)).size, total);
  assert.equal(total, repo.one("SELECT count(*) AS n FROM cards WHERE event_id='test-baby-shower' AND hidden=0 AND removed_at IS NULL AND delivery_state='delivered'").n);
  assert.ok(total > 1000);
  assert.ok(entries.some((entry) => !entry.consent));
  assert.ok(ids.slice(0, 3).every((id) => !entries.some((entry) => entry.id === id)));
  assert.equal(repo.one("SELECT count(*) AS n FROM audit WHERE action='Private CardVault export requested.'").n, 1);
});

test("export continuation is scoped, tamper-resistant, expiring and invalidated on moderation", (t) => {
  const f = fixture(t);
  const { repo, app, session } = f;
  const ids = insertCards(repo, 501);
  const vault = new VaultService(repo);
  const first = vault.exportPage(app, session, "test-baby-shower", {});
  assert.ok(first.nextCursor);
  assert.throws(() => vault.exportPage(app, { ...session, host: repo.host("review-other") }, "test-baby-shower", { cursor: first.nextCursor }), { status: 404 });
  assert.throws(() => vault.exportPage(app, session, "test-baby-shower", { cursor: first.nextCursor + "A" }), { status: 422 });
  app.moderateCard(session, ids[1], "hide");
  assert.throws(() => vault.exportPage(app, session, "test-baby-shower", { cursor: first.nextCursor }), { status: 409, code: "export_changed" });
  const second = vault.exportPage(app, session, "test-baby-shower", {});
  assert.ok(second.nextCursor);
  f.advance(6 * 60000);
  assert.throws(() => vault.exportPage(app, session, "test-baby-shower", { cursor: second.nextCursor }), { status: 409, code: "export_expired" });
});

test("closed and paused invitations cannot retrieve formerly accessible invitation artwork", (t) => {
  const { repo, app, session } = fixture(t);
  const event = repo.event(repo.ownedEvent(session.host.id, "test-baby-shower"));
  const invite = app.invitation(event.token);
  repo.run("INSERT INTO studio_sessions VALUES(?,?,?)", hash("old-session"), "csrf", "2020-01-01T00:00:00.000Z");
  repo.run("INSERT INTO studio_jobs(id,session_hash,request_key,kind,choices,state,image,event_id,created_at) VALUES(?,?,?,'invitation','{}','approved',?,?,?)",
    "synthetic-private-art", hash("old-session"), "private-art-request", Buffer.from("RIFF1234WEBP private art"), event.id, repo.now());
  const studio = new StudioService(repo, {});
  assert.equal(studio.guestImage(app, event.token, invite.cookieToken, "synthetic-private-art").id, "synthetic-private-art");
  repo.run("UPDATE events SET status='paused' WHERE id=?", event.id);
  assert.throws(() => studio.guestImage(app, event.token, invite.cookieToken, "synthetic-private-art"), { status: 404 });
  repo.run("UPDATE events SET status='published',date='2020-01-01' WHERE id=?", event.id);
  assert.throws(() => studio.guestImage(app, event.token, invite.cookieToken, "synthetic-private-art"), { status: 404 });
});

test("private export HTTP pages require ownership, CSRF and recent authentication after closure", async (t) => {
  const f = await setup(t);
  await f.host.login();
  await f.other.login("other@digitalcardbox.test");
  f.repo.run("UPDATE events SET status='published',date='2020-01-01' WHERE id='test-baby-shower'");
  const path = "/api/host/events/test-baby-shower/export";
  assert.equal((await f.guest.call(path, "POST", {})).status, 401);
  assert.equal((await f.other.call(path, "POST", {})).status, 404);
  assert.equal((await f.host.call(path, "POST", {}, { "x-csrf-token": "wrong" })).status, 403);
  const exported = await f.host.call(path, "POST", {});
  assert.equal(exported.status, 200);
  assert.equal(exported.response.headers.get("cache-control"), "no-store");
  assert.equal(exported.data.entries.length, exported.data.total);
  f.repo.run("UPDATE host_sessions SET authenticated_at='2020-01-01T00:00:00.000Z' WHERE host_id='review-host'");
  const stale = await f.host.call(path, "POST", {});
  assert.equal(stale.status, 401);
  assert.equal(stale.data.error.code, "reauthentication_required");
});
