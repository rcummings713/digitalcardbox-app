import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { Agent, card } from "../../server/tests/helpers.mjs";

test(
  "hosted DEV stores real private invitations and feedback across independent browser sessions",
  { timeout: 60000 },
  async (t) => {
    const probe = createServer();
    await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
    const port = probe.address().port;
    await new Promise((resolve) => probe.close(resolve));
    const directory = await mkdtemp(join(tmpdir(), "dcb-worker-"));
    const password = "worker-test-operator-private-2026";
    const args = [
      "node_modules/wrangler/bin/wrangler.js",
      "dev",
      "--config",
      "wrangler.dev.jsonc",
      "--ip",
      "127.0.0.1",
      "--port",
      String(port),
      "--persist-to",
      directory,
      "--var",
      "DCB_LOCAL_TEST:true",
      "--var",
      "AI_CARDS_ENABLED:false",
      "--var",
      "DCB_OPERATOR_PASSWORD:" + password,
    ];
    let worker,
      logs = "";
    async function start() {
      worker = spawn(process.execPath, args, {
        env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
        stdio: ["ignore", "pipe", "pipe"],
      });
      worker.stdout.on("data", (chunk) => {
        logs = (logs + chunk).slice(-5000);
      });
      worker.stderr.on("data", (chunk) => {
        logs = (logs + chunk).slice(-5000);
      });
      for (let n = 0; n < 160; n++) {
        if (worker.exitCode !== null)
          throw new Error(
            "Worker exited during startup: " +
              logs.replaceAll(password, "[redacted]"),
          );
        try {
          const response = await fetch(base + "/api/health");
          if (response.ok) return;
        } catch {}
        await delay(150);
      }
      throw new Error(
        "Worker startup timed out. " + logs.replaceAll(password, "[redacted]"),
      );
    }
    async function stop() {
      if (worker.exitCode === null) {
        worker.kill("SIGTERM");
        await Promise.race([
          new Promise((resolve) => worker.once("exit", resolve)),
          delay(3000),
        ]);
        if (worker.exitCode === null) worker.kill("SIGKILL");
      }
    }
    t.after(async () => {
      await stop();
      await rm(directory, { recursive: true, force: true });
    });
    const base = `http://127.0.0.1:${port}`;
    await start();
    const host = new Agent(base),
      guest = new Agent(base),
      stranger = new Agent(base),
      operator = new Agent(base);
    await t.test(
      "published local passwords cannot authenticate; anonymous workspaces are private",
      async () => {
        assert.equal(
          (
            await operator.call("/api/session", "POST", {
              email: "operator@digitalcardbox.test",
              password: "CardBoxReview!2026",
            })
          ).status,
          401,
        );
        assert.equal((await stranger.call("/api/host/workspace")).status, 401);
        const session = await host.call("/api/review/session", "POST", {});
        assert.equal(session.status, 200, JSON.stringify(session.data));
        assert(session.data.account.id.startsWith("visitor-"));
        assert.equal(session.data.account.role, "host");
        assert.equal(session.data.configuration.hosted, true);
        assert.equal(session.data.configuration.publicSiteUrl, base);
      },
    );
    let event;
    await t.test(
      "publish, open an invitation on another device, send, and read it from the host",
      async () => {
        const date = new Date().toISOString().slice(0, 10);
        const created = await host.call("/api/host/events", "POST", {
          title: "Live cross-device QR event",
          hosts: "Test host",
          type: "Baby shower",
          date,
          timezone: "America/New_York",
          location: "",
          welcome: "A private invitation for our guests.",
          cover: "flowers",
          status: "published",
        });
        assert.equal(created.status, 201, JSON.stringify(created.data));
        event = created.data.event;
        const path = "/api/invitations/" + event.token;
        assert.equal((await guest.call(path)).status, 200);
        const sent = await guest.call(path + "/cards", "POST", {
          ...card(),
          style: "gilded-rose",
          gif: "rings",
        });
        assert.equal(sent.status, 201, JSON.stringify(sent.data));
        const workspace = await host.call("/api/host/workspace");
        assert.equal(workspace.data.entries.length, 1);
        assert.equal(workspace.data.entries[0].gif, "rings");
        assert.equal(
          (await stranger.call("/api/host/events/" + event.id)).status,
          401,
        );
        assert.equal((await guest.call("/api/host/workspace")).status, 401);
        assert.equal(
          (await guest.call("/api/invitations/" + "z".repeat(43))).status,
          404,
        );
        assert.equal(
          (await guest.call("/api/config")).data.ai.available,
          false,
        );
      },
    );
    await t.test(
      "feedback saves privately and only the secret-protected operator can review it",
      async () => {
        const login = await operator.call("/api/session", "POST", {
          email: "operator@digitalcardbox.test",
          password,
        });
        assert.equal(login.status, 200, JSON.stringify(login.data));
        const feedback = new Agent(base);
        await feedback.call("/api/feedback/session");
        assert.equal(
          (
            await feedback.call("/api/feedback", "POST", {
              requestKey: "worker-feedback-0001",
              rating: 4,
              category: "Suggestion",
              message: "Please make the wedding card even more beautiful.",
              email: "",
              contactConsent: false,
              website: "",
            })
          ).status,
          201,
        );
        assert.equal((await host.call("/api/admin/feedback")).status, 403);
        const response = await operator.call("/api/admin/feedback");
        assert.equal(response.status, 200);
        assert.equal(response.data.feedback.length, 1);
        assert.equal((await feedback.call("/api/admin/feedback")).status, 401);
        const asset = await fetch(base + "/");
        assert.equal(asset.status, 200);
        assert(
          asset.headers
            .get("content-security-policy")
            .includes("connect-src 'self'"),
        );
        assert.equal(
          (await stranger.call("/api/payments", "POST", {})).status,
          404,
        );
      },
    );
    await t.test(
      "Worker restart preserves the invitation, host session, card and feedback",
      async () => {
        await stop();
        await start();
        assert.equal(
          (await guest.call("/api/invitations/" + event.token)).status,
          200,
        );
        assert.equal(
          (await host.call("/api/host/workspace")).data.entries.length,
          1,
        );
        assert.equal(
          (await operator.call("/api/admin/feedback")).data.feedback.length,
          1,
        );
      },
    );
  },
);
