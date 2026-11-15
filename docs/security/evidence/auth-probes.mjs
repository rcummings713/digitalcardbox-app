import assert from "node:assert/strict";
import { SqliteReviewRepository } from "../../../server/adapters/sqlite.mjs";
import { createApiHandler } from "../../../server/http.mjs";
import { AuthService } from "../../../server/auth-service.mjs";
import { authFixture } from "../../../server/tests/auth-fixture.mjs";

// Entirely synthetic in-memory records and provider transport. No sockets/network.
let now = new Date("2026-10-18T16:00:00Z");
const repo = new SqliteReviewRepository(":memory:", { clock: () => now });
const provider = authFixture();
const handler = createApiHandler(repo, {
  hosted: true,
  secureCookies: true,
  services: { auth: new AuthService(repo, provider.options) },
});
async function call(path, method = "GET", input, options = {}) {
  const headers = {
    host: "audit.invalid",
    origin: "https://audit.invalid",
    "content-type": "application/json",
    "x-dcb-request": "1",
    ...options,
  };
  const request = {
    url: path,
    method,
    headers,
    socket: { remoteAddress: "192.0.2.1" },
    async *[Symbol.asyncIterator]() {
      if (input !== undefined) yield Buffer.from(JSON.stringify(input));
    },
  };
  let status = 200;
  let result;
  const responseHeaders = {};
  await handler(request, {
    set statusCode(value) { status = value; },
    get statusCode() { return status; },
    setHeader(key, value) { responseHeaders[key.toLowerCase()] = value; },
    end(value) { result = JSON.parse(value); },
  });
  return { status, result, headers: responseHeaders };
}
const eventInput = {
  title: "Synthetic audit event",
  hosts: "Synthetic audit host",
  type: "Wedding",
  date: "2026-10-18",
  timezone: "America/New_York",
  location: "Synthetic private location",
  status: "draft",
};
const destinationInput = {
  service: "Venmo",
  identifier: "@SyntheticAuditPayee",
  repeatIdentifier: "@SyntheticAuditPayee",
  recipient: "Synthetic payee",
  enabled: true,
  checked: true,
  previewOnly: true,
  version: 0,
};
try {
  const login = await call("/api/auth/login", "POST", {
    email: provider.initial.email,
    password: provider.initial.password,
  });
  assert.equal(login.status, 200);
  const credentials = {
    cookie: login.headers["set-cookie"][0].split(";")[0],
    "x-csrf-token": login.result.csrfToken,
  };
  const create = await call("/api/host/events", "POST", eventInput, credentials);
  assert.equal(create.status, 201);
  now = new Date("2026-10-24T16:00:00Z");
  const publish = await call(
    `/api/host/events/${create.result.event.id}`,
    "PATCH",
    { status: "published" },
    { ...credentials, "if-match": String(create.result.event.revision) },
  );
  assert.equal(publish.status, 200);
  const destination = await call(
    `/api/host/events/${create.result.event.id}/destinations`,
    "PATCH",
    destinationInput,
    { ...credentials, "if-match": String(publish.result.event.revision) },
  );
  assert.equal(destination.status, 200);
  console.log(JSON.stringify({
    proof: "six-day-old managed session publishes and changes destination",
    sessionAgeDays: 6,
    publishStatus: publish.status,
    destinationStatus: destination.status,
    grants: provider.calls.filter(c => c.path === "token").map(c => c.body?.refresh_token ? "refresh" : "password"),
  }));

  const anonymous = await call("/api/review/session", "POST", {});
  assert.equal(anonymous.status, 200);
  const anonymousCredentials = {
    cookie: anonymous.headers["set-cookie"].split(";")[0],
    "x-csrf-token": anonymous.result.csrfToken,
  };
  const anonymousCreate = await call("/api/host/events", "POST", {
    ...eventInput, status: "published",
  }, anonymousCredentials);
  assert.equal(anonymousCreate.status, 201);
  console.log(JSON.stringify({
    proof: "DEV anonymous session publishes without verified identity",
    registered: anonymous.result.account.registered,
    createStatus: anonymousCreate.status,
    eventStatus: anonymousCreate.result.event.status,
  }));

  for (const [expectedWindow, change] of [
    ["closed", { date: "2020-01-01", status: "published" }],
    ["scheduled", { date: "2030-01-01", status: "published" }],
    ["paused", { date: "2026-10-24", status: "paused" }],
  ]) {
    const created = await call("/api/host/events", "POST", {
      ...eventInput, ...change,
    }, credentials);
    assert.equal(created.status, 201);
    const configured = await call(
      `/api/host/events/${created.result.event.id}/destinations`,
      "PATCH", destinationInput,
      { ...credentials, "if-match": String(created.result.event.revision) },
    );
    assert.equal(configured.status, 200);
    const path = `/api/invitations/${created.result.event.token}`;
    const guestRead = await call(path);
    assert.equal(guestRead.status, 200);
    assert.equal(guestRead.result.window, expectedWindow);
    assert.equal(guestRead.result.event.destinations[0].identifier, destinationInput.identifier);
    assert.equal(guestRead.result.event.location, eventInput.location);
    const guestWrite = await call(path + "/cards", "POST", {
      requestKey: `synthetic-audit-${expectedWindow}`,
      name: "Synthetic guest",
      note: "Synthetic test note",
      style: "little-star",
      consent: true,
    }, {
      cookie: guestRead.headers["set-cookie"].split(";")[0],
      "x-csrf-token": guestRead.result.csrfToken,
    });
    assert.equal(guestWrite.status, 409);
    console.log(JSON.stringify({
      proof: "inactive invitation exposes configured payee and event location",
      eventWindow: expectedWindow,
      readStatus: guestRead.status,
      identifierExposed: true,
      locationExposed: true,
      guestWriteStatus: guestWrite.status,
      invitationBearerRequired: true,
    }));
  }
} finally {
  repo.close();
}
