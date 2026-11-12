import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
test(
  "Stripe requests use supported Worker request options and never follow credential-bearing redirects",
  { timeout: 60000 },
  async (t) => {
    const probe = createServer();
    await new Promise((r) => probe.listen(0, "127.0.0.1", r));
    const port = probe.address().port;
    await new Promise((r) => probe.close(r));
    const directory = await mkdtemp(join(tmpdir(), "dcb-stripe-runtime-"));
    const worker = spawn(
      process.execPath,
      [
        "node_modules/wrangler/bin/wrangler.js",
        "dev",
        "worker/tests/stripe-runtime-probe.mjs",
        "--config",
        "wrangler.dev.jsonc",
        "--ip",
        "127.0.0.1",
        "--port",
        String(port),
        "--inspector-port",
        "0",
        "--persist-to",
        directory,
      ],
      {
        env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let logs = "";
    for (const stream of [worker.stdout, worker.stderr])
      stream.on("data", (c) => {
        logs = (logs + c).slice(-3000);
      });
    t.after(async () => {
      if (worker.exitCode === null) {
        worker.kill("SIGTERM");
        await Promise.race([
          new Promise((r) => worker.once("exit", r)),
          delay(3000),
        ]);
        if (worker.exitCode === null) worker.kill("SIGKILL");
      }
      await rm(directory, { recursive: true, force: true });
    });
    let result;
    for (let i = 0; i < 160; i++) {
      if (worker.exitCode !== null)
        throw new Error("Probe Worker exited: " + logs);
      try {
        const response = await fetch("http://127.0.0.1:" + port);
        if (response.ok) {
          result = await response.json();
          break;
        }
      } catch {}
      await delay(150);
    }
    assert.deepEqual(
      result,
      { nativeRequestAccepted: true, redirectRejected: true, calls: 2 },
      logs,
    );
  },
);
