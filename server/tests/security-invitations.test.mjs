import test from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.mjs";

test("closed and paused invitation responses contain no private event/payee data and create no new sessions", async (t) => {
  const f = await setup(t);
  const eventId = "test-baby-shower";
  f.repo.saveDestination(eventId, {
    service: "Venmo", recipient: "Private synthetic recipient",
    identifier: "@SyntheticPrivatePayee", version: 2,
    enabled: true, confirmed: true, previewOnly: true,
  });
  const event = f.repo.event(f.repo.one("SELECT * FROM events WHERE id=?", eventId));
  const path = "/api/invitations/" + event.token;
  assert.equal((await f.guest.call(path)).status, 200);
  for (const status of ["closed", "paused"]) {
    f.repo.run("UPDATE events SET title=?,location=?,welcome=?,date=?,status=? WHERE id=?",
      "PRIVATE EVENT TITLE", "PRIVATE HOME ADDRESS", "PRIVATE WELCOME",
      status === "closed" ? "2020-01-01" : "2026-10-18",
      status === "closed" ? "published" : "paused", eventId);
    const before = f.repo.one("SELECT count(*) AS n FROM guest_sessions").n;
    for (const actor of [f.guest, f.other]) {
      const result = await actor.call(path);
      assert.equal(result.status, 200);
      assert.equal(result.data.window, status);
      assert.deepEqual(result.data.event.destinations, []);
      assert.equal(result.data.csrfToken, "");
      assert.equal(result.data.event.invitation, undefined);
      assert.equal(result.data.event.saveTheDate, undefined);
      assert.equal(result.response.headers.get("set-cookie"), null);
      assert(!JSON.stringify(result.data).includes("PRIVATE"));
      assert(!JSON.stringify(result.data).includes("SyntheticPrivatePayee"));
    }
    assert.equal(f.repo.one("SELECT count(*) AS n FROM guest_sessions").n, before);
  }
});

test("scheduled save-the-dates retain event details but hide payees, and disabled gifts hide payees during open events", async (t) => {
  const f = await setup(t);
  const eventId = "test-baby-shower";
  f.repo.saveDestination(eventId, {
    service: "Venmo", recipient: "Synthetic recipient",
    identifier: "@SyntheticPrivatePayee", version: 2,
    enabled: true, confirmed: true, previewOnly: true,
  });
  const event = f.repo.event(f.repo.one("SELECT * FROM events WHERE id=?", eventId));
  const path = "/api/invitations/" + event.token;
  f.repo.run("UPDATE events SET date='2030-01-01',location='Approved save-the-date location' WHERE id=?", eventId);
  const scheduled = await f.guest.call(path);
  assert.equal(scheduled.data.window, "scheduled");
  assert.equal(scheduled.data.event.location, "Approved save-the-date location");
  assert.deepEqual(scheduled.data.event.destinations, []);
  f.repo.run("UPDATE events SET date='2026-10-18' WHERE id=?", eventId);
  assert((await f.guest.call(path)).data.event.destinations.length > 0);
  f.repo.run("UPDATE flags SET enabled=0 WHERE key='gifts'");
  const disabled = await f.guest.call(path);
  assert.equal(disabled.data.window, "open");
  assert.deepEqual(disabled.data.event.destinations, []);
});
