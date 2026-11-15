import test from "node:test";
import assert from "node:assert/strict";
import { setup, Agent } from "./helpers.mjs";
import { authFixture } from "./auth-fixture.mjs";
import { hash } from "../domain/identity.mjs";

const eventInput = {
  title: "Recent authentication test",
  hosts: "Synthetic host",
  type: "Wedding",
  date: "2026-10-18",
  timezone: "America/New_York",
  status: "draft",
};
const destination = {
  service: "Venmo",
  identifier: "@synthetic_auth_test",
  repeatIdentifier: "@synthetic_auth_test",
  recipient: "Synthetic host",
  previewOnly: true,
  enabled: true,
  checked: true,
  version: 0,
};
const sessionRow = (f, actor) => f.repo.hostSession(hash(
  [...actor.jar.values()].find((c) => c.pair.startsWith("dcb_host="))
    .pair.slice("dcb_host=".length),
));

test("sensitive changes expire at fifteen minutes; provider refresh cannot renew authentication and same-session password confirmation restores access", async (t) => {
  const provider = authFixture();
  const f = await setup(t, { authOptions: provider.options });
  let now = new Date("2026-10-18T16:00:00Z");
  f.repo.clock = () => now;
  const credentials = { email: provider.initial.email, password: provider.initial.password };
  assert.equal((await f.other.call("/api/auth/login", "POST", credentials)).status, 200);
  const created = await f.other.call("/api/host/events", "POST", eventInput);
  assert.equal(created.status, 201);
  const event = created.data.event;
  const initialSession = sessionRow(f, f.other);
  assert.equal(initialSession.authenticated_at, now.toISOString());
  const cookie = [...f.other.jar.values()].find((c) => c.pair.startsWith("dcb_host=")).pair;
  const csrf = f.other.csrf;
  now = new Date("2026-10-18T16:15:00Z");
  f.repo.run("UPDATE auth_sessions SET access_expires_at='2000-01-01T00:00:00Z'");
  assert.equal((await f.other.call("/api/host/workspace")).status, 200);
  assert.ok(provider.calls.some((c) => c.path === "token" && c.body?.refresh_token));
  assert.equal(sessionRow(f, f.other).authenticated_at, initialSession.authenticated_at);
  const publish = () => f.other.call(`/api/host/events/${event.id}`, "PATCH", { status: "published" }, { "if-match": String(event.revision) });
  const refused = await publish();
  assert.equal(refused.status, 401);
  assert.equal(refused.data.error.code, "reauthentication_required");
  assert.equal((await f.other.call(`/api/host/events/${event.id}/destinations`, "PATCH", destination, { "if-match": String(event.revision) })).status, 401);
  assert.equal((await f.other.call("/api/host/events", "POST", { ...eventInput, status: "published" })).status, 401);
  assert.equal(f.repo.one("SELECT status FROM events WHERE id=?", event.id).status, "draft");
  assert.equal((await f.other.call("/api/auth/reauthenticate", "POST", { password: "wrong" })).status, 401);
  assert.equal((await f.other.call("/api/auth/reauthenticate", "POST", { password: credentials.password }, { "x-csrf-token": "wrong" })).status, 403);
  const stranger = new Agent(f.base);
  await stranger.login("other@digitalcardbox.test");
  assert.equal((await stranger.call("/api/auth/reauthenticate", "POST", { password: "CardBoxReview!2026" }, { "x-csrf-token": csrf })).status, 403);
  assert.equal(sessionRow(f, f.other).authenticated_at, initialSession.authenticated_at);
  const confirmed = await f.other.call("/api/auth/reauthenticate", "POST", { password: credentials.password });
  assert.equal(confirmed.status, 200);
  assert.equal(confirmed.data.authenticated, true);
  assert.equal(confirmed.response.headers.getSetCookie().length, 0);
  assert.equal([...f.other.jar.values()].find((c) => c.pair.startsWith("dcb_host=")).pair, cookie);
  assert.equal(f.other.csrf, csrf);
  assert.equal(sessionRow(f, f.other).expires_at, initialSession.expires_at);
  assert.equal(sessionRow(f, f.other).authenticated_at, now.toISOString());
  const accepted = await publish();
  assert.equal(accepted.status, 200);
  assert.equal((await f.other.call(`/api/host/events/${event.id}/destinations`, "PATCH", destination, { "if-match": String(accepted.data.event.revision) })).status, 200);
  const audit = JSON.stringify(f.repo.all("SELECT * FROM audit WHERE actor_id=?", initialSession.host_id));
  assert.match(audit, /Sensitive action authentication confirmed/);
  assert.ok(!audit.includes(credentials.password));
  assert.ok(!audit.includes(destination.identifier));
});

test("OAuth sign-in alone is not interactive password evidence; confirming the current managed password authorizes sensitive actions", async (t) => {
  const provider = authFixture();
  const f = await setup(t, { authOptions: provider.options });
  const start = await f.other.call("/api/auth/oauth", "POST", { provider: "google", returnTo: "/workspace" });
  const state = new URL(new URL(start.data.url).searchParams.get("redirect_to")).searchParams.get("state");
  assert.equal((await f.other.call("/api/auth/callback", "POST", { code: "valid-oauth-code", state })).status, 200);
  assert.equal(sessionRow(f, f.other).authenticated_at, null);
  assert.equal((await f.other.call("/api/host/workspace")).status, 200);
  assert.equal((await f.other.call("/api/host/events", "POST", { ...eventInput, status: "published" })).status, 401);
  assert.equal((await f.other.call("/api/auth/reauthenticate", "POST", { password: provider.initial.password })).status, 200);
  assert.equal((await f.other.call("/api/host/events", "POST", { ...eventInput, status: "published" })).status, 201);
});

test("old timestamp-less sessions fail sensitive actions closed; seeded DEV passwords reauthenticate the same session", async (t) => {
  const f = await setup(t);
  await f.host.login();
  const session = sessionRow(f, f.host);
  f.repo.run("UPDATE host_sessions SET authenticated_at=NULL WHERE token_hash=?", session.token_hash);
  assert.equal((await f.host.call("/api/host/workspace")).status, 200);
  assert.equal((await f.host.call("/api/host/events", "POST", { ...eventInput, status: "published" })).status, 401);
  assert.equal((await f.host.call("/api/auth/reauthenticate", "POST", { password: "CardBoxReview!2026" })).status, 200);
  assert.equal((await f.host.call("/api/host/events", "POST", { ...eventInput, status: "published" })).status, 201);
  assert.equal((await new Agent(f.base).call("/api/auth/reauthenticate", "POST", { password: "CardBoxReview!2026" })).status, 401);
});

test("a password response for another provider subject cannot refresh this actor's authentication", async (t) => {
  const provider = authFixture();
  const f = await setup(t, { authOptions: provider.options });
  assert.equal((await f.other.call("/api/auth/login", "POST", { email: provider.initial.email, password: provider.initial.password })).status, 200);
  const before = sessionRow(f, f.other);
  provider.initial.id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  const rejected = await f.other.call("/api/auth/reauthenticate", "POST", { password: provider.initial.password });
  assert.equal(rejected.status, 403);
  assert.equal(sessionRow(f, f.other).authenticated_at, before.authenticated_at);
});

test("sign-out during password confirmation prevents the pending response from restoring a revoked session", async (t) => {
  const provider = authFixture();
  let block = false;
  let passwordStarted;
  let releasePassword;
  const started = new Promise((resolve) => { passwordStarted = resolve; });
  const release = new Promise((resolve) => { releasePassword = resolve; });
  const fetcher = async (url, init) => {
    const response = await provider.options.fetcher(url, init);
    if (block && new URL(url).searchParams.get("grant_type") === "password") {
      passwordStarted();
      await release;
    }
    return response;
  };
  const f = await setup(t, { authOptions: { ...provider.options, fetcher } });
  const credentials = { email: provider.initial.email, password: provider.initial.password };
  assert.equal((await f.other.call("/api/auth/login", "POST", credentials)).status, 200);
  block = true;
  const pending = f.other.call("/api/auth/reauthenticate", "POST", { password: credentials.password });
  await started;
  try {
    assert.equal((await f.other.call("/api/session", "DELETE", {})).status, 200);
  } finally { releasePassword(); }
  assert.equal((await pending).status, 401);
  assert.equal(f.repo.one("SELECT count(*) n FROM auth_sessions").n, 0);
  assert.equal(f.repo.one("SELECT count(*) n FROM host_sessions").n, 0);
});
