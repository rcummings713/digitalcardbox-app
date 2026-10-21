import { MediaService } from "../media-service.mjs";
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
  const { mediaOptions, ...httpOptions } = options;
  const media = new MediaService(repo, mediaOptions);
  const server = createApiServer(repo, {
    rateLimit: false,
    services: { media },
    ...httpOptions,
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    repo.close();
    await rm(directory, { recursive: true, force: true });
  });
  return {
    repo,
    media,
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

export { Agent, setup, card, invitation, clock, instant };
