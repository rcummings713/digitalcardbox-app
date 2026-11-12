import { HostedReviewIdentity } from "../adapters/hosted-review-identity.mjs";
import { LocalTestIdentity } from "../adapters/test-identity.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { setup, Agent } from "./helpers.mjs";
import { authFixture } from "./auth-fixture.mjs";
import { hash } from "../domain/identity.mjs";

test("managed signup requires verified email; browser sessions reveal no provider token or password and identities persist across browsers", async (t) => {
  const provider = authFixture(),
    f = await setup(t, { authOptions: provider.options });
  const input = {
    email: "new@example.invalid",
    password: "A long managed password!",
    name: "New Owner",
  };
  assert.equal(
    (await f.other.call("/api/auth/register", "POST", input)).status,
    200,
  );
  const rejected = await f.other.call("/api/auth/login", "POST", {
    email: input.email,
    password: input.password,
  });
  assert.equal(rejected.status, 403);
  assert.equal(f.repo.one("SELECT count(*) AS n FROM auth_subjects").n, 0);
  provider.users.get(input.email).email_confirmed_at = "2026-10-18T16:00:00Z";
  const login = await f.other.call("/api/auth/login", "POST", {
    email: input.email,
    password: input.password,
  });
  assert.equal(login.status, 200);
  assert.equal(login.data.account.role, "host");
  assert.equal(login.data.account.registered, true);
  assert.equal(login.response.headers.getSetCookie().length, 2);
  assert.ok(
    login.response.headers.getSetCookie().some((s) => s.includes("HttpOnly")),
  );
  for (const value of [
    input.password,
    "access_fixture_",
    "refresh_fixture_",
    "sb_publishable_",
  ])
    assert.ok(!JSON.stringify(login.data).includes(value));
  const stored =
    JSON.stringify(f.repo.all("SELECT * FROM hosts")) +
    JSON.stringify(f.repo.all("SELECT * FROM auth_sessions"));
  assert.ok(!stored.includes(input.password));
  assert.ok(!stored.includes("access_fixture_"));
  assert.ok(!stored.includes("refresh_fixture_"));
  const second = new Agent(f.base);
  const again = await second.call("/api/auth/login", "POST", {
    email: input.email,
    password: input.password,
  });
  assert.equal(again.data.account.id, login.data.account.id);
  assert.equal(f.repo.one("SELECT count(*) AS n FROM auth_subjects").n, 1);
  assert.equal((await f.other.call("/api/host/workspace")).status, 200);
  assert.equal((await f.other.call("/api/admin/summary")).status, 403);
  assert.equal(
    (
      await f.other.call("/api/auth/register", "POST", {
        ...input,
        role: "operator",
      })
    ).status,
    422,
  );
});

test("new verified account adopts only its current temporary workspace and cannot merge identities by email", async (t) => {
  const p = authFixture(),
    f = await setup(t, { hosted: true, authOptions: p.options });
  const guestHost = await f.other.call("/api/review/session", "POST", {});
  assert.equal(guestHost.status, 200);
  const oldId = guestHost.data.account.id;
  const before = await f.other.call("/api/session");
  const r = await f.other.call("/api/auth/login", "POST", {
    email: p.initial.email,
    password: p.initial.password,
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.account.id, oldId);
  assert.equal(r.data.account.registered, true);
  assert.equal(
    f.repo.one("SELECT count(*) AS n FROM hosts WHERE id=?", oldId).n,
    1,
  );
  assert.notEqual(r.data.csrfToken, before.data.csrfToken);
  p.initial.id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  const stranger = new Agent(f.base);
  assert.equal(
    (
      await stranger.call("/api/auth/login", "POST", {
        email: p.initial.email,
        password: p.initial.password,
      })
    ).status,
    409,
  );
  assert.equal(f.repo.one("SELECT count(*) AS n FROM auth_subjects").n, 1);
});

test("OAuth S256 transactions bind the browser, reject replay/expiry and constrain return paths", async (t) => {
  const p = authFixture(),
    f = await setup(t, { authOptions: p.options });
  const start = await f.other.call("/api/auth/oauth", "POST", {
    provider: "google",
    returnTo: "https://evil.invalid/steal",
  });
  assert.equal(start.status, 200);
  const u = new URL(start.data.url);
  assert.equal(u.origin, p.options.url);
  assert.equal(u.searchParams.get("provider"), "google");
  assert.equal(u.searchParams.get("code_challenge_method"), "s256");
  const state = new URL(u.searchParams.get("redirect_to")).searchParams.get(
    "state",
  );
  const flow = f.repo.one(
    "SELECT * FROM auth_flows WHERE token_hash=?",
    hash(state),
  );
  assert.equal(flow.return_path, "/workspace");
  assert.equal(
    u.searchParams.get("code_challenge"),
    createHash("sha256")
      .update(f.repo.decrypt(flow.verifier_ciphertext))
      .digest("base64url"),
  );
  assert.ok(
    !flow.verifier_ciphertext.includes(
      f.repo.decrypt(flow.verifier_ciphertext),
    ),
  );
  const other = new Agent(f.base);
  assert.equal(
    (
      await other.call("/api/auth/callback", "POST", {
        code: "valid-oauth-code",
        state,
      })
    ).status,
    400,
  );
  const done = await f.other.call("/api/auth/callback", "POST", {
    code: "valid-oauth-code",
    state,
  });
  assert.equal(done.status, 200);
  assert.equal(done.data.account.role, "host");
  assert.equal(done.data.returnTo, "/workspace");
  assert.equal(
    (
      await f.other.call("/api/auth/callback", "POST", {
        code: "valid-oauth-code",
        state,
      })
    ).status,
    400,
  );
  const expired = await other.call("/api/auth/oauth", "POST", {
    provider: "apple",
    returnTo: "/workspace/new",
  });
  const state2 = new URL(
    new URL(expired.data.url).searchParams.get("redirect_to"),
  ).searchParams.get("state");
  f.repo.run("UPDATE auth_flows SET expires_at='2000-01-01T00:00:00Z'");
  assert.equal(
    (
      await other.call("/api/auth/callback", "POST", {
        code: "valid-oauth-code",
        state: state2,
      })
    ).status,
    400,
  );
  assert.equal(
    (await other.call("/api/auth/oauth", "POST", { provider: "evil" })).status,
    422,
  );
});

test("managed sessions refresh on the server and revoked credentials cannot read a private workspace", async (t) => {
  const p = authFixture(),
    f = await setup(t, { authOptions: p.options });
  await f.other.call("/api/auth/login", "POST", {
    email: p.initial.email,
    password: p.initial.password,
  });
  f.repo.run(
    "UPDATE auth_sessions SET access_expires_at='2000-01-01T00:00:00Z'",
  );
  assert.equal((await f.other.call("/api/host/workspace")).status, 200);
  assert.ok(p.calls.some((c) => c.path === "token" && c.body?.refresh_token));
  p.tokens.clear();
  f.repo.run("UPDATE auth_sessions SET checked_at='2000-01-01T00:00:00Z'");
  assert.equal((await f.other.call("/api/host/workspace")).status, 401);
  assert.equal(f.repo.one("SELECT count(*) AS n FROM auth_sessions").n, 0);
  assert.equal(f.repo.one("SELECT count(*) AS n FROM auth_subjects").n, 1);
});

test("account endpoints enforce origin and bounded input; provider errors never disclose credentials", async (t) => {
  const p = authFixture(),
    f = await setup(t, { authOptions: p.options });
  const input = { email: p.initial.email, password: p.initial.password };
  assert.equal(
    (
      await f.other.call("/api/auth/login", "POST", input, {
        origin: "https://evil.invalid",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await f.other.call("/api/auth/register", "POST", {
        ...input,
        password: "short",
        name: "Owner",
      })
    ).status,
    422,
  );
  assert.equal(
    (await f.other.call("/api/auth/recover", "POST", { email: input.email }))
      .status,
    200,
  );
  await f.other.call("/api/auth/login", "POST", input);
  const reset = await f.other.call("/api/auth/reset", "POST", {
    tokenHash: "a".repeat(40),
    password: "The replacement password!",
  });
  assert.equal(reset.status, 200);
  assert.equal((await f.other.call("/api/session")).data.account, null);
  assert.equal(f.repo.one("SELECT count(*) AS n FROM auth_sessions").n, 0);
  f.auth.provider.fetcher = async () =>
    Response.json({ error: "private provider token secret" }, { status: 500 });
  const failure = await f.other.call("/api/auth/login", "POST", input);
  assert.equal(failure.status, 503);
  assert.ok(!JSON.stringify(failure.data).includes("private provider token"));
});

test("legacy shared review credentials cannot authenticate any managed customer", async (t) => {
  const provider = authFixture(),
    f = await setup(t, { authOptions: provider.options });
  const result = await f.other.call("/api/auth/login", "POST", {
    email: provider.initial.email,
    password: provider.initial.password,
  });
  assert.equal(result.status, 200);
  const legacyPassword = "private-shared-review-fixture-2026";
  const legacy = new HostedReviewIdentity(f.repo, {
    DCB_HOST_PASSWORD: legacyPassword,
    DCB_OPERATOR_PASSWORD: legacyPassword,
  });
  assert.equal(
    legacy.authenticate(provider.initial.email, legacyPassword),
    null,
  );
  assert.equal(
    new LocalTestIdentity(f.repo).authenticate(
      provider.initial.email,
      "CardBoxReview!2026",
    ),
    null,
  );
  assert.equal(
    legacy.authenticate("host@digitalcardbox.test", legacyPassword).id,
    "review-host",
  );
  assert.equal(
    legacy.authenticate("operator@digitalcardbox.test", legacyPassword).role,
    "operator",
  );
});
